<template>
  <div
    class="music-detail-content min-h-screen text-primary-50 font-space-grotesk bg-surface-950 relative"
    :class="{
      'performance-optimized': isLowPerformanceDevice,
      'reduced-animations': shouldReduceAnimations,
      'modal-mode': isModal
    }"
    :style="accentVars"
  >
    <!-- Back/Share Buttons (only on page, not modal) -->
    <!-- Teleport to body to avoid ancestor transforms/containment breaking fixed positioning -->
    <Teleport to="body">
      <div v-if="!isModal && shouldShowBackButton" class="floating-controls">
        <button
          @click="handleBack"
          :class="['back-glass-btn', { 'back-glass-btn--transparent': backBtnTransparent }]"
          aria-label="Back to music section"
        >
          <i class="pi pi-arrow-left text-xl"></i>
        </button>
        
        <!-- Logo in the center (always visible) -->
        <div class="floating-logo">
          <Logo
            :clickable="true"
            :on-click="scrollToHero"
            :image-class="`floating-logo-img ${backBtnTransparent ? 'floating-logo-img--small' : ''}`"
            loading="eager"
            class="floating-logo-img"
            fetchpriority="high"
            :blend-mode="'exclusion'"
          />
        </div>
        
        <button
          @click="handleShare"
          :class="['share-glass-btn', { 'share-glass-btn--transparent': backBtnTransparent }]"
          aria-label="Share release"
        >
          <i class="pi pi-share-alt text-xl"></i>
        </button>
      </div>
    </Teleport>

    <!-- Hero Section with Album Cover -->
    <section :class="['music-hero flex items-center justify-center relative overflow-hidden', {
      'pt-20 pb-4 px-4 md:py-16 md:px-8': !isHeroExpanded && !isDesktop && !isModal,
      'py-4 px-4': !isHeroExpanded && !isDesktop && isModal,
      'py-16 px-4 md:px-8': isHeroExpanded || isDesktop,
      'performance-hero': isLowPerformanceDevice,
      'modal-hero': isModal
    }]">
      <div class="music-hero-background absolute inset-0 z-0" :class="{ 
        'static-bg': shouldReduceAnimations || isModal,
        'modal-bg': isModal 
      }">
        <div class="music-hero-overlay" :class="{ 
          'static-overlay': shouldReduceAnimations || isModal,
          'modal-overlay': isModal 
        }"></div>
      </div>
      
      <!-- Mobile Compact Hero (default state on mobile) -->
      <div 
        v-if="!isHeroExpanded" 
        class="md:hidden w-full max-w-5xl z-10 cursor-pointer transform transition-all duration-400 ease-out md:hover:scale-[1.02] animate-slideInCompact"
        @click="toggleHeroExpansion"
      >
        <div class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-400 ease-out hover:bg-white/8 hover:border-white/15 hover:shadow-lg md:hover:bg-white/8 md:hover:border-white/15 md:hover:shadow-lg">
          <!-- Small Album Cover -->
          <div class="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
            <UiProgressiveImage
              :src="release.imageUrl"
              :alt="release.title"
              container-class="w-full h-full"
              image-class="w-full h-full object-cover object-center"
              :loading="isModal ? 'lazy' : 'eager'"
              preset="album"
              :show-placeholder="!isModal"
              fetch-priority="low"
              :width="64"
              :height="64"
              sizes="64px"
            />
            <!-- Small Badge -->
            <div class="absolute top-1 left-1 z-10">
              <span :class="badgeClass" class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/25 shadow-sm">
                {{ release.type }}
              </span>
            </div>
          </div>
          
          <!-- Compact Info -->
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-bold text-primary-50 mb-1 truncate">{{ release.title }}</h1>
            <p class="text-sm text-primary-200 font-medium">{{ formatDate(release.releaseDate) }}</p>
          </div>
          
          <!-- Expand Icon -->
          <div class="flex-shrink-0">
            <i class="pi pi-chevron-down text-primary-200 text-lg transition-all duration-300 ease-out"></i>
          </div>
        </div>
      </div>
      
      <!-- Full Hero (desktop always, mobile when expanded) -->
      <div 
        v-show="isDesktop || isHeroExpanded"
        :class="['music-hero-content flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl w-full z-10 transition-all duration-500 ease-out transform', {
          'animate-fadeInUpSmooth': isHeroExpanded && !isDesktop,
          'animate-fadeOutDown': !isHeroExpanded && !isDesktop
        }]"
      >
        <div class="music-album-cover relative w-44 h-44 md:w-72 md:h-72 flex-shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl"
             :class="{ 
               'backdrop-blur-xl': !isLowPerformanceDevice && !isModal,
               'backdrop-blur-sm': isLowPerformanceDevice || isModal,
               'static-cover': shouldReduceAnimations || isModal,
               'modal-cover': isModal
             }">
          <UiProgressiveImage
            :src="release.imageUrl"
            :alt="release.title"
            container-class="w-full h-full"
            image-class="w-full h-full object-cover"
            loading="eager"
            fetch-priority="high"
            :show-placeholder="!isModal"
            :width="512"
            :height="512"
            sizes="(min-width: 768px) 288px, 176px"
            preset="album"
          />
          <!-- Release Type Badge -->
          <div class="music-badge absolute top-4 left-4 z-10">
            <span :class="badgeClass" class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/25 shadow-md"
                  :style="{ 
                    backdropFilter: (isLowPerformanceDevice || isModal) ? 'blur(4px)' : 'blur(12px)',
                    WebkitBackdropFilter: (isLowPerformanceDevice || isModal) ? 'blur(4px)' : 'blur(12px)'
                  }">
              {{ release.type }}
            </span>
          </div>
        </div>
        <div class="music-info flex-1 min-w-0 text-center md:text-left">
          <!-- Mobile Collapse Button -->
          <div class="md:hidden mb-3 flex justify-center">
            <button 
              @click="toggleHeroExpansion"
              class="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-primary-200 text-sm font-medium transition-all duration-300 md:hover:bg-white/20 md:hover:scale-105"
            >
              <i class="pi pi-chevron-up text-sm"></i>
              <span>Collapse</span>
            </button>
          </div>
          
          <h1 class="music-title text-4xl md:text-6xl font-extrabold leading-tight mb-3 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-lg"
              :class="{ 'animate-titleGlow': !shouldReduceAnimations }">
            {{ release.title }}
          </h1>
          <p class="music-date text-primary-200 text-base md:text-lg font-medium mb-2">{{ formatDate(release.releaseDate) }}</p>
          <p v-if="release.description" class="music-description text-primary-100 text-base md:text-lg max-w-xl mx-auto md:mx-0">
            {{ release.description }}
          </p>
        </div>
      </div>
    </section>
    <!-- Music Platform Links -->
    <section class="music-platforms relative py-8 sm:pb-16 px-4 md:px-8 bg-gradient-to-b from-surface-900/80 to-surface-950/95">
      <div class="platforms-container max-w-3xl mx-auto rounded-xl">
        <h2 class="platforms-title text-center text-2xl md:text-3xl font-extrabold mb-4 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-md">Listen Now</h2>
        <div class="platforms-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
          <div 
            v-for="(url, platform) in availablePlatforms"
            :key="platform"
            class="platform-button-wrapper w-full h-full min-h-[110px] flex"
          >
            <MusicPlatformButton
              :platform="platform"
              :url="url"
              class="w-full h-full flex-1"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useScrollTo } from '~/composables/useScrollTo'
