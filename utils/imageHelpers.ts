/**
 * Image handling utilities with performance optimizations
 * Contains helper functions for image loading, error handling, progressive loading, and optimization
 */

import { ref, computed } from 'vue'

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
   * Sets imageLoaded to true and logs success
   */
  const handleImageLoad = () => {
    imageLoaded.value = true
    console.log('Image loaded successfully')
  }

  /**
   * Handler for image load error
   * Sets imageLoadError to true and logs warning
   */
  const handleImageError = () => {
    imageLoadError.value = true
    console.warn('Image failed to load, using fallback')
  }

  /**
   * Reset image states to initial values
   * Useful when changing image sources
   */
  const resetImageStates = () => {
    imageLoadError.value = false
    imageLoaded.value = false
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
    if (process.client && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting.value = entry.isIntersecting
          if (entry.isIntersecting) {
            observer.disconnect()
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      )
      
      observer.observe(target)
    } else {
      // Fallback for browsers without IntersectionObserver
      isIntersecting.value = true
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
 * Get optimized image URL for different screen sizes with modern formats
 * @param src - Original image source
 * @param width - Target width
 * @param height - Target height  
 * @param quality - Image quality (1-100)
 * @param format - Preferred format
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  src: string, 
  width?: number, 
  height?: number,
  quality: number = 80,
  format: string = 'avif,webp,jpg'
): string {
  const params = new URLSearchParams()
  
  if (width) {
    params.set('w', width.toString())
  }
  
  if (height) {
    params.set('h', height.toString())
  }
  
  params.set('q', quality.toString())
  params.set('f', format)
  params.set('fit', 'cover')
  
  return `${src}?${params.toString()}`
}

/**
 * Get responsive image srcset for different screen sizes
 * @param src - Original image source
 * @param sizes - Array of width sizes
 * @param quality - Image quality
 * @returns Optimized srcset string
 */
export function getResponsiveImageSrcSet(
  src: string,
  sizes: number[] = [400, 800, 1200, 1600],
  quality: number = 80
): string {
  return sizes
    .map(size => `${getOptimizedImageUrl(src, size, undefined, quality)} ${size}w`)
    .join(', ')
}

/**
 * Generate simple gradient placeholder for progressive loading
 * @param width - Placeholder width
 * @param height - Placeholder height
 * @returns Base64 encoded gradient placeholder
 */
export function generateBlurPlaceholder(width: number = 40, height: number = 40): string {
  // Return empty string on server side
  if (!process.client) {
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
  priority: 'high' | 'medium' | 'low' = 'high'
): Promise<HTMLImageElement>[] {
  return images.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      // Set loading priority if supported
      if ('loading' in img) {
        img.loading = priority === 'high' ? 'eager' : 'lazy'
      }
      
      // Set fetch priority if supported (convert medium to auto for HTML standard)
      if ('fetchPriority' in img) {
        const fetchPriority = priority === 'medium' ? 'auto' : priority as 'high' | 'low'
        img.fetchPriority = fetchPriority
      }
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
      
      img.src = getOptimizedImageUrl(src, 1920, 1080, 85)
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
