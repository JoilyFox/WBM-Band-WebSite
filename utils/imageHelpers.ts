/**
 * Image handling utilities with performance optimizations
 * Contains helper functions for image loading, error handling, progressive loading, and optimization
 */

import { ref, computed } from 'vue'
import imagePresets from '~/constants/imagePresets.json'

/**
 * Per-preset responsive width descriptors, shared with the build pipeline via
 * `constants/imagePresets.json` so the generated files and the <source srcset>
 * can never drift. Single-width presets (meta/team/thumbnail) are treated as
 * non-responsive (a single-URL srcset, i.e. the old behaviour).
 */
const RESPONSIVE_WIDTHS: Record<string, number[]> = Object.fromEntries(
  Object.entries(imagePresets as Record<string, { widths?: number[] }>)
    .filter(([, v]) => v && Array.isArray(v.widths))
    .map(([k, v]) => [k, v.widths as number[]])
)

/**
 * Recommended `sizes` per usage. The rendered <img> and the preloader MUST pass
 * the same value so the browser picks — and reuses — the same variant (no
 * double-fetch). Tune to how each image is actually laid out.
 */
export const IMAGE_SIZES = {
  hero: '100vw',
  album: '(max-width: 640px) 60vw, (max-width: 1024px) 40vw, 360px',
  about: '(min-width: 1024px) 960px, 92vw'
} as const

/**
 * Composable for handling image loading states and events with performance optimizations
 * @returns Object with reactive states and handler functions
 */
export function useImageLoading() {
  // Reactive state for image handling
  const imageLoadError = ref(false)
  const imageLoaded = ref(false)
  const isIntersecting = ref(false)

  /**
   * Handler for successful image load
   * Sets imageLoaded to true
   */
  const handleImageLoad = (event?: Event) => {
    imageLoaded.value = true
    if (import.meta.client) {
      const target = event?.target as HTMLImageElement | undefined
      console.log('[ProgressiveImage] loaded', target?.currentSrc || target?.src || 'unknown')
    }
  }

  /**
   * Handler for image load error
   * Sets imageLoadError to true and logs warning
   */
  const handleImageError = (event: Event) => {
    imageLoadError.value = true
    const target = event.target as HTMLImageElement
    console.warn('Image failed to load:', {
      src: target?.src,
      error: event
    })
  }

  /**
   * Reset image states to initial values
   * Useful when changing image sources
   */
  const resetImageStates = () => {
    imageLoadError.value = false
    imageLoaded.value = false
    if (import.meta.client) {
      console.log('[ProgressiveImage] states reset')
    }
  }

  /**
   * Check if image is in loading state
   * @returns boolean indicating if image is currently loading
   */
  const isImageLoading = computed(() => {
    return !imageLoaded.value && !imageLoadError.value
  })

  /**
   * Set up intersection observer for lazy loading
   * @param target - Target element to observe
   */
  const setIntersectionTarget = (target: HTMLElement) => {
    if (import.meta.client && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            isIntersecting.value = true
            observer.disconnect()
            if (import.meta.client) {
              console.log('[ProgressiveImage] intersecting, begin load')
            }
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      )

      observer.observe(target)

      // If already in viewport, trigger immediately
      const rect = target.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0

      if (isInViewport) {
        isIntersecting.value = true
        observer.disconnect()
        if (import.meta.client) {
          console.log('[ProgressiveImage] already in viewport, begin load')
        }
      }
    } else {
      // Fallback for browsers without IntersectionObserver
      isIntersecting.value = true
      if (import.meta.client) {
        console.log('[ProgressiveImage] IntersectionObserver unavailable, load immediately')
      }
    }
  }

  return {
    // Reactive states
    imageLoadError: readonly(imageLoadError),
    imageLoaded: readonly(imageLoaded),
    isImageLoading: readonly(isImageLoading),
    isIntersecting: readonly(isIntersecting),

    // Handler functions
    handleImageLoad,
    handleImageError,
    resetImageStates,
    setIntersectionTarget
  }
}

/**
 * Utility function to preload an image
 * @param src - Image source URL
 * @returns Promise that resolves when image loads or rejects on error
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))

    img.src = src
  })
}

/**
 * Get optimized image URL with format fallbacks for different screen sizes
 * @param src - Original image source
 * @param width - Target width
 * @param height - Target height
 * @param quality - Image quality (1-100)
 * @param preset - Preset name for predefined configurations
 * @returns Object with optimized image URLs and srcset
 */