import type { MusicRelease } from '~/data/musicLibrary'
import Logo from '~/components/ui/Logo.vue'

interface Props {
  release: MusicRelease
  isModal?: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

// Performance detection
const isLowPerformanceDevice = ref(false)
const shouldReduceAnimations = ref(false)

// Check if back button should be visible based on URL parameters
const shouldShowBackButton = computed(() => {
  return route.query.from === 'music'
})

// Responsive breakpoint detection
const isDesktop = ref(false)
const updateBreakpoint = () => {
  isDesktop.value = window.innerWidth >= 768 // md breakpoint
}

// Performance detection function
const detectPerformance = () => {
  if (typeof window === 'undefined') return
  
  // Check for low-end device indicators
  const deviceMemory = (navigator as any).deviceMemory || 4
  const hardwareConcurrency = navigator.hardwareConcurrency || 4
  const isMobile = window.innerWidth < 768
  const pixelRatio = window.devicePixelRatio || 1
  
  // Detect if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // Performance scoring
  const memoryScore = deviceMemory >= 4 ? 1 : 0
  const cpuScore = hardwareConcurrency >= 4 ? 1 : 0
  const displayScore = pixelRatio <= 2 ? 1 : 0
  const mobileScore = isMobile ? 0 : 1
  
  const performanceScore = memoryScore + cpuScore + displayScore + mobileScore
  
  isLowPerformanceDevice.value = performanceScore < 2
  shouldReduceAnimations.value = prefersReducedMotion || isLowPerformanceDevice.value
}

// Mobile hero expansion state (default collapsed on mobile)
const isHeroExpanded = ref(false)
const toggleHeroExpansion = () => {
  isHeroExpanded.value = !isHeroExpanded.value
}

// Glassmorphic back button opacity on scroll
const backBtnTransparent = ref(false)
let scrollHandler: (() => void) | null = null
let resizeHandler: (() => void) | null = null
onMounted(() => {
  // Initialize performance detection
  detectPerformance()
  
  // Initialize breakpoint
  updateBreakpoint()
  
  // Scroll handler for back button (throttled for performance)
  let ticking = false
  scrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        backBtnTransparent.value = window.scrollY > 60
        ticking = false
      })
      ticking = true
    }
  }
  
  // Resize handler for responsive breakpoint (debounced)
  let resizeTimeout: NodeJS.Timeout
  resizeHandler = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      updateBreakpoint()
      detectPerformance() // Re-detect on resize
    }, 150)
  }
  
  window.addEventListener('scroll', scrollHandler, { passive: true })
  window.addEventListener('resize', resizeHandler, { passive: true })
})
onBeforeUnmount(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})

