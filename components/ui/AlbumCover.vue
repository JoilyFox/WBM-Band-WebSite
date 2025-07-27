<template>
  <div class="relative overflow-hidden rounded-xl bg-surface-800 aspect-square shadow-lg">
    <!-- Hover Overlay (Desktop only) -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hidden md:block"></div>
    
    <!-- Album Cover Image or Fallback -->
    <NuxtImg 
      v-if="!imageError"
      :src="imageUrl" 
      :alt="alt"
      class="w-full h-full object-cover transition-transform duration-300 md:group-hover:scale-105"
      loading="lazy"
      format="webp,jpg"
      quality="90"
      @error="handleImageError"
    />
    
    <!-- Fallback Component -->
    <div 
      v-else
      class="w-full h-full bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center"
    >
      <div class="text-center text-white/60">
        <i class="pi pi-image text-4xl mb-2"></i>
        <p class="text-xs font-medium uppercase tracking-wider">No Image</p>
      </div>    
    </div>
    
    <!-- Play Overlay (Desktop only) -->
    <div class="absolute inset-0 md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hidden">
      <div class="bg-white/90 rounded-full w-12 h-12 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl">
        <i class="pi pi-play text-surface-900 text-lg ml-0.5"></i>
      </div>
    </div>

    <!-- Release Type Badge -->
    <div class="absolute top-2 left-2 z-30">
      <span :class="badgeClass" class="badge-glass">
        {{ releaseType }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MusicRelease } from '~/data/musicLibrary'

interface Props {
  imageUrl: string
  alt: string
  releaseType: MusicRelease['type']
}

const props = defineProps<Props>()

const imageError = ref(false)

const badgeClass = computed(() => {
  // For now, using dark badge (works well on most album covers)
  // Could be enhanced later with image analysis for smart contrast
  return 'badge-contrast'
})

const handleImageError = () => {
  imageError.value = true
}
</script>

<style scoped>
/* Glass morphism badge styles */
.badge-glass {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.badge-glass:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), 0 3px 6px rgba(0, 0, 0, 0.15);
}

/* Badge type specific styles - smart contrast */
.badge-contrast {
  background: rgba(0, 0, 0, 0.7);
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Alternative light badge for dark backgrounds (future enhancement) */
.badge-light {
  background: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.9);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

/* Ensure perfect circle for play button */
.rounded-full {
  border-radius: 50%;
}

/* Enhanced shadow for cards */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Custom animations for play icon */
.pi-play {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.group:hover .pi-play {
  transform: scale(1.1);
}
</style>
