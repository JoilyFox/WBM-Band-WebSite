import { nextTick } from 'vue'

/**
 * Composable for smooth scrolling functionality
 */
export const useScrollTo = () => {
  /**
   * Smoothly scrolls to an element with the given ID
   * @param elementId - The ID of the element to scroll to (without #)
   * @param customOffset - Optional custom offset from the top in pixels
   */
  const scrollToElement = (elementId: string, customOffset?: number) => {
    const element = document.getElementById(elementId)
    
    if (!element) {
      console.warn(`Element with ID "${elementId}" not found`)
      return
    }
    
    // Use minimal offset - just enough to clear the fixed header
    let offset = customOffset ?? 64 // Exact header height (h-16 = 64px)
    
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset
    
    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    })
  }

  /**
   * Navigates to index page and then scrolls to element
   * If already on index page, scrolls directly
   * @param elementId - The ID of the element to scroll to (without #)
   * @param customOffset - Optional custom offset from the top in pixels
   */
  const scrollToElementWithNavigation = async (elementId: string, customOffset?: number) => {
    const route = useRoute()
    const router = useRouter()
    
    // Check if we're not on the index page
    if (route.path !== '/') {
      try {
        // Navigate to index page first
        await router.push('/')
        
        // Wait for the navigation to complete and DOM to update
        await nextTick()
        
        // Add a small delay to ensure the page is fully loaded
        setTimeout(() => {
          scrollToElement(elementId, customOffset)
        }, 100)
      } catch (error) {
        console.error('Navigation failed:', error)
      }
    } else {
      // Already on index page, scroll directly
      scrollToElement(elementId, customOffset)
    }
  }
  
  /**
   * Scrolls to a specific position
   * @param position - The Y position to scroll to
   */
  const scrollToPosition = (position: number) => {
    window.scrollTo({
      top: position,
      behavior: 'smooth'
    })
  }
  
  /**
   * Scrolls to the top of the page
   */
  const scrollToTop = () => {
    scrollToPosition(0)
  }
  
  return {
    scrollToElement,
    scrollToElementWithNavigation,
    scrollToPosition,
    scrollToTop
  }
}
