import { ref, computed, readonly } from 'vue'
import { useLocalePath } from '#i18n'
import type { MusicRelease } from '~/data/musicLibrary'
import { isUpcomingRelease } from '~/utils/configHelpers'

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
   * Determine if a release is in pre-save mode
   */
  const isReleaseInPreSaveMode = (release: MusicRelease): boolean => {
    return isUpcomingRelease(release.releaseDate) && !!release.preSaveMusicPlatformLinks
  }

  /**
   * Check if the currently selected release is in pre-save mode
   */
  const isSelectedReleasePreSave = computed(() => {
    if (!selectedRelease.value) return false
    return isReleaseInPreSaveMode(selectedRelease.value)
  })

  /**
   * Handle music card click
   * On mobile: navigate to page with music origin parameter
   * On desktop: open modal
   */
  const handleMusicClick = async (release: MusicRelease) => {
    const isPreSave = isReleaseInPreSaveMode(release)
    const basePath = isPreSave ? '/pre-save' : '/listen'
    
    if (isMobile.value) {
    // Navigate to the locale-aware listen/pre-save page on mobile with 'from=music' parameter
    const path = localePath({ path: `${basePath}/${release.slug}`, query: { from: 'music' } })
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
    const isPreSave = isReleaseInPreSaveMode(release)
    const basePath = isPreSave ? '/pre-save' : '/listen'
    const path = localePath({ path: `${basePath}/${release.slug}`, query: { from: 'music' } })
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
    isSelectedReleasePreSave: readonly(isSelectedReleasePreSave),
    isMobile,
    handleMusicClick,
    closeModal,
    goToFullPage,
    handleModalKeyboard
  }
}
