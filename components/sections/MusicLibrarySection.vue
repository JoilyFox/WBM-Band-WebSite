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
      <div class="flex justify-center mb-12">
        <div class="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 max-w-fit mx-auto">
          <!-- New Release Preview Block - Always First -->
          <div
            v-if="shouldShowNewReleasePreview"
            ref="newReleasePreviewRef"
            class="card-base new-release-preview cursor-pointer"
            :style="{ transitionDelay: '0ms' }"
            @click="handleNewReleasePreviewClick"
          >
            <div class="new-release-content">
              <!-- Background Image -->
              <img 
                :src="newReleasePreviewData?.imageUrl" 
                :alt="newReleasePreviewData?.title"
                class="new-release-image"
              />
              
              <!-- Glassmorphic Overlay -->
              <div class="new-release-overlay">
                <div class="new-release-info">
                  <div class="new-release-icon">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <h3 class="new-release-title">{{ newReleasePreviewData?.title }}</h3>
                  <p class="new-release-date">Coming {{ newReleasePreviewData?.releaseDate }}</p>
                  
                </div>
              </div>
            </div>
          </div>

          <div
            v-for="(release, index) in displayedReleases"
            :key="release.id"
            ref="cardRefs"
            class="card-base music-card-wrapper"
            :style="{ transitionDelay: `${(index + (shouldShowNewReleasePreview ? 1 : 0)) * 100}ms` }"
          >
            <UiMusicCard
              :release="release"
              @click="handleReleaseClick"
            />
          </div>
          
          <!-- Coming Soon Block -->
          <div
            v-if="shouldShowComingSoon"
            ref="comingSoonRef"
            class="card-base coming-soon-card"
            :style="{ transitionDelay: `${(displayedReleases.length + (shouldShowNewReleasePreview ? 1 : 0)) * 100}ms` }"
          >
            <div class="coming-soon-content">
              <div class="coming-soon-icon">
                <i class="pi pi-clock"></i>
              </div>
              <h3 class="coming-soon-title">{{ comingSoonTitle }}</h3>
              <p class="coming-soon-text">{{ comingSoonText }}</p>
              <div class="coming-soon-shimmer"></div>
            </div>
          </div>
        </div>
      </div>      <!-- Show More Button -->
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
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { MusicRelease } from '~/data/musicLibrary'
import { getLatestReleases, getAllReleases } from '~/data/musicLibrary'
import { generalConfig } from '~/config/general'
import { formatReleaseDate, isUpcomingRelease } from '~/utils/configHelpers'
import { useSnackbar } from '~/composables/useSnackbar'

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

// Refs
const cardRefs = ref<HTMLElement[]>([])
const comingSoonRef = ref<HTMLElement>()
const newReleasePreviewRef = ref<HTMLElement>()

// Composables
const { success: showSuccessSnackbar } = useSnackbar()

// Intersection Observer
let observer: IntersectionObserver | null = null

// Computed
const displayedReleases = computed(() => {
  const releases = props.showAll ? getAllReleases() : getLatestReleases(props.maxItems)
  return releases
})

const hasMoreReleases = computed(() => {
  return !props.showAll && getAllReleases().length > props.maxItems
})

const shouldShowComingSoon = computed(() => {
  if (!generalConfig.enableComingSoonCard) return false
  // Don't show if new release preview is active
  if (shouldShowNewReleasePreview.value) return false
  const totalReleases = getAllReleases().length
  return totalReleases < generalConfig.maxReleasesBeforeHideComingSoon
})

const comingSoonTitle = computed(() => {
  return 'Soon'
})

const comingSoonText = computed(() => {
  const totalReleases = getAllReleases().length
  if (totalReleases === 0) {
    return 'Our debut release is in the works.'
  } else if (totalReleases === 1) {
    return 'More tracks are on the horizon.'
  } else {
    return 'More music coming soon!'
  }
})

// New Release Preview functionality
const shouldShowNewReleasePreview = computed(() => {
  const { nextReleaseDate } = generalConfig
  return nextReleaseDate && isUpcomingRelease(nextReleaseDate)
})

const newReleasePreviewData = computed(() => {
  const { nextReleaseDate, nextReleaseTitle } = generalConfig
  if (!nextReleaseDate) return null
  
  return {
    title: nextReleaseTitle || 'New Release',
    releaseDate: formatReleaseDate(nextReleaseDate),
    imageUrl: '/images/albums-images/IMG_1822.JPG' // Default preview image, you can make this configurable
  }
})

// Methods
const handleReleaseClick = (release: MusicRelease) => {
  emit('releaseClick', release)
}

const handleShowMore = () => {
  emit('showMore')
}

const handleNewReleasePreviewClick = () => {
  const releaseData = newReleasePreviewData.value
  if (releaseData) {
    showSuccessSnackbar(
      `"${releaseData.title}" coming ${releaseData.releaseDate}!`,
      'Stay tuned for more updates'
    )
  }
}

