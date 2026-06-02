<template>
  <div
    class="music-detail-content flex flex-col min-h-screen text-primary-50 font-space-grotesk bg-surface-950 relative"
    :class="[
      performanceClass,
      ...(!isModal ? atmosphereClass : []),
      {
        'modal-mode': isModal
      }
    ]"
    :style="{ ...themeVars, ...performanceCSSVars }"
  >
    <!-- Back/Share Buttons (only on page, not modal) -->
    <!-- Teleport to body to avoid ancestor transforms/containment breaking fixed positioning -->
    <Teleport to="body">
      <div v-if="!isModal" class="floating-controls">
        <button
          :class="[
            'back-glass-btn',
            {
              'back-glass-btn--transparent': backBtnTransparent,
              'back-glass-btn--optimized': shouldUseMobileFallback
            }
          ]"
          :aria-label="
            shouldShowBackArrow ? t('music.a11y.back_to_section') : t('music.a11y.go_to_library')
          "
          @click="handleBack"
        >
          <i v-if="shouldShowBackArrow" class="pi pi-arrow-left text-xl"></i>
          <i v-else class="fa-solid fa-home text-lg"></i>
        </button>

        <!-- Logo and Share button only on mobile -->
        <template v-if="!isDesktop && isClient">
          <!-- Logo in the center (mobile only) -->
          <div class="floating-logo" :class="{ 'floating-logo--transparent': backBtnTransparent }">
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
            :class="[
              'share-glass-btn',
              {
                'share-glass-btn--transparent': backBtnTransparent,
                'share-glass-btn--optimized': shouldUseMobileFallback
              }
            ]"
            :aria-label="t('music.a11y.share_release')"
            @click="handleShare"
          >
            <i class="pi pi-share-alt text-xl"></i>
          </button>
        </template>
      </div>
    </Teleport>

    <!--
      Cover-driven "Ambient Bloom" atmosphere — bathes the whole page in the
      artwork's colours. Layers (cheap → expensive):
        • atmo-aura  : static palette-gradient mesh (all devices, GPU-cheap)
        • atmo-bloom : blurred cover image (high-perf DESKTOP only — see CSS)
        • atmo-veil  : transparent vignette for text contrast (all devices)
      Hidden entirely in modal mode (the modal keeps its flat background).
    -->
    <div v-if="!isModal" class="release-atmosphere" aria-hidden="true">
      <div class="atmo-aura"></div>
      <div class="atmo-bloom"></div>
      <div class="atmo-veil"></div>
      <!-- Liquid-distortion filter: only emitted for the bespoke 'liquid' variant. -->
      <svg
        v-if="isLiquid"
        class="atmo-liquid-defs"
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
      >
        <filter id="release-liquid-distort" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.01" numOctaves="2" seed="4">
            <animate
              attributeName="baseFrequency"
              dur="28s"
              values="0.006 0.01; 0.012 0.016; 0.006 0.01"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            scale="60"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>

    <!-- Hero Section with Album Cover -->
    <section
      :class="[
        'music-hero flex flex-col items-center justify-center relative overflow-hidden',
        {
          'pt-20 pb-4 px-4 md:py-16 md:px-8': !isHeroExpanded && !isDesktop && !isModal,
          'py-4 px-4': !isHeroExpanded && !isDesktop && isModal,
          'pt-16 pb-8 px-4 md:px-8': isHeroExpanded || isDesktop,
          'modal-hero': isModal
        }
      ]"
    >
      <div
        class="music-hero-background absolute inset-0 z-0"
        :class="{
          'modal-bg': isModal
        }"
      >
        <div
          class="music-hero-overlay"
          :class="{
            'modal-overlay': isModal
          }"
        ></div>
      </div>

      <!-- Mobile Compact Hero (default state on mobile) -->
      <div
        v-if="!isHeroExpanded"
        class="md:hidden w-full max-w-5xl z-10 cursor-pointer transform transition-all duration-400 ease-out md:hover:scale-[1.02] animate-slideInCompact"
        @click="toggleHeroExpansion"
      >
        <div
          class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-400 ease-out hover:bg-white/8 hover:border-white/15 hover:shadow-lg md:hover:bg-white/8 md:hover:border-white/15 md:hover:shadow-lg"
        >
          <!-- Small Album Cover -->
          <div
            class="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg"
            style="min-width: 64px; min-height: 64px; aspect-ratio: 1"
          >
            <UiProgressiveImage
              :src="release.imageUrl"
              :alt="displayTitle"
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
          </div>

          <!-- Compact Info -->
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-bold text-primary-50 mb-[2px] truncate">{{ displayTitle }}</h1>
            <p class="text-sm text-primary-200 opacity-70 font-base leading-[1.2]">
              <span class="inline-flex mr-1">
                <span>{{ compactInfoPrimary }}</span>
                <span v-if="showCompactDate" class="whitespace-nowrap">
                  <span aria-hidden="true" class="mx-1.5">·</span>
                  <span>{{ formattedReleaseDate }}</span>
                </span>
              </span>
              <span v-if="preSaveCountdownText" class="whitespace-nowrap">
                <span class="text-[0.8rem] text-primary-200 opacity-80"
                  >({{ preSaveCountdownText }})</span
                >
              </span>
            </p>
          </div>

          <!-- Expand Icon -->
          <div class="flex-shrink-0">
            <i
              class="pi pi-chevron-down text-primary-200 text-lg transition-all duration-300 ease-out"
            ></i>
          </div>
        </div>
      </div>

      <!-- Full Hero (desktop always, mobile when expanded) -->
      <div
        :class="[
          'music-hero-content flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl w-full z-10 transition-all duration-500 ease-out transform',
          {
            'animate-fadeInUpSmooth': isHeroExpanded && !isDesktop && isClient,
            'animate-fadeOutDown': !isHeroExpanded && !isDesktop && isClient,
            'mobile-expanded': isHeroExpanded && !isDesktop
          }
        ]"
        :style="{
          display: !isDesktop && !isHeroExpanded && (isClient || isHydrating) ? 'none' : ''
        }"
      >
        <div
          class="music-album-cover relative w-44 h-44 md:w-72 md:h-72 flex-shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl"
          :class="{
            'modal-cover': isModal
          }"
        >
          <UiProgressiveImage
            :src="release.imageUrl"
            :alt="displayTitle"
            container-class="w-full h-full"
            image-class="w-full h-full object-cover"
            loading="eager"
            fetch-priority="high"
            :show-placeholder="!isModal"
            :width="isDesktop ? 288 : 176"
            :height="isDesktop ? 288 : 176"
            sizes="(min-width: 768px) 288px, 176px"
            preset="album"
          />
          <!-- Release Type Badge -->
          <div class="music-badge absolute top-4 left-4 z-10">
            <UiAppBadge :variant="badgeVariant">
              {{
                isPreSave ? t('music.presave.card_title_fallback').toUpperCase() : displayTypeName
              }}
            </UiAppBadge>
          </div>
        </div>
        <div class="music-info flex-1 min-w-0 text-center md:text-left">
          <!-- Mobile Collapse Button -->
          <div class="md:hidden mb-3 flex justify-center">
            <button
              class="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-primary-200 text-sm font-medium transition-all duration-300 md:hover:bg-white/20 md:hover:scale-105"
              @click="toggleHeroExpansion"
            >
              <i class="pi pi-chevron-up text-sm"></i>
              <span>{{ collapseLabel }}</span>
            </button>
          </div>

          <h1
            class="music-title text-4xl md:text-6xl font-extrabold leading-tight mb-3 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-lg"
            :class="{ 'animate-titleGlow': isHighPerformanceDevice }"
          >
            {{ displayTitle }}
          </h1>
          <p class="music-date text-primary-200 text-sm md:text-lg font-medium">
            {{ heroDateText }}
          </p>
          <p
            v-if="preSaveCountdownText"
            class="music-countdown text-primary-200 opacity-70 text-xs md:text-sm font-normal tracking-[0.06em] mt-0.5 pb-1"
          >
            ({{ preSaveCountdownText }})
          </p>
          <p
            v-if="displayDescription"
            class="music-description text-primary-100 text-base md:text-lg max-w-xl mx-auto md:mx-0 mt-2 mb-4"
          >
            {{ displayDescription }}
          </p>

          <!-- Desktop Share Button -->
          <div v-if="isDesktop && isClient" class="desktop-share-button mt-6">
            <Button
              id="desktop-share-button"
              class="btn-glassmorphic"
              :class="{ 'btn-glassmorphic--optimized': shouldUseMobileFallback }"
              :aria-label="t('music.a11y.share_release')"
              unstyled
              :pt="{ ripple: { style: 'display: none !important' } }"
              @click="showDesktopSharePopup"
            >
              <i class="pi pi-share-alt"></i>
              <span>{{ t('music.buttons.share') }}</span>
            </Button>
          </div>
        </div>
      </div>
      <!-- Mobile/tablet quick actions under the hero header: optional Music
           Video + Lyrics. Kept INSIDE .music-hero so they sit on the hero's
           darkened background (no seam against the page). Always rendered <md
           (md:hidden) so the music video stays reachable whether the hero is
           collapsed or expanded — it is removed from the platform grid below at
           this breakpoint, while desktop keeps it in the grid and hides this row. -->
      <div
        v-if="!isModal && showHeroActions"
        class="hero-quick-actions md:hidden relative z-10 mt-3 flex w-full max-w-[500px] mx-auto items-center gap-3"
      >
        <a
          v-if="musicVideoUrl"
          :href="musicVideoUrl"
          target="_blank"
          rel="noopener noreferrer"
          :class="[heroPillClass, { 'flex-1 justify-center': bothActions }]"
          :aria-label="t('music.buttons.watch_video')"
          @click="handleMusicVideoClick"
        >
          <i class="pi pi-play-circle text-base" aria-hidden="true"></i>
          <span>{{ t('music.buttons.music_video') }}</span>
        </a>
        <!-- Lyrics: visual placeholder for now — behaviour wired up later.
             ml-auto pins it to the right edge (and right-aligns it when it is the
             only button). Label swaps short↔long at 440px via UiResponsiveText
             (always, whether paired or alone). -->
        <button
          v-if="lyricsAvailable"
          type="button"
          :class="[heroPillClass, bothActions ? 'flex-1 justify-center' : 'ml-auto']"
        >
          <i class="pi pi-align-left text-base" aria-hidden="true"></i>
          <UiResponsiveText
            :narrow="t('music.buttons.lyrics')"
            :wide="t('music.buttons.song_lyrics')"
            :breakpoint="440"
          />
        </button>
      </div>
    </section>

    <!-- Custom Share Popup for Desktop -->
    <CustomSharePopup
      :visible="showSharePopup"
      :share-text="shareContent.displayText"
      :share-url="shareContent.url"
      :target-element="shareButtonElement"
      @close="hideSharePopup"
    />

    <!-- Music Platform Links -->
    <section
      class="music-platforms flex-1 relative z-10 py-6 sm:pb-16 px-4 md:px-8 bg-gradient-to-b from-surface-900/70 to-surface-950/60"
    >
      <div class="platforms-container max-w-3xl mx-auto rounded-xl">
        <h2
          class="platforms-title text-center text-2xl md:text-3xl font-extrabold mb-6 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-md"
        >
          {{ listenNowTitle }}
        </h2>
        <div
          class="platforms-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-stretch"
        >
          <div
            v-for="(url, platform) in availablePlatforms"
            :key="platform"
            class="platform-button-wrapper w-full h-full min-h-[110px] flex"
            :class="{ 'max-md:!hidden': platform === 'musicVideo' }"
          >
            <MusicPlatformButton
              :platform="platform"
              :url="url"
              :is-pre-save="isPreSave"
              :release-slug="release.slug"
              :page-type="pageType"
              class="w-full h-full flex-1"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import Button from 'primevue/button'
  import { useScrollTo } from '~/composables/useScrollTo'
  import { usePerformanceOptimization } from '~/composables/usePerformanceOptimization'
  import { useOptimizedScroll } from '~/composables/useOptimizedScroll'
  import { useShareFunctionality } from '~/composables/useShareFunctionality'
  import { useReleaseTheme } from '~/composables/useReleaseTheme'
  import { useAnalytics } from '~/composables/useAnalytics'
  import { getLocalizedCountdown } from '~/utils/countdown'
  import type { MusicRelease } from '~/data/musicLibrary'
  import Logo from '~/components/ui/Logo.vue'
  import CustomSharePopup from '~/components/common/CustomSharePopup.vue'
  import { useLocalePath } from '#i18n'
  import { useI18n } from 'vue-i18n'

  interface Props {
    release: MusicRelease
    isModal?: boolean
    isPreSave?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isModal: false,
    isPreSave: false
  })
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()
  // Use global composer to avoid per-component instances and keep SSR/CSR consistent
  const { t, locale } = useI18n({ useScope: 'global' })

  // Performance optimization system
  const {
    isLowPerformanceDevice,
    isMediumPerformanceDevice,
    isHighPerformanceDevice,
    shouldReduceAnimations,
    isMobileFlagship,
    shouldUseMobileFallback,
    performanceCSSVars,
    getPerformanceClass
  } = usePerformanceOptimization()

  const performanceClass = computed(() => getPerformanceClass())
  const pageType = computed<'listen' | 'pre-save'>(() => (props.isPreSave ? 'pre-save' : 'listen'))

  // Mobile/tablet hero quick-actions (Music Video + Lyrics pills).
  const { trackPlatformClick } = useAnalytics()

  // Optional Music Video pill — only on the released listen page (pre-save mode
  // uses preSave links, which never include a music video). On <md it stands in
  // for the music-video cell that is removed from the platform grid there.
  const musicVideoUrl = computed(() =>
    props.isPreSave ? '' : props.release?.musicPlatformLinks?.musicVideo || ''
  )

  const handleMusicVideoClick = () => {
    if (!props.release?.slug) return
    trackPlatformClick({
      platformName: 'musicVideo',
      releaseSlug: props.release.slug,
      pageType: pageType.value
    })
  }

  // Lyrics button is a placeholder (no behaviour yet) and is always shown for
  // now. When it becomes data-driven, gate `lyricsAvailable` and the whole row
  // collapses cleanly (no leftover margin) when neither action is present.
  const lyricsAvailable = ref(true)
  const showHeroActions = computed(() => Boolean(musicVideoUrl.value) || lyricsAvailable.value)
  // With both pills present they grow to share the row equally; a lone pill
  // keeps its natural content width (left for video, right for lyrics).
  const bothActions = computed(() => Boolean(musicVideoUrl.value) && lyricsAvailable.value)

  // Shared glass-pill styling. Tailwind `hover:` is auto-wrapped in
  // `@supports (hover: hover)` (tailwind.config.js → hoverOnlyWhenSupported), so
  // the hover never sticks after a tap on touch devices.
  const heroPillClass =
    'inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1 text-sm font-medium text-primary-200/55 bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-100 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-[0.98] active:bg-white/15 active:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25'

  // Optimized scroll handling
  const { isScrolled } = useOptimizedScroll({ threshold: 60 })

  // Share functionality
  const { getShareContent, shareViaMobile, copyToClipboard } = useShareFunctionality()

  // Translation keys for the current release
  const releaseTitleKey = computed(
    () => props.release.titleKey || `releases.${props.release.slug}.title`
  )
  const countdownText = ref('')
  const preSaveCountdownText = computed(() => countdownText.value)
  const formattedReleaseDate = computed(() =>
    formatDate(props.release.releaseDate, { includeYear: !props.isPreSave })
  )

  const displayTypeName = computed(() => {
    const key = (props.release.type || '').toString().toLowerCase().replace(/\s+/g, '_')
    const i18nKey = `music.types.${key}`
    const label = t(i18nKey) as string
    if (label !== i18nKey) return label
    const loc = locale.value === 'ua' ? 'ua' : 'en'
    const map: Record<string, Record<string, string>> = {
      en: { single: 'Single', album: 'Album', ep: 'EP', new_release: 'New Release' },
      ua: { single: 'Сингл', album: 'Альбом', ep: 'EP', new_release: 'Новий реліз' }
    }
    return map[loc][key] || (props.release.type || '').toString()
  })

  const releaseDateLabel = computed(() => {
    if (!props.isPreSave) return formattedReleaseDate.value
    const key = 'music.detail.release_label'
    const translated = t(key, { date: formattedReleaseDate.value }) as string
    if (translated !== key) return translated
    const fallback =
      locale.value === 'ua'
        ? `Реліз ${formattedReleaseDate.value}`
        : `Release ${formattedReleaseDate.value}`
    return fallback
  })

  const compactInfoPrimary = computed(() => {
    if (props.isPreSave) return releaseDateLabel.value
    return displayTypeName.value
  })

  const showCompactDate = computed(() => !props.isPreSave)

  const heroDateText = computed(() => releaseDateLabel.value)

  const updateCountdown = () => {
    if (!import.meta.client) return
    if (!props.isPreSave) {
      countdownText.value = ''
      return
    }

    const text = getLocalizedCountdown({
      releaseDate: props.release.releaseDate,
      locale: locale.value,
      t
    })

    countdownText.value = text
  }

  watch(
    () => locale.value,
    () => updateCountdown()
  )
  watch(
    () => props.release.releaseDate,
    () => updateCountdown()
  )
  watch(
    () => props.isPreSave,
    () => updateCountdown()
  )

  // Custom share popup state
  const showSharePopup = ref(false)
  const shareButtonElement = ref<HTMLElement>()
  const shareUrlInput = ref<HTMLInputElement>()
  const justCopied = ref(false)
  const isCopying = ref(false)

  // Build clean share URL without language prefix and protocol
  const shareUrlForRelease = computed(() => {
    // Use appropriate path based on pre-save mode
    const pathPrefix = props.isPreSave ? '/pre-save/' : '/listen/'
    // Build path without locale prefix
    const path = `${pathPrefix}${props.release.slug}`
    const relative = resolveUrl(path)

    if (typeof window !== 'undefined') {
      // Return full URL with protocol to avoid concatenation issues
      return new URL(relative, window.location.origin).toString()
    }
    // For SSR, return relative path (will be converted to full URL on client)
    return relative
  })

  // Computed share content – use appropriate text for pre-save vs regular
  const shareContent = computed(() => {
    const cleanUrl = shareUrlForRelease.value
    const fallbackTitle = props.release.title || props.release.slug
    const translatedTitle = t(releaseTitleKey.value) as string
    const title =
      translatedTitle !== releaseTitleKey.value && translatedTitle ? translatedTitle : fallbackTitle

    // Use localized share text
    const key = props.isPreSave ? 'music.share_popup.presave' : 'music.share_popup.check_out'
    const displayText = t(key, { title }) as string
    const shareMessage = `${displayText}\n\n${cleanUrl}`

    return {
      title,
      text: shareMessage,
      url: cleanUrl,
      displayText
    }
  })

  // Check if back button should show back arrow or music library icon
  // Lock decision on first render to avoid flicker when query params change
  const shouldShowBackArrow = ref(route.query.from === 'music')

  // Track if we're on client side to avoid SSR hydration issues
  const isClient = ref(false)
  // Keep SSR fallbacks during hydration to prevent mismatches; switch to translations after mount
  const isHydrating = ref(true)

  // Responsive breakpoint detection - start with a safe default
  const isDesktop = ref(false)
  const updateBreakpoint = () => {
    if (typeof window !== 'undefined') {
      isDesktop.value = window.innerWidth >= 768 // md breakpoint
    }
  }

  // Mobile hero expansion state (default collapsed on mobile)
  const isHeroExpanded = ref(false)
  const toggleHeroExpansion = () => {
    isHeroExpanded.value = !isHeroExpanded.value
  }

  // Optimized back button transparency based on scroll
  const backBtnTransparent = computed(() => isScrolled.value)
  onMounted(() => {
    // Mark as client-side and update breakpoint immediately
    isClient.value = true
    updateBreakpoint()
    // Hydration finished; allow switching to localized strings without triggering hydration warnings
    isHydrating.value = false
    updateCountdown()

    // Resize handler for responsive breakpoint (debounced)
    let resizeTimeout: NodeJS.Timeout
    const resizeHandler = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        updateBreakpoint()
      }, 150)
    }

    window.addEventListener('resize', resizeHandler, { passive: true })

    // Cleanup function
    onBeforeUnmount(() => {
      window.removeEventListener('resize', resizeHandler)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    })
  })

  // Cover-driven release theme: resolves an override → auto-extracted palette →
  // hash fallback, and emits the CSS variables that paint the Ambient Bloom
  // atmosphere. Replaces the old slug-hash accent guess with the real artwork
  // colours. (The expensive photographic layer is gated to high-perf desktop in
  // CSS; mobile/low tiers get the cheap palette-gradient mesh only.)
  const { themeVars, atmosphereClass, variant } = useReleaseTheme(() => props.release)
  const isLiquid = computed(() => variant.value === 'liquid')

  const availablePlatforms = computed(() => {
    const platforms: Record<string, string> = {}
    // Use pre-save links if in pre-save mode, otherwise use regular music platform links
    const linkSource =
      props.isPreSave && props.release.preSaveMusicPlatformLinks
        ? props.release.preSaveMusicPlatformLinks
        : props.release.musicPlatformLinks

    const orderedPlatforms: Record<string, string> = {}
    const priorityOrder = ['spotify', 'youtubeMusic', 'appleMusic', 'musicVideo']

    // Add priority platforms first
    priorityOrder.forEach((platform) => {
      if (platform in linkSource && linkSource[platform as keyof typeof linkSource]) {
        orderedPlatforms[platform] = linkSource[platform as keyof typeof linkSource] as string
      }
    })

    // Add remaining platforms
    Object.entries(linkSource).forEach(([platform, url]) => {
      if (!priorityOrder.includes(platform) && url) {
        orderedPlatforms[platform] = url
      }
    })

    return orderedPlatforms
  })

  const badgeVariant = computed(() => {
    if (props.isPreSave) return 'presave'
    const type = props.release.type.toLowerCase()
    if (type === 'single') return 'single'
    if (type === 'album') return 'album'
    if (type === 'ep') return 'ep'
    return 'glass'
  })

  const releaseDescriptionKey = computed(
    () => props.release.descriptionKey || `releases.${props.release.slug}.description`
  )

  // Localized title/description from locales.releases[slug]
  // Hydration-aware: keep SSR fallbacks during hydration to avoid mismatches
  const displayTitle = computed(() => {
    const ssrFallback = props.release.title || props.release.slug
    if (isHydrating.value) return ssrFallback
    const translated = t(releaseTitleKey.value) as string
    return translated !== releaseTitleKey.value ? translated : ssrFallback
  })

  const displayDescription = computed(() => {
    const ssrFallback = props.release.description
    if (isHydrating.value) return ssrFallback
    const translated = t(releaseDescriptionKey.value) as string
    if (translated !== releaseDescriptionKey.value && translated) return translated
    return ssrFallback
  })

  function formatDate(
    dateString: string | undefined,
    options: { includeYear?: boolean } = {}
  ): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    const currentLocale = locale.value === 'ua' ? 'uk-UA' : 'en-US'
    const includeYear = options.includeYear !== false
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      // Release times are authored in Kyiv time, so display the date in that
      // fixed zone (e.g. 2026-06-11T21:00Z = 00:00 Kyiv → "12 June", not "11").
      // A fixed zone also keeps SSR and client renders identical.
      timeZone: 'Europe/Kyiv'
    }

    if (includeYear) {
      formatOptions.year = 'numeric'
    }

    return date.toLocaleDateString(currentLocale, formatOptions)
  }

  // Localized display name for release type
  // Deterministic labels for section titles/buttons to avoid SSR key rendering
  const listenNowTitle = computed(() => {
    if (props.isPreSave) {
      return t('music.detail.presave_title')
    }
    return t('music.detail.listen_now_title')
  })

  const collapseLabel = computed(() => {
    return t('music.buttons.collapse')
  })

  // Build a robust fallback URL for CSS backgrounds (prefer JPG)
  const { resolveUrl } = useAssetUrl()
  const bgCoverUrl = computed(() => {
    const raw = props.release.imageUrl || ''
    let path = raw
    if (raw.includes('/images/optimized/')) {
      path = raw.replace(/\.(avif|webp|png)$/, '.jpg')
    } else if (raw.startsWith('/images/')) {
      path = raw.replace('/images/', '/images/optimized/').replace(/\.(avif|webp|png|jpg)$/, '.jpg')
    }

    return resolveUrl(path)
  })

  // Back button handler: go to / and scroll to music section, or just go to music library
  const { scrollToElementWithNavigation } = useScrollTo()
  const handleBack = async () => {
    if (shouldShowBackArrow.value) {
      // If came from music section, go back to home and scroll to music
      await router.push('/')
      setTimeout(() => {
        scrollToElementWithNavigation('music')
      }, 100)
    } else {
      // If no specific origin, go to music library/home
      await router.push('/')
      setTimeout(() => {
        scrollToElementWithNavigation('music')
      }, 100)
    }
  }

  // Logo click handler: scroll to hero section
  const scrollToHero = () => {
    scrollToElementWithNavigation('hero')
  }

  // Share functionality - Mobile share handler (uses Web Share API)
  const handleShare = async () => {
    await shareViaMobile({
      title: shareContent.value.title,
      url: shareUrlForRelease.value
    })
  }

  // Desktop share popup functions
  const showDesktopSharePopup = (event: Event) => {
    const targetElement = event.currentTarget as HTMLElement
    shareButtonElement.value = targetElement
    showSharePopup.value = true
  }

  const hideSharePopup = () => {
    showSharePopup.value = false
  }

  const selectAllShareText = async () => {
    await nextTick()
    if (shareUrlInput.value) {
      shareUrlInput.value.select()
    }
  }

  const handleCopyToClipboard = async () => {
    if (isCopying.value) return

    isCopying.value = true
    const success = await copyToClipboard(shareContent.value.url)

    if (success) {
      justCopied.value = true
      setTimeout(() => {
        justCopied.value = false
      }, 2000)
    }

    isCopying.value = false
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

  /* On desktop, only show back button on left */
  @media (min-width: 768px) {
    .floating-controls {
      justify-content: flex-start; /* Align back button to left only */
    }
  }

  .floating-controls .back-glass-btn,
  .floating-controls .share-glass-btn {
    pointer-events: auto;
    position: static !important; /* override fixed when inside container */
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
  }

  /* Floating logo in the center */
  .floating-logo {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: auto;
    z-index: 10;
    transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 1;
  }

  /* Hide mobile elements on desktop as CSS safeguard */
  @media (min-width: 768px) {
    .floating-logo {
      display: none !important;
    }
  }

  .floating-logo--transparent {
    opacity: 0.2;
    pointer-events: none;
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

  /* Hover only on devices that support it — the floating logo is shown on
     mobile, so an unguarded :hover would stick after a tap. */
  @media (hover: hover) and (pointer: fine) {
    .logo-button:hover {
      transform: scale(1.05);
    }
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
    transition:
      height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      margin-top 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
    box-shadow:
      0 4px 24px 0 rgba(0, 0, 0, 0.18),
      0 1.5px 6px 0 rgba(0, 0, 0, 0.1);
    border: 1.5px solid rgba(255, 255, 255, 0.13);
    backdrop-filter: blur(var(--perf-blur-strength, 12px));
    -webkit-backdrop-filter: blur(var(--perf-blur-strength, 12px));
    color: #fff;
    transition:
      background 0.25s,
      box-shadow 0.25s,
      opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 1;
    cursor: pointer;
    /* Ensure it creates its own stacking context */
    isolation: isolate;
  }

  /* Optimized version for low-performance devices */
  .back-glass-btn--optimized,
  .share-glass-btn--optimized {
    background: rgba(30, 30, 40, 0.85);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
  }

  /* When not in container, keep back on left and share on right */
  .share-glass-btn {
    left: auto;
    right: 1rem;
  }

  /* Hide mobile share button on desktop as CSS safeguard */
  @media (min-width: 768px) {
    .share-glass-btn {
      display: none !important;
    }
  }

  .back-glass-btn:hover,
  .share-glass-btn:hover {
    background: rgba(60, 60, 80, 0.44);
    box-shadow:
      0 8px 32px 0 rgba(0, 0, 0, 0.22),
      0 2px 8px 0 rgba(0, 0, 0, 0.13);
  }

  /* Optimized hover for low-performance devices */
  .back-glass-btn--optimized:hover,
  .share-glass-btn--optimized:hover {
    background: rgba(60, 60, 80, 0.9);
    transform: none;
  }

  /* Disable hover effects on mobile/touch devices */
  @media (hover: none) and (pointer: coarse) {
    .back-glass-btn:hover,
    .share-glass-btn:hover {
      background: rgba(30, 30, 40, 0.32);
      box-shadow:
        0 4px 24px 0 rgba(0, 0, 0, 0.18),
        0 1.5px 6px 0 rgba(0, 0, 0, 0.1);
      transform: none;
    }
  }

  .back-glass-btn--transparent {
    opacity: 0.2;
    pointer-events: none;
  }
  .share-glass-btn--transparent {
    opacity: 0.2;
    pointer-events: none;
  }

  /* Preserve transitions for buttons even while modal performance classes are active */
  :global(body.modal-open) .back-glass-btn,
  :global(body.modal-open) .share-glass-btn {
    transition:
      background 0.25s,
      box-shadow 0.25s,
      opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  :global(body.modal-animating) .back-glass-btn,
  :global(body.modal-animating) .share-glass-btn {
    transition:
      background 0.25s,
      box-shadow 0.25s,
      opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* Performance optimizations */
  .music-detail-content {
    position: relative;
    min-height: 600px;
    color: white;
    /* GPU acceleration for better performance */
    transform: translateZ(0);
    will-change: auto;

    /* Palette-driven near-black base; the cover colours live in the
       .release-atmosphere layers painted on top. Flat fill = no repaint cost. */
    background: var(--bloom-dark, #060606);
  }

  /* When used in a page context with flexbox, ensure it grows to fill space */
  .music-detail-content {
    flex: 1; /* This will make it expand to fill available space in flex container */
  }

  /* Motion now lives in the atmosphere layers, not the page base. */
  .music-detail-content.perf-high,
  .music-detail-content.perf-medium {
    animation: none;
  }

  /* Low performance devices get a plain dark base (no colour cast cost) */
  .music-detail-content.perf-low,
  .music-detail-content.simple-gradients {
    background: linear-gradient(180deg, #050505 0%, #0d0d0f 45%, #050505 100%);
    animation: none;
    background-attachment: initial;
  }

  /* =========================================================================
     Cover-driven "Ambient Bloom" atmosphere (whole page, behind all content)

     Performance budget — the cheap path is the default; the expensive path is
     opt-in for hardware that can afford it:
       • atmo-aura  → static radial-gradient palette mesh. EVERY device. No blur,
                      no image, ~4 gradients painted once. Drifts (transform) only
                      on high-perf DESKTOP.
       • atmo-bloom → blurred cover image. HIGH-PERF DESKTOP ONLY. The
                      background-image + blur live solely inside the media query
                      below, so phones and low/medium tiers never fetch the image
                      or run a blur filter at all.
       • atmo-veil  → static contrast gradients. EVERY device.
     All motion is transform-based, gated to perf-high, and killed by
     reduce-animations / prefers-reduced-motion.
     ========================================================================= */
  .release-atmosphere {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    /* Isolate paint + layout so the colour layers never invalidate content. */
    contain: layout paint;
  }

  .release-atmosphere > div {
    position: absolute;
    inset: 0;
  }

  /* --- Aura: palette mesh (all devices, GPU-cheap) ------------------------- */
  .atmo-aura {
    background:
      radial-gradient(46% 38% at 18% 16%, var(--bloom-primary, transparent), transparent 62%),
      radial-gradient(52% 44% at 84% 12%, var(--bloom-secondary, transparent), transparent 64%),
      radial-gradient(58% 50% at 72% 86%, var(--bloom-accent, transparent), transparent 66%),
      radial-gradient(72% 62% at 26% 94%, var(--bloom-primary, transparent), transparent 70%);
    opacity: calc(0.9 * var(--bloom-intensity, 1));
  }

  /* --- Bloom: blurred cover image (high-perf DESKTOP only) ----------------- */
  /* Default state carries no image and no filter — nothing to pay for. */
  .atmo-bloom {
    opacity: 0;
  }

  /* --- Veil: readability vignette (all devices) --------------------------- */
  .atmo-veil {
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, transparent 22%),
      linear-gradient(0deg, var(--bloom-dark, #060606) 1%, transparent 32%),
      radial-gradient(125% 82% at 50% 42%, transparent 44%, rgba(0, 0, 0, 0.46) 100%);
  }

  /* Muted (near-monochrome) covers: ease the mesh back so it reads intentional. */
  .atmo-muted .atmo-aura {
    opacity: calc(0.78 * var(--bloom-intensity, 1));
  }

  .atmo-liquid-defs {
    position: absolute;
    width: 0;
    height: 0;
  }

  /* The expensive layers + motion: high-perf, wide viewport only. */
  @media (min-width: 768px) {
    .perf-high .atmo-bloom {
      background-image: var(--bloom-image);
      background-size: cover;
      background-position: center;
      transform: scale(1.25) translateZ(0);
      filter: blur(56px) saturate(1.4) brightness(0.92);
      opacity: calc(0.5 * var(--bloom-intensity, 1));
    }

    .perf-high .atmo-aura {
      animation: atmoDrift 28s ease-in-out infinite alternate;
      will-change: transform;
    }

    /* Bespoke 'liquid' variant: flowing displacement instead of a still bloom. */
    .perf-high.atmo-variant-liquid .atmo-bloom {
      filter: url(#release-liquid-distort) blur(26px) saturate(1.45) brightness(0.92);
      transform: scale(1.35) translateZ(0);
      opacity: calc(0.5 * var(--bloom-intensity, 1));
    }
  }

  /* Hard stops for reduced motion / low tier. */
  .reduce-animations .atmo-aura,
  .reduce-animations .atmo-bloom {
    animation: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .atmo-aura,
    .atmo-bloom {
      animation: none !important;
    }
  }

  @keyframes atmoDrift {
    0% {
      transform: translate3d(0, 0, 0) scale(1.02);
    }
    100% {
      transform: translate3d(2.5%, -2%, 0) scale(1.08);
    }
  }

  /* The old hero aurora/vignette pseudo-layers are superseded by the page-wide
     atmosphere on real pages — disable them (this also REMOVES a blur that used
     to run on low-end mobile). Kept intact for the modal preview. */
  .music-detail-content:not(.modal-mode) .music-hero::before,
  .music-detail-content:not(.modal-mode) .music-hero::after {
    display: none;
  }

  /* Reduced animations override */
  .music-detail-content.reduce-animations {
    animation: none !important;
  }

  .music-detail-content.reduce-animations *,
  .music-detail-content.reduce-animations *::before,
  .music-detail-content.reduce-animations *::after {
    animation: none !important;
    transition: opacity 0.2s ease !important;
  }

  /* Simplified grain overlay for better performance (only on high-performance devices) */
  .perf-high .music-detail-content::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.04;
    mix-blend-mode: overlay;
    background:
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size:
      100px 100px,
      150px 150px;
    z-index: 0;
  }

  /* Disable grain overlay on medium and low performance */
  .perf-medium .music-detail-content::after,
  .perf-low .music-detail-content::after {
    display: none;
  }

  /* Container optimization for better scrolling performance */
  .music-detail-content {
    content-visibility: auto;
    contain: layout style;
  }

  /* Modal-specific optimizations for smooth animations */
  .music-detail-content.modal-mode {
    /* Simplified background for modals to reduce rendering load */
    background: linear-gradient(180deg, #020202 0%, #1a1a1a 50%, #020202 100%) !important;
    animation: none !important;
    /* Force compositing layer for smoother animations */
    transform: translateZ(0);
    will-change: auto;
    /* Optimize rendering performance */
    contain: layout style paint;
    /* Never skip-render the open modal body. The base rule sets
       `content-visibility: auto` (a scroll perf win on the full page), but with no
       contain-intrinsic-size the browser can report this element as 0 height while
       it's "skipped" — collapsing the modal to a thin line. The modal body is always
       fully visible when open, so the optimization only hurts here. */
    content-visibility: visible;
  }

  /* Modal mode: disable grain overlay completely */
  .music-detail-content.modal-mode::after {
    display: none;
  }

  /* Modal hero and background optimizations */
  .modal-hero .music-hero::before,
  .modal-hero .music-hero::after {
    animation: none !important;
    transform: none !important;
    filter: blur(15px) !important;
  }

  .modal-bg .music-hero::before,
  .modal-bg .music-hero::after {
    animation: none !important;
    transform: none !important;
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
    animation: none !important;
    backdrop-filter: blur(6px) !important;
    -webkit-backdrop-filter: blur(6px) !important;
    will-change: auto;
  }

  .modal-cover::before {
    filter: blur(10px) !important;
    opacity: 0.3 !important;
  }

  .modal-cover::after {
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

  .music-hero {
    /* Prevent layout shift by reserving minimum space */
    min-height: 200px;
  }

  /* Desktop hero section gets fixed height to prevent content shift */
  @media (min-width: 768px) {
    .music-hero {
      min-height: 400px;
    }
  }

  /* Performance-aware hero background */
  .music-hero::before {
    content: '';
    position: absolute;
    inset: -20%;
    background:
      radial-gradient(60% 80% at 10% 20%, var(--accent1), transparent 60%),
      radial-gradient(80% 60% at 90% 10%, var(--accent2), transparent 60%),
      conic-gradient(
        from 180deg at 50% 50%,
        rgba(255, 255, 255, 0.05),
        rgba(0, 0, 0, 0) 20% 80%,
        rgba(255, 255, 255, 0.05)
      );
    filter: blur(40px) saturate(110%);
    background-size:
      200% 200%,
      180% 180%,
      150% 150%;
    z-index: 1;
    will-change: auto;
    backface-visibility: hidden;
  }

  /* High performance gets full animations */
  .perf-high .music-hero::before {
    animation:
      auroraShift 16s ease-in-out infinite alternate,
      auroraFloat 20s ease-in-out infinite alternate,
      auroraPulse 12s ease-in-out infinite alternate;
    will-change: transform, filter;
  }

  /* Medium performance gets simplified animations */
  .perf-medium .music-hero::before {
    animation: auroraShift 20s ease-in-out infinite alternate;
    will-change: transform;
  }

  /* Low performance gets static background */
  .perf-low .music-hero::before,
  .simple-gradients .music-hero::before {
    background: radial-gradient(60% 80% at 50% 50%, var(--accent1), transparent 70%);
    filter: blur(20px);
    animation: none;
    will-change: auto;
  }

  .music-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 60% at 50% 100%, rgba(0, 0, 0, 0.75), transparent 60%),
      radial-gradient(80% 50% at 50% -10%, rgba(0, 0, 0, 0.6), transparent 60%);
    pointer-events: none;
    background-size:
      140% 140%,
      160% 160%;
    z-index: 2;
    will-change: auto;
  }

  /* Performance-aware vignette animations */
  .perf-high .music-hero::after {
    animation: vignetteWave 18s ease-in-out infinite alternate;
    will-change: transform;
  }

  .perf-medium .music-hero::after,
  .perf-low .music-hero::after {
    background: radial-gradient(100% 100% at 50% 50%, rgba(0, 0, 0, 0.6), transparent 70%);
    animation: none;
  }

  .music-hero-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 30% 70%, var(--accent1), transparent 50%),
      radial-gradient(circle at 70% 30%, var(--accent2), transparent 50%),
      linear-gradient(135deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.65) 100%);
    background-size:
      130% 130%,
      120% 120%,
      100% 100%;
    will-change: auto;
  }

  /* High performance gets overlay animation */
  .perf-high .music-hero-overlay {
    animation: overlayDrift 22s ease-in-out infinite alternate;
    will-change: transform;
  }

  /* Medium and low performance get static overlay */
  .perf-medium .music-hero-overlay,
  .perf-low .music-hero-overlay {
    background:
      radial-gradient(circle at 30% 70%, var(--accent1), transparent 50%),
      radial-gradient(circle at 70% 30%, var(--accent2), transparent 50%),
      linear-gradient(135deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.65) 100%);
    animation: none;
  }

  .music-hero-content {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 3rem;
    max-width: 1100px;
    width: 100%;
    /* Prevent layout shift by reserving space */
    min-height: 320px;
  }

  /* Mobile: hidden by default, shown only when expanded */
  @media (max-width: 767px) {
    .music-hero-content {
      min-height: auto;
      display: none; /* Hidden by default on mobile */
    }

    /* Show when mobile expanded class is applied */
    .music-hero-content.mobile-expanded {
      display: flex !important;
    }
  }

  /* Desktop: always visible with proper sizing */
  @media (min-width: 768px) {
    .music-hero-content {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 320px;
    }

    .music-hero {
      min-height: 400px;
    }

    /* Disable mobile animations on desktop */
    .music-hero-content.animate-fadeInUpSmooth,
    .music-hero-content.animate-fadeOutDown {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
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
    will-change: auto;
    backface-visibility: hidden;
    /* Prevent layout shift */
    aspect-ratio: 1;
    contain: layout size;
  }

  /* Keep shadow visible on click/focus states */
  .music-album-cover:active,
  .music-album-cover:focus,
  .music-album-cover:focus-visible {
    box-shadow:
      0 25px 60px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
  }

  /* Also keep shadow identical on hover and when children receive focus */
  .music-album-cover:hover,
  .music-album-cover:focus-within {
    box-shadow:
      0 25px 60px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
  }

  /* Remove default tap highlight that can appear as a flicker on click */
  .music-album-cover {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }

  /* Responsive sizing with fixed dimensions to prevent layout shift */
  /* Use Tailwind's sizing but add stability */
  @media (max-width: 767px) {
    .music-album-cover {
      /* w-44 = 176px, h-44 = 176px - keep Tailwind classes working */
      min-width: 176px;
      min-height: 176px;
      aspect-ratio: 1;
    }
  }

  @media (min-width: 768px) {
    .music-album-cover {
      /* md:w-72 = 288px, md:h-72 = 288px */
      width: 288px !important;
      height: 288px !important;
      min-width: 288px !important;
      min-height: 288px !important;
      aspect-ratio: 1;
    }
  }

  /* Floating animation only for high-performance devices */
  .perf-high .music-album-cover:not(.modal-cover) {
    animation: float 6s ease-in-out infinite;
    will-change: transform;
  }

  /* Performance-based backdrop blur via CSS variables */
  .music-album-cover {
    backdrop-filter: blur(var(--perf-blur-strength, 0px));
    -webkit-backdrop-filter: blur(var(--perf-blur-strength, 0px));
  }

  .music-album-cover::before {
    content: '';
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    /* Halo tinted with the cover's accent so the artwork lifts off a glow of
       its own colour (falls back to a soft white glow if no palette). */
    background: radial-gradient(
      closest-side,
      var(--accent-edge, rgba(255, 255, 255, 0.15)),
      rgba(255, 255, 255, 0) 60%
    );
    filter: blur(34px);
    opacity: var(--perf-opacity, 0.6);
    will-change: auto;
  }

  /* Shine effect only for high-performance devices */
  .perf-high .music-album-cover::after {
    content: '';
    position: absolute;
    top: -100%;
    left: -50%;
    width: 200%;
    height: 300%;
    background: linear-gradient(
      75deg,
      transparent 40%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 60%
    );
    transform: rotate(8deg);
    opacity: 0;
    transition:
      opacity 0.3s ease,
      transform 0.4s ease;
    will-change: opacity, transform;
  }

  /* Only enable hover effects on high-performance devices with hover capability */
  @media (hover: hover) and (pointer: fine) {
    .perf-high .music-album-cover:not(.modal-cover):hover::after {
      opacity: 0.7;
      transform: rotate(8deg) translateY(10%);
    }
  }

  /* Disable shine effect on low/medium-performance devices */
  .perf-medium .music-album-cover::after,
  .perf-low .music-album-cover::after {
    display: none;
  }

  /* Badge */
  .music-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 10;
  }
  /* Title + text animation only */
  .animate-titleGlow {
    animation: titleGlow 5s ease-in-out infinite alternate;
  }
  @keyframes titleGlow {
    0% {
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.28));
    }
    100% {
      filter: drop-shadow(0 0 22px rgba(255, 255, 255, 0.5));
    }
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
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes auroraShift {
    0% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    100% {
      transform: translate3d(-2%, 2%, 0) scale(1.06);
    }
  }

  /* Background gradient animations - disabled on low-performance devices */
  @keyframes gradientFlow {
    0%,
    100% {
      background-position:
        0% 0%,
        100% 100%,
        0% 0%;
    }
    50% {
      background-position:
        100% 50%,
        0% 50%,
        0% 0%;
    }
  }

  @keyframes auroraFloat {
    0%,
    100% {
      background-position:
        0% 0%,
        100% 100%,
        50% 50%;
    }
    25% {
      background-position:
        100% 25%,
        25% 75%,
        25% 75%;
    }
    50% {
      background-position:
        50% 100%,
        75% 25%,
        75% 25%;
    }
    75% {
      background-position:
        25% 50%,
        50% 100%,
        100% 50%;
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
    0%,
    100% {
      background-position:
        0% 100%,
        100% 0%;
      transform: scale(1) rotate(0deg);
    }
    33% {
      background-position:
        50% 50%,
        50% 50%;
      transform: scale(1.02) rotate(0.5deg);
    }
    66% {
      background-position:
        100% 0%,
        0% 100%;
      transform: scale(0.98) rotate(-0.5deg);
    }
  }

  @keyframes overlayDrift {
    0%,
    100% {
      background-position:
        30% 70%,
        70% 30%,
        0% 0%;
      transform: translateZ(0);
    }
    25% {
      background-position:
        60% 40%,
        40% 60%,
        0% 0%;
      transform: translateZ(0) scale(1.01);
    }
    50% {
      background-position:
        80% 20%,
        20% 80%,
        0% 0%;
      transform: translateZ(0) scale(0.99);
    }
    75% {
      background-position:
        45% 55%,
        55% 45%,
        0% 0%;
      transform: translateZ(0) scale(1.005);
    }
  }

  /* Performance optimizations based on device capability detection */
  @media (prefers-reduced-motion: reduce) {
    .music-detail-content,
    .music-hero::before,
    .music-hero::after,
    .music-hero-overlay,
    .music-album-cover {
      animation: none !important;
      transition: opacity calc(var(--perf-animation-duration, 0.2) * 1s) ease !important;
    }

    .animate-titleGlow {
      animation: none !important;
    }
  }

  /* Mobile device optimizations */
  .mobile-device .music-detail-content {
    background-size:
      100% 100%,
      100% 100%,
      100% 100%;
  }

  .mobile-device .music-hero::before {
    filter: blur(20px) saturate(100%);
  }

  .mobile-device .music-album-cover::before {
    filter: blur(15px);
    opacity: 0.4;
  }

  /* Modal specific optimizations */
  .music-detail-content:has(.music-hero) {
    min-height: auto;
  }

  /* Performance-aware modal animations */
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
  :global(body.modal-open) .back-glass-btn,
  :global(body.modal-open) .share-glass-btn {
    transition:
      background 0.25s,
      box-shadow 0.25s,
      opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1) !important;
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
  :global(body.modal-animating) .back-glass-btn,
  :global(body.modal-animating) .share-glass-btn {
    transition:
      background 0.25s,
      box-shadow 0.25s,
      opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* Lightweight image transitions in modal */
  .modal-mode .progressive-image {
    transition: opacity 0.18s ease-out !important;
    transform: none !important;
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

  /* Desktop Share Button Container */
  .desktop-share-button {
    display: flex;
    justify-content: center;
    position: relative; /* Ensure proper positioning context */
  }

  /* Hide desktop share button on mobile as CSS safeguard */
  @media (max-width: 767px) {
    .desktop-share-button {
      display: none !important;
    }
  }

  @media (min-width: 768px) {
    .desktop-share-button {
      justify-content: flex-start;
    }
  }

  .share-glassmorphic-popup {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    width: 400px;
    max-width: 90vw;
    color: white;
    overflow: hidden;
  }

  .share-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .share-popup-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .share-popup-close {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .share-popup-close:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      transform: scale(1.05);
    }
  }

  .share-popup-content {
    padding: 1.5rem;
  }

  .share-popup-description {
    margin: 0 0 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .share-popup-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
  }

  .share-popup-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: white;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .share-popup-input:focus {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }

  .share-popup-copy-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
    border: none !important;
    border-radius: 0.5rem !important;
    padding: 0.75rem 1.25rem !important;
    color: white !important;
    font-size: 0.9rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    white-space: nowrap !important;
    height: auto !important;
    min-height: auto !important;
  }

  @media (hover: hover) and (pointer: fine) {
    .share-popup-copy-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
    }
  }

  .share-popup-copy-btn:disabled {
    opacity: 0.7 !important;
    cursor: not-allowed !important;
  }

  /* Performance optimizations for low-end devices */
  @media (prefers-reduced-motion: reduce) {
    .share-glassmorphic-popup {
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .share-popup-close:hover,
    .share-popup-copy-btn:hover {
      transform: none !important;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .share-glassmorphic-popup {
      width: 95vw;
      margin: 1rem;
    }

    .share-popup-header,
    .share-popup-content {
      padding: 1.25rem;
    }

    .share-popup-input-group {
      flex-direction: column;
      gap: 0.75rem;
    }

    .share-popup-copy-btn {
      justify-content: center !important;
    }
  }
</style>
