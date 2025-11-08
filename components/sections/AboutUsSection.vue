<template>
  <section id="about" class="about-bg-section relative overflow-hidden">
    <CommonContainer size="xl" padding="md">
      <!-- Header -->
      <div class="relative z-10 mt-10 mb-10 text-center">
        <CommonSectionTitle :level="2" size="xl" align="center" class="mb-6">
          {{ t('about.section_title') }}
        </CommonSectionTitle>
      </div>

      <!-- Swiper Image Slider -->
      <div class="relative z-10 mb-6">
        <div class="slider-wrapper-container mx-auto max-w-5xl">
          <Swiper
            v-if="imagesPreloaded"
            :modules="modules"
            :slides-per-view="1"
            :space-between="0"
            :loop="true"
            :autoplay="{
              delay: interval,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }"
            :pagination="{
              clickable: true,
              dynamicBullets: false
            }"
            :navigation="true"
            :effect="'slide'"
            :speed="400"
            :grab-cursor="true"
            :touch-ratio="1"
            :touch-angle="45"
            :threshold="10"
            :resistance-ratio="0.85"
            :watch-slides-progress="true"
            class="about-swiper rounded-3xl shadow-2xl"
            @swiper="onSwiper"
            @slideChange="onSlideChange"
          >
            <SwiperSlide 
              v-for="(image, index) in sliderImages" 
              :key="`slide-${index}`"
              class="swiper-slide-custom"
            >
              <UiProgressiveImage
                :src="image.src"
                :alt="image.alt"
                loading="eager"
                :fetchPriority="index === 0 ? 'high' : 'auto'"
                preset="about"
                container-class="slider-image-container"
                image-class="slider-image"
                :show-placeholder="true"
              />
            </SwiperSlide>
          </Swiper>
          
          <!-- Loading placeholder while images preload -->
          <div 
            v-else
            class="about-swiper rounded-3xl shadow-2xl bg-surface-800/20 flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>

      <!-- About Us Text Content -->
      <div class="relative z-10 max-w-4xl mx-auto">
        <div class="text-content">
          <p class="text-lg md:text-xl text-gray-300 leading-relaxed">
            {{ t('about.content') }}
          </p>
        </div>
      </div>
    </CommonContainer>

    <!-- Background Grain Layer -->
    <div class="grain-layer" aria-hidden="true"></div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'

const { t } = useI18n({ useScope: 'global' })

// Swiper modules
const modules = [Navigation, Pagination, Autoplay, EffectFade]

// Props
interface Props {
  images?: Array<{ src: string; alt: string }>
  autoPlay?: boolean
  interval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoPlay: true,
  interval: 30000, // 30 seconds
  images: () => [
    {
      src: '/images/optimized/about-us-images/DSC02185.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02209-2.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02213-2.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02256.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02268.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02277.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02287.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02291.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02299.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02323.avif',
      alt: 'About us image'
    },
    {
      src: '/images/optimized/about-us-images/DSC02356.avif',
      alt: 'About us image'
    }
  ]
})

// Computed slider images
const sliderImages = computed(() => props.images)

// Swiper instance
const swiperInstance = ref<SwiperType | null>(null)

// Track if images are preloaded
const imagesPreloaded = ref(false)
const preloadedCount = ref(0)

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper
}

const onSlideChange = () => {
  // Optional: track slide changes
  // You can add analytics or other tracking here if needed
}

// Preload images on component mount to prevent loading issues
onMounted(() => {
  // Preload all slider images
  if (process.client) {
    const totalImages = sliderImages.value.length
    
    sliderImages.value.forEach((image, index) => {
      const img = new Image()
      img.src = image.src
      
      img.onload = () => {
        preloadedCount.value++
        console.log(`[AboutUsSection] Preloaded image ${index + 1}/${totalImages}:`, image.src)
        
        // Once all images are preloaded, show the swiper
        if (preloadedCount.value === totalImages) {
          imagesPreloaded.value = true
          console.log('[AboutUsSection] All images preloaded, initializing swiper')
        }
      }
      
      img.onerror = () => {
        preloadedCount.value++
        console.error(`[AboutUsSection] Failed to preload image ${index + 1}:`, image.src)
        
        // Still initialize swiper even if some images fail to load
        if (preloadedCount.value === totalImages) {
          imagesPreloaded.value = true
          console.log('[AboutUsSection] Preloading complete (with errors), initializing swiper')
        }
      }
    })
    
    // Fallback: if images don't load within 3 seconds, show swiper anyway
    setTimeout(() => {
      if (!imagesPreloaded.value) {
        console.warn('[AboutUsSection] Preload timeout, forcing swiper initialization')
        imagesPreloaded.value = true
      }
    }, 3000)
  } else {
    // On server, just set to true immediately
    imagesPreloaded.value = true
  }
})
</script>

