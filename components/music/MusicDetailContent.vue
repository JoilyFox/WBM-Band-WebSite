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
              'back-glass-btn--transparent': backBtnTransparent
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
                'share-glass-btn--transparent': backBtnTransparent
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
          'pt-20 pb-3 px-4 md:py-16 md:px-8': !isHeroExpanded && !isDesktop && !isModal,
          'py-4 px-4': !isHeroExpanded && !isDesktop && isModal,
          'pt-16 pb-3 md:pb-8 px-4 md:px-8': isHeroExpanded || isDesktop,
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
        :class="[
          'md:hidden w-full max-w-5xl z-10 cursor-pointer transform transition-all duration-400 ease-out md:hover:scale-[1.02]',
          heroInteracted
            ? 'animate-slideInCompact'
            : heroEntered
              ? 'animate-heroFadeIn'
              : 'hero-prehidden'
        ]"
        @click="toggleHeroExpansion"
      >
        <div
          class="liquid-glass liquid-glass-interactive flex items-center gap-4 p-4 transition-all duration-400 ease-out"
          style="
            --lg-radius: 1rem;
            --lg-tint: rgb(255 255 255 / 0.05);
            --lg-rim: rgb(255 255 255 / 0.32);
          "
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
          <!-- Mobile Collapse Button (same pill as the hero actions) -->
          <div class="md:hidden mb-3 flex justify-center">
            <MusicHeroPill
              icon="pi pi-chevron-up text-base leading-none"
              :label="collapseLabel"
              @click="toggleHeroExpansion"
            />
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

          <!-- Desktop hero action row: an optional Lyrics button alongside Share,
               in the shared glassmorphic design. Music Video stays in the platform
               grid below (not here). Share drops to icon-only once it shares the
               row with the Lyrics button. Client + desktop only. -->
          <div
            v-if="isDesktop && isClient"
            class="desktop-share-button mt-6 items-center gap-3 flex-wrap"
          >
            <MusicActionButton
              v-if="lyricsAvailable"
              :icon="
                showLyrics
                  ? hasMusicNavContext
                    ? 'pi pi-arrow-left'
                    : 'pi pi-play'
                  : 'pi pi-align-left'
              "
              :label="showLyrics ? lyricsBackLabel : t('music.buttons.lyrics')"
              :aria-label="showLyrics ? lyricsBackLabel : t('music.a11y.show_lyrics')"
              :optimized="shouldUseMobileFallback"
              @click="toggleLyrics"
            />
            <MusicActionButton
              id="desktop-share-button"
              icon="pi pi-share-alt"
              :label="t('music.buttons.share')"
              :icon-only="desktopShareIconOnly"
              :aria-label="t('music.a11y.share_release')"
              :optimized="shouldUseMobileFallback"
              @click="showDesktopSharePopup"
            />
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
        :class="{ 'lyrics-active': showLyrics }"
      >
        <MusicHeroPill
          v-if="musicVideoUrl"
          as="a"
          :href="musicVideoUrl"
          target="_blank"
          rel="noopener noreferrer"
          accent="video"
          :aria-label="t('music.buttons.watch_video')"
          :class="{ 'flex-1 justify-center': bothActions }"
          @click="handleMusicVideoClick"
        >
          <!-- Slotted (not the icon/label props) so the label can collapse to an
               icon-only pill on narrow phones when the lyrics view is open —
               see `.mv-label` + the max-width:400px rule in the styles. -->
          <i class="fab fa-youtube text-base leading-none" aria-hidden="true"></i>
          <span class="mv-label">{{ t('music.buttons.music_video') }}</span>
        </MusicHeroPill>
        <!-- Lyrics: swaps the platform-links section below for the song lyrics
             (horizontal cross-slide). Only present when the release ships lyrics.
             Alone (no Music Video): `--solo` makes it half the row on the links
             view (right-pinned via ml-auto, like a paired Lyrics pill) and grows it
             to the full row on the lyrics view. The label swaps short↔long at 440px
             via the pill's responsive label. -->
        <MusicHeroPill
          v-if="lyricsAvailable"
          :aria-label="showLyrics ? lyricsBackLabel : t('music.a11y.show_lyrics')"
          :class="[
            'lyrics-morph-pill',
            bothActions ? 'flex-1 justify-center' : 'lyrics-morph-pill--solo ml-auto'
          ]"
          @click="toggleLyrics"
        >
          <!-- Morphing content: the SAME pill is the Lyrics trigger (links view)
               and the "Back to Music" control (lyrics view). Both faces are
               grid-stacked and clipped by the pill; only the icon+text slide
               (out/in on the right) + cross-fade, synced to the 0.42s pane swap.
               The pill's border/size never change. Faces are aria-hidden — the
               button's dynamic aria-label is the authoritative accessible name. -->
          <span
            class="pill-morph"
            :class="{ 'is-back': showLyrics, 'pill-morph--reduced': shouldReduceAnimations }"
          >
            <span class="pill-morph__face pill-morph__face--lyrics" aria-hidden="true">
              <i class="pi pi-align-left text-base leading-none"></i>
              <UiResponsiveText
                :narrow="t('music.buttons.lyrics')"
                :wide="t('music.buttons.song_lyrics')"
                :breakpoint="440"
              />
            </span>
            <span class="pill-morph__face pill-morph__face--back" aria-hidden="true">
              <!-- Cold visitors (no prior context) get a play glyph + "Listen to
                   the Song"; once they've used the toggle it morphs to the back
                   arrow + "Back to Music". -->
              <i
                class="text-base leading-none"
                :class="hasMusicNavContext ? 'pi pi-arrow-left' : 'pi pi-play'"
              ></i>
              <span>{{ lyricsBackLabel }}</span>
            </span>
          </span>
        </MusicHeroPill>
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

    <!-- Music Platform Links (swaps with the song lyrics via a horizontal slide) -->
    <section class="music-platforms flex-1 relative z-10 py-6 sm:pb-16 bg-surface-950/60">
      <!-- Full-bleed swap: `.lyrics-swap` spans the viewport and clips at the SCREEN
           edges, so the two panes cross-slide edge-to-edge (links exit left while
           lyrics enter right, reversed on the way back) with nothing cutting them
           off. The horizontal padding + max-width live on each pane's inner
           container instead of the section. The reduced-motion fallback is CSS-only. -->
      <div ref="lyricsSwapEl" class="lyrics-swap">
        <Transition :name="swapTransitionName" :mode="swapMode">
          <div :key="showLyrics ? 'lyrics' : 'links'" class="lyrics-swap__pane">
            <div class="platforms-container max-w-3xl mx-auto px-4 md:px-8 rounded-xl">
              <!-- LINKS VIEW -->
              <template v-if="!showLyrics">
                <h2
                  class="platforms-title text-center text-2xl md:text-3xl font-extrabold mb-6 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-md"
                >
                  {{ listenNowTitle }}
                </h2>
                <div
                  v-if="hasPlatformLinks"
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

                <!-- Released-state fallback: no individual platform links yet → a
                     single "Listen on all platforms" CTA to the distributor
                     smart-link. The moment real musicPlatformLinks are added, the
                     grid above replaces it. No redirect, so /listen stays a real,
                     indexable page. -->
                <div v-else-if="showSmartLinkCta" class="flex justify-center">
                  <a
                    :href="releaseSmartLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="smart-link-cta inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold text-surface-950 bg-gradient-to-br from-primary-50 to-primary-200 shadow-lg shadow-black/30 transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:text-lg"
                    @click="handleSmartLinkClick"
                  >
                    <i class="pi pi-play text-sm leading-none" aria-hidden="true"></i>
                    <span>{{ t('music.buttons.stream_all') }}</span>
                  </a>
                </div>
              </template>

              <!-- LYRICS VIEW -->
              <MusicLyrics v-else :sections="lyricsSections" />
            </div>
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
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
    /** Boot with the lyrics view already open (the dedicated /lyrics/<slug>
     *  page passes this so the lyric text is SSR-rendered into the static HTML). */
    initialShowLyrics?: boolean
    /** Opt in to History-API URL syncing between the release page and the
     *  /lyrics/<slug> URL when the lyrics view is toggled. Only the clean listen
     *  page + the lyrics page enable it; the modal, pre-save and source-prefix
     *  variants keep the pure in-place toggle (no URL change). */
    lyricsUrlSync?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isModal: false,
    isPreSave: false,
    initialShowLyrics: false,
    lyricsUrlSync: false
  })

  // Emitted whenever the visible view flips, so the host page can keep its
  // <title> / canonical in sync with the URL (see useReleaseHead).
  const emit = defineEmits<{ 'view-change': ['links' | 'lyrics'] }>()
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

  // Lyrics are data-driven: the button (and the swipe-in lyrics view) exist only
  // when the release actually ships lyrics in data/musicLibrary.ts. When absent,
  // the whole quick-actions row collapses cleanly (no leftover margin).
  const lyricsSections = computed(() => props.release?.lyrics ?? [])
  const lyricsAvailable = computed(() => lyricsSections.value.length > 0)
  const showHeroActions = computed(() => Boolean(musicVideoUrl.value) || lyricsAvailable.value)
  // With both pills present they grow to share the row equally; a lone pill
  // keeps its natural content width (left for video, right for lyrics).
  const bothActions = computed(() => Boolean(musicVideoUrl.value) && lyricsAvailable.value)

  // Desktop hero action row: Share is always present; the Lyrics button joins it
  // when the release ships lyrics. Share collapses to icon-only once it's no longer
  // the lone button. (Music Video lives in the platform grid, not this row.)
  const desktopShareIconOnly = computed(() => lyricsAvailable.value)

  // Cold-entry-aware label for the lyrics "back" pill. A visitor who reached the
  // lyrics straight from a search engine has no "music" to go back to, so the pill
  // reads "Listen to the Song" until they interact with the toggle; after that it
  // becomes "Back to Music" (persisted ~2h — see useMusicNavContext). SSR + first
  // client render see hasContext=false (the cold label), then hydrate promotes it.
  const {
    hasContext: hasMusicNavContext,
    markContext: markMusicNavContext,
    hydrate: hydrateMusicNavContext
  } = useMusicNavContext()
  const lyricsBackLabel = computed(() =>
    hasMusicNavContext.value ? t('music.buttons.back_to_music') : t('music.buttons.listen_to_song')
  )

  // --- Lyrics view: in-place horizontal swap of the platform links <-> lyrics.
  // `showLyrics` drives a directional cross-slide (links exit left, lyrics enter
  // right; reversed on the way back). Pure client state — no route change — so SSR
  // renders the links view and there is no hydration mismatch.
  const showLyrics = ref(props.initialShowLyrics)
  const swapDirection = ref<'forward' | 'back'>('forward')

  // Reduced-motion OR a genuinely low-perf device gets a clean opacity crossfade
  // (sequential, via `out-in`, so the two panes never overlap); everything else
  // gets the directional translateX swipe — lyrics in/out from the RIGHT, links
  // in/out from the LEFT. `shouldReduceAnimations` is `prefersReducedMotion ||
  // level === 'low'`; Client Hints now keep modern flagships out of the 'low'
  // tier (see usePerformanceOptimization) so they get the swipe, not the fade.
  const swapTransitionName = computed(() =>
    shouldReduceAnimations.value ? 'lyrics-fade' : `lyrics-swap-${swapDirection.value}`
  )
  // `out-in` for the fade (old fully leaves before new enters → no overlap);
  // default/simultaneous for the cross-slide so both panes move together.
  const swapMode = computed<'out-in' | undefined>(() =>
    shouldReduceAnimations.value ? 'out-in' : undefined
  )

  // --- Smooth height change on the links <-> lyrics swap --------------------
  // The two panes share one grid cell, so the container's natural height changes
  // in a single frame when the views swap — which on the full page yanks the
  // footer up, and in the modal makes the body resize abruptly. We tween the
  // container's height across the same 0.42s/easing instead.
  //
  // Two details keep it glitch-free in modal mode, where the global
  // `transition: none` would otherwise remove the leaving pane instantly:
  //   • lock the CURRENT height BEFORE the panes swap (the watch is pre-flush, so
  //     this runs before the DOM update) — otherwise the container snaps to the new
  //     height first and our tween then yanks it back, the flicker that was seen;
  //   • set the height transition with `important`, to beat the modal's
  //     `transition: none !important`.
  // Skipped only for reduced motion (its out-in fade has no overlap to bridge).
  const lyricsSwapEl = ref<HTMLElement | null>(null)
  let cancelSwapHeight: (() => void) | null = null

  watch(showLyrics, async (isLyrics) => {
    const el = lyricsSwapEl.value
    if (!el || !import.meta.client || shouldReduceAnimations.value) return
    if (cancelSwapHeight) cancelSwapHeight() // rapid re-toggle: drop the in-flight tween
    const startH = el.offsetHeight
    el.style.height = `${startH}px` // lock before the DOM swaps the panes
    await nextTick()
    // The entering pane is the one whose content matches the new view; its own
    // height is the natural target even while the container is height-locked.
    const panes = Array.from(el.querySelectorAll<HTMLElement>('.lyrics-swap__pane'))
    const target = panes.find((p) => Boolean(p.querySelector('.music-lyrics')) === isLyrics)
    const targetH = target ? target.offsetHeight : 0
    if (!targetH || targetH === startH) {
      el.style.height = ''
      return
    }
    void el.offsetHeight // commit the locked start height
    el.style.setProperty('transition', 'height 0.42s cubic-bezier(0.22, 1, 0.36, 1)', 'important')
    el.style.height = `${targetH}px`
    const finish = () => {
      el.style.height = ''
      el.style.removeProperty('transition')
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(timer)
      cancelSwapHeight = null
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === 'height') finish()
    }
    el.addEventListener('transitionend', onEnd)
    const timer = setTimeout(finish, 600) // safety net if transitionend never fires
    cancelSwapHeight = finish
  })

  // --- URL sync (release page <-> /lyrics/<slug>) --------------------------
  // We change the URL with the History API directly — NOT router navigation —
  // so the cross-slide animation is preserved and the component never remounts.
  // vue-router only reacts to popstate (not pushState), so it stays put while we
  // open lyrics; our own popstate handler re-syncs `showLyrics` for browser
  // back/forward. Opening pushes a history entry (Back closes lyrics); closing
  // replaces it (collapses the /lyrics entry back to /listen). Client + opt-in.
  const isLyricsPath = (path: string) => /(^|\/)lyrics\//.test(path)

  const pathForView = (target: 'links' | 'lyrics'): string => {
    // Swap only the section segment, preserving whatever locale-prefix style the
    // visitor is on (/listen/x, /ua/listen/x, /en/listen/x → the /lyrics sibling).
    const current = window.location.pathname
    return target === 'lyrics'
      ? current.replace(/(^|\/)listen(\/)/, '$1lyrics$2')
      : current.replace(/(^|\/)lyrics(\/)/, '$1listen$2')
  }

  const syncLyricsUrl = (target: 'links' | 'lyrics', mode: 'push' | 'replace') => {
    if (!import.meta.client || !props.lyricsUrlSync) return
    const path = pathForView(target)
    if (path === window.location.pathname) return
    if (mode === 'push') window.history.pushState(window.history.state, '', path)
    else window.history.replaceState(window.history.state, '', path)
  }

  const openLyrics = () => {
    if (!lyricsAvailable.value) return
    swapDirection.value = 'forward'
    showLyrics.value = true
    if (props.lyricsUrlSync) {
      syncLyricsUrl('lyrics', 'push')
      emit('view-change', 'lyrics')
    }
  }

  const closeLyrics = () => {
    swapDirection.value = 'back'
    showLyrics.value = false
    if (props.lyricsUrlSync) {
      syncLyricsUrl('links', 'replace')
      emit('view-change', 'links')
    }
  }

  // The morphing hero pill is the single open/close control (the in-pane back
  // button was removed): open the lyrics when on the links view, close them when
  // on the lyrics view. The floating top-left back-arrow still closes too.
  const toggleLyrics = () => {
    // A real tap on the pill is the "interaction" that earns the visitor the
    // context for the "Back to Music" label (vs the cold-entry "Listen to the
    // Song"). Persisted ~2h so it survives refreshes/navigation in this session.
    markMusicNavContext()
    if (showLyrics.value) closeLyrics()
    else openLyrics()
  }

  // Browser back/forward: mirror `showLyrics` to whatever view the URL now names.
  const handleLyricsPopState = () => {
    if (!props.lyricsUrlSync) return
    const shouldShow = isLyricsPath(window.location.pathname)
    if (shouldShow === showLyrics.value) return
    swapDirection.value = shouldShow ? 'forward' : 'back'
    showLyrics.value = shouldShow
    emit('view-change', shouldShow ? 'lyrics' : 'links')
  }

  onMounted(() => {
    // Promote the cold "Listen to the Song" label to "Back to Music" if this
    // visitor has interacted with the toggle within the TTL (client-only read).
    hydrateMusicNavContext()
    if (import.meta.client && props.lyricsUrlSync) {
      window.addEventListener('popstate', handleLyricsPopState)
    }
  })
  onBeforeUnmount(() => {
    if (import.meta.client) window.removeEventListener('popstate', handleLyricsPopState)
  })

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
  // The first page-open shows the compact card with a gentle opacity fade (smooth
  // even during the busy initial mount — cover image loading, layout settling).
  // The bouncier slideInCompact entrance is reserved for when the card re-appears
  // after the user collapses from full mode (the page is settled by then).
  const heroInteracted = ref(false)
  // The first-open entrance is triggered ONCE, after mount (see onMounted) — never
  // during SSR/hydration, where a late stylesheet or a re-render could restart or
  // skip the keyframe and make it "blink". Until then the card sits pre-hidden so
  // there's no flash of the un-animated element.
  const heroEntered = ref(false)
  const toggleHeroExpansion = () => {
    heroInteracted.value = true
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

    // Fire the compact-card first-open entrance once the first frame has painted,
    // so the fade always plays cleanly on the client (never interrupted by
    // hydration). Before this the card is `hero-prehidden` (opacity 0).
    requestAnimationFrame(() => {
      heroEntered.value = true
    })

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
    // Music Video leads the grid (it's the visual hook); on mobile its cell is
    // hidden (`max-md:!hidden`) so the order there effectively starts at Spotify.
    const priorityOrder = ['musicVideo', 'spotify', 'youtubeMusic', 'appleMusic']

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

  const hasPlatformLinks = computed(() => Object.keys(availablePlatforms.value).length > 0)

  // Released-state fallback CTA. Per-platform DSP links often only exist after
  // release, so when the listen page has none yet we surface a single
  // "Listen on all platforms" button pointing at the distributor smart-link
  // (release.releaseSmartLink). Listen page only, and only while there are no
  // real links — adding any musicPlatformLinks entry swaps the grid back in.
  // No redirect: the /listen page stays a real, indexable page (canonical + JSON-LD).
  const releaseSmartLink = computed(() =>
    !props.isPreSave && !hasPlatformLinks.value ? props.release.releaseSmartLink || '' : ''
  )
  const showSmartLinkCta = computed(() => Boolean(releaseSmartLink.value))

  const handleSmartLinkClick = () => {
    if (!props.release?.slug) return
    // Manual click = real listen intent (unlike the pre-save auto-redirect), so
    // this conversion IS tracked regardless of skipDistributorConversionEvent.
    trackPlatformClick({
      platformName: 'smartlink',
      releaseSlug: props.release.slug,
      pageType: pageType.value
    })
  }

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
  // Resolve the LOCALIZED title at SSR too, so the prerendered <h1> is correct
  // per locale. `release.title` is a single static string (e.g. mania = "Mania",
  // chorni-ptahy = "Чорні Птахи"), so using it as the SSR value bakes the
  // wrong-language H1 for one locale on every release — bad for "<song> слова" /
  // "<song> lyrics" ranking. Hydration-safe: prefix routing keeps the locale
  // stable between SSR and the client's first render (detectBrowserLanguage
  // redirects on root only, and the non-localized alias resolves to default ua),
  // so t() matches; release.title is the last-resort fallback for a missing key.
  const displayTitle = computed(() => {
    const translated = t(releaseTitleKey.value) as string
    if (translated && translated !== releaseTitleKey.value) return translated
    return props.release.title || props.release.slug
  })

  const displayDescription = computed(() => {
    // Resolve the LOCALIZED description at SSR too, so the visible <p> is baked
    // into the static HTML. It was client-only before: releases have no static
    // `description` (only `descriptionKey`), so the old isHydrating fallback
    // returned empty at SSR → the paragraph never reached no-JS crawlers. Mirrors
    // displayTitle; hydration-safe (prefix routing keeps the locale stable, and
    // `isHydrating` stays in use for the hero display toggle).
    const translated = t(releaseDescriptionKey.value) as string
    if (translated && translated !== releaseDescriptionKey.value) return translated
    return props.release.description || ''
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
    // The floating top-left control always sends the visitor to the home page (and
    // scrolls to the music section) — never a history "back". The lyrics view
    // rewrites the URL (/listen <-> /lyrics), so a history back would just bounce
    // between those rather than leave the release; going straight home is the
    // intent regardless of the current view or how the visitor arrived.
    await router.push('/')
    setTimeout(() => {
      scrollToElementWithNavigation('music')
    }, 100)
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

<style scoped src="./MusicDetailContent.styles.css"></style>
