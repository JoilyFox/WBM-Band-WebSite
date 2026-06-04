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

  const { imageLoadError, imageLoaded, handleImageLoad, handleImageError } = useImageLoading()
</script>

<template>
  <UiProgressiveImage
    src="/path/to/image"
    alt="Example"
    :class="{ loaded: imageLoaded }"
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

### `getOptimizedImageUrl(src, width?, height?, quality?, preset?)`

Maps an original image path to its pre-generated optimized variants under
`/images/optimized/`. There is **no** runtime query-string transform — the files
are emitted at build time by `scripts/compress-images.js`.

**Parameters:**

- `src`: Original image source
- `width`: Target width (optional)
- `height`: Target height (optional)
- `quality`: Image quality 1-100 (default: 80)
- `preset`: Preset name for predefined dimensions/quality (optional)

**Returns:** An object with `avif`, `webp`, `jpg` URLs plus a `srcSet` object
(`{ avif, webp, jpg }`).

**Usage:**

```typescript
import { getOptimizedImageUrl } from '~/utils/imageHelpers'

const urls = getOptimizedImageUrl('/images/hero.jpg', undefined, undefined, 80, 'hero')
// Returns: { avif: '/images/optimized/hero.avif', webp: '...', jpg: '...', srcSet: { ... } }
```

> Most call sites should prefer `<UiProgressiveImage>` (or `generatePictureSources()`),
> which wire all three formats plus the responsive `srcset` for you.

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

## Integration with ProgressiveImage

The project does not use `@nuxt/image`. These utilities back the
`<UiProgressiveImage>` component (`components/ui/ProgressiveImage.vue`), which
renders a native `<picture>` (AVIF → WebP → JPEG) built by
`generatePictureSources()`:

```vue
<UiProgressiveImage
  :src="imageSrc"
  alt="..."
  preset="hero"
  :class="{ 'image-loaded': imageLoaded }"
  loading="eager"
  fetch-priority="high"
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
