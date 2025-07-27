/**
 * Image handling utilities
 * Contains helper functions for image loading, error handling, and state management
 */

import { ref } from 'vue'

/**
 * Composable for handling image loading states and events
 * @returns Object with reactive states and handler functions
 */
export function useImageLoading() {
  // Reactive state for image handling
  const imageLoadError = ref(false)
  const imageLoaded = ref(false)

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

  return {
    // Reactive states
    imageLoadError: readonly(imageLoadError),
    imageLoaded: readonly(imageLoaded),
    isImageLoading: readonly(isImageLoading),
    
    // Handler functions
    handleImageLoad,
    handleImageError,
    resetImageStates
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
 * Get optimized image URL for different screen sizes
 * @param src - Original image source
 * @param width - Target width
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  src: string, 
  width?: number, 
  quality: number = 80
): string {
  const params = new URLSearchParams()
  
  if (width) {
    params.set('w', width.toString())
  }
  
  params.set('q', quality.toString())
  params.set('f', 'webp')
  
  return `${src}?${params.toString()}`
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
