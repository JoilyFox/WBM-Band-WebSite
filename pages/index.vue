<template>
  <div>
    <!-- Hero Section -->
    <section class="hero-section relative w-full flex items-center justify-center px-4 overflow-hidden">
      <!-- Background Image with Nuxt optimizations -->
      <NuxtImg 
        src="/images/band-hero-bg.jpg"
        alt="WBM Band performing live on stage"
        class="hero-background-image"
        loading="eager"
        fetchpriority="high"
        format="webp,jpg"
        quality="90"
        @error="handleImageError"
      />
      
      <!-- Fallback background for when image fails to load -->
      <div 
        v-if="imageLoadError" 
        class="absolute inset-0 hero-bg-fallback"
      ></div>
      
      <!-- Background overlay for better text readability -->
      <div class="absolute inset-0 bg-black/50 z-10"></div>
      
      <!-- Content -->
      <div class="relative z-20 text-center max-w-4xl mx-auto">
        <h1 class="xs:text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
          Woman Based Mechanics
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up">
          Rock • Alternative • Indie
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
          <Button 
            label="Listen Now" 
            class="btn-primary text-lg px-8 py-3"
            icon="pi pi-play"
          />
          <Button 
            label="Tour Dates" 
            class="btn-outline text-lg px-8 py-3"
            icon="pi pi-calendar"
          />
        </div>
      </div>
      
      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <i class="pi pi-chevron-down text-white text-2xl"></i>
      </div>
    </section>
  
  </div>
</template>

<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar'
import { WEBSITE_TITLE, APP_DESCRIPTION, createPageTitle } from '~/constants/app'

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

// Reactive state for image handling
const imageLoadError = ref(false)

// Image error handler
const handleImageError = () => {
  imageLoadError.value = true
  console.warn('Hero background image failed to load, using fallback')
}

// Methods for future functionality
const handleListenNow = () => {
  snackbar.info('Music Player', 'Music player coming soon!', 3000)
}

const handleTourDates = () => {
  snackbar.info('Tour Dates', 'Tour schedule coming soon!', 3000)
}

const handleContact = () => {
  snackbar.info('Contact', 'Contact form coming soon!', 3000)
}

const handleSocialClick = (platform: string) => {
  snackbar.info('Social Media', `${platform} link coming soon!`, 3000)
}
</script>

<style scoped>
/* Hero section specific styles */
.hero-section {
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height for mobile browsers */
}

/* Hero background image styling */
.hero-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  object-position: center;
  z-index: 0;
  max-width: none;
  max-height: none;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Ensure proper aspect ratio and performance on mobile */
@media (max-width: 768px) {
  .hero-background-image {
    object-position: center 30%; /* Adjust focus point for mobile */
    will-change: transform; /* Optimize for smooth scrolling */
  }
}

/* Animation keyframes */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-slide-up {
  animation: slide-up 1s ease-out 0.3s both;
}

.animate-scale-in {
  animation: scale-in 1s ease-out 0.6s both;
}

/* Text shadow for better readability over image */
h1 {
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}

p {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

/* Additional responsive text sizing for very small screens */
@media (max-width: 420px) {
  h1 {
    font-size: 2.25rem; /* 36px - smaller than text-4xl */
    line-height: 2.5rem;
  }
}

@media (max-width: 360px) {
  h1 {
    font-size: 2rem; /* 32px - even smaller for very small screens */
    line-height: 2.25rem;
  }
}

/* Fallback gradient background in case image doesn't load */
.hero-bg-fallback {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1b69 50%, #1a1a1a 100%);
}
</style>