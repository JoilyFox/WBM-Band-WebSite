import { ref, computed } from 'vue'
import { cachedGet, cachedPost, cachedPut, apiDelete, invalidateCache } from '~/utils/api'
import { apiCache } from '~/utils/cache'

interface UseApiOptions {
  cache?: {
    enabled?: boolean
    ttl?: number
  }
  loading?: boolean
  errorHandling?: {
    showNotification?: boolean
    rethrow?: boolean
  }
}

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  /**
   * Generic API request wrapper with loading state
   */
  const request = async <T = any>(
    apiCall: () => Promise<T>,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    const { loading: manageLoading = true } = options
    
    if (manageLoading) {
      loading.value = true
    }
    error.value = null
    
    try {
      const result = await apiCall()
      return result
    } catch (err: any) {
      error.value = err.message || 'An error occurred'
      console.error('API request failed:', err)
      return null
    } finally {
      if (manageLoading) {
        loading.value = false
      }
    }
  }
  
  /**
   * GET request with caching
   */
  const get = async <T = any>(
    url: string,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    const { cache = { enabled: true, ttl: 5 * 60 * 1000 } } = options
    
    return request(
      () => cachedGet(url, {}, cache, options.errorHandling),
      options
    )
  }
  
  /**
   * POST request
   */
  const post = async <T = any>(
    url: string,
    data: any,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    const { cache = { enabled: false } } = options
    
    return request(
      () => cachedPost(url, data, {}, cache, options.errorHandling),
      options
    )
  }
  
  /**
   * PUT request
   */
  const put = async <T = any>(
    url: string,
    data: any,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    const { cache = { enabled: false } } = options
    
    return request(
      () => cachedPut(url, data, {}, cache, options.errorHandling),
      options
    )
  }
  
  /**
   * DELETE request
   */
  const del = async <T = any>(
    url: string,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    return request(
      () => apiDelete(url, {}, options.errorHandling),
      options
    )
  }
  
  /**
   * Clear specific cache entries
   */
  const clearCache = async (pattern?: string | RegExp) => {
    if (pattern) {
      await invalidateCache(pattern)
    } else {
      await apiCache.clear()
    }
  }
  
  /**
   * Get cache statistics
   */
  const getCacheStats = async () => {
    return await apiCache.getStats()
  }
  
  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    isLoading: computed(() => loading.value),
    hasError: computed(() => error.value !== null),
    
    // Methods
    request,
    get,
    post,
    put,
    delete: del,
    clearCache,
    getCacheStats
  }
}