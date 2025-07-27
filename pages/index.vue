<template>
  <div>
    <!-- Hero Section -->
    <SectionsHeroSection 
      @primary-action="handleListenNow"
      @secondary-action="handleTourDates"
    />
    
    <!-- Test Section for Scroll Testing -->
    <SectionsTestSection />
    
    <!-- Additional sections will go here -->
    <!-- Future sections:
         - AboutSection
         - MusicSection  
         - TourSection
         - ContactSection
    -->
  </div>
</template>

<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar'
import { createPageTitle } from '~/constants/app'

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

// Event handlers for hero section
const handleListenNow = () => {
  // TODO: Implement navigation to music/streaming platforms
  snackbar.show({
    type: 'info',
    message: 'Coming Soon',
    subtitle: 'Music streaming links will be available soon!'
  })
}

const handleTourDates = () => {
  // TODO: Implement navigation to tour dates section
  snackbar.show({
    type: 'info', 
    message: 'Tour Dates',
    subtitle: 'Check out our upcoming tour dates!'
  })
}
</script>

<style scoped>
/* Index page specific styles */
/* Most styles are now in section components */
</style>