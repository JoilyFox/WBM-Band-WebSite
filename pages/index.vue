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
import { onMounted } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { useScrollTo } from '~/composables/useScrollTo'
import { useImagePreloader } from '~/composables/useImagePreloader'
import { createPageTitle } from '~/constants/app'
import { musicLibrary } from '~/data/musicLibrary'
import type { MusicRelease } from '~/data/musicLibrary'

// Meta
definePageMeta({
  title: 'Home'
})

useHead({
  title: createPageTitle('WBM Band - Rock • Metal • Alternative'),
  meta: [
    {
      name: 'description',
      content: 'WBM Band - High-energy rock performances with a modern twist on classic metal sounds. Official website for tour dates, music, and updates.'
    }
  ]
})

// Composables
const snackbar = useSnackbar()
const { scrollToElement } = useScrollTo()
const { preloadHeroImages, preloadAlbumCovers } = useImagePreloader()

// Hero images for preloading
const heroImages = [
  {
    src: '/images/optimized/hero-images/hero-1.avif',
    alt: 'WBM Band performing live on stage'
  },
  {
    src: '/images/optimized/hero-images/hero-2.avif',
    alt: 'WBM Band in recording studio'
  },
  {
    src: '/images/optimized/hero-images/hero-3.avif',
    alt: 'WBM Band concert crowd'
  }
]

// Preload critical images on mount
onMounted(async () => {
  // Preload hero images with high priority
  await preloadHeroImages(heroImages)
  
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