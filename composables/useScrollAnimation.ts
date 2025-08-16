import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface ScrollAnimationOptions {
  threshold?: number
  throttleMs?: number
  useRAF?: boolean
  enableAdaptiveThrottling?: boolean
  enableIntersectionObserver?: boolean
  reducedMotionRespect?: boolean
  performanceMode?: 'auto' | 'high' | 'balanced' | 'low'
}

interface ScrollState {
  scrollY: number
  isScrolled: boolean
  isScrollingDown: boolean
  isScrollingUp: boolean
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const {
    threshold = 50,
    throttleMs = 16,
    useRAF = true,
    enableAdaptiveThrottling = true,
    enableIntersectionObserver = true,
    reducedMotionRespect = true,
    performanceMode = 'auto'
  } = options

  // Performance detection
  const isLowPerformanceDevice = ref(false)
  const prefersReducedMotion = ref(false)
  const currentThrottleMs = ref(throttleMs)

  // Scroll state
  const scrollY = ref(0)
  const previousScrollY = ref(0)
  const isScrolled = computed(() => scrollY.value > threshold)
  
  // Scroll direction with debouncing for better performance
  const scrollDirection = ref<'up' | 'down' | 'none'>('none')
  const isScrollingDown = computed(() => scrollDirection.value === 'down')
  const isScrollingUp = computed(() => scrollDirection.value === 'up')

  // Performance optimization variables
  let rafId: number | null = null
  let lastScrollTime = 0
  let isListenerActive = false
  let intersectionObserver: IntersectionObserver | null = null
  let isVisible = ref(true)
  let frameCount = 0
  let performanceStartTime = 0
  let lastDirectionChangeTime = 0
  // Keep reference to sentinel to clean it up properly
  let sentinelEl: HTMLDivElement | null = null
  
  // Adaptive performance tracking
  const performanceMetrics = {
    averageFrameTime: 16.67, // Target 60fps
    missedFrames: 0,
    totalFrames: 0
  }

  // Detect device performance capabilities
  const detectDevicePerformance = () => {
    if (typeof window === 'undefined') return

    // Check for reduced motion preference
    if (reducedMotionRespect) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.value = mediaQuery.matches
      
      mediaQuery.addEventListener('change', (e) => {
        prefersReducedMotion.value = e.matches
        adaptThrottling()
      })
    }

    // Detect low-performance indicators
    const navigator = window.navigator as any
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    // Check hardware concurrency (CPU cores)
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2
    
