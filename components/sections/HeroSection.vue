<template>
  <section 
    class="hero-section relative w-full flex items-center justify-center px-4 overflow-hidden"
  >
    <!-- Background Images Slider -->
    <div class="hero-slider-container">
      <div 
        v-for="(image, index) in heroImages" 
        :key="image.src"
        class="hero-slide"
        :class="{
          'active': currentIndex === index,
          'transitioning': isTransitioning,
          [`transition-${transition}`]: true
        }"
      >
        <UiProgressiveImage
          :src="image.src"
          :alt="image.alt"
          loading="eager"
          :fetchPriority="index === 0 ? 'high' : 'auto'"
          preset="hero"
          container-class="hero-background-image"
          image-class="hero-image"
          :show-placeholder="true"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </div>
    </div>
    
    <!-- Fallback background for when images fail to load -->
    <div 
      v-if="imageLoadError" 
      class="absolute inset-0 hero-bg-fallback"
    ></div>
    
    <!-- Background overlay for better text readability -->
    <div class="absolute inset-0 bg-black/50 z-10"></div>
    
    <!-- Slider Controls -->
    <div class="absolute inset-0 z-15 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
      <button 
        @click="previousSlide"
        class="slider-control prev-btn"
        :disabled="!canSlide"
      >
        <i class="pi pi-chevron-left text-2xl"></i>
      </button>
      
      <button 
        @click="nextSlide"
        class="slider-control next-btn"
        :disabled="!canSlide"
      >
        <i class="pi pi-chevron-right text-2xl"></i>
      </button>
    </div>
    
    <!-- Progress Bar -->
    <div class="absolute bottom-0 left-0 w-full z-15">
      <div class="progress-bar-container">
        <div 
          :key="`progress-${progressKey}`"
          class="progress-bar"
          :class="{ 
            'animate': isPlaying
          }"
          :style="{ animationDuration: `${interval}ms` }"
        ></div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="relative z-20 text-center max-w-4xl mx-auto">
      <h1 class="xs:text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
        {{ title }}
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up">
        {{ subtitle }}
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
        <Button 
          :label="primaryButtonLabel" 
          class="btn-primary text-lg px-8 py-3"
          :icon="primaryButtonIcon"
          @click="handlePrimaryAction"
        />
        <Button 
          :label="secondaryButtonLabel" 
          class="btn-outline text-lg px-8 py-3"
          :icon="secondaryButtonIcon"
          @click="handleSecondaryAction"
        />
      </div>
    </div>
    
    <!-- Scroll indicator -->
    <div 
      class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer hover:scale-110 transition-transform duration-300"
      @click="handleScrollDown"
    >
      <i class="pi pi-chevron-down text-white text-2xl"></i>
    </div>
  </section>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import Button from 'primevue/button'
import { useImageLoading } from '~/utils/imageHelpers'
import { useHeroSlider, type HeroImage } from '~/composables/useHeroSlider'
import { useScrollTo } from '~/composables/useScrollTo'

// Props
interface Props {
  title?: string
  subtitle?: string
  primaryButtonLabel?: string
  primaryButtonIcon?: string
  secondaryButtonLabel?: string
  secondaryButtonIcon?: string
  heroImages?: HeroImage[]
  autoPlay?: boolean
  interval?: number
  transition?: 'fade' | 'slide' | 'zoom'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Woman Based Mechanics',
  subtitle: 'Rock • Alternative • Indie',
  primaryButtonLabel: 'Listen Now',
  primaryButtonIcon: 'pi pi-play',
  secondaryButtonLabel: 'Tour Dates',
  secondaryButtonIcon: 'pi pi-calendar',
  autoPlay: true,
  interval: 6000,
  transition: 'fade',
  heroImages: () => [
    {
      src: '/images/optimized/hero-images/hero-1.avif',
      alt: 'WBM Band performing live on stage',
      title: 'Woman Based Mechanics',
      subtitle: 'Live Performance'
    },
    {
      src: '/images/optimized/hero-images/hero-2.avif',
      alt: 'WBM Band in recording studio',
      title: 'Woman Based Mechanics',
      subtitle: 'In Studio'
    },
    {
      src: '/images/optimized/hero-images/hero-3.avif',
      alt: 'WBM Band concert crowd',
      title: 'Woman Based Mechanics',
      subtitle: 'Concert Experience'
    },
  ]
})

