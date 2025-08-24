/**
 * Advanced Performance Optimization Composable
 * Mobile-first approach: Low performance by default on mobile, high performance only for flagships
 * Desktop: Maintains current detection system
 */

import { ref, computed, onMounted } from 'vue'

interface DeviceMetrics {
  deviceMemory: number
  hardwareConcurrency: number
  effectiveType: string
  pixelRatio: number
  isMobile: boolean
  isTablet: boolean
  screenWidth: number
  screenHeight: number
  deviceModel: string
  isFlagship: boolean
  gpuTier: 'low' | 'medium' | 'high'
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
  mobileStrategy: 'flagship' | 'standard' | 'conservative'
}

export function usePerformanceOptimization() {
  const deviceMetrics = ref<DeviceMetrics>({
    deviceMemory: 4,
    hardwareConcurrency: 4,
    effectiveType: '4g',
    pixelRatio: 1,
    isMobile: false,
    isTablet: false,
    screenWidth: 1920,
    screenHeight: 1080,
    deviceModel: 'unknown',
    isFlagship: false,
    gpuTier: 'medium'
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
    animationDuration: 1,
    mobileStrategy: 'standard'
  })

  const prefersReducedMotion = ref(false)

  // Flagship device detection patterns
  const FLAGSHIP_DEVICES = {
    iphone: [
      // iPhone 12 and newer (A14+)
      /iPhone1[3-9],/i, // iPhone 13, 14, 15+
      /iPhone1[2-9],[2-9]/i, // iPhone 12 Pro Max etc
    ],
    samsung: [
      // Galaxy S20+ and Galaxy Note 20+ (2020+)
      /SM-[GN][0-9]{3}[0-9]+/i, // S21, S22, S23, S24, Note series
      /SM-F[0-9]{3}/i, // Galaxy Fold/Flip series
    ],
    google: [
      // Pixel 6+ (Tensor chips)
      /Pixel [6-9]/i,
      /Pixel 1[0-9]/i, // Pixel 10+
    ],
    oneplus: [
      // OnePlus 8+ (2020+)
      /OnePlus [8-9]/i,
      /OnePlus 1[0-9]/i,
    ],
    xiaomi: [
      // Xiaomi flagship series
      /Mi 1[0-9]/i, // Mi 10, 11, 12+
      /Xiaomi 1[0-9]/i,
      /Redmi K[3-9][0-9]/i, // Redmi K30+
    ]
  }

  const GPU_TIER_INDICATORS = {
    high: [
      // Apple A14+ (iPhone 12+, iPad Air 4+)
      /iPhone1[3-9],/i,
      /iPhone1[2-9],[2-9]/i,
      /iPad13,[0-9]/i, // iPad Air 4+
      /iPad1[4-9],[0-9]/i, // iPad Pro 2021+
      
      // Android flagships with Adreno 650+, Mali-G78+, etc.
      /Adreno \(TM\) [6-9][5-9][0-9]/i,
      /Mali-G[7-9][8-9]/i,
    ],
    medium: [
      // Apple A10-A13 (iPhone 7-11, iPad 6-8)
      /iPhone(?:9|10|11|12),[0-9]/i,
      /iPad[6-8],[0-9]/i,
      
      // Mid-range Android GPUs
      /Adreno \(TM\) [5-6][0-4][0-9]/i,
      /Mali-G[5-7][0-7]/i,
    ]
  }

  // Detect device characteristics
  const detectDeviceModel = (userAgent: string): { model: string; isFlagship: boolean; gpuTier: 'low' | 'medium' | 'high' } => {
    const ua = userAgent.toLowerCase()
    
    // Check flagship devices
    let isFlagship = false
    for (const [brand, patterns] of Object.entries(FLAGSHIP_DEVICES)) {
      if (patterns.some(pattern => pattern.test(userAgent))) {
        isFlagship = true
        break
      }
    }
    
    // Determine GPU tier
    let gpuTier: 'low' | 'medium' | 'high' = 'low'
    if (GPU_TIER_INDICATORS.high.some(pattern => pattern.test(userAgent))) {
      gpuTier = 'high'
    } else if (GPU_TIER_INDICATORS.medium.some(pattern => pattern.test(userAgent))) {
      gpuTier = 'medium'
    }
    
    // Extract device model name
    let model = 'unknown'
    const iphoneMatch = userAgent.match(/iPhone[0-9,]+/i)
    const samsungMatch = userAgent.match(/SM-[A-Z0-9]+/i)
    const pixelMatch = userAgent.match(/Pixel [0-9]+/i)
    
    if (iphoneMatch) model = iphoneMatch[0]
    else if (samsungMatch) model = samsungMatch[0]
    else if (pixelMatch) model = pixelMatch[0]
    
    return { model, isFlagship, gpuTier }
  }

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
    const userAgent = navigator.userAgent || ''

    // Detect device characteristics
    const deviceInfo = detectDeviceModel(userAgent)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /(iPad|Android.*tablet|Windows.*touch)/i.test(userAgent) && !/Mobile/i.test(userAgent)

    // Collect device metrics with all required fields
    deviceMetrics.value = {
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      effectiveType: navigator.connection?.effectiveType || '4g',
      pixelRatio: window.devicePixelRatio || 1,
      isMobile,
      isTablet,
      screenWidth: screen.width || window.innerWidth,
      screenHeight: screen.height || window.innerHeight,
      deviceModel: deviceInfo.model,
      isFlagship: deviceInfo.isFlagship,
      gpuTier: deviceInfo.gpuTier
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
    
    // Mobile-First Strategy: Start with conservative mobile settings
    if (metrics.isMobile && !metrics.isTablet) {
      // Mobile devices - default to low performance, upgrade only flagships
      let mobileStrategy: 'flagship' | 'standard' | 'conservative' = 'conservative'
      let level: PerformanceLevel['level'] = 'low'
      
      if (metrics.isFlagship && metrics.gpuTier === 'high') {
        // Only the best mobile devices get high performance
        mobileStrategy = 'flagship'
        level = 'high'
      } else if (metrics.isFlagship || metrics.gpuTier === 'medium') {
        // Good mobile devices get medium performance
        mobileStrategy = 'standard' 
        level = 'medium'
      }
      // All other mobile devices stay at 'conservative' low performance
      
      // Override for reduced motion or very low specs
      if (prefersReducedMotion.value || metrics.deviceMemory < 2 || metrics.hardwareConcurrency < 2) {
        level = 'low'
        mobileStrategy = 'conservative'
      }
      
      // Set mobile performance configuration
      performanceLevel.value = {
        level,
        score: level === 'high' ? 15 : level === 'medium' ? 10 : 5,
        mobileStrategy,
        enableAnimations: level !== 'low' && !prefersReducedMotion.value,
        enableBackdropBlur: level === 'high' && mobileStrategy === 'flagship',
        enableComplexGradients: level === 'high',
        enableFloatingEffects: false, // Always disabled on mobile for battery life
        enableParallax: false, // Always disabled on mobile for performance
        maxAnimationCount: level === 'high' ? 5 : level === 'medium' ? 3 : 1,
        blurStrength: level === 'high' ? 8 : level === 'medium' ? 4 : 0,
        animationDuration: level === 'high' ? 0.6 : level === 'medium' ? 0.4 : 0.2
      }
    } else {
      // Desktop/Tablet - use original scoring system
      let score = 10 // Start with base score

      // Memory scoring
      if (metrics.deviceMemory >= 8) score += 4
      else if (metrics.deviceMemory >= 4) score += 2
      else if (metrics.deviceMemory >= 2) score += 0
      else score -= 3

      // CPU scoring
      if (metrics.hardwareConcurrency >= 8) score += 4
      else if (metrics.hardwareConcurrency >= 6) score += 3
      else if (metrics.hardwareConcurrency >= 4) score += 2
      else if (metrics.hardwareConcurrency >= 2) score += 0
      else score -= 3

      // Network scoring
      if (metrics.effectiveType === '4g') score += 2
      else if (metrics.effectiveType === '3g') score += 0
      else if (metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g') score -= 2

      // Display scoring
      if (metrics.pixelRatio <= 1.5) score += 2
      else if (metrics.pixelRatio <= 2) score += 1
      else if (metrics.pixelRatio <= 3) score += 0
      else score -= 1

      // Screen resolution consideration
      const totalPixels = metrics.screenWidth * metrics.screenHeight * metrics.pixelRatio
      if (totalPixels > 4000000) score -= 2 // Very high res displays
      else if (totalPixels > 2000000) score -= 1 // 4K displays

      // GPU tier bonus for desktop
      if (metrics.gpuTier === 'high') score += 3
      else if (metrics.gpuTier === 'medium') score += 1

      // Prefer reduced motion override
      if (prefersReducedMotion.value) score -= 5

      // Determine performance level
      let level: PerformanceLevel['level']
      if (score >= 15) level = 'high'
      else if (score >= 10) level = 'medium'
      else level = 'low'

      // Set desktop performance configuration
      performanceLevel.value = {
        level,
        score,
        mobileStrategy: 'standard',
        enableAnimations: level !== 'low' && !prefersReducedMotion.value,
        enableBackdropBlur: level !== 'low',
        enableComplexGradients: level !== 'low',
        enableFloatingEffects: level === 'high',
        enableParallax: level === 'high',
        maxAnimationCount: level === 'high' ? 12 : level === 'medium' ? 8 : 3,
        blurStrength: level === 'high' ? 12 : level === 'medium' ? 8 : 2,
        animationDuration: level === 'high' ? 1 : level === 'medium' ? 0.7 : 0.4
      }
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Advanced Performance Detection:', {
        metrics: deviceMetrics.value,
        level: performanceLevel.value.level,
        score: performanceLevel.value.score,
        mobileStrategy: performanceLevel.value.mobileStrategy,
        config: performanceLevel.value
      })
    }
  }

  // CSS class helpers
  const getPerformanceClass = () => {
    const classes = [`perf-${performanceLevel.value.level}`]
    
    if (deviceMetrics.value.isMobile) {
      classes.push('mobile-device')
      classes.push(`mobile-${performanceLevel.value.mobileStrategy}`)
    }
    if (deviceMetrics.value.isTablet) classes.push('tablet-device')
    if (deviceMetrics.value.isFlagship) classes.push('flagship-device')
    if (shouldReduceAnimations.value) classes.push('reduce-animations')
    if (!performanceLevel.value.enableBackdropBlur) classes.push('no-backdrop-blur')
    if (!performanceLevel.value.enableComplexGradients) classes.push('simple-gradients')
    if (!performanceLevel.value.enableFloatingEffects) classes.push('no-floating')
    if (!performanceLevel.value.enableParallax) classes.push('no-parallax')
    
    return classes.join(' ')
  }

  // Mobile-specific performance checks
  const isMobileFlagship = computed(() => 
    deviceMetrics.value.isMobile && deviceMetrics.value.isFlagship
  )
  const shouldUseMobileFallback = computed(() =>
    deviceMetrics.value.isMobile && performanceLevel.value.mobileStrategy === 'conservative'
  )

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
    isMobileFlagship,
    shouldUseMobileFallback,
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
