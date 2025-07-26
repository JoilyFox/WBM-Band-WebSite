/**
 * ApiCache class for browser-based API response caching using Web Cache API
 * Falls back to localStorage when Cache API is not available
 */
export class ApiCache {
  public readonly cacheName: string
  private _useLocalStorage: boolean = false

  constructor(cacheName = 'wbm-api-cache') {
    this.cacheName = cacheName
    this.checkCacheSupport()
    this.startAutoCleanup()
  }

  /**
   * Check if using localStorage fallback
   */
  get useLocalStorage(): boolean {
    return this._useLocalStorage
  }

  /**
   * Check if Cache API is supported, fallback to localStorage
   */
  private checkCacheSupport(): void {
    if (typeof window === 'undefined') return
    
    if (!('caches' in window)) {
      this._useLocalStorage = true
      console.info('Cache API not supported, using localStorage fallback')
    }
  }

  /**
   * Generates a unique cache key for API requests
   * @param url - The API endpoint URL
   * @param options - Request options (method, body, params)
   * @returns Unique cache key string
   */
  generateCacheKey(url: string, options: any = {}): string {
    const { method = 'GET', body, params } = options
    
    // Create a normalized key including URL, method, and parameters
    const keyParts = [
      method.toUpperCase(),
      url,
      params ? JSON.stringify(params) : '',
      body ? JSON.stringify(body) : ''
    ]
    
    return keyParts.filter(Boolean).join('|')
  }

  /**
   * Retrieves data from cache
   * @param cacheKey - The cache key
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   * @returns Cached data or null if not found/expired
   */
  async get(cacheKey: string, ttl: number = 5 * 60 * 1000): Promise<any | null> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return null
      }

      if (this._useLocalStorage) {
        return this.getFromLocalStorage(cacheKey, ttl)
      }

      if (!('caches' in window)) {
        return null
      }

      const cache = await caches.open(this.cacheName)
      const request = new Request(this.createCacheUrl(cacheKey))
      const response = await cache.match(request)

      if (!response) {
        return null
      }

      // Check if cache entry has expired
      const cachedData = await response.json()
      const now = Date.now()
      
      if (now - cachedData.timestamp > ttl) {
        // Remove expired entry
        await cache.delete(request)
        return null
      }

      return cachedData.data
    } catch (error) {
      console.error('Error retrieving from cache:', error)
      return null
    }
  }

  /**
   * Stores data in cache
   * @param cacheKey - The cache key
   * @param data - Data to cache
   */
  async set(cacheKey: string, data: any): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return
      }

      if (this._useLocalStorage) {
        this.setToLocalStorage(cacheKey, data)
        return
      }

      if (!('caches' in window)) {
        return
      }

      const cache = await caches.open(this.cacheName)
      const request = new Request(this.createCacheUrl(cacheKey))
      
      const cacheEntry = {
        data,
        timestamp: Date.now()
      }

      const response = new Response(JSON.stringify(cacheEntry), {
        headers: { 'Content-Type': 'application/json' }
      })

      await cache.put(request, response)
    } catch (error) {
      console.error('Error storing in cache:', error)
    }
  }

  /**
   * LocalStorage fallback methods
   */
  private getFromLocalStorage(cacheKey: string, ttl: number): any | null {
    try {
      const stored = localStorage.getItem(`${this.cacheName}:${cacheKey}`)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      const now = Date.now()

      if (now - parsed.timestamp > ttl) {
        localStorage.removeItem(`${this.cacheName}:${cacheKey}`)
        return null
      }

      return parsed.data
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  private setToLocalStorage(cacheKey: string, data: any): void {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(`${this.cacheName}:${cacheKey}`, JSON.stringify(cacheEntry))
    } catch (error) {
      console.error('Error storing to localStorage:', error)
    }
  }

  private removeFromLocalStorage(cacheKey: string): void {
    try {
      localStorage.removeItem(`${this.cacheName}:${cacheKey}`)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }

  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage)
      const prefix = `${this.cacheName}:`
      
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  private getLocalStorageStats(): { size: number; entries: number } {
    try {
      const keys = Object.keys(localStorage)
      const prefix = `${this.cacheName}:`
      let totalSize = 0
      let entries = 0

      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          const value = localStorage.getItem(key)
          if (value) {
            totalSize += value.length
            entries++
          }
        }
      })

      return { size: totalSize, entries }
    } catch (error) {
      console.error('Error getting localStorage stats:', error)
      return { size: 0, entries: 0 }
    }
  }

  /**
   * Removes specific cache entry
   * @param cacheKey - The cache key
   */
  async remove(cacheKey: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      if (this._useLocalStorage) {
        this.removeFromLocalStorage(cacheKey)
        return
      }

      if (!('caches' in window)) return

      const cache = await caches.open(this.cacheName)
      const request = new Request(this.createCacheUrl(cacheKey))
      await cache.delete(request)
    } catch (error) {
      console.error('Error removing from cache:', error)
    }
  }

  /**
   * Clears all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      if (this._useLocalStorage) {
        this.clearLocalStorage()
        console.log(`LocalStorage cache '${this.cacheName}' cleared`)
        return
      }

      if (!('caches' in window)) return

      await caches.delete(this.cacheName)
      console.log(`Cache '${this.cacheName}' cleared`)
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Removes expired cache entries
   * @param maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  async cleanup(maxAge: number = 60 * 60 * 1000): Promise<void> {
    try {
      if (typeof window === 'undefined' || !('caches' in window)) return

      const cache = await caches.open(this.cacheName)
      const requests = await cache.keys()
      const now = Date.now()

      for (const request of requests) {
        try {
          const response = await cache.match(request)
          if (response) {
            const cachedData = await response.json()
            if (now - cachedData.timestamp > maxAge) {
              await cache.delete(request)
              console.log(`Cleaned up expired cache entry: ${request.url}`)
            }
          }
        } catch (error) {
          // If we can't parse the cached data, remove it
          await cache.delete(request)
        }
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error)
    }
  }

  /**
   * Gets cache statistics
   */
  async getStats(): Promise<{ size: number; entries: number }> {
    try {
      if (typeof window === 'undefined') {
        return { size: 0, entries: 0 }
      }

      if (this._useLocalStorage) {
        return this.getLocalStorageStats()
      }

      if (!('caches' in window)) {
        return { size: 0, entries: 0 }
      }

      const cache = await caches.open(this.cacheName)
      const requests = await cache.keys()
      
      let totalSize = 0
      for (const request of requests) {
        try {
          const response = await cache.match(request)
          if (response) {
            const text = await response.text()
            totalSize += text.length
          }
        } catch (error) {
          // Skip entries that can't be read
        }
      }

      return {
        size: totalSize,
        entries: requests.length
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return { size: 0, entries: 0 }
    }
  }

  /**
   * Creates a cache URL for the given key
   */
  private createCacheUrl(key: string): string {
    return `cache://${this.cacheName}/${encodeURIComponent(key)}`
  }

  /**
   * Starts automatic cleanup every 10 minutes
   */
  private startAutoCleanup(): void {
    // Only start cleanup in browser environment
    if (typeof window !== 'undefined' && 'caches' in window) {
      setInterval(() => {
        this.cleanup()
      }, 10 * 60 * 1000) // 10 minutes
    }
  }
}

// Create and export a singleton instance
export const apiCache = new ApiCache()