// Derive per-release accent colors from slug
const stringToHue = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % 360
}
const hue = computed(() => stringToHue(props.release.slug || props.release.id))
const accentVars = computed(() => ({
  '--accent1': `hsla(${hue.value}deg, 85%, 62%, 0.24)`,
  '--accent2': `hsla(${(hue.value + 40) % 360}deg, 85%, 60%, 0.18)`,
  '--accent-edge': `hsla(${(hue.value + 20) % 360}deg, 90%, 55%, 0.35)`
}))

const availablePlatforms = computed(() => {
  const platforms: Record<string, string> = {}
  Object.entries(props.release.musicPlatformLinks).forEach(([platform, url]) => {
    if (url) {
      platforms[platform] = url
    }
  })
  return platforms
})

const badgeClass = computed(() => {
  const typeClasses = {
    'single': 'badge-single',
    'album': 'badge-album', 
    'ep': 'badge-ep',
    'new release': 'badge-new'
  }
  return typeClasses[props.release.type] || 'badge-default'
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Build a robust fallback URL for CSS backgrounds (prefer JPG)
const bgCoverUrl = computed(() => {
  const raw = props.release.imageUrl || ''
  let path = raw
  if (raw.includes('/images/optimized/')) {
    path = raw.replace(/\.(avif|webp|png)$/, '.jpg')
  } else if (raw.startsWith('/images/')) {
    path = raw.replace('/images/', '/images/optimized/').replace(/\.(avif|webp|png|jpg)$/, '.jpg')
  }
  const config = useRuntimeConfig()
  const baseURL = config.app?.baseURL || '/'
  if (path.startsWith('http') || path.startsWith('//')) return path
  const finalUrl = baseURL === '/' ? path : (path.startsWith(baseURL) ? path : baseURL.replace(/\/$/, '') + path)
  return finalUrl
})

// Back button handler: go to / and scroll to music section
const { scrollToElementWithNavigation } = useScrollTo()
const handleBack = async () => {
  await router.push('/')
  setTimeout(() => {
    scrollToElementWithNavigation('music')
  }, 100)
}

// Logo click handler: scroll to hero section
const scrollToHero = () => {
  scrollToElementWithNavigation('hero')
}

// Share button handler: Web Share API with clipboard fallback
const handleShare = async () => {
  try {
    const url = window.location.href
    const title = props.release.title
    const text = `Check out: ${props.release.title}`
    if (navigator.share) {
      await navigator.share({ title, text, url })
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      // Optional: integrate snackbar here if desired
    }
  } catch (e) {
    // no-op on cancel or failure
  }
}
</script>

<style scoped>
/* Floating fixed container that holds both buttons */
.floating-controls {
  position: fixed;
  top: 1.25rem;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem; /* matches left/right offsets of individual buttons */
  pointer-events: none; /* let children handle interactions */
}
.floating-controls .back-glass-btn,
.floating-controls .share-glass-btn {
  pointer-events: auto;
  position: static !important; /* override fixed when inside container */
  top: auto; left: auto; right: auto; bottom: auto;
}

/* Floating logo in the center */
.floating-logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  z-index: 10;
}

/* Logo button styles (similar to header layout) */
.logo-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: transform 0.3s ease-out;
}

