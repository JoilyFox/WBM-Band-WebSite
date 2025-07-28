import { ref, computed, onMounted, onUnmounted } from 'vue'

interface ScrollAnimationOptions {
  threshold?: number
  throttleMs?: number
  useRAF?: boolean
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
    throttleMs = 16, // ~60fps
    useRAF = true
  } = options

  // Scroll state
  const scrollY = ref(0)
  const previousScrollY = ref(0)
  const isScrolled = computed(() => scrollY.value > threshold)
  
  // Scroll direction
  const isScrollingDown = computed(() => scrollY.value > previousScrollY.value)
  const isScrollingUp = computed(() => scrollY.value < previousScrollY.value)

  // Performance optimization variables
  let rafId: number | null = null
  let lastScrollTime = 0
  let isListenerActive = false

  // Optimized scroll handler with throttling and RAF
  const handleScroll = () => {
    const now = Date.now()
    
    // Throttle scroll events
    if (now - lastScrollTime < throttleMs) {
      return
    }
    
    lastScrollTime = now

    if (useRAF) {
      // Cancel previous RAF if still pending
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      
      // Use RAF for smooth animations
      rafId = requestAnimationFrame(updateScrollState)
    } else {
      updateScrollState()
    }
  }

  // Update scroll state
  const updateScrollState = () => {
    const currentScrollY = window.scrollY
    
    // Only update if there's a meaningful change
    if (Math.abs(currentScrollY - scrollY.value) > 1) {
      previousScrollY.value = scrollY.value
      scrollY.value = currentScrollY
    }
    
    rafId = null
  }

  // Passive scroll listener for better performance
  const addScrollListener = () => {
    if (!isListenerActive) {
      window.addEventListener('scroll', handleScroll, { 
        passive: true,
        capture: false 
      })
      isListenerActive = true
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
  }

  // Desktop logo animation classes
  const logoSizeClass = computed(() => 
    isScrolled.value ? 'h-20' : 'h-40'
  )

  const logoPositionClass = computed(() => 
    isScrolled.value ? 'top-[14px]' : 'top-[14px]'
  )

  // Navigation spacing classes
  const leftNavSpacing = computed(() => 
    isScrolled.value ? 'pr-0' : 'pr-10'
  )

  const rightNavSpacing = computed(() => 
    isScrolled.value ? 'pl-0' : 'pl-10'
  )

  // Mobile logo animation classes
  const mobileLogoSizeClass = computed(() => 
    isScrolled.value ? 'h-20' : 'h-34'
  )

  const mobileLogoPositionClass = computed(() => 
    isScrolled.value 
      ? 'top-[20px] absolute left-[4px]' 
      : 'top-[30px] absolute left-1/2 transform -translate-x-1/2'
  )

  // Initialize scroll position immediately
  const initializeScrollPosition = () => {
    if (typeof window !== 'undefined') {
      scrollY.value = window.scrollY
      previousScrollY.value = window.scrollY
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
    
    // Desktop classes
    logoSizeClass,
    logoPositionClass,
    leftNavSpacing,
    rightNavSpacing,
    
    // Mobile classes
    mobileLogoSizeClass,
    mobileLogoPositionClass,
    
    // Control methods
    addScrollListener,
    removeScrollListener,
    
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
