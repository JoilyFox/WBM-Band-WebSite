/**
 * Composable for managing viewport height with CSS custom properties
 * Provides a stable viewport height that prevents layout jumps on mobile browsers
 * and ensures content fits within the visible viewport (excluding browser UI)
 */
export const useViewportHeight = () => {
  const isInitialized = ref(false)

  /**
   * Set the CSS custom property for viewport height
   * Uses the smaller of window.innerHeight and visualViewport.height to ensure content fits
   */
  const setViewportHeight = () => {
    if (typeof window === 'undefined') return
    
    // Get the actual visible viewport height (excluding browser UI)
    let vh: number
    
    if (window.visualViewport) {
      // Use Visual Viewport API when available (better mobile support)
      vh = window.visualViewport.height * 0.01
    } else {
      // Fallback to window.innerHeight
      vh = window.innerHeight * 0.01
    }
    
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    
    if (!isInitialized.value) {
      isInitialized.value = true
    }
  }

  /**
   * Initialize viewport height management
   * Sets initial height and adds appropriate event listeners
   */
  const initializeViewportHeight = () => {
    if (typeof window === 'undefined') return

    // Set initial viewport height
    setViewportHeight()

    // Handle orientation changes
    const handleOrientationChange = () => {
      // Small delay to ensure orientation change is complete
      setTimeout(setViewportHeight, 150)
    }

    // Handle visual viewport changes (mobile browser UI show/hide)
    const handleVisualViewportChange = () => {
      setViewportHeight()
    }

    // Handle window resize (for desktop and some edge cases)
    const handleResize = (() => {
      let timeoutId: ReturnType<typeof setTimeout>
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(setViewportHeight, 100)
      }
    })()

    // Add event listeners
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    
    // Enhanced mobile browser UI detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange, { passive: true })
    }

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      }
    }

    return cleanup
  }

  /**
   * Force update the viewport height
   * Useful for specific scenarios where manual update is needed
   */
  const updateViewportHeight = () => {
    setViewportHeight()
  }

  return {
    isInitialized: readonly(isInitialized),
    initializeViewportHeight,
    updateViewportHeight,
    setViewportHeight
  }
}