    // Check network connection
    const slowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData === true
    )
    
    // Check device memory (if available)
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2
    
    // Check if mobile device (generally less powerful)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    isLowPerformanceDevice.value = lowCPU || slowConnection || lowMemory || (isMobile && (lowCPU || lowMemory))
    
    adaptThrottling()
  }

  // Adaptive throttling based on performance
  const adaptThrottling = () => {
    if (performanceMode === 'auto') {
      if (prefersReducedMotion.value) {
        currentThrottleMs.value = 100 // Very conservative for accessibility
      } else if (isLowPerformanceDevice.value) {
        currentThrottleMs.value = 33 // ~30fps for low-end devices
      } else {
        // Adaptive based on performance metrics
        const avgFrameTime = performanceMetrics.averageFrameTime
        if (avgFrameTime > 20) { // Below 50fps
          currentThrottleMs.value = Math.min(50, avgFrameTime * 1.5)
        } else {
          currentThrottleMs.value = throttleMs
        }
      }
    } else {
      // Manual performance modes
      const modes = {
        high: 8,      // 120fps+ for high-end devices
        balanced: 16, // 60fps standard
        low: 33       // 30fps for low-end devices
      }
      currentThrottleMs.value = modes[performanceMode] || throttleMs
    }
  }

  // Performance monitoring
  const updatePerformanceMetrics = (frameTime: number) => {
    performanceMetrics.totalFrames++
    
    // Calculate rolling average
    const alpha = 0.1 // Smoothing factor
    performanceMetrics.averageFrameTime = 
      performanceMetrics.averageFrameTime * (1 - alpha) + frameTime * alpha
    
    // Count missed frames (above 20ms = below 50fps)
    if (frameTime > 20) {
      performanceMetrics.missedFrames++
    }
    
    // Adapt throttling every 60 frames
    if (performanceMetrics.totalFrames % 60 === 0) {
      adaptThrottling()
    }
  }
  // Optimized scroll handler with adaptive throttling and RAF
  const handleScroll = () => {
    const now = performance.now()
    
    // Skip if not visible (intersection observer optimization)
    if (!isVisible.value && enableIntersectionObserver) {
      return
    }
    
    // Adaptive throttling based on current performance
    if (now - lastScrollTime < currentThrottleMs.value) {
      return
    }
    
    // Performance tracking
    if (performanceStartTime === 0) {
      performanceStartTime = now
    }
    
    lastScrollTime = now

    if (useRAF && !prefersReducedMotion.value) {
      // Cancel previous RAF if still pending
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      
      // Use RAF for smooth animations
      rafId = requestAnimationFrame(() => updateScrollState(now))
    } else {
      // Direct update for reduced motion or non-RAF mode
      updateScrollState(now)
    }
  }

  // Update scroll state with performance optimizations
  const updateScrollState = (startTime: number) => {
    const updateStartTime = performance.now()
    const currentScrollY = Math.round(window.scrollY) // Round to avoid sub-pixel updates
    
    // Only update if there's a meaningful change (reduce unnecessary reactivity)
    const scrollDiff = Math.abs(currentScrollY - scrollY.value)
    if (scrollDiff > (isLowPerformanceDevice.value ? 2 : 1)) {
      previousScrollY.value = scrollY.value
      scrollY.value = currentScrollY
      
      // Update scroll direction with debouncing
      const now = performance.now()
      const timeSinceLastDirectionChange = now - lastDirectionChangeTime
      
      // Only update direction if enough time has passed and scroll difference is significant
      if (timeSinceLastDirectionChange > 50 && scrollDiff > 3) {
        const newDirection = currentScrollY > previousScrollY.value ? 'down' : 'up'
        if (scrollDirection.value !== newDirection) {
          scrollDirection.value = newDirection
          lastDirectionChangeTime = now
        }
      }
    }
    
    // Performance monitoring
    const frameTime = performance.now() - updateStartTime
    updatePerformanceMetrics(frameTime)
    
    rafId = null
  }

  // Intersection Observer for visibility optimization
  const setupIntersectionObserver = () => {
    if (!enableIntersectionObserver || typeof window === 'undefined') return
    
    // Create a tiny sentinel at the top of the page to detect when we've scrolled away
    // Keep it 1px tall so it does not contribute to page height/scroll area
    const sentinel = document.createElement('div')
    sentinel.style.position = 'absolute'
    sentinel.style.top = '0'
    sentinel.style.left = '0'
    sentinel.style.height = '1px'
    sentinel.style.width = '1px'
    sentinel.style.opacity = '0'
    sentinel.style.pointerEvents = 'none'
    sentinel.style.overflow = 'hidden'
    document.body.appendChild(sentinel)
    sentinelEl = sentinel
    
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible.value = entries[0].isIntersecting
      },
      {
        rootMargin: '200px 0px', // Start observing before element comes into view
        threshold: 0
      }
    )
    
    intersectionObserver.observe(sentinel)
  }

  // Passive scroll listener with enhanced options
  const addScrollListener = () => {
    if (!isListenerActive && typeof window !== 'undefined') {
      // Use passive listener with enhanced options for better performance
      const options = { 
        passive: true,
        capture: false
      }
      
      window.addEventListener('scroll', handleScroll, options)
      isListenerActive = true
      
      // Setup intersection observer
      setupIntersectionObserver()
    }
  }

  const removeScrollListener = () => {
    if (isListenerActive) {
      window.removeEventListener('scroll', handleScroll)
      isListenerActive = false
    }
    
    // Cancel any pending RAF
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    
    // Cleanup intersection observer and sentinel
    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }
    if (sentinelEl && sentinelEl.parentNode) {
      try { sentinelEl.parentNode.removeChild(sentinelEl) } catch {}
      sentinelEl = null
    }
  }

  // Desktop logo animation classes with performance-aware transitions
  const logoSizeClass = computed(() => {
    const baseClass = isScrolled.value ? 'h-20' : 'h-40'
    // Add performance-aware transition classes from scroll-animations.scss
    const transitionClass = prefersReducedMotion.value 
      ? 'transition-none' 
      : isLowPerformanceDevice.value 
        ? 'transition-transform-gpu' 
        : 'transition-all gpu-accelerated'
    return `${baseClass} ${transitionClass}`
  })

  const logoPositionClass = computed(() => {
    const baseClass = isScrolled.value ? 'top-[14px]' : 'top-[14px]'
    const transitionClass = prefersReducedMotion.value ? '' : 'transition-transform-gpu'
    return `${baseClass} ${transitionClass}`.trim()
  })

  // Navigation spacing classes with performance optimizations
  const leftNavSpacing = computed(() => {
    const baseClass = isScrolled.value ? 'pr-0' : 'pr-10'
    const transitionClass = prefersReducedMotion.value ? '' : 'transition-spacing'
    return `${baseClass} ${transitionClass}`.trim()
  })

  const rightNavSpacing = computed(() => {
    const baseClass = isScrolled.value ? 'pl-0' : 'pl-10'
    const transitionClass = prefersReducedMotion.value ? '' : 'transition-spacing'
    return `${baseClass} ${transitionClass}`.trim()
  })

  // Mobile logo fade animation classes with enhanced performance
  const mobileLogoCenteredClass = computed(() => {
    if (prefersReducedMotion.value) {
      return isScrolled.value ? 'opacity-0' : 'opacity-100'
    }
    
    const baseClasses = 'absolute left-1/2 top-[30px] -translate-x-1/2 z-10'
    const transitionClasses = 'transition-all duration-300 ease-in-out'
    
    if (isScrolled.value) {
      // Hidden state: fade out and move up
      return `${baseClasses} ${transitionClasses} opacity-0 -translate-y-3 pointer-events-none`
    } else {
      // Visible state: fully visible at normal position
      return `${baseClasses} ${transitionClasses} opacity-100 translate-y-0 pointer-events-auto`
    }
  })

  const mobileLogoLeftClass = computed(() => {
    if (prefersReducedMotion.value) {
      return isScrolled.value ? 'opacity-100' : 'opacity-0'
    }
    
    const baseClasses = '!absolute left-[4px] top-[20px] z-10'
    const transitionClasses = 'transition-all duration-300 ease-in-out'
    
    if (isScrolled.value) {
      // Visible state: fully visible at normal position
      return `${baseClasses} ${transitionClasses} opacity-100 translate-y-0 pointer-events-auto`
    } else {
      // Hidden state: fade out and move down
      return `${baseClasses} ${transitionClasses} opacity-0 -translate-y-3 pointer-events-none`
    }
  })

  // Initialize scroll position and performance detection
  const initializeScrollPosition = () => {
    if (typeof window !== 'undefined') {
      scrollY.value = Math.round(window.scrollY)
      previousScrollY.value = Math.round(window.scrollY)
      
      // Detect device performance on next tick to avoid blocking
      nextTick(() => {
        detectDevicePerformance()
      })
    }
  }

  // Lifecycle management
  onMounted(() => {
    initializeScrollPosition()
    addScrollListener()
  })

  onUnmounted(() => {
    removeScrollListener()
  })

  // Return reactive state and computed classes
  return {
    // Scroll state
    scrollY: readonly(scrollY),
    isScrolled,
    isScrollingDown,
    isScrollingUp,
    scrollDirection: readonly(scrollDirection),
    
    // Performance state
    isLowPerformanceDevice: readonly(isLowPerformanceDevice),
    prefersReducedMotion: readonly(prefersReducedMotion),
    currentThrottleMs: readonly(currentThrottleMs),
    
    // Desktop classes
    logoSizeClass,
    logoPositionClass,
    leftNavSpacing,
    rightNavSpacing,
    
    // Mobile classes
    mobileLogoCenteredClass,
    mobileLogoLeftClass,
    
    // Control methods
    addScrollListener,
    removeScrollListener,
    adaptThrottling,
    
    // Performance monitoring
    getPerformanceMetrics: () => ({ ...performanceMetrics }),
    
    // Raw scroll state for custom implementations
    getScrollState: (): ScrollState => ({
      scrollY: scrollY.value,
      isScrolled: isScrolled.value,
      isScrollingDown: isScrollingDown.value,
      isScrollingUp: isScrollingUp.value
    })
  }
}

// Export readonly helper
function readonly<T>(ref: any): any {
  return computed(() => ref.value)
}
