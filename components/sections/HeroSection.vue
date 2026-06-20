<template>
  <section
    id="hero"
    ref="heroEl"
    class="hero-section relative w-full flex items-center justify-center px-4 overflow-hidden"
  >
    <!-- Background Images Slider (orientation-adaptive) -->
    <div class="hero-slider-container">
      <div
        v-for="(image, index) in activeImages"
        :key="index"
        class="hero-slide"
        :class="{
          active: currentIndex === index,
          transitioning: isTransitioning,
          [`transition-${transition}`]: true
        }"
      >
        <!-- The LCP element is the headline TEXT, not the hero photo (it's
             entropy-excluded under the dark overlay), so the image must NOT
             outrank the preloaded headline font for bandwidth. Slide 0 stays
             eager (loads immediately) but at default priority so the font —
             which actually gates LCP — wins the pipe. -->
        <UiProgressiveImage
          v-if="loadedSlides.has(index)"
          :src="index === 0 ? lcpLandscapeSrc : image.src"
          :src-portrait="index === 0 ? lcpPortraitSrc : undefined"
          :alt="image.alt"
          :loading="index === 0 ? 'eager' : 'lazy'"
          fetch-priority="auto"
          :preset="isPortrait ? 'heroVertical' : 'hero'"
          portrait-preset="heroVertical"
          :sizes="IMAGE_SIZES.hero"
          container-class="hero-background-image"
          image-class="hero-image"
          :show-placeholder="true"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </div>
    </div>

    <!-- Fallback background for when images fail to load -->
    <div v-if="imageLoadError" class="absolute inset-0 hero-bg-fallback"></div>

    <!-- Background overlay for better text readability -->
    <div class="absolute inset-0 bg-black/50 z-10"></div>

    <!-- Slider Controls -->
    <div
      class="absolute inset-0 z-15 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity duration-300"
    >
      <UiButton
        variant="clear"
        shape="circle"
        icon-only
        size="lg"
        icon="pi pi-chevron-left"
        :disabled="!canSlide"
        aria-label="Previous slide"
        @click="previousSlide"
      />

      <UiButton
        variant="clear"
        shape="circle"
        icon-only
        size="lg"
        icon="pi pi-chevron-right"
        :disabled="!canSlide"
        aria-label="Next slide"
        @click="nextSlide"
      />
    </div>

    <!-- Progress Bar -->
    <div class="absolute bottom-0 left-0 w-full z-15">
      <div class="progress-bar-container">
        <div
          :key="`progress-${progressKey}`"
          class="progress-bar"
          :class="{
            animate: isPlaying
          }"
          :style="{ animationDuration: `${interval}ms` }"
        ></div>
      </div>
    </div>

    <!-- Content. On phones the whole block sits ~24px higher (-translate-y-6,
         reset at sm) and the subtitle is a touch smaller (text-lg). -->
    <div class="relative z-20 text-center max-w-4xl mx-auto sm:translate-y-0">
      <h1
        class="!text-5xl sm:!text-[3.4rem] md:!text-6xl font-bold text-white mb-2 md:mb-3 animate-fade-in"
      >
        {{ displayTitle }}
      </h1>

      <p class="text-lg md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up">
        {{ displaySubtitle }}
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
        <Button
          :label="t(primaryButtonLabel)"
          class="btn-primary text-lg px-8 py-3"
          :icon="primaryButtonIcon"
          @click="handlePrimaryAction"
        />
        <!-- <Button 
          :label="t(secondaryButtonLabel)" 
          class="btn-outline text-lg px-8 py-3"
          :icon="secondaryButtonIcon"
          @click="handleSecondaryAction"
        /> -->
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute z-20 bottom-8 left-0 right-0 flex justify-center">
      <div
        class="opacity-80 animate-bounce cursor-pointer hover:scale-110 transition-transform duration-300"
        @click="handleScrollDown"
      >
        <i class="pi pi-chevron-down text-white text-2xl"></i>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { watch } from 'vue'
  import Button from 'primevue/button'
  import { useI18n } from 'vue-i18n'
  import { useImageLoading, IMAGE_SIZES } from '~/utils/imageHelpers'
  import { useHeroSlider, type HeroImage } from '~/composables/useHeroSlider'
  import { useScrollTo } from '~/composables/useScrollTo'
  import { getConfig } from '~/utils/configHelpers'

  const { t } = useI18n()

  // Computed properties for config values
  const bandName = computed(() => getConfig('general.bandName'))
  const fullBandName = computed(() => getConfig('general.fullBandName'))
  const tagline = computed(() => t('app.tagline'))

  // Props
  interface Props {
    title?: string
    subtitle?: string
    primaryButtonLabel?: string
    primaryButtonIcon?: string
    secondaryButtonLabel?: string
    secondaryButtonIcon?: string
    horizontalImages?: HeroImage[]
    verticalImages?: HeroImage[]
    autoPlay?: boolean
    interval?: number
    transition?: 'fade' | 'slide' | 'zoom'
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    primaryButtonLabel: 'hero.listen_now',
    primaryButtonIcon: 'pi pi-play',
    secondaryButtonLabel: 'hero.tour_dates',
    secondaryButtonIcon: 'pi pi-calendar',
    autoPlay: true,
    interval: 6000,
    transition: 'fade',
    horizontalImages: () => [
      { src: '/images/hero-images/horizontal/hero-1.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-2.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-4.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-5.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-6.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-7.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-3.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/horizontal/hero-8.jpg', alt: 'WBM Band' }
    ],
    verticalImages: () => [
      { src: '/images/hero-images/vertical/hero-6.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-2.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-1.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-3.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-8.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-4.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-5.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-7.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-9.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-10.jpg', alt: 'WBM Band' },
      { src: '/images/hero-images/vertical/hero-11.jpg', alt: 'WBM Band' }
    ]
  })

  // Computed properties that use config values with fallbacks
  const displayTitle = computed(() => props.title || fullBandName.value)
  const displaySubtitle = computed(() => props.subtitle || tagline.value)

  // Emits
  const emit = defineEmits<{
    primaryAction: []
    secondaryAction: []
    slideChange: [index: number]
  }>()

  // Resolve hero image URLs
  const { resolveUrl } = useAssetUrl()

  // Orientation-adaptive image set: pick portrait array on portrait viewports,
  // landscape array otherwise. SSR/SSG default = landscape (matches most
  // crawlers and desktop visitors); portrait users swap once on hydration.
  // We use an explicit matchMedia setup in onMounted (instead of useMediaQuery)
  // because some setups skip the initial value update during hydration, leaving
  // the slider stuck on the SSR-default landscape set until a resize event.
  const isPortrait = ref(false)
  const activeImages = computed<HeroImage[]>(() => {
    const source =
      isPortrait.value && props.verticalImages.length > 0
        ? props.verticalImages
        : props.horizontalImages
    return source.map((img) => ({ ...img, src: resolveUrl(img.src) }))
  })

  // LCP slide (index 0): emit BOTH landscape and portrait sources inside one
  // <picture> so the browser picks the orientation-matched image at HTML
  // parse time. This avoids the brief horizontal-image flash on portrait
  // devices that the JS-driven swap can't prevent.
  const lcpLandscapeSrc = computed(() => props.horizontalImages[0]?.src ?? '')
  const lcpPortraitSrc = computed(() =>
    props.verticalImages.length > 0 ? props.verticalImages[0].src : undefined
  )

  // --- Deferred slide loading -------------------------------------------
  // Only the first slide (the LCP/above-the-fold image) loads eagerly. The rest
  // are gated behind `loadedSlides` so they don't compete for bandwidth during
  // the initial paint (this was ~6MB of hero images loading at once, tanking
  // Speed Index + LCP). Remaining slides are pulled in just-in-time before they
  // become visible and progressively on idle, so the slideshow is unaffected
  // after the first couple of seconds. Deferring past hydration also means these
  // load the orientation-correct (portrait) variant rather than the SSR-default
  // landscape one.
  const loadedSlides = ref<Set<number>>(new Set([0]))
  const markSlideLoaded = (i: number) => {
    if (i < 0 || i >= activeImages.value.length || loadedSlides.value.has(i)) return
    loadedSlides.value = new Set(loadedSlides.value).add(i)
  }

  const onIdle = (cb: () => void, timeout = 1500) => {
    if (typeof window === 'undefined') return
    const ric = (window as unknown as { requestIdleCallback?: typeof requestIdleCallback })
      .requestIdleCallback
    if (ric) ric(cb, { timeout })
    else setTimeout(cb, 200)
  }

  // Hero slider functionality
  const {
    currentIndex,
    isPlaying,
    isTransitioning,
    canSlide,
    nextSlide,
    previousSlide,
    transition,
    interval,
    progressKey
  } = useHeroSlider(activeImages, {
    autoPlay: props.autoPlay,
    interval: props.interval,
    transition: props.transition,
    pauseOnHover: false // We removed pause on hover functionality
  })

  // Image loading utilities
  const { imageLoadError, handleImageLoad, handleImageError } = useImageLoading()

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

  // Watch for slide changes and emit to parent. Also guarantee the current slide
  // and the one after it are loaded, so manual/auto navigation is never blocked
  // on a not-yet-fetched image.
  watch(currentIndex, (newIndex) => {
    emit('slideChange', newIndex)
    const len = activeImages.value.length
    if (len > 0) {
      markSlideLoaded(newIndex)
      markSlideLoaded((newIndex + 1) % len)
    }
  })

  // Fix dynamic mobile browser chrome (top bar) causing vh jumps
  // Measure initial small viewport height and use it for background layers only (no initial layout shift)
  const heroEl = ref<HTMLElement | null>(null)
  const setFixedSVH = () => {
    if (typeof window === 'undefined') return
    const vh = Math.round(window.visualViewport?.height ?? window.innerHeight)
    heroEl.value?.style.setProperty('--hero-fixed-svh', `${vh}px`)
    heroEl.value?.classList.add('hero-ready')
  }

  onMounted(() => {
    setFixedSVH()

    // Detect orientation immediately (post-hydration) and react to changes.
    // Reading mql.matches synchronously here guarantees portrait devices
    // swap to the vertical image set on first paint after hydration —
    // no resize required.
    const orientationMql = window.matchMedia('(orientation: portrait)')
    isPortrait.value = orientationMql.matches
    const handleOrientationMatch = (e: MediaQueryListEvent) => {
      isPortrait.value = e.matches
    }
    orientationMql.addEventListener('change', handleOrientationMatch)

    // Recalculate svh on orientation change only (not on scroll) to avoid jank
    const handleOrientation = () => {
      // Wait a tick for viewport to settle
      setTimeout(setFixedSVH, 300)
    }
    // Preload ONLY the next slide, and only after the page has loaded, so the
    // first auto-advance has its image ready without competing with the critical
    // above-the-fold paint. Every later slide is pulled in just-in-time by the
    // currentIndex watcher (which loads current+next on each change), giving each
    // a full interval of lead time. This keeps the initial payload to ~2 images
    // instead of all ~11 (the rest were ~5MB of off-screen hero images).
    const preloadNextSlide = () => {
      const len = activeImages.value.length
      if (len > 1) markSlideLoaded((currentIndex.value + 1) % len)
    }
    if (document.readyState === 'complete') onIdle(preloadNextSlide)
    else window.addEventListener('load', () => onIdle(preloadNextSlide), { once: true })

    onBeforeUnmount(() => {
      window.removeEventListener('orientationchange', handleOrientation)
      orientationMql.removeEventListener('change', handleOrientationMatch)
    })
  })
