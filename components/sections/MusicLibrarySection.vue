<template>
  <section id="music" class="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-surface-950">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          Our Music
        </h2>
        <p class="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
          Dive into our sonic universe. From atmospheric albums to high-energy singles, 
          discover the sounds that define WBM Band. Stream our latest releases on your favorite platform.
        </p>
      </div>

      <!-- Music Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-12">
        <UiMusicCard
          v-for="release in displayedReleases"
          :key="release.id"
          :release="release"
          @click="handleReleaseClick"
        />
      </div>

      <!-- Show More Button -->
      <div v-if="hasMoreReleases" class="text-center">
        <button
          @click="handleShowMore"
          class="show-more-button group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-full hover:from-primary-500 hover:to-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
        >
          <span class="relative z-10">Show All Music</span>
          <div class="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <i class="pi pi-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MusicRelease } from '~/data/musicLibrary'
import { getLatestReleases, getAllReleases } from '~/data/musicLibrary'

// Props
interface Props {
  showAll?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  showAll: false,
  maxItems: 8
})

// Emits
const emit = defineEmits<{
  releaseClick: [release: MusicRelease]
  showMore: []
}>()

// Computed
const displayedReleases = computed(() => {
  const releases = props.showAll ? getAllReleases() : getLatestReleases(props.maxItems)
  return releases
})

const hasMoreReleases = computed(() => {
  return !props.showAll && getAllReleases().length > props.maxItems
})

// Methods
const handleReleaseClick = (release: MusicRelease) => {
  emit('releaseClick', release)
}

const handleShowMore = () => {
  emit('showMore')
}
</script>

<style scoped>
/* Show More Button Animation */
.show-more-button {
  position: relative;
  overflow: hidden;
}

.show-more-button:active {
  transform: scale(0.98);
}

/* Mobile optimizations for grid */
@media (max-width: 767px) {
  .show-more-button:hover {
    transform: none;
  }
  
  .show-more-button:active {
    transform: scale(0.95);
  }
  
  /* Ensure proper spacing on mobile */
  .grid {
    gap: 0.75rem;
  }
}
</style>
