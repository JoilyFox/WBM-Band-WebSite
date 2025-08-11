/**
 * Image Optimization Plugin
 * Configures global image optimization settings and performance monitoring
 */

export default defineNuxtPlugin(() => {
  // Set up global image optimization preferences
  if (process.client) {
    // Enable native lazy loading for supported browsers
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading is supported
      console.log('✅ Native lazy loading supported')
    }

    // Check for AVIF support
    const testAvif = () => {
      return new Promise((resolve) => {
        const avif = new Image()
        avif.onload = avif.onerror = () => resolve(avif.height === 2)
        avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      })
    }

    // Check for WebP support
    const testWebp = () => {
      return new Promise((resolve) => {
        const webp = new Image()
        webp.onload = webp.onerror = () => resolve(webp.height === 2)
        webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      })
    }

    // Test format support and log results
    Promise.all([testAvif(), testWebp()]).then(([supportsAvif, supportsWebp]) => {
      console.log(`✅ Image format support - AVIF: ${supportsAvif}, WebP: ${supportsWebp}`)
      
      // Store format support for optimization decisions
      if (process.client && window) {
        (window as any).__IMAGE_SUPPORT__ = {
          avif: supportsAvif,
          webp: supportsWebp
        }
      }
    })

    // Monitor Core Web Vitals related to images
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lcpEntry = entries[entries.length - 1] as any
        
        if (lcpEntry && lcpEntry.element && lcpEntry.element.tagName === 'IMG') {
          console.log(`📊 LCP Image detected: ${lcpEntry.startTime.toFixed(2)}ms`, lcpEntry.element.src)
        }
      })
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.log('LCP observer not supported')
      }

      // Monitor layout shifts from images
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        if (clsValue > 0.1) {
          console.warn(`⚠️ Layout shift detected: ${clsValue.toFixed(4)}`)
        }
      })
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.log('CLS observer not supported')
      }
    }

    // Preload critical CSS for image placeholders
    const style = document.createElement('style')
    style.textContent = `
      .progressive-image-container {
        background: linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
        position: relative;
      }
      
      .progressive-image-container::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: 
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.01) 2px,
            rgba(255, 255, 255, 0.01) 4px
          );
        opacity: 0.5;
        pointer-events: none;
      }
      
      .progressive-image {
        content-visibility: auto;
        contain-intrinsic-size: 400px 300px;
      }
      
      /* Optimize for smooth animations */
      .progressive-image,
      .hero-background-image,
      .placeholder-container {
        will-change: opacity;
        backface-visibility: hidden;
        transform: translateZ(0);
      }
      
      /* Enhanced grainy texture for hero sections */
      .hero-section .progressive-image-container {
        background: radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%);
      }
      
      .hero-section .progressive-image-container::before {
        background-image: 
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 1px,
            rgba(255, 255, 255, 0.015) 1px,
            rgba(255, 255, 255, 0.015) 2px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 1px,
            rgba(255, 255, 255, 0.01) 1px,
            rgba(255, 255, 255, 0.01) 2px
          );
      }
    `
    document.head.appendChild(style)
  }
})
