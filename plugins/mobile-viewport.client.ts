/**
 * Mobile viewport optimization plugin
 * Handles mobile browser viewport detection and optimization
 */
export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.client) {
    // Detect mobile browsers
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Add mobile class to body
      document.body.classList.add('mobile-browser')
      
      // Handle iOS Safari specific optimizations
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        document.body.classList.add('ios-browser')
        
        // Force minimal-ui on iOS Safari
        const viewport = document.querySelector('meta[name=viewport]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, minimal-ui')
        }
      }
      
      // Handle Chrome mobile optimizations
      const isChrome = /Chrome/.test(navigator.userAgent)
      if (isChrome && !isIOS) {
        document.body.classList.add('chrome-mobile')
      }
      
      // Add CSS to prevent address bar from affecting layout
      const style = document.createElement('style')
      style.textContent = `
        .mobile-browser {
          /* Prevent viewport changes from causing layout shifts */
          position: relative;
          overflow-x: hidden;
        }
        
        .mobile-browser .hero-section {
          /* Ensure hero section always fits in visible viewport */
          height: calc(var(--vh) * 100);
          max-height: calc(var(--vh) * 100);
        }
        
        .ios-browser {
          /* iOS Safari specific optimizations */
          -webkit-overflow-scrolling: touch;
          -webkit-text-size-adjust: none;
        }
        
        .chrome-mobile {
          /* Chrome mobile specific optimizations */
          overscroll-behavior: none;
        }
      `
      document.head.appendChild(style)
    }
  }
})
