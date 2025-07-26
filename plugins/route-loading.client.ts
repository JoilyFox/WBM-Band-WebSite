export default defineNuxtPlugin(() => {
  const { showLoading, hideLoading, setProgress } = useGlobalLoading()
  const router = useRouter()

  // Track loading state
  let isLoading = false
  let progressInterval: NodeJS.Timeout | null = null

  // Start loading on route navigation
  router.beforeEach((to, from) => {
    // Don't show loading for hash changes or same route
    if (to.path === from.path && to.hash !== from.hash) {
      return
    }

    if (!isLoading) {
      isLoading = true
      showLoading()
      setProgress(0)

      // Simulate progress during navigation
      let progress = 0
      progressInterval = setInterval(() => {
        progress += Math.random() * 15
        if (progress > 90) {
          progress = 90 // Don't complete until navigation is done
        }
        setProgress(progress)
      }, 100)
    }
  })

  // Complete loading after route navigation
  router.afterEach(() => {
    if (isLoading) {
      // Clear the progress interval
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }

      // Complete the progress and hide loading
      setProgress(100)
      
      // Small delay to show completion before hiding
      setTimeout(() => {
        hideLoading()
        isLoading = false
      }, 150)
    }
  })

  // Handle navigation errors
  router.onError(() => {
    if (isLoading) {
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      hideLoading()
      isLoading = false
    }
  })
})
