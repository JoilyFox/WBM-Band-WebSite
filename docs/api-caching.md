# API Caching

The WBM Band Website includes a robust API caching system built on top of the Web Cache API with localStorage fallback. This feature helps improve performance by storing API responses in the browser cache and reducing redundant network requests.

## Overview

The API caching system is built around the **[`ApiCache`](../utils/cache.ts)** class which provides core caching functionality with automatic fallback to localStorage when the Cache API is not available.

## Components

- [`ApiCache`](../utils/cache.ts) - Core caching utility class
- [`cachedApiRequest`](../utils/api.ts) - API wrapper with caching integration
- [`useApi`](../composables/useApi.ts) - Vue composable for easy API usage
- [`[...path].ts`](../server/api/[...path].ts) - Mock API endpoints for testing

## Features

- Browser-based caching using Web Cache API with localStorage fallback
- Configurable TTL (Time To Live) for cache entries
- Automatic cache cleanup for expired entries
- Cache size and entry monitoring
- Manual cache clearing and pattern-based invalidation
- SSR-safe implementation
- TypeScript support throughout

## Quick Start

### Basic Usage

```typescript
import { apiCache } from '~/utils/cache'

// Cache some data
const cacheKey = apiCache.generateCacheKey('/api/users', { method: 'GET' })
await apiCache.set(cacheKey, userData)

// Retrieve cached data
const cachedData = await apiCache.get(cacheKey)
if (cachedData) {
  console.log('Using cached data:', cachedData)
} else {
  // Fetch fresh data from API
}
```

### Using the API Composable

```vue
<template>
  <div>
    <button @click="loadUsers" :disabled="loading">
      {{ loading ? 'Loading...' : 'Load Users' }}
    </button>
    <div v-if="users">{{ users.length }} users loaded</div>
  </div>
</template>

<script setup lang="ts">
const api = useApi()
const users = ref(null)

const { loading } = api

const loadUsers = async () => {
  users.value = await api.get('/api/users', {
    cache: { enabled: true, ttl: 5 * 60 * 1000 } // 5 minutes
  })
}
</script>
```

## API Reference

### ApiCache Class

#### Constructor

```typescript
const cache = new ApiCache(cacheName?: string)
```

#### Methods

**`generateCacheKey(url: string, options?: any): string`**

- Generates a unique cache key for API requests
- Parameters:
  - `url` (string) - The API endpoint URL
  - `options` (object) - Request options (method, body, params)
- Returns: string

**`get(cacheKey: string, ttl?: number): Promise<any|null>`**

- Retrieves data from cache
- Parameters:
  - `cacheKey` (string) - The cache key
  - `ttl` (number) - Time to live in milliseconds (default: 5 minutes)
- Returns: Promise<any|null>

**`set(cacheKey: string, data: any): Promise<void>`**

- Stores data in cache
- Parameters:
  - `cacheKey` (string) - The cache key
  - `data` (any) - Data to cache
- Returns: Promise<void>

**`remove(cacheKey: string): Promise<void>`**

- Removes specific cache entry
- Parameters:
  - `cacheKey` (string) - The cache key
- Returns: Promise<void>

**`clear(): Promise<void>`**

- Clears all cache entries
- Returns: Promise<void>

**`getStats(): Promise<{size: number, entries: number}>`**

- Gets cache statistics
- Returns: Promise with size (bytes) and entries count

### API Utility Functions

**`cachedApiRequest(url, options?, cacheOptions?, errorOptions?)`**

- Makes a cached API request
- Supports GET, POST, PUT, DELETE methods
- Automatic caching for GET requests when enabled

**`cachedGet(url, options?, cacheOptions?, errorOptions?)`**

- Shorthand for cached GET requests

**`invalidateCache(pattern: string | RegExp)`**

- Invalidates cache entries matching pattern

### useApi Composable

```typescript
const api = useApi()

// Reactive state
api.loading        // Ref<boolean>
api.error          // Ref<string|null>
api.isLoading      // ComputedRef<boolean>
api.hasError       // ComputedRef<boolean>

// Methods
api.get(url, options?)           // GET with caching
api.post(url, data, options?)    // POST request
api.put(url, data, options?)     // PUT request
api.delete(url, options?)        // DELETE request
api.clearCache(pattern?)         // Clear cache
api.getCacheStats()              // Get stats
```

## Configuration

### Default Settings

- **Cache Name**: `"wbm-api-cache"`
- **Default TTL**: 5 minutes (300,000 ms)
- **Auto Cleanup**: Every 10 minutes (handled automatically)
- **Fallback Storage**: localStorage when Cache API not supported

### Customizing Cache Behavior

```typescript
// Custom TTL for specific requests
const data = await api.get('/api/data', {
  cache: { 
    enabled: true, 
    ttl: 10 * 60 * 1000 // 10 minutes
  }
})

// Disable caching for specific requests
const liveData = await api.get('/api/live-data', {
  cache: { enabled: false }
})

// Custom cache key
const customData = await cachedGet('/api/custom', {}, {
  enabled: true,
  key: 'my-custom-cache-key'
})
```

## Real-World Examples

### User Data Service

```typescript
// composables/useUserData.ts
export function useUserData() {
  const api = useApi()
  const users = ref([])
  
  const fetchUsers = async () => {
    const result = await api.get('/api/users', {
      cache: { enabled: true, ttl: 2 * 60 * 1000 } // 2 minutes
    })
    
    if (result?.data) {
      users.value = result.data
    }
  }
  
  const refreshUsers = async () => {
    await api.clearCache('users')
    await fetchUsers()
  }
  
  return {
    users: readonly(users),
    fetchUsers,
    refreshUsers,
    loading: api.loading
  }
}
```

### Data Mutation with Cache Invalidation

```typescript
const api = useApi()

// Update user and invalidate related cache
const updateUser = async (userId: number, userData: any) => {
  const result = await api.put(`/api/users/${userId}`, userData)
  
  if (result) {
    // Invalidate user-related cache entries
    await api.clearCache('users')
    await api.clearCache(`user-${userId}`)
    
    snackbar.success('User updated!', 'Changes saved successfully')
  }
  
  return result
}
```

## Browser Compatibility

- **Primary**: Uses Web Cache API (modern browsers, service worker compatible)
- **Fallback**: Uses localStorage (older browsers or restricted environments)
- **SSR Safe**: Gracefully handles server-side rendering
- **Error Resilient**: Continues working even if caching fails

## Best Practices

1. **Choose appropriate TTL values** - Balance between performance and data freshness
2. **Use caching for GET requests** - POST/PUT/DELETE typically shouldn't be cached
3. **Invalidate cache after mutations** - Clear relevant cache entries after data changes
4. **Monitor cache size** - Use `getCacheStats()` to track storage usage
5. **Handle cache failures gracefully** - Always have fallbacks for when caching fails
6. **Use pattern-based invalidation** - Clear multiple related entries efficiently

## Troubleshooting

**Cache not working in development?**

- Make sure you're testing in a secure context (HTTPS or localhost)
- Check browser console for Cache API support warnings
- Verify that localStorage fallback is working

**Cache growing too large?**

- Use shorter TTL values for less critical data
- Implement regular cache cleanup calls
- Consider cache size limits for localStorage fallback

**Stale data issues?**

- Verify TTL values are appropriate for your use case
- Implement proper cache invalidation after data mutations
- Use manual cache clearing when needed: `api.clearCache()`

**SSR hydration issues?**

- Cache only works client-side, which is expected behavior
- Server requests will always fetch fresh data
- Client-side navigation will use cached data appropriately
