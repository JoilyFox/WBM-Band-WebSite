/**
 * Hero Image Slider Composable
 * Handles automatic image sliding with smooth transitions
 */

import { ref, computed, onMounted, onUnmounted, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export interface HeroImage {
  src: string
  alt: string
  title?: string
  subtitle?: string
}

export interface SliderOptions {
  autoPlay?: boolean
  interval?: number
  transition?: 'fade' | 'slide' | 'zoom'
  pauseOnHover?: boolean
  transitionDuration?: number // Duration in ms for slide transitions
}

export function useHeroSlider(
  imagesSource: MaybeRefOrGetter<HeroImage[]>,
  options: SliderOptions = {}
) {
  const {
    autoPlay = true,
    interval = 5000,
    transition = 'fade',
    pauseOnHover = true,
    transitionDuration = 800
  } = options

  // Reactive state
  const currentIndex = ref(0)
  const isPlaying = ref(autoPlay)
  const isPaused = ref(false)
  const isTransitioning = ref(false)
  const progressKey = ref(0) // Key to force progress bar restart
  const progressVisible = ref(true) // Always keep progress bar visible

  // Timer reference
  let timer: NodeJS.Timeout | null = null

  // Reactive image list — recomputes when the source ref/getter changes
  const images = computed(() => toValue(imagesSource))

  // Computed properties
  const currentImage = computed(() => images.value[currentIndex.value])
  const nextImage = computed(() => images.value[(currentIndex.value + 1) % images.value.length])
  const previousImage = computed(
    () => images.value[currentIndex.value === 0 ? images.value.length - 1 : currentIndex.value - 1]
  )

  const totalImages = computed(() => images.value.length)
  const canSlide = computed(() => images.value.length > 1)

  // Reset index + restart autoplay when the underlying image set changes
  // (e.g. user rotates device and we swap horizontal ↔ vertical arrays)
  watch(
    () => images.value.length,
    () => {
      currentIndex.value = 0
      progressKey.value++
      if (isPlaying.value) startAutoPlay()
    }
  )

  // Navigation methods
  const goToSlide = (index: number) => {
    if (index >= 0 && index < images.value.length && index !== currentIndex.value) {
      isTransitioning.value = true
      currentIndex.value = index

      // Force progress bar restart
      progressKey.value++

      // Reset transition state after animation
      setTimeout(() => {
        isTransitioning.value = false
      }, transitionDuration)

      // Restart timer for auto-play
      if (isPlaying.value) {
        startAutoPlay()
      }
    }
  }

  const nextSlide = () => {
    const nextIndex = (currentIndex.value + 1) % images.value.length
    goToSlide(nextIndex)
  }

  const previousSlide = () => {
    const prevIndex = currentIndex.value === 0 ? images.value.length - 1 : currentIndex.value - 1
    goToSlide(prevIndex)
  }

  // Auto-play controls
  const startAutoPlay = () => {
    if (!canSlide.value || !isPlaying.value) return

    stopAutoPlay()

    // Force progress bar restart
    progressKey.value++

    timer = setInterval(() => {
      nextSlide()
    }, interval)
  }

  const stopAutoPlay = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const pauseAutoPlay = () => {
    isPaused.value = true
  }

  const resumeAutoPlay = () => {
    isPaused.value = false
    // Restart progress animation when resuming
    if (isPlaying.value) {
      progressKey.value++
    }
  }

  const toggleAutoPlay = () => {
    isPlaying.value = !isPlaying.value
    if (isPlaying.value) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }
  }

  // Lifecycle
  onMounted(() => {
    if (autoPlay && canSlide.value) {
      startAutoPlay()
    }
  })

  onUnmounted(() => {
    stopAutoPlay()
  })

  // Progress calculation for indicators
  const getSlideProgress = (index: number) => {
    if (index === currentIndex.value && isPlaying.value && !isPaused.value) {
      return 100
    }
    return 0
  }

  return {
    // State
    currentIndex: readonly(currentIndex),
    isPlaying: readonly(isPlaying),
    isPaused: readonly(isPaused),
    isTransitioning: readonly(isTransitioning),
    progressKey: readonly(progressKey),
    progressVisible: readonly(progressVisible),

    // Computed
    currentImage,
    nextImage,
    previousImage,
    totalImages,
    canSlide,

    // Navigation
    goToSlide,
    nextSlide,
    previousSlide,

    // Auto-play controls
    startAutoPlay,
    stopAutoPlay,
    pauseAutoPlay,
    resumeAutoPlay,
    toggleAutoPlay,

    // Utilities
    getSlideProgress,

    // Configuration
    transition,
    interval
  }
}