export function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: number = 80,
  preset?: string
): {
  avif: string
  webp: string
  jpg: string
  srcSet: {
    avif: string
    webp: string
    jpg: string
  }
} {
  // Remove file extension and get base path
  const basePath = src.replace(/\.[^/.]+$/, '')
  const isOptimizedPath = src.includes('/optimized/')

  // If already optimized path, use as is
  if (isOptimizedPath) {
    return {
      avif: basePath + '.avif',
      webp: basePath + '.webp',
      jpg: basePath + '.jpg',
      srcSet: {
        avif: basePath + '.avif',
        webp: basePath + '.webp',
        jpg: basePath + '.jpg'
      }
    }
  }

  // Apply preset configurations
  let targetWidth = width
  let targetHeight = height
  let targetQuality = quality

  if (preset) {
    const presetConfig = getPresetConfig(preset)
    targetWidth = presetConfig.width || width
    targetHeight = presetConfig.height || height
    targetQuality = presetConfig.quality || quality
  }

  // Convert original path to optimized path
  const optimizedBasePath = src.replace('/images/', '/images/optimized/').replace(/\.[^/.]+$/, '')

  return {
    avif: optimizedBasePath + '.avif',
    webp: optimizedBasePath + '.webp',
    jpg: optimizedBasePath + '.jpg',
    srcSet: {
      avif: optimizedBasePath + '.avif',
      webp: optimizedBasePath + '.webp',
      jpg: optimizedBasePath + '.jpg'
    }
  }
}

/**
 * Get preset configuration based on preset name
 * @param preset - Preset name
 * @returns Preset configuration object
 */
function getPresetConfig(preset: string) {
  const presets: Record<string, { width?: number; height?: number; quality?: number }> = {
    hero: { width: 1920, height: 1080, quality: 85 },
    heroVertical: { width: 1080, height: 1920, quality: 85 },
    heroMobile: { width: 768, height: 1024, quality: 80 },
    about: { width: 1600, height: 900, quality: 85 },
    album: { width: 400, height: 400, quality: 85 },
    albumLarge: { width: 800, height: 800, quality: 90 },
    thumbnail: { width: 200, height: 200, quality: 80 }
  }

  return presets[preset] || { quality: 80 }
}

/**
 * Generate responsive picture element sources for modern image formats
 * @param src - Original image source
 * @param sizes - CSS sizes attribute value
 * @param preset - Preset name for predefined configurations
 * @returns Object with source elements for picture tag
 */
/**
 * Build a width-descriptor srcset from a base path. The largest width points at
 * the base file (`name.ext`); smaller widths at `name-<w>.ext` — exactly the
 * files `scripts/compress-images.js` emits for the same preset.
 */
function buildSrcSet(baseNoExt: string, ext: string, widths: number[]): string {
  const max = Math.max(...widths)
  return widths
    .map((w) => (w === max ? `${baseNoExt}.${ext} ${w}w` : `${baseNoExt}-${w}.${ext} ${w}w`))
    .join(', ')
}

export function generatePictureSources(src: string, sizes?: string, preset?: string) {
  const optimizedUrls = getOptimizedImageUrl(src, undefined, undefined, 80, preset)
  const widths = preset ? RESPONSIVE_WIDTHS[preset] : undefined
  const responsive = !!widths && widths.length > 1
  const sizesValue = sizes || '100vw'

  const avifBase = optimizedUrls.avif.replace(/\.avif$/, '')
  const webpBase = optimizedUrls.webp.replace(/\.webp$/, '')
  const jpgBase = optimizedUrls.jpg.replace(/\.jpg$/, '')

  return {
    avifSource: {
      srcset: responsive ? buildSrcSet(avifBase, 'avif', widths as number[]) : optimizedUrls.avif,
      type: 'image/avif',
      sizes: sizesValue
    },
    webpSource: {
      srcset: responsive ? buildSrcSet(webpBase, 'webp', widths as number[]) : optimizedUrls.webp,
      type: 'image/webp',
      sizes: sizesValue
    },
    fallbackSrc: optimizedUrls.jpg,
    fallbackSrcset: responsive
      ? buildSrcSet(jpgBase, 'jpg', widths as number[])
      : optimizedUrls.jpg,
    sizes: sizesValue
  }
}