.logo-button:hover {
  transform: scale(1.05);
}

.logo-button:active {
  transform: scale(0.95);
}

.logo-button:focus {
  outline: none;
  box-shadow: none;
}

/* Floating logo image with scroll-responsive sizing */
.floating-logo-img {
  width: 45px;
  margin-top: 12px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  transition: height 0.25s cubic-bezier(.4,0,.2,1), margin-top 0.25s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
}

/* Alternative blend modes (comment out difference above and uncomment one below to try different effects)
.floating-logo-img {
  mix-blend-mode: exclusion; // Softer inversion effect
  mix-blend-mode: overlay; // High contrast overlay  
  mix-blend-mode: screen; // Brightening effect
}
*/

/* Glassmorphic action buttons styles */
.back-glass-btn,
.share-glass-btn {
  position: fixed !important; /* default when rendered outside container */
  top: 1.25rem;
  left: 1rem;
  z-index: 9999; /* Very high z-index to ensure it stays above everything */
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(30, 30, 40, 0.32);
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
  border: 1.5px solid rgba(255,255,255,0.13);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  color: #fff;
  transition: background 0.25s, box-shadow 0.25s, opacity 0.45s cubic-bezier(.4,0,.2,1);
  opacity: 1;
  cursor: pointer;
  /* Ensure it creates its own stacking context */
  isolation: isolate;
}
/* When not in container, keep back on left and share on right */
.share-glass-btn { left: auto; right: 1rem; }

.back-glass-btn:hover,
.share-glass-btn:hover {
  background: rgba(60, 60, 80, 0.44);
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.22), 0 2px 8px 0 rgba(0,0,0,0.13);
}

/* Disable hover effects on mobile/touch devices */
@media (hover: none) and (pointer: coarse) {
  .back-glass-btn:hover,
  .share-glass-btn:hover {
    background: rgba(30, 30, 40, 0.32);
    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
    transform: none;
  }
}

.back-glass-btn--transparent { opacity: 0; pointer-events: none; }
.share-glass-btn--transparent { opacity: 0; pointer-events: none; }

/* Preserve transitions for buttons even while modal performance classes are active */
:global(body.modal-open) .back-glass-btn,
:global(body.modal-open) .share-glass-btn {
  transition: background 0.25s, box-shadow 0.25s, opacity 0.45s cubic-bezier(.4,0,.2,1) !important;
}
:global(body.modal-animating) .back-glass-btn,
:global(body.modal-animating) .share-glass-btn {
  transition: background 0.25s, box-shadow 0.25s, opacity 0.45s cubic-bezier(.4,0,.2,1) !important;
}

