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
            @slide-change="onSlideChange"
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
                :fetch-priority="index === 0 ? 'high' : 'auto'"
                preset="about"
                :sizes="IMAGE_SIZES.about"
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
  </section>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { Swiper, SwiperSlide } from 'swiper/vue'
  import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
  import type { Swiper as SwiperType } from 'swiper'
  import { IMAGE_SIZES } from '~/utils/imageHelpers'

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
        src: '/images/optimized/about-us-images/1.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/2.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/3.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/4.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/5.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/6.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/7.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/8.avif',
        alt: 'About us image'
      },
      {
        src: '/images/optimized/about-us-images/9.avif',
        alt: 'About us image'
      }
    ]
  })

  // Computed slider images
  const { resolveUrl } = useAssetUrl()
  const sliderImages = computed(() => {
    return props.images.map((img) => ({
      ...img,
      src: resolveUrl(img.src)
    }))
  })

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
    if (import.meta.client) {
      const totalImages = sliderImages.value.length

      sliderImages.value.forEach((image, index) => {
        const img = new Image()
        img.src = image.src

        img.onload = () => {
          preloadedCount.value++
          if (import.meta.dev) {
            console.log(`[AboutUsSection] Preloaded image ${index + 1}/${totalImages}:`, image.src)
          }

          // Once all images are preloaded, show the swiper
          if (preloadedCount.value === totalImages) {
            imagesPreloaded.value = true
            if (import.meta.dev) {
              console.log('[AboutUsSection] All images preloaded, initializing swiper')
            }
          }
        }

        img.onerror = () => {
          preloadedCount.value++
          console.error(`[AboutUsSection] Failed to preload image ${index + 1}:`, image.src)

          // Still initialize swiper even if some images fail to load
          if (preloadedCount.value === totalImages) {
            imagesPreloaded.value = true
            if (import.meta.dev) {
              console.log('[AboutUsSection] Preloading complete (with errors), initializing swiper')
            }
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
  @use '~/assets/css/components/swiper-navigation.scss' as swp;

  .about-bg-section {
    min-height: 75vh;
    display: block;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    overflow: hidden;
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
    @include swp.swiper-nav-button;
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

  @media (hover: hover) and (pointer: fine) {
    /* Show buttons on hover */
    .about-swiper:hover :deep(.swiper-button-prev),
    .about-swiper:hover :deep(.swiper-button-next) {
      opacity: 1;
    }

    /* Dim disabled buttons on hover */
    .about-swiper:hover :deep(.swiper-button-prev.swiper-button-disabled),
    .about-swiper:hover :deep(.swiper-button-next.swiper-button-disabled) {
      opacity: 0.2;
    }
  }

  /* Custom Pagination Dots */
  :deep(.swiper-pagination) {
    bottom: 1.5rem !important;
  }

  /* Liquid-glass dots: translucent frosted fill, a specular "light reflection"
     rim (bright top-left inset, faint bottom-right counter-glint) instead of a
     flat border, and a soft DROP SHADOW for depth — no outer glow. */
  :deep(.swiper-pagination-bullet) {
    width: 12px;
    height: 12px;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.35);
    -webkit-backdrop-filter: blur(3px) saturate(1.4);
    backdrop-filter: blur(3px) saturate(1.4);
    box-shadow:
      inset 1.2px 1.2px 1.5px -0.5px rgba(255, 255, 255, 0.85),
      inset -1px -1px 1px -0.5px rgba(255, 255, 255, 0.2),
      0 2px 5px rgba(0, 0, 0, 0.35);
    opacity: 1;
    transition: all 0.3s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    :deep(.swiper-pagination-bullet:hover) {
      background: rgba(255, 255, 255, 0.35);
      border-color: rgba(255, 255, 255, 0.6);
      transform: scale(1.2);
    }
  }

  :deep(.swiper-pagination-bullet-active) {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(255, 255, 255, 0.95);
    /* brighter light-reflection rim + a touch deeper depth shadow */
    box-shadow:
      inset 1.4px 1.4px 1.5px -0.3px rgba(255, 255, 255, 1),
      inset -1px -1px 1.5px -0.5px rgba(255, 255, 255, 0.55),
      0 2px 7px rgba(0, 0, 0, 0.45);
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
    .grain-layer {
      animation: none;
    }

    :deep(.swiper-wrapper) {
      transition-duration: 0.2s !important;
    }
  }
</style>
