
<template>
  <div
    class="music-detail-content min-h-screen text-primary-50 font-space-grotesk bg-surface-950 relative"
    :style="accentVars"
  >
    <!-- Back Button (only on page, not modal, and with proper URL param) -->
    <button
      v-if="!isModal && shouldShowBackButton"
      @click="handleBack"
      :class="['back-glass-btn', { 'back-glass-btn--transparent': backBtnTransparent }]"
      aria-label="Back to music section"
    >
      <i class="pi pi-arrow-left text-xl"></i>
    </button>
    <!-- Hero Section with Album Cover -->
    <section :class="['music-hero flex items-center justify-center relative overflow-hidden', {
      'py-4 px-4 md:py-16 md:px-8': !isHeroExpanded && !isDesktop,
      'py-16 px-4 md:px-8': isHeroExpanded || isDesktop
    }]">
      <div class="music-hero-background absolute inset-0 z-0">
        <div class="music-hero-overlay"></div>
      </div>
      
      <!-- Mobile Compact Hero (default state on mobile) -->
      <div 
        v-if="!isHeroExpanded" 
        class="md:hidden w-full max-w-5xl z-10 cursor-pointer transform transition-all duration-400 ease-out hover:scale-[1.02] animate-slideInCompact"
        @click="toggleHeroExpansion"
      >
        <div class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-400 ease-out hover:bg-white/8 hover:border-white/15 hover:shadow-lg">
          <!-- Small Album Cover -->
          <div class="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
            <UiProgressiveImage
              :src="release.imageUrl"
              :alt="release.title"
              container-class="w-full h-full"
              image-class="w-full h-full object-cover object-center"
              loading="eager"
              preset="album"
              :show-placeholder="true"
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
        <div class="music-album-cover relative w-44 h-44 md:w-72 md:h-72 flex-shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <UiProgressiveImage
            :src="release.imageUrl"
            :alt="release.title"
            container-class="w-full h-full"
            image-class="w-full h-full object-cover"
            loading="eager"
            preset="album"
            :show-placeholder="true"
          />
          <!-- Release Type Badge -->
          <div class="music-badge absolute top-4 left-4 z-10">
            <span :class="badgeClass" class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/25 shadow-md">
              {{ release.type }}
            </span>
          </div>
        </div>
        <div class="music-info flex-1 min-w-0 text-center md:text-left">
          <!-- Mobile Collapse Button -->
          <div class="md:hidden mb-3 flex justify-center">
            <button 
              @click="toggleHeroExpansion"
              class="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-primary-200 text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <i class="pi pi-chevron-up text-sm"></i>
              <span>Collapse</span>
            </button>
          </div>
          
          <h1 class="music-title text-4xl md:text-6xl font-extrabold leading-tight mb-3 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-lg animate-titleGlow">
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
        <div class="platforms-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <MusicPlatformButton
            v-for="(url, platform) in availablePlatforms"
            :key="platform"
            :platform="platform"
            :url="url"
          />
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

interface Props {
  release: MusicRelease
  isModal?: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

// Check if back button should be visible based on URL parameters
const shouldShowBackButton = computed(() => {
  return route.query.from === 'music'
})

// Responsive breakpoint detection
const isDesktop = ref(false)
const updateBreakpoint = () => {
  isDesktop.value = window.innerWidth >= 768 // md breakpoint
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
  // Initialize breakpoint
  updateBreakpoint()
  
  // Scroll handler for back button
  scrollHandler = () => {
    backBtnTransparent.value = window.scrollY > 60
  }
  
  // Resize handler for responsive breakpoint
  resizeHandler = updateBreakpoint
  
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
const { scrollToElement } = useScrollTo()
const handleBack = async () => {
  await router.push('/')
  setTimeout(() => {
    scrollToElement('music')
  }, 100)
}
</script>

<style scoped>
/* Glassmorphic back button styles */
.back-glass-btn {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 30;
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
}
.back-glass-btn:hover {
  background: rgba(60, 60, 80, 0.44);
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.22), 0 2px 8px 0 rgba(0,0,0,0.13);
}
.back-glass-btn--transparent {
  opacity: 0;
  pointer-events: none;
}

.music-detail-content {
  position: relative;
  min-height: 100vh;
  color: white;
  /* Subtle deep-space grainy base with animated gradients */
  background:
    radial-gradient(1200px 600px at 10% 110%, rgba(120,119,198,0.10), transparent 60%),
    radial-gradient(900px 500px at 110% -10%, rgba(255,119,198,0.10), transparent 60%),
    linear-gradient(#020202, #030303);
  /* Smooth gradient animation */
  background-size: 150% 150%, 120% 120%, 100% 100%;
  animation: gradientFlow 25s ease-in-out infinite alternate;
}

/* Global grain overlay - simplified */
.music-detail-content::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .06;
  mix-blend-mode: overlay;
  background: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,.08) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 100px 100px, 150px 150px;
  z-index: 1;
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

/* Animated aurora and vignette layers */
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

/* Album cover with glow ring + sheen */
.music-album-cover {
  position: relative;
  width: 300px;
  height: 300px;
  flex-shrink: 0;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(22px) saturate(120%);
  -webkit-backdrop-filter: blur(22px) saturate(120%);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  animation: float 6s ease-in-out infinite;
}

.music-album-cover::before {
  content: '';
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255,255,255,.15), rgba(255,255,255,0) 60%);
  filter: blur(30px);
  opacity: .6;
}

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
  transition: opacity .4s ease, transform .6s ease;
}

.music-album-cover:hover::after {
  opacity: .7;
  transform: rotate(8deg) translateY(10%);
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

/* Mobile hero expand animation */
.animate-fadeInUpSmooth {
  animation: fadeInUpSmooth 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fadeOutDown {
  animation: fadeOutDown 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
}

.animate-slideInCompact {
  animation: slideInCompact 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
    filter: blur(0);
  }
  100% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    filter: blur(2px);
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

/* Platforms Section background/animation remains in CSS for unique effects */

/* Motion + effects */
@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
@keyframes auroraShift { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(-2%, 2%, 0) scale(1.06); } }

/* Background gradient animations */
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

/* Mobile Responsive handled by Tailwind classes */

/* Modal specific adjustments */
.music-detail-content:has(.music-hero) { min-height: auto; }
</style>