/**
 * Check if browser supports modern image formats
 * @returns Object indicating format support
 */
export function checkImageFormatSupport() {
  if (!import.meta.client) {
    return { avif: false, webp: false }
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return {
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
}

/**
 * Build a real responsive srcset (width descriptors → distinct generated files)
 * for a given preset, e.g. for a hand-rolled <img srcset>/<source>. Widths come
 * from constants/imagePresets.json, the same set the build pipeline emits.
 * Returns the JPEG srcset by default (widest support); pass 'avif'/'webp' for
 * those. Most call sites should prefer <ProgressiveImage>, which wires all three
 * formats plus the gradient placeholder and load-in fade.
 */
export function getResponsiveImageSrcSet(
  src: string,
  preset: string,
  format: 'avif' | 'webp' | 'jpg' = 'jpg'
): string {
  const sources = generatePictureSources(src, undefined, preset)
  if (format === 'avif') return sources.avifSource.srcset
  if (format === 'webp') return sources.webpSource.srcset
  return sources.fallbackSrcset
}

/**
 * Generate simple gradient placeholder for progressive loading
 * @param width - Placeholder width
 * @param height - Placeholder height
 * @returns Base64 encoded gradient placeholder
 */
export function generateBlurPlaceholder(width: number = 40, height: number = 40): string {
  // Return empty string on server side
  if (!import.meta.client) {
    return ''
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Create simple black to white gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#000000')
    gradient.addColorStop(0.5, '#333333')
    gradient.addColorStop(1, '#000000')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return canvas.toDataURL('image/jpeg', 0.1)
  } catch (error) {
    console.warn('Failed to generate gradient placeholder:', error)
    return ''
  }
}

/**
 * Preload critical images with priority
 * @param images - Array of image sources to preload
 * @param priority - Loading priority
 * @returns Promise array for all preloaded images
 */
export function preloadCriticalImages(
  images: string[],
  priority: 'high' | 'medium' | 'low' = 'high',
  options: { preset?: string; sizes?: string } = {}
): Promise<HTMLImageElement>[] {
  return images.map((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()

      // Set loading priority if supported
      if ('loading' in img) {
        img.loading = priority === 'high' ? 'eager' : 'lazy'
      }

      // Set fetch priority if supported (convert medium to auto for HTML standard)
      if ('fetchPriority' in img) {
        const fetchPriority = priority === 'medium' ? 'auto' : (priority as 'high' | 'low')
        img.fetchPriority = fetchPriority
      }

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))

      // Preload via the SAME AVIF srcset + sizes the rendered <img> uses, so the
      // browser warms (and then reuses) the exact variant it will display — no
      // double-fetch of the full-size base on small screens. Falls back to a
      // single URL for non-responsive presets.
      const sources = generatePictureSources(src, options.sizes, options.preset)
      if (sources.avifSource.srcset.includes(' ')) {
        img.srcset = sources.avifSource.srcset
        img.sizes = sources.avifSource.sizes
      } else {
        img.src = sources.avifSource.srcset || src
      }
    })
  })
}

/**
 * Image loading states enum for better type safety
 */
export enum ImageLoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * Advanced image loading composable with more states
 * @returns Object with detailed loading states and handlers
 */
export function useAdvancedImageLoading() {
  const loadingState = ref<ImageLoadingState>(ImageLoadingState.IDLE)
  const loadingProgress = ref(0)

  const handleImageLoadStart = () => {
    loadingState.value = ImageLoadingState.LOADING
    loadingProgress.value = 0
  }

  const handleImageLoadProgress = (event: ProgressEvent) => {
    if (event.lengthComputable) {
      loadingProgress.value = (event.loaded / event.total) * 100
    }
  }

  const handleImageLoadSuccess = () => {
    loadingState.value = ImageLoadingState.LOADED
    loadingProgress.value = 100
  }

  const handleImageLoadError = () => {
    loadingState.value = ImageLoadingState.ERROR
    loadingProgress.value = 0
  }

  const resetLoadingState = () => {
    loadingState.value = ImageLoadingState.IDLE
    loadingProgress.value = 0
  }

  return {
    loadingState: readonly(loadingState),
    loadingProgress: readonly(loadingProgress),
    handleImageLoadStart,
    handleImageLoadProgress,
    handleImageLoadSuccess,
    handleImageLoadError,
    resetLoadingState
  }
}
