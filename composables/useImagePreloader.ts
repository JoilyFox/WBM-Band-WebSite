/**
 * Composable for managing image preloading and performance optimization
 */

import { ref, onMounted } from 'vue'
import { preloadCriticalImages } from '~/utils/imageHelpers'

export function useImagePreloader() {
  const isPreloading = ref(false)
  const preloadedImages = ref<string[]>([])
  const preloadErrors = ref<string[]>([])

  /**
   * Preload hero images for immediate display
   * @param heroImages - Array of hero image objects
   */
  const preloadHeroImages = async (heroImages: Array<{ src: string }>) => {
    if (!heroImages.length) return

    isPreloading.value = true
    
    try {
      const imageSources = heroImages.map(img => img.src)
      const preloadPromises = preloadCriticalImages(imageSources, 'high')
      
      // Wait for the first image to load (critical for LCP)
      await Promise.race(preloadPromises)
      
      // Continue loading others in background
      Promise.allSettled(preloadPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            preloadedImages.value.push(imageSources[index])
          } else {
            preloadErrors.value.push(imageSources[index])
            console.warn(`Failed to preload hero image: ${imageSources[index]}`)
          }
        })
      })
    } catch (error) {
      console.error('Error preloading hero images:', error)
    } finally {
      isPreloading.value = false
    }
  }

  /**
   * Preload critical album covers that are above the fold
   * @param albumImages - Array of album image URLs
   * @param maxImages - Maximum number of images to preload
   */
  const preloadAlbumCovers = async (albumImages: string[], maxImages: number = 4) => {
    if (!albumImages.length) return

    try {
      const criticalImages = albumImages.slice(0, maxImages)
      const preloadPromises = preloadCriticalImages(criticalImages, 'medium')
      
      Promise.allSettled(preloadPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            preloadedImages.value.push(criticalImages[index])
          } else {
            preloadErrors.value.push(criticalImages[index])
          }
        })
      })
    } catch (error) {
      console.error('Error preloading album covers:', error)
    }
  }

  /**
   * Check if an image has been preloaded
   * @param src - Image source to check
   * @returns boolean indicating if image is preloaded
   */
  const isImagePreloaded = (src: string): boolean => {
    return preloadedImages.value.includes(src)
  }

  /**
   * Get preloading statistics
   * @returns object with preloading stats
   */
  const getPreloadStats = () => {
    return {
      total: preloadedImages.value.length + preloadErrors.value.length,
      successful: preloadedImages.value.length,
      failed: preloadErrors.value.length,
      isLoading: isPreloading.value
    }
  }

  return {
    isPreloading: readonly(isPreloading),
    preloadedImages: readonly(preloadedImages),
    preloadErrors: readonly(preloadErrors),
    preloadHeroImages,
    preloadAlbumCovers,
    isImagePreloaded,
    getPreloadStats
  }
}