// Emits
const emit = defineEmits<{
  primaryAction: []
  secondaryAction: []
  slideChange: [index: number]
}>()

// Hero slider functionality
const {
  currentIndex,
  isPlaying,
  isTransitioning,
  currentImage,
  canSlide,
  goToSlide,
  nextSlide,
  previousSlide,
  transition,
  interval,
  progressKey
} = useHeroSlider(props.heroImages, {
  autoPlay: props.autoPlay,
  interval: props.interval,
  transition: props.transition,
  pauseOnHover: false // We removed pause on hover functionality
})

// Image loading utilities
const {
  imageLoadError,
  imageLoaded,
  isImageLoading,
  handleImageLoad,
  handleImageError,
  resetImageStates
} = useImageLoading()

// Scroll functionality
const { scrollToElement } = useScrollTo()

// Event handlers for button actions
const handlePrimaryAction = () => {
  emit('primaryAction')
}

const handleSecondaryAction = () => {
  emit('secondaryAction')
}

// Handle scroll down indicator click
const handleScrollDown = () => {
  scrollToElement('music')
}

// Watch for slide changes and emit to parent
watch(currentIndex, (newIndex) => {
  emit('slideChange', newIndex)
})
</script>

<style scoped>
/* Hero section specific styles */
.hero-section {
  height: calc(var(--vh) * 100);
  min-height: 100vh; /* Fallback for older browsers */
}

/* Hero slider container */
.hero-slider-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* Individual hero slide */
.hero-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: all 0.8s ease-in-out;
  pointer-events: none;
}

.hero-slide.active {
  opacity: 1;
  pointer-events: auto;
}

/* Ensure hero images can fade in smoothly within active slides */
.hero-slide.active .progressive-image {
  transition: opacity 1s ease-out, transform 1s ease-out;
}

/* Transition animations */
.hero-slide.transition-fade {
  transform: scale(1);
}

.hero-slide.transition-fade.active {
  opacity: 1;
  transform: scale(1);
}

.hero-slide.transition-slide {
  transform: translateX(100%);
}

.hero-slide.transition-slide.active {
  opacity: 1;
  transform: translateX(0);
}

.hero-slide.transition-zoom {
  transform: scale(1.1);
}

.hero-slide.transition-zoom.active {
  opacity: 1;
  transform: scale(1);
}

/* Hero background image styling */
.hero-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 0;
}

.hero-image {
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: opacity;
}

/* Slider controls */
.slider-control {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.slider-control:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.slider-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Progress Bar */
.progress-bar-container {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 255, 255, 0.8) 25%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 255, 255, 0.8) 75%,
    rgba(255, 255, 255, 0.95) 100%
  );
  box-shadow: 
    0 0 20px rgba(255, 255, 255, 0.5),
    0 -2px 8px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: width 0.1s ease-out;
  position: relative;
  border-radius: 0 2px 2px 0;
}

.progress-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s ease-in-out infinite;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 1) 100%
  );
  box-shadow: 
    0 0 8px rgba(255, 255, 255, 0.8),
    2px 0 6px rgba(255, 255, 255, 0.4);
  border-radius: 0 2px 2px 0;
}

.progress-bar.animate {
  animation: progressSlide 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  animation-fill-mode: forwards;
}

.progress-bar:not(.animate) {
  width: 0%;
  transition: width 0.2s ease-out;
}

@keyframes progressSlide {
  0% { 
    width: 0%; 
    opacity: 0.8;
  }
  1% {
    opacity: 1;
  }
  99% {
    opacity: 1;
  }
  100% { 
    width: 100%; 
    opacity: 0.9;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
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
