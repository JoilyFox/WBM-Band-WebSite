import { ref, computed, readonly } from 'vue'
import { useLocalePath } from '#i18n'
import type { MusicRelease } from '~/data/musicLibrary'

export const useMusicNavigation = () => {
  const selectedRelease = ref<MusicRelease | null>(null)
  const isModalOpen = ref(false)
  const localePath = useLocalePath()

  // Detect if user is on mobile device
  const isMobile = computed(() => {
    if (process.client) {
      return window.innerWidth < 768 || 'ontouchstart' in window
    }
    return false
  })

  /**
   * Handle music card click
   * On mobile: navigate to page with music origin parameter
   * On desktop: open modal
   */
  const handleMusicClick = async (release: MusicRelease) => {
    if (isMobile.value) {
    // Navigate to the locale-aware music page on mobile with 'from=music' parameter
    const path = localePath({ path: `/music/${release.slug}`, query: { from: 'music' } })
    await navigateTo(path)
    } else {
      // Open modal on desktop
      selectedRelease.value = release
      isModalOpen.value = true
    }
  }

  /**
   * Close the modal
   */
  const closeModal = () => {
    isModalOpen.value = false
    selectedRelease.value = null
  }

  /**
   * Navigate to the full page (can be used from modal)
   */
  const goToFullPage = async (release: MusicRelease) => {
    closeModal()
    const path = localePath({ path: `/music/${release.slug}`, query: { from: 'music' } })
    await navigateTo(path)
  }

  /**
   * Handle keyboard navigation in modal
   */
  const handleModalKeyboard = (event: KeyboardEvent, releases: MusicRelease[]) => {
    if (!selectedRelease.value || !isModalOpen.value) return

    const currentIndex = releases.findIndex(r => r.id === selectedRelease.value?.id)
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        if (currentIndex > 0) {
          selectedRelease.value = releases[currentIndex - 1]
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (currentIndex < releases.length - 1) {
          selectedRelease.value = releases[currentIndex + 1]
        }
        break
      case 'Escape':
        event.preventDefault()
        closeModal()
        break
    }
  }

  return {
    selectedRelease: readonly(selectedRelease),
    isModalOpen: readonly(isModalOpen),
    isMobile,
    handleMusicClick,
    closeModal,
    goToFullPage,
    handleModalKeyboard
  }
}
