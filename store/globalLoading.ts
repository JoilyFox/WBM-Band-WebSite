import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalLoadingStore = defineStore('globalLoading', () => {
  // State
  const isLoading = ref(false)
  const loadingProgress = ref(0)

  // Actions
  const showLoading = () => {
    isLoading.value = true
    loadingProgress.value = 0
  }

  const hideLoading = () => {
    isLoading.value = false
    loadingProgress.value = 100
    // Reset progress after animation
    setTimeout(() => {
      loadingProgress.value = 0
    }, 300)
  }

  const setProgress = (progress: number) => {
    loadingProgress.value = Math.min(Math.max(progress, 0), 100)
  }

  // Getters
  const getLoadingState = () => ({
    isLoading: isLoading.value,
    progress: loadingProgress.value
  })

  return {
    // State
    isLoading,
    loadingProgress,

    // Actions
    showLoading,
    hideLoading,
    setProgress,

    // Getters
    getLoadingState,
  }
})
