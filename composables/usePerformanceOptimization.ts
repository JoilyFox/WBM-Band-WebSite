/**
 * Performance Optimization Composable
 * Automatically detects device capabilities and applies appropriate optimizations
 * Target: iPhone 7/8 level performance and above
 */

import { ref, computed, onMounted } from 'vue'

interface DeviceMetrics {
  deviceMemory: number
  hardwareConcurrency: number
  effectiveType: string
  pixelRatio: number
  isMobile: boolean
  screenWidth: number
  screenHeight: number
}

interface PerformanceLevel {
  level: 'high' | 'medium' | 'low'
  score: number
  enableAnimations: boolean
  enableBackdropBlur: boolean
  enableComplexGradients: boolean
  enableFloatingEffects: boolean
  enableParallax: boolean
  maxAnimationCount: number
  blurStrength: number
  animationDuration: number
}

export function usePerformanceOptimization() {
  const deviceMetrics = ref<DeviceMetrics>({
    deviceMemory: 4,
    hardwareConcurrency: 4,
    effectiveType: '4g',
    pixelRatio: 1,
    isMobile: false,
    screenWidth: 1920,
    screenHeight: 1080
  })

  const performanceLevel = ref<PerformanceLevel>({
    level: 'high',
    score: 10,
    enableAnimations: true,
    enableBackdropBlur: true,
    enableComplexGradients: true,
    enableFloatingEffects: true,
    enableParallax: true,
    maxAnimationCount: 10,
    blurStrength: 12,
    animationDuration: 1
  })

  const prefersReducedMotion = ref(false)

  // Computed properties for easy access
  const isLowPerformanceDevice = computed(() => performanceLevel.value.level === 'low')
  const isMediumPerformanceDevice = computed(() => performanceLevel.value.level === 'medium')
  const isHighPerformanceDevice = computed(() => performanceLevel.value.level === 'high')
  const shouldReduceAnimations = computed(() => 
    prefersReducedMotion.value || performanceLevel.value.level === 'low'
  )

  // Performance-based CSS variables
  const performanceCSSVars = computed(() => ({
    '--perf-blur-strength': `${performanceLevel.value.blurStrength}px`,
    '--perf-animation-duration': `${performanceLevel.value.animationDuration}s`,
    '--perf-max-animations': performanceLevel.value.maxAnimationCount.toString(),
    '--perf-opacity': performanceLevel.value.level === 'low' ? '0.8' : performanceLevel.value.level === 'medium' ? '0.9' : '1'
  }))

  const detectDeviceCapabilities = () => {
    if (typeof window === 'undefined') return

    const navigator = window.navigator as any
    const screen = window.screen

    // Collect device metrics
    deviceMetrics.value = {
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      effectiveType: navigator.connection?.effectiveType || '4g',
      pixelRatio: window.devicePixelRatio || 1,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenWidth: screen.width || window.innerWidth,
      screenHeight: screen.height || window.innerHeight
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches
      calculatePerformanceLevel()
    })

    calculatePerformanceLevel()
  }

  const calculatePerformanceLevel = () => {
    const metrics = deviceMetrics.value
    let score = 10 // Start with base score

    // Memory scoring (iPhone 7 has 2GB, iPhone 8 has 2GB)
    if (metrics.deviceMemory >= 4) score += 3
    else if (metrics.deviceMemory >= 2) score += 1
    else score -= 2

    // CPU scoring (iPhone 7 has 2 cores, iPhone 8 has 2 performance cores)
    if (metrics.hardwareConcurrency >= 6) score += 3
    else if (metrics.hardwareConcurrency >= 4) score += 2
    else if (metrics.hardwareConcurrency >= 2) score += 0
    else score -= 3

    // Network scoring
    if (metrics.effectiveType === '4g') score += 2
    else if (metrics.effectiveType === '3g') score += 0
    else if (metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g') score -= 2

    // Display scoring (high DPI = more GPU work)
    if (metrics.pixelRatio <= 2) score += 1
    else if (metrics.pixelRatio <= 3) score += 0
    else score -= 1

    // Mobile penalty for battery life
    if (metrics.isMobile) score -= 1

    // Screen size consideration (larger screens = more pixels to render)
    const totalPixels = metrics.screenWidth * metrics.screenHeight * metrics.pixelRatio
    if (totalPixels > 2000000) score -= 1 // 4K+ displays

    // Prefer reduced motion override
    if (prefersReducedMotion.value) score -= 5

    // Determine performance level
    let level: PerformanceLevel['level']
    if (score >= 12) level = 'high'
    else if (score >= 8) level = 'medium'
    else level = 'low'

    // Set performance configuration
    performanceLevel.value = {
      level,
      score,
      enableAnimations: level !== 'low' && !prefersReducedMotion.value,
      enableBackdropBlur: level === 'high',
      enableComplexGradients: level !== 'low',
      enableFloatingEffects: level === 'high',
      enableParallax: level === 'high',
      maxAnimationCount: level === 'high' ? 10 : level === 'medium' ? 5 : 2,
      blurStrength: level === 'high' ? 12 : level === 'medium' ? 6 : 0,
      animationDuration: level === 'high' ? 1 : level === 'medium' ? 0.7 : 0.3
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Performance Detection:', {
        metrics: deviceMetrics.value,
        level: performanceLevel.value.level,
        score: performanceLevel.value.score,
        config: performanceLevel.value
      })
    }
  }

  // CSS class helpers
  const getPerformanceClass = () => {
    const classes = [`perf-${performanceLevel.value.level}`]
    
    if (shouldReduceAnimations.value) classes.push('reduce-animations')
    if (!performanceLevel.value.enableBackdropBlur) classes.push('no-backdrop-blur')
    if (!performanceLevel.value.enableComplexGradients) classes.push('simple-gradients')
    if (!performanceLevel.value.enableFloatingEffects) classes.push('no-floating')
    if (deviceMetrics.value.isMobile) classes.push('mobile-device')
    
    return classes.join(' ')
  }

  // Animation budget system
  const activeAnimationCount = ref(0)
  const canAddAnimation = computed(() => 
    activeAnimationCount.value < performanceLevel.value.maxAnimationCount
  )

  const requestAnimation = (name: string) => {
    if (!performanceLevel.value.enableAnimations || !canAddAnimation.value) {
      return false
    }
    activeAnimationCount.value++
    return true
  }

  const releaseAnimation = () => {
    if (activeAnimationCount.value > 0) {
      activeAnimationCount.value--
    }
  }

  // Intersection Observer for performance-aware animations
  const createPerformanceObserver = (callback: IntersectionObserverCallback) => {
    if (!window.IntersectionObserver) return null

    const options = {
      // Adjust thresholds based on performance level
      threshold: performanceLevel.value.level === 'low' ? [0.5] : [0.1, 0.5, 0.9],
      rootMargin: performanceLevel.value.level === 'low' ? '50px' : '100px'
    }

    return new IntersectionObserver(callback, options)
  }

  // Re-detect performance on window resize (device rotation, etc.)
  const handleResize = () => {
    detectDeviceCapabilities()
  }

  onMounted(() => {
    detectDeviceCapabilities()
    window.addEventListener('resize', handleResize, { passive: true })
  })

  return {
    // State
    deviceMetrics: readonly(deviceMetrics),
    performanceLevel: readonly(performanceLevel),
    prefersReducedMotion: readonly(prefersReducedMotion),
    
    // Computed
    isLowPerformanceDevice,
    isMediumPerformanceDevice,
    isHighPerformanceDevice,
    shouldReduceAnimations,
    performanceCSSVars,
    canAddAnimation,
    
    // Methods
    getPerformanceClass,
    requestAnimation,
    releaseAnimation,
    createPerformanceObserver,
    detectDeviceCapabilities
  }
}