/* Performance optimizations */
.music-detail-content {
  position: relative;
  min-height: 100vh;
  color: white;
  /* GPU acceleration */
  transform: translateZ(0);
  will-change: auto;
  /* Optimized background for normal devices */
  background:
    radial-gradient(1200px 600px at 10% 110%, rgba(120,119,198,0.10), transparent 60%),
    radial-gradient(900px 500px at 110% -10%, rgba(255,119,198,0.10), transparent 60%),
    linear-gradient(#020202, #030303);
  background-size: 150% 150%, 120% 120%, 100% 100%;
  animation: gradientFlow 25s ease-in-out infinite alternate;
}

/* Performance-optimized version for low-end devices */
.music-detail-content.performance-optimized {
  /* Simplified background without complex gradients */
  background: linear-gradient(180deg, #020202 0%, #1a1a1a 50%, #020202 100%);
  animation: none;
}

/* Reduced animations for accessibility and low-performance devices */
.music-detail-content.reduced-animations {
  animation: none !important;
}

.music-detail-content.reduced-animations *,
.music-detail-content.reduced-animations *::before,
.music-detail-content.reduced-animations *::after {
  animation: none !important;
  transition: opacity 0.2s ease !important;
}

/* Simplified grain overlay for better performance */
.music-detail-content::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .04;
  mix-blend-mode: overlay;
  background: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,.08) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 100px 100px, 150px 150px;
  z-index: 0; /* Lower z-index to ensure it doesn't interfere with fixed buttons */
}

/* Modal-specific optimizations for smooth animations */
.music-detail-content.modal-mode {
  /* Simplified background for modals to reduce rendering load */
  background: linear-gradient(180deg, #020202 0%, #1a1a1a 50%, #020202 100%);
  animation: none !important;
  /* Force compositing layer for smoother animations */
  transform: translateZ(0);
  will-change: auto;
  /* Optimize rendering performance */
  contain: layout style paint;
}

/* Modal mode: disable grain overlay completely */
.music-detail-content.modal-mode::after {
  display: none;
}

/* Modal hero optimizations */
.modal-hero .music-hero::before {
  /* Simplified background without expensive animations */
  background: radial-gradient(60% 80% at 50% 50%, var(--accent1), transparent 70%);
  filter: blur(15px);
  animation: none !important;
  will-change: auto;
}

.modal-hero .music-hero::after {
  /* Simplified vignette */
  background: radial-gradient(100% 100% at 50% 50%, rgba(0,0,0,.5), transparent 70%);
  animation: none !important;
  will-change: auto;
}

/* Modal background and overlay optimizations */
.modal-bg .music-hero::before,
.modal-bg .music-hero::after {
  animation: none !important;
  transform: none !important;
  filter: blur(10px) !important;
}

.modal-overlay {
  animation: none !important;
  background: 
    radial-gradient(circle at 30% 70%, var(--accent1), transparent 50%),
    radial-gradient(circle at 70% 30%, var(--accent2), transparent 50%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.6) 100%) !important;
  will-change: auto;
}

/* Modal album cover optimizations */
.modal-cover {
  /* Remove floating animation in modal */
  animation: none !important;
  /* Optimize backdrop blur for modal performance */
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  will-change: auto;
}

.modal-cover::before {
  /* Reduce glow effect in modal */
  filter: blur(10px) !important;
  opacity: 0.3 !important;
}

.modal-cover::after {
  /* Disable shine effect in modal */
  display: none !important;
}

/* Disable all hover effects in modal mode */
.modal-mode .music-album-cover:hover::after {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .music-detail-content,
  .music-hero::before,
  .music-hero::after,
  .music-hero-overlay {
    animation: none !important;
    transition: none !important;
    background-attachment: initial !important;
  }
}

/* Hero Section and background animation remain in CSS for unique effects */

