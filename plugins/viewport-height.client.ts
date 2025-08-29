export default defineNuxtPlugin(() => {
  const setAppSVH = () => {
    if (typeof window === 'undefined') return
    const vh = Math.round(window.visualViewport?.height ?? window.innerHeight)
    document.documentElement.style.setProperty('--app-svh', `${vh}px`)
  document.documentElement.setAttribute('data-svh-ready', '1')
  }

  // Set ASAP
  setAppSVH()

  // Update on orientation change (avoid scroll-driven changes)
  const onOrientation = () => {
    setTimeout(setAppSVH, 300)
  }
  window.addEventListener('orientationchange', onOrientation)

  // Cleanup when HMR disposes the plugin (dev)
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener('orientationchange', onOrientation)
    })
  }
})
