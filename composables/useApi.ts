/**
 * API composable for handling HTTP requests
 * Provides a consistent interface for API calls with error handling
 */
export const useApi = () => {
  const config = useRuntimeConfig()

  const apiFetch = async <T>(url: string, options: any = {}): Promise<T> => {
    try {
      const response = await $fetch<T>(url, {
        baseURL: config.public.apiBase || '/api',
        ...options,
      })
      
      return response
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  return {
    get: <T>(url: string, options?: any) => apiFetch<T>(url, { method: 'GET', ...options }),
    post: <T>(url: string, body?: any, options?: any) => apiFetch<T>(url, { method: 'POST', body, ...options }),
    put: <T>(url: string, body?: any, options?: any) => apiFetch<T>(url, { method: 'PUT', body, ...options }),
    delete: <T>(url: string, options?: any) => apiFetch<T>(url, { method: 'DELETE', ...options }),
  }
}