/* Performance-aware hero background */
.music-hero::before {
  content: '';
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(60% 80% at 10% 20%, var(--accent1), transparent 60%),
    radial-gradient(80% 60% at 90% 10%, var(--accent2), transparent 60%),
    conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,.05), rgba(0,0,0,0) 20% 80%, rgba(255,255,255,.05));
  filter: blur(40px) saturate(110%);
  background-size: 200% 200%, 180% 180%, 150% 150%;
  animation: 
    auroraShift 16s ease-in-out infinite alternate,
    auroraFloat 20s ease-in-out infinite alternate,
    auroraPulse 12s ease-in-out infinite alternate;
  z-index: 1;
  will-change: transform, filter;
  backface-visibility: hidden;
}

/* Simplified version for low-performance devices */
.performance-hero .music-hero::before {
  background: radial-gradient(60% 80% at 50% 50%, var(--accent1), transparent 70%);
  filter: blur(20px);
  animation: none;
  will-change: auto;
}

/* Static background for reduced motion */
.static-bg .music-hero::before {
  animation: none !important;
  transform: none !important;
}

.music-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 60% at 50% 100%, rgba(0,0,0,.75), transparent 60%),
    radial-gradient(80% 50% at 50% -10%, rgba(0,0,0,.6), transparent 60%);
  pointer-events: none;
  background-size: 140% 140%, 160% 160%;
  animation: vignetteWave 18s ease-in-out infinite alternate;
  z-index: 2;
  will-change: transform;
}

/* Simplified vignette for low-performance */
.performance-hero .music-hero::after {
  background: radial-gradient(100% 100% at 50% 50%, rgba(0,0,0,.6), transparent 70%);
  animation: none;
  will-change: auto;
}

.static-bg .music-hero::after {
  animation: none !important;
}

.music-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 70%, var(--accent1), transparent 50%),
    radial-gradient(circle at 70% 30%, var(--accent2), transparent 50%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.65) 100%);
  background-size: 130% 130%, 120% 120%, 100% 100%;
  animation: overlayDrift 22s ease-in-out infinite alternate;
  will-change: transform;
}

/* Static overlay */
.static-overlay {
  animation: none !important;
  background:
    radial-gradient(circle at 30% 70%, var(--accent1), transparent 50%),
    radial-gradient(circle at 70% 30%, var(--accent2), transparent 50%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.65) 100%) !important;
}

.music-hero-content {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 3rem;
  max-width: 1100px;
  width: 100%;
}

/* Optimized album cover with performance considerations */
.music-album-cover {
  position: relative;
  width: 300px;
  height: 300px;
  flex-shrink: 0;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  /* GPU acceleration for better performance */
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* Floating animation for normal performance */
.music-album-cover:not(.static-cover) {
  animation: float 6s ease-in-out infinite;
}

/* Performance-optimized backdrop blur */
.music-album-cover.backdrop-blur-xl {
  backdrop-filter: blur(22px) saturate(120%);
  -webkit-backdrop-filter: blur(22px) saturate(120%);
}

.music-album-cover.backdrop-blur-sm {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.music-album-cover::before {
  content: '';
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255,255,255,.15), rgba(255,255,255,0) 60%);
  filter: blur(30px);
  opacity: .6;
  will-change: opacity;
}

/* Optimized shine effect */
.music-album-cover::after {
  content: '';
  position: absolute;
  top: -100%;
  left: -50%;
  width: 200%;
  height: 300%;
  background: linear-gradient(75deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%);
  transform: rotate(8deg);
  opacity: 0;
  transition: opacity .3s ease, transform .4s ease;
  will-change: opacity, transform;
}

/* Only enable hover effects on capable devices */
@media (hover: hover) and (pointer: fine) and (min-resolution: 1.5dppx) {
  .music-album-cover:not(.static-cover):hover::after {
    opacity: .7;
    transform: rotate(8deg) translateY(10%);
  }
}

/* Disable shine effect on low-performance devices */
.performance-optimized .music-album-cover::after {
  display: none;
}