<style scoped lang="scss">
/* Copy background styles from TeamSection */
.about-bg-section {
  min-height: 75vh;
  display: block;
  position: relative;
  isolation: isolate;
  /* Extended vertical gradient: lengthened intermediate stops for smoother ramp */
  background:
    linear-gradient(to bottom,
      rgba(0,0,0,0.95) 0%,
      rgba(8,8,9,0.88) 120px,
      rgba(16,16,17,0.78) 280px,
      rgba(24,24,26,0.68) 480px,
      rgba(32,32,35,0.58) 680px,
      rgba(38,38,42,0.50) 100%), /* vertical fade starting from top */
    linear-gradient(140deg, rgba(14,14,15,0.95) 0%, rgba(18,18,20,0.85) 40%, rgba(24,24,26,0.78) 75%, rgba(30,30,32,0.72) 100%), /* diagonal depth */
    radial-gradient(circle at 24% 30%, rgba(255,255,255,0.07), transparent 62%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.055), transparent 68%),
    #070707;
  background-blend-mode: normal, overlay, overlay, overlay, normal;
  overflow: hidden;
}

/* Static fine grain texture */
.grain-layer {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.028'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: overlay;
  z-index: 1;
}

/* Swiper Container Styling */
.slider-wrapper-container {
  position: relative;
}

.about-swiper {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
}

/* Swiper Slide Custom Styling */
.swiper-slide-custom {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Image Container */
.slider-image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.slider-image {
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Custom Navigation Buttons */
:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  opacity: 0;
}

:deep(.swiper-button-prev) {
  left: 20px;
}

:deep(.swiper-button-next) {
  right: 20px;
}

:deep(.swiper-navigation-icon) {
  width: 10px !important;
  height: 16px !important;
}

.about-swiper:hover :deep(.swiper-button-prev),
.about-swiper:hover :deep(.swiper-button-next) {
  opacity: 1;
}

:deep(.swiper-button-prev:hover),
:deep(.swiper-button-next:hover) {
  background: rgba(255, 255, 255, 0.95);
  color: #000;
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.swiper-button-disabled) {
  opacity: 0.2 !important;
  cursor: not-allowed;
}

:deep(.swiper-button-prev:hover:disabled),
:deep(.swiper-button-next:hover:disabled) {
  transform: scale(1);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  box-shadow: none;
}

/* Custom Pagination Dots */
:deep(.swiper-pagination) {
  bottom: 1.5rem !important;
}

:deep(.swiper-pagination-bullet) {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.6);
  opacity: 1;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet:hover) {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

:deep(.swiper-pagination-bullet-active) {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 
    0 0 12px rgba(255, 255, 255, 0.6),
    inset 0 0 4px rgba(255, 255, 255, 0.8);
}

/* Text Content */
.text-content {
  text-align: center;
  padding: 2rem 1rem;
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.text-content p {
  margin: 0 auto;
  max-width: 900px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .about-swiper {
    aspect-ratio: 4 / 3;
  }

  /* Hide navigation arrows on mobile */
  :deep(.swiper-button-prev),
  :deep(.swiper-button-next) {
    display: none !important;
  }

  :deep(.swiper-pagination) {
    bottom: 1rem !important;
  }

  :deep(.swiper-pagination-bullet) {
    width: 10px;
    height: 10px;
  }

  .text-content {
    padding: 1.5rem 0.5rem;
  }

  .text-content p {
    font-size: 1rem;
    line-height: 1.6;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .grain-layer { animation: none; }
  
  :deep(.swiper-wrapper) {
    transition-duration: 0.2s !important;
  }
}
</style>
