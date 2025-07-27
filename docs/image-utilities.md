# Image Utilities Documentation

## Overview
The `imageHelpers.ts` utility file contains composables and helper functions for handling image loading states, error management, and optimization utilities.

## Main Composables

### `useImageLoading()`
A simple composable for basic image loading state management.

**Returns:**
- `imageLoadError`: Readonly ref indicating if image failed to load
- `imageLoaded`: Readonly ref indicating if image loaded successfully
- `isImageLoading`: Computed ref indicating if image is currently loading
- `handleImageLoad()`: Function to call when image loads successfully
- `handleImageError()`: Function to call when image fails to load
- `resetImageStates()`: Function to reset all states to initial values

**Usage:**
```vue
<script setup>
import { useImageLoading } from '~/utils/imageHelpers'

const {
  imageLoadError,
  imageLoaded,
  handleImageLoad,
  handleImageError
} = useImageLoading()
</script>

<template>
  <NuxtImg 
    src="/path/to/image.jpg"
    :class="{ 'loaded': imageLoaded }"
    @load="handleImageLoad"
    @error="handleImageError"
  />
  <div v-if="imageLoadError" class="fallback-bg"></div>
</template>
```

### `useAdvancedImageLoading()`
A more detailed composable with loading progress and multiple states.

**Returns:**
- `loadingState`: Current loading state (IDLE, LOADING, LOADED, ERROR)
- `loadingProgress`: Loading progress percentage (0-100)
- Various handler functions for different loading events

## Utility Functions

### `preloadImage(src: string)`
Preloads an image and returns a promise.

**Parameters:**
- `src`: Image source URL

**Returns:** Promise<HTMLImageElement>

**Usage:**
```typescript
import { preloadImage } from '~/utils/imageHelpers'

try {
  const img = await preloadImage('/path/to/image.jpg')
  console.log('Image preloaded successfully')
} catch (error) {
  console.error('Failed to preload image:', error)
}
```

### `getOptimizedImageUrl(src, width?, quality?)`
Generates optimized image URLs with query parameters.

**Parameters:**
- `src`: Original image source
- `width`: Target width (optional)
- `quality`: Image quality 1-100 (default: 80)

**Returns:** Optimized image URL string

**Usage:**
```typescript
import { getOptimizedImageUrl } from '~/utils/imageHelpers'

const optimizedUrl = getOptimizedImageUrl('/image.jpg', 800, 90)
// Returns: "/image.jpg?w=800&q=90&f=webp"
```

## CSS Integration

When using these utilities, pair them with CSS transitions for smooth animations:

```css
.image {
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

.image.loaded {
  opacity: 1;
}
```

## Best Practices

1. **Always handle both load and error events** to provide fallbacks
2. **Use readonly refs** to prevent accidental state mutations
3. **Reset states** when changing image sources
4. **Preload critical images** for better UX
5. **Use appropriate quality settings** for different use cases

## Integration with NuxtImg

The utilities work seamlessly with Nuxt Image component:

```vue
<NuxtImg 
  :src="imageSrc"
  :class="{ 'image-loaded': imageLoaded }"
  loading="eager"
  fetchpriority="high"
  format="webp,jpg"
  quality="90"
  @load="handleImageLoad"
  @error="handleImageError"
/>
```

This approach provides:
- ✅ Separation of concerns
- ✅ Reusable across components
- ✅ Type safety with TypeScript
- ✅ Better testing capabilities
- ✅ Cleaner component code
