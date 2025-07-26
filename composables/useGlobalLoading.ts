import { useGlobalLoadingStore } from '~/store/globalLoading'

/**
 * Composable for managing global loading state
 * @returns {Object} Loading control methods and state
 */
export const useGlobalLoading = () => {
  const store = useGlobalLoadingStore()

  /**
   * Show global loading progress bar
   */
  const showLoading = () => {
    store.showLoading()
  }

  /**
   * Hide global loading progress bar
   */
  const hideLoading = () => {
    store.hideLoading()
  }

  /**
   * Set loading progress percentage
   * @param {number} progress - Progress percentage (0-100)
   */
  const setProgress = (progress: number) => {
    store.setProgress(progress)
  }

  /**
   * Execute an async function with loading progress bar
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Options for progress simulation
   * @returns {Promise} Promise that resolves when the async function completes
   */
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      showProgress?: boolean
      progressSteps?: number
    }
  ): Promise<T> => {
    try {
      showLoading()
      
      if (options?.showProgress && options?.progressSteps) {
        // Simulate progress steps
        const stepSize = 90 / options.progressSteps
        for (let i = 1; i <= options.progressSteps; i++) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setProgress(stepSize * i)
        }
      }
      
      const result = await asyncFn()
      return result
    } finally {
      hideLoading()
    }
  }

  return {
    // Actions
    showLoading,
    hideLoading,
    setProgress,
    withLoading,

    // State (reactive)
    isLoading: store.isLoading,
    loadingProgress: store.loadingProgress,

    // Getters
    getLoadingState: store.getLoadingState,
  }
}
