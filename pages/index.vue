<template>
  <div>
    <!-- Hero Section -->
    <SectionsHeroSection 
      @primary-action="handleListenNow"
      @secondary-action="handleTourDates"
    />
    
    <!-- Music Library Section -->
    <SectionsMusicLibrarySection 
      :max-items="8"
      @release-click="handleReleaseClick"
      @show-more="handleShowAllMusic"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { useScrollTo } from '~/composables/useScrollTo'
import { useImagePreloader } from '~/composables/useImagePreloader'
import { createPageTitle } from '~/constants/app'
import { musicLibrary } from '~/data/musicLibrary'
import { getConfig } from '~/utils/configHelpers'
import type { MusicRelease } from '~/data/musicLibrary'

// Meta
definePageMeta({
  title: 'Home'
})

// Computed properties for config values
const bandName = computed(() => getConfig('general.bandName'))
const tagline = computed(() => getConfig('general.tagline'))

// Computed properties for page title and description
const pageTitle = computed(() => createPageTitle(`${bandName.value} - ${tagline.value}`))
const pageDescription = computed(() => `${bandName.value} - High-energy rock performances with a modern twist on classic metal sounds. Official website for tour dates, music, and updates.`)

useHead({
  title: pageTitle,
  meta: [
    {
      name: 'description',
      content: pageDescription
    }
  ]
})

// Composables
const snackbar = useSnackbar()
const { scrollToElement } = useScrollTo()
const { preloadHeroImages, preloadAlbumCovers } = useImagePreloader()

// Hero images for preloading - using computed to properly reference config values
const heroImages = computed(() => [
  {
    src: '/images/optimized/hero-images/hero-1.avif',
    alt: `${bandName.value} performing live on stage`
  },
  {
    src: '/images/optimized/hero-images/hero-2.avif',
    alt: `${bandName.value} in recording studio`
  },
  {
    src: '/images/optimized/hero-images/hero-3.avif',
    alt: `${bandName.value} concert crowd`
  }
])

// Preload critical images on mount
onMounted(async () => {
  // Preload hero images with high priority
  await preloadHeroImages(heroImages.value)
  
  // Preload first 6 album covers (above the fold)
  const albumImageUrls = musicLibrary
    .slice(0, 6)
    .map(release => release.imageUrl)
  
  preloadAlbumCovers(albumImageUrls, 6)
})

// Event handlers for hero section
const handleListenNow = () => {
  // Scroll to music section
  scrollToElement('music')
}

const handleTourDates = () => {
  // TODO: Implement navigation to tour dates section
  snackbar.show({
    type: 'info', 
    message: 'Tour Dates',
    subtitle: 'Check out our upcoming tour dates!'
  })
}

// Event handlers for music library section
const handleReleaseClick = (release: MusicRelease) => {
  // TODO: Implement release detail view or redirect to streaming platform
  snackbar.show({
    type: 'info',
    message: `${release.title}`,
    subtitle: `Listen to our ${release.type} on your favorite platform!`
  })
}

const handleShowAllMusic = () => {
  // TODO: Navigate to dedicated music library page
  snackbar.show({
    type: 'info',
    message: 'Music Library',
    subtitle: 'Full music library page coming soon!'
  })
}
</script>

<style scoped>
/* Index page specific styles */
/* Most styles are now in section components */
</style>