/**
 * Optimized Scroll Handler Composable
 * Uses RAF throttling and Intersection Observer for better performance
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePerformanceOptimization } from './usePerformanceOptimization'

interface ScrollOptions {
  threshold?: number
  throttle?: boolean
  useIntersectionObserver?: boolean
}

export function useOptimizedScroll(options: ScrollOptions = {}) {
  const { threshold = 60, throttle = true, useIntersectionObserver = true } = options
  
  const { performanceLevel, createPerformanceObserver } = usePerformanceOptimization()
  
  // Scroll state
  const scrollY = ref(0)
  const isScrolled = computed(() => scrollY.value > threshold)
  const scrollDirection = ref<'up' | 'down' | 'none'>('none')
  
  // Performance optimized scroll tracking
  let rafId: number | null = null
  let lastScrollY = 0
  let lastScrollTime = 0
  let isScrolling = false
  
  const updateScrollState = () => {
    const currentScrollY = window.scrollY
    const currentTime = Date.now()
    
    // Update direction only if there's significant movement
    const deltaY = currentScrollY - lastScrollY
    if (Math.abs(deltaY) > 5) {
      scrollDirection.value = deltaY > 0 ? 'down' : 'up'
      lastScrollY = currentScrollY
    }
    
    scrollY.value = currentScrollY
    lastScrollTime = currentTime
    isScrolling = false
  }
  
  const handleScroll = () => {
    if (isScrolling) return
    isScrolling = true
    
    if (throttle && performanceLevel.value.level === 'low') {
      // Use simpler throttling for low-performance devices
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        updateScrollState()
        rafId = null
      })
    } else if (throttle) {
      // Use RAF for medium/high performance devices
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateScrollState)
    } else {
      updateScrollState()
    }
  }
  
  // Intersection Observer for element visibility
  const visibleElements = ref(new Set<string>())
  let observer: IntersectionObserver | null = null
  
  const observeElement = (element: Element, id: string) => {
    if (!useIntersectionObserver || !observer) return
    
    element.setAttribute('data-scroll-id', id)
    observer.observe(element)
  }
  
  const unobserveElement = (element: Element) => {
    if (!observer) return
    observer.unobserve(element)
  }
  
  const isElementVisible = (id: string) => visibleElements.value.has(id)
  
  onMounted(() => {
    // Setup scroll listener
    window.addEventListener('scroll', handleScroll, { 
      passive: true,
      capture: false 
    })
    
    // Setup intersection observer if supported
    if (useIntersectionObserver && createPerformanceObserver) {
      observer = createPerformanceObserver((entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-scroll-id')
          if (!id) return
          
          if (entry.isIntersecting) {
            visibleElements.value.add(id)
          } else {
            visibleElements.value.delete(id)
          }
        })
      })
    }
    
    // Initial scroll state
    updateScrollState()
  })
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    
    if (observer) {
      observer.disconnect()
    }
  })
  
  return {
    scrollY: readonly(scrollY),
    isScrolled,
    scrollDirection: readonly(scrollDirection),
    observeElement,
    unobserveElement,
    isElementVisible
  }
}
