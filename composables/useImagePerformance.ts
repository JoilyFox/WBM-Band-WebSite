/**
 * Performance monitoring composable for image loading
 */

import { ref } from 'vue'

interface ImageMetrics {
  src: string
  loadTime: number
  size?: number
  format?: string
  loadedAt: Date
}

export function useImagePerformance() {
  const metrics = ref<ImageMetrics[]>([])
  const isMonitoring = ref(false)

  /**
   * Start monitoring image performance
   */
  const startMonitoring = () => {
    if (!process.client) return
    
    isMonitoring.value = true
    
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.initiatorType === 'img' || entry.name.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
            const metric: ImageMetrics = {
              src: entry.name,
              loadTime: entry.duration,
              size: entry.transferSize,
              loadedAt: new Date()
            }
            
            metrics.value.push(metric)
            
            // Log slow loading images
            if (entry.duration > 1000) {
              console.warn(`🐌 Slow image load: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
            }
          }
        })
      })
      
      try {
        observer.observe({ entryTypes: ['resource'] })
      } catch (e) {
        console.log('Resource observer not supported')
      }
    }
  }

  /**
   * Stop monitoring
   */
  const stopMonitoring = () => {
    isMonitoring.value = false
  }

  /**
   * Get performance statistics
   */
  const getPerformanceStats = () => {
    const totalImages = metrics.value.length
    if (totalImages === 0) return null

    const loadTimes = metrics.value.map(m => m.loadTime)
    const totalSize = metrics.value.reduce((sum, m) => sum + (m.size || 0), 0)
    
    return {
      totalImages,
      averageLoadTime: loadTimes.reduce((sum, time) => sum + time, 0) / totalImages,
      slowestImage: Math.max(...loadTimes),
      fastestImage: Math.min(...loadTimes),
      totalSize,
      averageSize: totalSize / totalImages
    }
  }

  /**
   * Get slow loading images
   */
  const getSlowImages = (threshold: number = 1000) => {
    return metrics.value.filter(metric => metric.loadTime > threshold)
  }

  /**
   * Clear metrics
   */
  const clearMetrics = () => {
    metrics.value = []
  }

  return {
    isMonitoring: readonly(isMonitoring),
    metrics: readonly(metrics),
    startMonitoring,
    stopMonitoring,
    getPerformanceStats,
    getSlowImages,
    clearMetrics
  }
}
