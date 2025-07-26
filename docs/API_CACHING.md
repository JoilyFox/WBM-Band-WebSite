# WBM Band Website - API Caching System

This application features a robust API caching system that improves performance by storing API responses in the browser cache and reducing redundant network requests.

## Features

✅ **Browser-based caching** using Web Cache API with localStorage fallback  
✅ **Configurable TTL** (Time To Live) for cache entries  
✅ **Automatic cache cleanup** for expired entries  
✅ **Cache size and entry monitoring**  
✅ **Manual cache clearing and invalidation**  
✅ **Global loading bar** integration  
✅ **Custom snackbar notifications**

## Quick Demo

Visit `http://localhost:3001` and try the API Caching System Demo:

1. **Test Cached Requests**: Click "Fetch Users" twice - notice the second call is instant (cached)
2. **Slow Endpoint Demo**: Try the "Slow Endpoint" - it takes 3+ seconds first time, instant when cached
3. **Cache Management**: Clear specific cache entries and see the difference
4. **Monitor Usage**: Check cache stats to monitor storage usage

## Usage Examples

### Basic API Calls with Caching

```typescript
// Using the useApi composable
const api = useApi()

// GET request with 2-minute cache
const users = await api.get('/api/users', {
  cache: { enabled: true, ttl: 2 * 60 * 1000 }
})

// POST request (typically not cached)
const result = await api.post('/api/users', userData)
```

### Direct API Utility Usage

```typescript
import { cachedGet, cachedPost } from '~/utils/api'

// Cached GET request
const data = await cachedGet('/api/posts', {}, {
  enabled: true,
  ttl: 5 * 60 * 1000 // 5 minutes
})

// POST request
const result = await cachedPost('/api/posts', postData)
```

### Cache Management

```typescript
import { apiCache, invalidateCache } from '~/utils/api'

// Clear all cache
await apiCache.clear()

// Clear specific cache entries
await invalidateCache('users') // Clear all entries containing 'users'

// Get cache statistics
const stats = await apiCache.getStats()
console.log(`Cache has ${stats.entries} entries using ${stats.size} bytes`)
```

## Configuration

### Default Settings

- **Cache Name**: `"wbm-api-cache"`
- **Default TTL**: 5 minutes (300,000 ms)
- **Auto Cleanup**: Every 10 minutes
- **Fallback**: localStorage when Cache API not supported

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
const data = await api.get('/api/live-data', {
  cache: { enabled: false }
})
```

## Browser Compatibility

- **Primary**: Uses Web Cache API (modern browsers)
- **Fallback**: Uses localStorage (older browsers)
- **SSR Safe**: Gracefully handles server-side rendering

## Architecture

### Core Components

1. **`utils/cache.ts`** - Core caching utility with Web Cache API and localStorage fallback
2. **`utils/api.ts`** - API wrapper with caching integration
3. **`composables/useApi.ts`** - Vue composable for easy API usage
4. **`server/api/[...path].ts`** - Mock API endpoints for testing

### Cache Storage Strategy

- **Cache API**: Preferred for modern browsers (service worker compatible)
- **localStorage**: Fallback for older browsers or restricted environments
- **Automatic Detection**: Seamlessly switches based on browser capabilities

## Testing the System

The homepage includes a comprehensive demo section that allows you to:

- Test cached vs non-cached requests
- Monitor cache performance improvements
- Manage cache entries
- View cache statistics
- Test with intentionally slow endpoints

## Best Practices

1. **Choose appropriate TTL values** - Balance between performance and data freshness
2. **Use caching for GET requests** - POST/PUT/DELETE typically shouldn't be cached
3. **Monitor cache size** - Use `getCacheStats()` to track usage
4. **Invalidate when needed** - Clear cache after data mutations
5. **Handle errors gracefully** - Always have fallbacks for cache failures
