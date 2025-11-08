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
                loading="lazy"
                :fetchPriority="index === 0 ? 'high' : 'auto'"
                preset="about"
                container-class="slider-image-container"
                image-class="slider-image"
                :show-placeholder="true"
              />
            </SwiperSlide>
          </Swiper>
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
import { ref, computed } from 'vue'
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
})

// Computed slider images
const sliderImages = computed(() => props.images)

// Swiper instance
const swiperInstance = ref<SwiperType | null>(null)

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper
}

const onSlideChange = () => {
  // Optional: track slide changes
  // You can add analytics or other tracking here if needed
}
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
      rgba(0,0,0,0.88) 0%,
      rgba(12,12,13,0.70) 460px,
      rgba(22,22,24,0.62) 680px,
      rgba(30,30,33,0.56) 880px,
      rgba(38,38,42,0.50) 100%), /* vertical fade */
    linear-gradient(140deg, rgba(14,14,15,0.95) 0%, rgba(18,18,20,0.85) 40%, rgba(24,24,26,0.78) 75%, rgba(30,30,32,0.72) 100%), /* diagonal depth */
    radial-gradient(circle at 24% 30%, rgba(255,255,255,0.07), transparent 62%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.055), transparent 68%),
    #070707;
  background-blend-mode: normal, overlay, overlay, overlay, normal;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.03),
    inset 0 -1px 0 rgba(255,255,255,0.02);
  overflow: hidden;
}

/* Top and bottom transition extenders */
.about-bg-section::before,
.about-bg-section::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  pointer-events: none;
  z-index: -1;
}

/* Fade upward above the section to merge smoothly with previous dark area */
.about-bg-section::before {
  top: -160px;
  height: 160px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.97));
}

/* Bottom extended fade to ease into next darker or lighter block */
.about-bg-section::after {
  bottom: -200px;
  height: 200px;
  background: linear-gradient(to bottom, rgba(36,36,39,0.48), rgba(28,28,30,0.6) 40%, rgba(16,16,17,0.78) 80%, rgba(8,8,9,0.9));
  filter: blur(2px);
  opacity: 0.95;
}

/* Static fine grain texture */
.grain-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 2px),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E");
  background-blend-mode: soft-light, overlay;
  animation: grainShift 22s steps(1) infinite;
}

@keyframes grainShift {
  0% { transform: translate(0,0); }
  25% { transform: translate(-5%, 3%); }
  50% { transform: translate(4%, -4%); }
  75% { transform: translate(-3%, 2%); }
  100% { transform: translate(0,0); }
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
