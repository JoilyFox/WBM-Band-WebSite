<template>
  <div 
    ref="containerRef"
    class="progressive-image-container"
    :class="containerClass"
  >
    <!-- Simple moving gradient placeholder -->
    <div
      v-if="showPlaceholder"
      class="absolute inset-0 gradient-placeholder transition-opacity duration-1000 ease-out"
      :class="{ 'opacity-0': imageLoaded }"
    >
    </div>

    <!-- Main optimized image -->
    <NuxtImg
      v-if="shouldLoadImage"
      :src="src"
      :alt="alt"
      :class="[
        'progressive-image',
        'transition-all duration-1000 ease-out',
        imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
        imageClass
      ]"
      :loading="loading"
      :fetchpriority="fetchPriority"
      :preset="preset"
      :width="width"
      :height="height"
      :sizes="sizes"
      :quality="quality"
      :format="format"
      @load="handleImageLoad"
      @error="handleImageError"
    />

    <!-- Error fallback -->
    <div
      v-if="imageLoadError"
      class="absolute inset-0 bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center"
    >
      <div class="text-center text-white/60">
        <i class="pi pi-image text-4xl mb-2"></i>
        <p class="text-xs font-medium uppercase tracking-wider">
          {{ errorText || 'Image unavailable' }}
        </p>
      </div>
    </div>

    <!-- Loading spinner -->
    <div
      v-if="showLoadingSpinner && isImageLoading"
      class="absolute inset-0 flex items-center justify-center bg-surface-800/20"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- Overlay content slot -->
    <div v-if="$slots.overlay" class="absolute inset-0 z-10">
      <slot name="overlay" :loaded="imageLoaded" :loading="isImageLoading" :error="imageLoadError" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useImageLoading, generateBlurPlaceholder } from '~/utils/imageHelpers'

interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  preset?: string
  quality?: number
  format?: string
  sizes?: string
  containerClass?: string
  imageClass?: string
  errorText?: string
  showPlaceholder?: boolean
  showLoadingSpinner?: boolean
  lazyLoadOffset?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  fetchPriority: 'auto',
  quality: 80,
  format: 'avif,webp,jpg',
  showPlaceholder: true,
  showLoadingSpinner: false,
  lazyLoadOffset: '50px'
})

// Template refs
const containerRef = ref<HTMLElement>()

// Image loading composable
const {
  imageLoadError,
  imageLoaded,
  isImageLoading,
  handleImageLoad,
  handleImageError,
  isIntersecting,
  setIntersectionTarget,
  resetImageStates
} = useImageLoading()

// Generate blur placeholder
const blurPlaceholder = ref('')

// Control when to actually load the image
const shouldLoadImage = computed(() => {
  return props.loading === 'eager' || isIntersecting.value
})

onMounted(() => {
  // Set up intersection observer for lazy loading
  if (containerRef.value && props.loading === 'lazy') {
    setIntersectionTarget(containerRef.value)
  }

  // Generate blur placeholder if enabled
  if (props.showPlaceholder) {
    blurPlaceholder.value = generateBlurPlaceholder(
      props.width || 40,
      props.height || 40
    )
  }
})

// Watch for src changes to reset states
watch(() => props.src, () => {
  resetImageStates()
})
</script>

<style scoped>
.progressive-image-container {
  position: relative;
  overflow: hidden;
  background-color: #0a0a0a;
}

.progressive-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Cool black and grey grainy gradient placeholder */
.gradient-placeholder {
  background: 
    linear-gradient(
      135deg,
      #000000 0%,
      #1a1a1a 20%,
      #333333 40%,
      #1a1a1a 60%,
      #000000 80%,
      #0a0a0a 100%
    ),
    conic-gradient(
      from 0deg at 30% 70%,
      #000000 0deg,
      #222222 60deg,
      #111111 120deg,
      #000000 180deg,
      #1a1a1a 240deg,
      #000000 360deg
    ),
    url('/noise.svg');
  background-size: 
    200% 200%,
    300% 300%,
    150px 150px;
  filter: contrast(120%) brightness(400%);
  animation: coolMove 10s ease-in-out infinite;
  isolation: isolate;
}

@keyframes coolMove {
  0% {
    background-position: 
      0% 0%,
      50% 50%,
      0 0;
  }
  50% {
    background-position: 
      100% 100%,
      150% 150%,
      75px 75px;
  }
  100% {
    background-position: 
      0% 0%,
      50% 50%,
      0 0;
  }
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .gradient-placeholder {
    animation: none !important;
    background: 
      linear-gradient(135deg, #000000 0%, #1a1a1a 20%, #333333 40%, #1a1a1a 60%, #000000 100%),
      url('/noise.svg');
    filter: contrast(120%) brightness(400%);
  }
}
</style>