/* Badge */
.music-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}
.music-badge span {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Title + text animation only */
.animate-titleGlow {
  animation: titleGlow 5s ease-in-out infinite alternate;
}
@keyframes titleGlow {
  0% { filter: drop-shadow(0 0 10px rgba(255,255,255,.28)); }
  100% { filter: drop-shadow(0 0 22px rgba(255,255,255,.5)); }
}

/* Optimized animations with performance considerations */
.animate-fadeInUpSmooth {
  animation: fadeInUpSmooth 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: opacity, transform;
}

.animate-fadeOutDown {
  animation: fadeOutDown 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
  will-change: opacity, transform;
}

.animate-slideInCompact {
  animation: slideInCompact 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  will-change: opacity, transform;
}

/* Reduced motion variants */
.reduced-animations .animate-fadeInUpSmooth,
.reduced-animations .animate-fadeOutDown,
.reduced-animations .animate-slideInCompact {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}

@keyframes fadeInUpSmooth {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeOutDown {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

@keyframes slideInCompact {
  0% {
    opacity: 0;
    transform: translateY(-15px) scale(0.95);
  }
  60% {
    opacity: 0.8;
    transform: translateY(2px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Optimized keyframe animations with performance considerations */

/* Basic motion effects */
@keyframes float { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-10px); } 
}

@keyframes auroraShift { 
  0% { transform: translate3d(0,0,0) scale(1); } 
  100% { transform: translate3d(-2%, 2%, 0) scale(1.06); } 
}

/* Background gradient animations - disabled on low-performance devices */
@keyframes gradientFlow {
  0%, 100% {
    background-position: 0% 0%, 100% 100%, 0% 0%;
  }
  50% {
    background-position: 100% 50%, 0% 50%, 0% 0%;
  }
}

@keyframes auroraFloat {
  0%, 100% {
    background-position: 0% 0%, 100% 100%, 50% 50%;
  }
  25% {
    background-position: 100% 25%, 25% 75%, 25% 75%;
  }
  50% {
    background-position: 50% 100%, 75% 25%, 75% 25%;
  }
  75% {
    background-position: 25% 50%, 50% 100%, 100% 50%;
  }
}

@keyframes auroraPulse {
  0% {
    filter: blur(40px) saturate(110%) brightness(1);
    opacity: 0.8;
  }
  50% {
    filter: blur(35px) saturate(130%) brightness(1.1);
    opacity: 1;
  }
  100% {
    filter: blur(45px) saturate(90%) brightness(0.9);
    opacity: 0.9;
  }
}

@keyframes vignetteWave {
  0%, 100% {
    background-position: 0% 100%, 100% 0%;
    transform: scale(1) rotate(0deg);
  }
  33% {
    background-position: 50% 50%, 50% 50%;
    transform: scale(1.02) rotate(0.5deg);
  }
  66% {
    background-position: 100% 0%, 0% 100%;
    transform: scale(0.98) rotate(-0.5deg);
  }
}

@keyframes overlayDrift {
  0%, 100% {
    background-position: 30% 70%, 70% 30%, 0% 0%;
    transform: translateZ(0);
  }
  25% {
    background-position: 60% 40%, 40% 60%, 0% 0%;
    transform: translateZ(0) scale(1.01);
  }
  50% {
    background-position: 80% 20%, 20% 80%, 0% 0%;
    transform: translateZ(0) scale(0.99);
  }
  75% {
    background-position: 45% 55%, 55% 45%, 0% 0%;
    transform: translateZ(0) scale(1.005);
  }
}

/* Performance optimizations for reduced motion and low-end devices */
@media (prefers-reduced-motion: reduce) {
  .music-detail-content,
  .music-hero::before,
  .music-hero::after,
  .music-hero-overlay,
  .music-album-cover {
    animation: none !important;
    transition: opacity 0.2s ease !important;
  }
  
  .animate-titleGlow {
    animation: none !important;
  }
}

/* Mobile optimizations for better performance */
@media (max-width: 768px) {
  .music-detail-content {
    /* Reduce background complexity on mobile */
    background-size: 100% 100%, 100% 100%, 100% 100%;
  }
  
  .music-hero::before {
    /* Reduce blur intensity on mobile */
    filter: blur(20px) saturate(100%);
    animation-duration: 20s, 25s, 15s;
  }
  
  .music-album-cover::before {
    /* Reduce glow effect on mobile */
    filter: blur(15px);
    opacity: 0.4;
  }
}

/* Low-performance device optimizations */
@media (max-width: 768px) and (max-resolution: 1.5dppx) {
  .music-detail-content {
    background: linear-gradient(180deg, #020202 0%, #1a1a1a 50%, #020202 100%);
    animation: none;
  }
  
  .music-hero::before,
  .music-hero::after,
  .music-hero-overlay {
    animation: none !important;
    filter: blur(10px) !important;
  }
  
  .music-album-cover {
    animation: none !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
  }
  
  .music-album-cover::before,
  .music-album-cover::after {
    display: none !important;
  }
}

/* Modal specific optimizations */
.music-detail-content:has(.music-hero) { 
  min-height: auto; 
}

/* Container optimization for better scrolling performance */
.music-detail-content {
  /* Removed 'contain: layout style paint' as it breaks fixed positioning for child elements */
  content-visibility: auto;
}

/* While modal is animating, kill inner animations and filters for max FPS */
:global(body.modal-open) .music-detail-content.modal-mode,
:global(body.modal-open) .music-detail-content.modal-mode *,
:global(body.modal-open) .music-detail-content.modal-mode *::before,
:global(body.modal-open) .music-detail-content.modal-mode *::after {
  animation: none !important;
  transition: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Exception: Keep back button transitions working */
:global(body.modal-open) .back-glass-btn {
  transition: background 0.25s, box-shadow 0.25s, opacity 0.45s cubic-bezier(.4,0,.2,1) !important;
}

/* Hard drop of effects only during the short modal transition window */
:global(body.modal-animating) .music-detail-content.modal-mode,
:global(body.modal-animating) .music-detail-content.modal-mode *,
:global(body.modal-animating) .music-detail-content.modal-mode *::before,
:global(body.modal-animating) .music-detail-content.modal-mode *::after {
  animation: none !important;
  transition: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Exception: Keep back button transitions working during animation */
:global(body.modal-animating) .back-glass-btn {
  transition: background 0.25s, box-shadow 0.25s, opacity 0.45s cubic-bezier(.4,0,.2,1) !important;
}

/* Restore normal optimized modal styles after animation ends (handled automatically once body class is removed) */

/* In modal mode, make image reveal extremely light */
.modal-mode .progressive-image {
  transition: opacity 0.18s ease-out !important;
  transform: none !important; /* avoid scale jank */
}
.modal-mode .progressive-image-container .gradient-placeholder { 
  display: none !important; 
}

/* Platform buttons uniform sizing */
.platforms-grid {
  /* Ensure grid items stretch to fill available space */
  align-items: stretch;
}

.platform-button-wrapper {
  /* Ensure consistent button container dimensions */
  display: flex;
  align-items: stretch;
}

/* Make sure the platform buttons fill their containers uniformly */
.platform-button-wrapper :deep(.platform-button) {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 80px !important;
  flex: 1 !important;
}

/* Ensure consistent content layout within buttons */
.platform-button-wrapper :deep(.platform-content) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  min-width: 0 !important;
}

/* Center platform icons within their containers */
.platform-button-wrapper :deep(.platform-icon) {
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Center platform arrow icons */
.platform-button-wrapper :deep(.platform-arrow) {
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Responsive adjustments for mobile devices */
@media (max-width: 640px) {
  .platform-button-wrapper {
    min-height: 70px;
  }
  
  .platform-button-wrapper :deep(.platform-button) {
    min-height: 70px !important;
  }
}
</style>