</script>

<style scoped>
  /* Hero section specific styles */
  .hero-section {
    /* Fallback first, then svh overrides to exclude browser UI */
    height: 100vh; /* fallback */
    height: 100svh; /* preferred */
    min-height: 100svh;
  }

  /* After plugin measures viewport, lock background layers without changing container layout */
  :root[data-svh-ready='1'] .hero-section .hero-slider-container,
  :root[data-svh-ready='1'] .hero-section .hero-slide,
  :root[data-svh-ready='1'] .hero-section .hero-background-image {
    height: var(--app-svh) !important;
  }

  /* Align container with measured height when ready to avoid any bottom gap */
  :root[data-svh-ready='1'] .hero-section {
    height: var(--app-svh) !important;
    min-height: var(--app-svh) !important;
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
    transition:
      opacity 1s ease-out,
      transform 1s ease-out;
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

  /* Slider controls are now <UiButton variant="clear" shape="circle" icon-only>. */

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
    background: linear-gradient(
      90deg,
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
    background: linear-gradient(
      90deg,
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
    background: linear-gradient(
      180deg,
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
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* Ensure proper aspect ratio and performance on mobile */
  @media (max-width: 768px) {
    .hero-background-image {
      object-position: center 30%; /* Adjust focus point for mobile */
      will-change: transform; /* Optimize for smooth scrolling */
    }
  }

  /* Animation keyframes */
  /* Transform-only entrance: the headline is the LCP element, so it must paint
     at full opacity on the first frame (an opacity 0→1 fade would push LCP out
     by the animation duration). It still slides up for a subtle entrance. */
  @keyframes fade-in {
    from {
      transform: translateY(16px);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
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
