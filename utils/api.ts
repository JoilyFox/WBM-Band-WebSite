import { apiCache } from '~/utils/cache'

interface ApiOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
}

interface CacheOptions {
  enabled?: boolean
  ttl?: number
  key?: string
}

interface ErrorOptions {
  showNotification?: boolean
  rethrow?: boolean
  defaultValue?: any
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: any, operation: string, options: ErrorOptions = {}) {
  const { showNotification = true, rethrow = true, defaultValue = null } = options
  
  console.error(`API Error during ${operation}:`, error)
  
  if (showNotification) {
    // You can integrate with your snackbar system here if needed
    console.warn(`${operation} failed:`, error.message)
  }
  
  if (rethrow) {
    throw error
  }
  
  return defaultValue
}

/**
 * Convert params object to URL search string
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

/**
 * Makes a cached API request
 */
export async function cachedApiRequest(
  url: string,
  options: ApiOptions = {},
  cacheOptions: CacheOptions = {},
  errorOptions: ErrorOptions = {}
): Promise<any> {
  const { method = 'GET', headers = {}, body, params } = options
  
  const {
    enabled = false,
    ttl = 5 * 60 * 1000, // 5 minutes
    key: customKey
  } = cacheOptions
  
  const operation = `${method.toLowerCase()} request to ${url}`
  
  try {
    // Build full URL with query parameters
    let fullUrl = url
    if (params && Object.keys(params).length > 0) {
      const queryString = buildQueryString(params)
      fullUrl += (url.includes('?') ? '&' : '?') + queryString
    }
    
    // Generate cache key
    const cacheKey = customKey || apiCache.generateCacheKey(fullUrl, { method, body })
    
    // Check cache first if enabled and method is GET
    if (enabled && method.toLowerCase() === 'get') {
      const cachedData = await apiCache.get(cacheKey, ttl)
      if (cachedData !== null) {
        console.log(`Cache hit for ${operation}`)
        return cachedData
      }
    }
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
    
    if (body && method.toLowerCase() !== 'get') {
      fetchOptions.body = JSON.stringify(body)
    }
    
    // Make API request
    console.log(`Making ${operation}`)
    const response = await fetch(fullUrl, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const responseData = await response.json()
    
    // Cache the response if enabled and method is GET
    if (enabled && method.toLowerCase() === 'get') {
      await apiCache.set(cacheKey, responseData)
      console.log(`Cached response for ${operation}`)
    }
    
    return responseData
  } catch (error) {
    return handleApiError(error, operation, errorOptions)
  }
}

/**
 * Shorthand for cached GET requests
 */
export async function cachedGet(
  url: string,
  options: Omit<ApiOptions, 'method'> = {},
  cacheOptions: CacheOptions = {},
  errorOptions: ErrorOptions = {}
): Promise<any> {
  return cachedApiRequest(
    url,
    { ...options, method: 'GET' },
    cacheOptions,
    errorOptions
  )
}

/**
 * Shorthand for cached POST requests
 */
export async function cachedPost(
  url: string,
  data: any,
  options: Omit<ApiOptions, 'method' | 'body'> = {},
  cacheOptions: CacheOptions = {},
  errorOptions: ErrorOptions = {}
): Promise<any> {
  return cachedApiRequest(
    url,
    { ...options, method: 'POST', body: data },
    cacheOptions,
    errorOptions
  )
}

/**
 * Shorthand for cached PUT requests
 */
export async function cachedPut(
  url: string,
  data: any,
  options: Omit<ApiOptions, 'method' | 'body'> = {},
  cacheOptions: CacheOptions = {},
  errorOptions: ErrorOptions = {}
): Promise<any> {
  return cachedApiRequest(
    url,
    { ...options, method: 'PUT', body: data },
    cacheOptions,
    errorOptions
  )
}

/**
 * Shorthand for DELETE requests (typically not cached)
 */
export async function apiDelete(
  url: string,
  options: Omit<ApiOptions, 'method'> = {},
  errorOptions: ErrorOptions = {}
): Promise<any> {
  return cachedApiRequest(
    url,
    { ...options, method: 'DELETE' },
    { enabled: false }, // Don't cache DELETE requests
    errorOptions
  )
}

/**
 * Invalidates cache for specific patterns
 */
export async function invalidateCache(pattern: string | RegExp): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    
    // Check if using localStorage fallback
    if (apiCache.useLocalStorage) {
      const keys = Object.keys(localStorage)
      const prefix = `${apiCache.cacheName}:`
      
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          const cacheKey = key.substring(prefix.length)
          const shouldInvalidate = typeof pattern === 'string' 
            ? cacheKey.includes(pattern) 
            : pattern.test(cacheKey)
          
          if (shouldInvalidate) {
            localStorage.removeItem(key)
            console.log(`Invalidated localStorage cache for: ${cacheKey}`)
          }
        }
      })
      return
    }
    
    if (!('caches' in window)) return
    
    const cache = await caches.open(apiCache.cacheName)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const url = request.url
      const shouldInvalidate = typeof pattern === 'string' 
        ? url.includes(pattern) 
        : pattern.test(url)
      
      if (shouldInvalidate) {
        await cache.delete(request)
        console.log(`Invalidated cache for: ${url}`)
      }
    }
  } catch (error) {
    console.error('Error invalidating cache:', error)
  }
}
