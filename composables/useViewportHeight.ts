/**
 * Composable for managing viewport height with CSS custom properties
 * Provides a stable viewport height that prevents layout jumps on mobile browsers
 */
export const useViewportHeight = () => {
  const isInitialized = ref(false)

  /**
   * Set the CSS custom property for viewport height
   * Uses window.innerHeight to get the actual viewport size
   */
  const setViewportHeight = () => {
    if (typeof window === 'undefined') return
    
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    
    if (!isInitialized.value) {
      isInitialized.value = true
    }
  }

  /**
   * Initialize viewport height management
   * Sets initial height and adds orientation change listener
   */
  const initializeViewportHeight = () => {
    if (typeof window === 'undefined') return

    // Set initial viewport height
    setViewportHeight()

    // Update only on orientation change (not resize) to prevent jumps
    const handleOrientationChange = () => {
      // Small delay to ensure orientation change is complete
      setTimeout(setViewportHeight, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
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