const setupIntersectionObserver = () => {
  if (!process.client) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          target.classList.add('show')
          observer?.unobserve(target)
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  )

  cardRefs.value.forEach((card) => {
    if (card) {
      observer?.observe(card)
    }
  })
  
  // Also observe the coming soon card
  if (comingSoonRef.value) {
    observer.observe(comingSoonRef.value)
  }
  
  // Also observe the new release preview card
  if (newReleasePreviewRef.value) {
    observer.observe(newReleasePreviewRef.value)
  }
}

const resetAnimations = async () => {
  // Reset all cards to initial state
  cardRefs.value.forEach((card) => {
    if (card) {
      card.classList.remove('show')
    }
  })
  
  // Reset coming soon card
  if (comingSoonRef.value) {
    comingSoonRef.value.classList.remove('show')
  }
  
  // Reset new release preview card
  if (newReleasePreviewRef.value) {
    newReleasePreviewRef.value.classList.remove('show')
  }
  
  // Wait for DOM update
  await nextTick()
  
  // Setup observer for new cards
  setupIntersectionObserver()
}

// Watch for changes in displayed releases and reset animations
watch(displayedReleases, resetAnimations)

onMounted(() => {
  nextTick(() => {
    setupIntersectionObserver()
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style lang="scss" scoped>
// Animation timing variables - customize these to your preference
$fade-in-duration: 0.4s;
$fade-in-easing: ease-out;
$hover-duration: 0.2s;
$hover-easing: ease;
$shimmer-duration: 8s;
$shimmer-easing: ease-in-out;

// Reusable mixins for common patterns
@mixin card-fade-animation {
  opacity: 0;
  transform: translateY(1rem) scale(0.98);
  transition: all $fade-in-duration $fade-in-easing;
  
  &.show {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@mixin card-sizing {
  min-width: 200px;
  min-height: 200px;
  max-width: 300px;
}

@mixin card-sizing-large {
  min-width: 240px;
  min-height: 240px;
  max-width: 300px;
}

@mixin responsive-widths {
  width: calc(50% - 0.375rem);
  
  @media (min-width: 640px) {
    width: calc(50% - 0.5rem);
  }
  
  @media (min-width: 768px) {
    width: calc(33.333% - 0.667rem);
  }
  
  @media (min-width: 1024px) {
    width: calc(25% - 1.125rem);
  }
  
  @media (min-width: 1280px) {
    width: calc(20% - 1.2rem);
  }
}

@mixin absolute-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

@mixin glassmorphic-base {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

@mixin text-shadow-light {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

@mixin text-shadow-medium {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

@mixin hover-lift {
  transition: all $hover-duration $hover-easing;
  
  &:hover {
    transform: translateY(-0.125rem);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

@mixin noise-texture {
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
  border-radius: 16px;
  pointer-events: none;
}

@mixin gradient-overlay {
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
}

// Base card styles
.card-base {
  @include card-fade-animation;
  @include card-sizing;
  @include responsive-widths;
}

/* Desktop: Larger cards when few items */
@media (min-width: 768px) {
  .flex:has(.music-card-wrapper:nth-child(-n+3):last-child) .music-card-wrapper,
  .flex:has(.coming-soon-card:nth-child(-n+3):last-child) .music-card-wrapper,
  .flex:has(.coming-soon-card:nth-child(-n+3):last-child) .coming-soon-card,
  .flex:has(.new-release-preview:nth-child(-n+3):last-child) .music-card-wrapper,
  .flex:has(.new-release-preview:nth-child(-n+3):last-child) .coming-soon-card,
  .flex:has(.new-release-preview:nth-child(-n+3):last-child) .new-release-preview {
    min-width: 240px;
    max-width: 280px;
  }
  
  .flex:has(.music-card-wrapper:nth-child(1):last-child) .music-card-wrapper,
  .flex:has(.coming-soon-card:nth-child(1):last-child) .music-card-wrapper,
  .flex:has(.coming-soon-card:nth-child(1):last-child) .coming-soon-card,
  .flex:has(.new-release-preview:nth-child(1):last-child) .music-card-wrapper,
  .flex:has(.new-release-preview:nth-child(1):last-child) .coming-soon-card,
  .flex:has(.new-release-preview:nth-child(1):last-child) .new-release-preview {
    min-width: 260px;
    max-width: 320px;
  }
}

.coming-soon-content {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  @include glassmorphic-base;
  @include hover-lift;
  
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  &::before {
    content: '';
    @include absolute-overlay;
    @include gradient-overlay;
    border-radius: 16px;
    opacity: 0.8;
  }

  &::after {
    content: '';
    @include absolute-overlay;
    @include noise-texture;
  }
}

.coming-soon-icon {
  position: relative;
  z-index: 2;
  color: rgba(255, 255, 255, 0.9);
  font-size: 2.5rem;
}

.coming-soon-title {
  position: relative;
  z-index: 2;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  @include text-shadow-light;
}

.coming-soon-text {
  position: relative;
  z-index: 2;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 85%;
  @include text-shadow-light;
}

.coming-soon-shimmer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  transform: translateX(-100%) translateY(-100%) rotate(45deg);
  animation: shimmer $shimmer-duration $shimmer-easing infinite;
}

/* New Release Preview */
.new-release-preview {
  @include card-sizing-large;
  // Other styles inherited from card-base
}

.new-release-content {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  transition: all $hover-duration $hover-easing;
  transform-origin: center;

  &:hover {
    transform: translateY(-0.125rem) scale(1.01);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: translateY(-0.0625rem) scale(0.98);
    transition-duration: 0.1s;
  }
}

.new-release-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform ($hover-duration * 1.5) $hover-easing;

  .new-release-content:hover & {
    transform: scale(1.05);
  }
}

.new-release-overlay {
  @include absolute-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 
    rgba(0, 0, 0, 0.4),
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%);
  backdrop-filter: blur(15px) saturate(180%);
  -webkit-backdrop-filter: blur(15px) saturate(180%);
  transition: background $hover-duration $hover-easing;

  .new-release-content:hover & {
    background: 
      rgba(0, 0, 0, 0.3),
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 60%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 60%);
  }

  &::before {
    content: '';
    @include absolute-overlay;
    @include noise-texture;
    mix-blend-mode: overlay;
    opacity: 0.05;
  }
}

.new-release-info {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 1.5rem;
  transition: all $hover-duration $hover-easing;

  .new-release-content:hover & {
    transform: translateY(-0.0625rem);
  }
}

.new-release-icon {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.875rem;
  margin-bottom: 0.5rem;
  transition: all $hover-duration $hover-easing;

  .new-release-content:hover & {
    color: rgba(255, 255, 255, 1);
    font-size: 2.1rem;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }
}

.new-release-title {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  @include text-shadow-medium;
  transition: all $hover-duration $hover-easing;

  .new-release-content:hover & {
    color: rgba(255, 255, 255, 1);
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.7),
      0 0 15px rgba(255, 255, 255, 0.15);
  }
}

.new-release-date {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  @include text-shadow-light;
  transition: all $hover-duration $hover-easing;

  .new-release-content:hover & {
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 
      0 1px 2px rgba(0, 0, 0, 0.5),
      0 0 10px rgba(255, 255, 255, 0.08);
  }
}

.new-release-label {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  @include text-shadow-light;
  transition: all $hover-duration $hover-easing;

  .new-release-content:hover & {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.35);
    color: rgba(255, 255, 255, 1);
    transform: translateY(-0.0625rem);
    box-shadow: 
      0 3px 15px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  10% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
}

/* Show More Button */
.show-more-button {
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .card-base {
    transition-duration: ($fade-in-duration * 0.8);
    min-width: 140px;
    max-width: 180px;
  }
  
  .coming-soon-content,
  .new-release-content {
    min-height: 140px;
    min-width: 140px;
  }
  
  .coming-soon-content {
    padding: 1.5rem;
  }
  
  .coming-soon-title {
    font-size: 1rem;
  }
  
  .coming-soon-text {
    font-size: 0.75rem;
  }
  
  .show-more-button {
    &:hover {
      transform: none;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  .flex-wrap {
    gap: 0.75rem;
  }
  
  // Disable hover effects on mobile for coming soon card
  .coming-soon-content:hover {
    background: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    transform: none !important;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  }
  
  // Mobile active state for coming soon card touch feedback
  .coming-soon-content:active {
    transform: scale(0.96) !important;
    transition-duration: ($hover-duration * 0.5) !important;
  }
  
  // Disable hover effects on mobile for new release preview
  .new-release-content:hover {
    transform: none !important;
    box-shadow: none !important;
    
    .new-release-image {
      transform: none !important;
    }
    
    .new-release-overlay {
      background: 
        rgba(0, 0, 0, 0.4),
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%) !important;
    }
    
    .new-release-info,
    .new-release-icon,
    .new-release-title,
    .new-release-date,
    .new-release-label {
      transform: none !important;
      color: inherit !important;
      text-shadow: none !important;
    }
  }
  
  .new-release-content:active {
    transform: scale(0.96) !important;
    transition-duration: ($hover-duration * 0.5) !important;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .card-base {
    transition-duration: ($fade-in-duration * 0.5);
    transform: translateY(0.5rem);
  }
  
  .coming-soon-shimmer {
    animation: none;
  }
  
  .coming-soon-content:hover,
  .new-release-content:hover {
    transform: none !important;
    
    .new-release-image,
    .new-release-info,
    .new-release-icon,
    .new-release-title,
    .new-release-date,
    .new-release-label {
      transform: none !important;
    }
  }
  
  .new-release-content:active {
    transform: none !important;
  }
}
</style>
