<template>
  <section id="music" class="pt-16 pb-6 lg:pb-16 lg:pt-24 px-4 sm:px-6 lg:px-8 bg-surface-950">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center mb-10">
        <CommonSectionTitle :level="2" size="xl" align="center">
          {{ t('music.section_title') }}
        </CommonSectionTitle>
        <CommonSectionSubtitle align="center" max-width="md" size="base">
          {{ t('music.section_subtitle', { name: bandName }) }}
        </CommonSectionSubtitle>
      </div>

      <!-- Music Grid -->
      <div class="flex justify-center">
        <div class="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 max-w-fit mx-auto">
          <!-- Upcoming Release Block (Preview or Pre-save) - Always First -->
          <div
            v-if="shouldShowNewReleasePreview || shouldShowPreSaveCard"
            ref="newReleasePreviewRef"
            :class="[
              'card-base',
              shouldShowPreSaveCard
                ? 'presave-card cursor-pointer'
                : 'new-release-preview cursor-pointer'
            ]"
            :style="{ transitionDelay: '0ms' }"
            @click="handleUpcomingReleaseClick"
          >
            <div :class="shouldShowPreSaveCard ? 'presave-content' : 'new-release-content'">
              <!-- Album Cover with Progressive Loading -->
              <div class="relative">
                <UiAlbumCover
                  :image-url="upcomingReleaseImageUrl"
                  :alt="upcomingReleaseTitle || t('music.new_release.card_title_fallback')"
                  :release-type="upcomingReleaseData?.type || 'new release'"
                  :show-badge="false"
                />

                <!-- Custom Pre-save Badge (override the default type badge) -->
                <div v-if="shouldShowPreSaveCard" class="absolute top-2 left-2 z-30">
                  <UiAppBadge variant="glass">
                    {{ t('music.presave.card_title_fallback').toUpperCase() }}
                  </UiAppBadge>
                </div>

                <!-- New Release Badge for preview mode -->
                <div v-else class="absolute top-2 left-2 z-30">
                  <UiAppBadge variant="glass">
                    {{ t('music.new_release.card_title_fallback').toUpperCase() }}
                  </UiAppBadge>
                </div>
              </div>

              <!-- Background Overlay under text (no play button for preview, yes for pre-save) -->
              <div :class="shouldShowPreSaveCard ? 'presave-overlay' : 'new-release-overlay'"></div>

              <!-- Text content layered above overlay -->
              <div :class="shouldShowPreSaveCard ? 'presave-info' : 'new-release-info'">
                <div
                  :class="[
                    shouldShowPreSaveCard ? 'presave-icon' : 'new-release-icon',
                    { 'has-date': !!upcomingReleaseData?.releaseDate }
                  ]"
                >
                  <i :class="shouldShowPreSaveCard ? 'pi pi-bookmark' : 'pi pi-calendar'"></i>
                </div>
                <h3 :class="shouldShowPreSaveCard ? 'presave-title' : 'new-release-title'">
                  {{ upcomingReleaseTitle }}
                </h3>
                <p :class="shouldShowPreSaveCard ? 'presave-date' : 'new-release-date'">
                  {{ upcomingReleaseComingText }}
                </p>
                <p
                  v-if="daysRemainingText"
                  :class="shouldShowPreSaveCard ? 'presave-days' : 'new-release-days'"
                >
                  ({{ daysRemainingText }})
                </p>
              </div>
            </div>
          </div>

          <div
            v-for="(release, index) in displayedReleases"
            :key="release.id"
            ref="cardRefs"
            class="card-base music-card-wrapper"
            :style="{
              transitionDelay: `${(index + (shouldShowNewReleasePreview ? 1 : 0)) * 100}ms`
            }"
          >
            <UiMusicCard :release="release" @click="handleReleaseClick" />
          </div>

          <!-- Coming Soon Block -->
          <div
            v-if="shouldShowComingSoon"
            ref="comingSoonRef"
            class="card-base coming-soon-card"
            :style="{
              transitionDelay: `${(displayedReleases.length + (shouldShowNewReleasePreview ? 1 : 0)) * 100}ms`
            }"
          >
            <div class="coming-soon-content">
              <div class="coming-soon-icon">
                <i class="pi pi-clock"></i>
              </div>
              <h3 class="coming-soon-title">{{ comingSoonTitle }}</h3>
              <p class="coming-soon-text">{{ comingSoonText }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Show More Button -->
      <div v-if="hasMoreReleases" class="text-center">
        <button
          class="show-more-button group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-full hover:from-primary-500 hover:to-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
          @click="handleShowMore"
        >
          <span class="relative z-10">{{ t('music.show_all') }}</span>
          <div
            class="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <i
            class="pi pi-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"
          ></i>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { MusicRelease } from '~/data/musicLibrary'
  import { getLatestReleases, getAllReleases, musicLibrary } from '~/data/musicLibrary'
  import { getConfig, isUpcomingRelease } from '~/utils/configHelpers'
  import { getLocalizedCountdown } from '~/utils/countdown'
  import { useSnackbar } from '~/composables/useSnackbar'

  // Computed properties for config values
  const bandName = computed(() => getConfig('general.bandName'))
  const enableComingSoonCard = computed(() => getConfig('general.enableComingSoonCard'))
  const maxReleasesBeforeHideComingSoon = computed(() =>
    getConfig('general.maxReleasesBeforeHideComingSoon')
  )
  const enablePreSave = computed(() => getConfig('general.enablePreSave'))
  const enableNextReleasePreview = computed(() => getConfig('general.enableNextReleasePreview'))

  // i18n
  // Use global composer to align SSR and CSR for lazy-loaded messages
  const { t, locale } = useI18n({ useScope: 'global' })

  // Track hydration to avoid SSR/client mismatches for localized strings
  const isHydrating = ref(true)

  // Props
  interface Props {
    showAll?: boolean
    maxItems?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    showAll: false,
    maxItems: 8
  })

  // Emits
  const emit = defineEmits<{
    releaseClick: [release: MusicRelease]
    showMore: []
  }>()

  // Refs
  const cardRefs = ref<HTMLElement[]>([])
  const comingSoonRef = ref<HTMLElement>()
  const newReleasePreviewRef = ref<HTMLElement>()

  // Composables
  const { success: showSuccessSnackbar } = useSnackbar()

  // Intersection Observer
  let observer: IntersectionObserver | null = null

  // Computed
  const displayedReleases = computed(() => {
    let releases = props.showAll ? getAllReleases() : getLatestReleases(props.maxItems)

    // Hide all upcoming releases until their release date has passed
    releases = releases.filter((release) => !isUpcomingRelease(release.releaseDate))

    // Filter out the upcoming release if it's being shown in preview/pre-save card
    // This prevents showing the same release twice
    if (shouldShowNewReleasePreview.value || shouldShowPreSaveCard.value) {
      const upcomingReleaseId = upcomingRelease.value?.id
      if (upcomingReleaseId) {
        releases = releases.filter((release) => release.id !== upcomingReleaseId)
      }
    }

    return releases
  })

  const hasMoreReleases = computed(() => {
    return !props.showAll && getAllReleases().length > props.maxItems
  })

  const shouldShowComingSoon = computed(() => {
    if (!enableComingSoonCard.value) return false
    // Don't show if new release preview or pre-save is active
    if (shouldShowNewReleasePreview.value || shouldShowPreSaveCard.value) return false
    const totalReleases = getAllReleases().length
    return totalReleases < maxReleasesBeforeHideComingSoon.value
  })

  const comingSoonTitle = computed(() => t('music.coming_soon.title') as string)

  const comingSoonText = computed(() => {
    const total = getAllReleases().length
    if (total === 0) return t('music.coming_soon.text_none') as string
    if (total === 1) return t('music.coming_soon.text_one') as string
    return t('music.coming_soon.text_many') as string
  })

  // Get the upcoming release from music library
  const upcomingRelease = computed<MusicRelease | null>(() => {
    const upcoming = musicLibrary.filter((release) => isUpcomingRelease(release.releaseDate))
    if (upcoming.length === 0) return null

    return upcoming.reduce((nearest, current) => {
      // If one has date and other doesn't, the one without date is "further" in future (TBA)
      if (!nearest.releaseDate) return nearest
      if (!current.releaseDate) return current

      const nearestDate = new Date(nearest.releaseDate)
      const currentDate = new Date(current.releaseDate)
      return currentDate < nearestDate ? current : nearest
    })
  })

  // Pre-save functionality - shows clickable card with pre-save links
  const shouldShowPreSaveCard = computed(() => {
    if (!enablePreSave.value) return false
    const release = upcomingRelease.value
    return (
      release !== null &&
      ((release.preSaveMusicPlatformLinks &&
        Object.keys(release.preSaveMusicPlatformLinks).length > 0) ||
        !!release.distributorPreSaveUrl)
    )
  })

  // Next Release Preview functionality - shows non-clickable preview card
  const shouldShowNewReleasePreview = computed(() => {
    if (enablePreSave.value) return false // Pre-save takes precedence
    if (!enableNextReleasePreview.value) return false
    return upcomingRelease.value !== null
  })

  const upcomingReleaseData = computed(() => {
    const release = upcomingRelease.value
    if (!release) return null

    // If no release date, return release data with empty formatted date
    if (!release.releaseDate) {
      return {
        ...release,
        formattedDate: ''
      }
    }

    const date = new Date(release.releaseDate)
    const currentLocale = locale.value === 'ua' ? 'uk-UA' : 'en-US'

    // Format date with only month and day (no year, no time)
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      // Force UTC to keep SSR/CSR consistent regardless of server/client timezones
      timeZone: 'UTC'
    }

    const formatted = date.toLocaleString(currentLocale, formatOptions)

    return {
      ...release,
      formattedDate: formatted
    }
  })

  const upcomingReleaseTitle = computed(() => {
    const release = upcomingRelease.value
    if (!release) return ''
    const key = release.titleKey || `releases.${release.slug}.title`
    const fallback = release.title || release.slug
    if (isHydrating.value) return fallback
    const translated = t(key) as string
    return translated !== key && translated ? translated : fallback
  })

  // Build a stable "Coming {date}" label with fallback for SSR
  const upcomingReleaseComingText = computed(() => {
    // If no date, show generic "Coming Soon" text
    if (!upcomingReleaseData.value?.releaseDate) {
      return t('music.new_release.coming_soon')
    }

    const dateStr = upcomingReleaseData.value?.formattedDate || ''
    const key = shouldShowPreSaveCard.value
      ? 'music.presave.coming_prefix'
      : 'music.new_release.coming_prefix'
    const translated = t(key, { date: dateStr }) as string

    // Fallback if translation key is returned literally (SSR scenario)
    if (translated === key || translated.includes('music.')) {
      const template = locale.value === 'ua' ? 'Реліз {date}' : 'Release {date}'
      return template.replace('{date}', dateStr)
    }

    return translated
  })

  // Calculate days remaining until release
  const daysRemainingText = computed(() => {
    const releaseDate = upcomingReleaseData.value?.releaseDate
    if (!releaseDate) return ''

    return getLocalizedCountdown({
      releaseDate,
      locale: locale.value,
      t
    })
  })

  // Use a pre-blurred variant of the upcoming release image to avoid runtime backdrop blur
  const blurredUpcomingReleaseImageUrl = computed(() => {
    // First check if the release has an explicit blurredImageUrl
    if (upcomingReleaseData.value?.blurredImageUrl) {
      return upcomingReleaseData.value.blurredImageUrl
    }

    // Fallback to the old logic of adding "-blurred" suffix
    const src = upcomingReleaseData.value?.imageUrl || ''
    if (!src) return ''
    // Insert "-blurred" before extension: cover.jpg -> cover-blurred.jpg
    const idx = src.lastIndexOf('.')
    if (idx === -1) return `${src}-blurred`
    const base = src.slice(0, idx)
    const ext = src.slice(idx)
    return `${base}-blurred${ext}`
  })

  // Image URL for the upcoming release card - use regular image for pre-save, blurred for preview
  const upcomingReleaseImageUrl = computed(() => {
    if (shouldShowPreSaveCard.value) {
      // Pre-save mode: use regular optimized image
      return upcomingReleaseData.value?.imageUrl || ''
    } else {
      // Preview mode: use blurred image
      return blurredUpcomingReleaseImageUrl.value
    }
  })

  // Methods
  const handleReleaseClick = (release: MusicRelease) => {
    emit('releaseClick', release)
  }

  const handleShowMore = () => {
    emit('showMore')
  }

  const handleUpcomingReleaseClick = () => {
    const releaseData = upcomingReleaseData.value
    if (!releaseData) return

    if (shouldShowPreSaveCard.value) {
      // Pre-save mode - emit click to open modal/page
      emit('releaseClick', releaseData)
    } else {
      // Preview mode - show snackbar
      showSuccessSnackbar(
        upcomingReleaseComingText.value,
        t('snackbar.music_library.subtitle') as string
      )
    }
  }

  const setupIntersectionObserver = () => {
    if (!import.meta.client) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            target.classList.add('show')
            observer?.unobserve(target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    cardRefs.value.forEach((card) => {
      if (card) {
        observer?.observe(card)
      }
    })

    // Also observe the coming soon card
    if (comingSoonRef.value) {
      observer.observe(comingSoonRef.value)
    }

    // Also observe the new release preview card
    if (newReleasePreviewRef.value) {
      observer.observe(newReleasePreviewRef.value)
    }
  }

  const resetAnimations = async () => {
    // Reset all cards to initial state
    cardRefs.value.forEach((card) => {
      if (card) {
        card.classList.remove('show')
      }
    })

    // Reset coming soon card
    if (comingSoonRef.value) {
      comingSoonRef.value.classList.remove('show')
    }

    // Reset new release preview card
    if (newReleasePreviewRef.value) {
      newReleasePreviewRef.value.classList.remove('show')
    }

    // Wait for DOM update
    await nextTick()

    // Setup observer for new cards
    setupIntersectionObserver()
  }

  // Watch for changes in displayed releases and reset animations
  watch(displayedReleases, resetAnimations)

  onMounted(() => {
    isHydrating.value = false
    nextTick(() => {
      setupIntersectionObserver()
    })
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })
</script>

<style lang="scss" scoped>
  // Animation timing variables - customize these to your preference
  $fade-in-duration: 0.4s;
  $fade-in-easing: ease-out;
  $hover-duration: 0.2s;
  $hover-easing: ease;

  // Reusable mixins for common patterns
  @mixin card-fade-animation {
    opacity: 0;
    transition: opacity $fade-in-duration $fade-in-easing;

    &.show {
      opacity: 1;
    }
  }

  @mixin card-sizing {
    min-width: 200px;
    min-height: 200px;
    max-width: 300px;
  }

  @mixin card-sizing-large {
    min-width: 240px;
    min-height: 240px;
    max-width: 300px;
  }

  @mixin responsive-widths {
    width: calc(50% - 0.375rem);

    @media (min-width: 640px) {
      width: calc(50% - 0.5rem);
    }

    @media (min-width: 768px) {
      width: calc(33.333% - 0.667rem);
    }

    @media (min-width: 1024px) {
      width: calc(25% - 1.125rem);
    }

    @media (min-width: 1280px) {
      width: calc(20% - 1.2rem);
    }
  }

  @mixin absolute-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  @mixin glassmorphic-base {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    position: relative;
    overflow: hidden;
  }

  @mixin text-shadow-light {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  @mixin text-shadow-medium {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  @mixin hover-lift {
    transition: all $hover-duration $hover-easing;

    &:hover {
      transform: translateY(-0.125rem);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }
  }

  @mixin noise-texture {
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
    border-radius: 16px;
    pointer-events: none;
  }

  @mixin gradient-overlay {
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  }

  // Base card styles
  .card-base {
    @include card-fade-animation;
    @include card-sizing;
    @include responsive-widths;
  }

  /* Mobile: Make single item cards wider */
  @media (max-width: 767px) {
    .flex:has(.music-card-wrapper:nth-child(1):last-child) .music-card-wrapper,
    .flex:has(.coming-soon-card:nth-child(1):last-child) .coming-soon-card,
    .flex:has(.new-release-preview:nth-child(1):last-child) .new-release-preview,
    .flex:has(.presave-card:nth-child(1):last-child) .presave-card {
      width: 100%;
      max-width: 210px;
      min-width: 210px;
    }
  }

  /* Desktop: Larger cards when few items */
  @media (min-width: 768px) {
    .flex:has(.music-card-wrapper:nth-child(-n + 3):last-child) .music-card-wrapper,
    .flex:has(.coming-soon-card:nth-child(-n + 3):last-child) .music-card-wrapper,
    .flex:has(.coming-soon-card:nth-child(-n + 3):last-child) .coming-soon-card,
    .flex:has(.new-release-preview:nth-child(-n + 3):last-child) .music-card-wrapper,
    .flex:has(.new-release-preview:nth-child(-n + 3):last-child) .coming-soon-card,
    .flex:has(.new-release-preview:nth-child(-n + 3):last-child) .new-release-preview,
    .flex:has(.presave-card:nth-child(-n + 3):last-child) .music-card-wrapper,
    .flex:has(.presave-card:nth-child(-n + 3):last-child) .coming-soon-card,
    .flex:has(.presave-card:nth-child(-n + 3):last-child) .presave-card {
      min-width: 240px;
      max-width: 280px;
    }

    .flex:has(.music-card-wrapper:nth-child(1):last-child) .music-card-wrapper,
    .flex:has(.coming-soon-card:nth-child(1):last-child) .music-card-wrapper,
    .flex:has(.coming-soon-card:nth-child(1):last-child) .coming-soon-card,
    .flex:has(.new-release-preview:nth-child(1):last-child) .music-card-wrapper,
    .flex:has(.new-release-preview:nth-child(1):last-child) .coming-soon-card,
    .flex:has(.new-release-preview:nth-child(1):last-child) .new-release-preview,
    .flex:has(.presave-card:nth-child(1):last-child) .music-card-wrapper,
    .flex:has(.presave-card:nth-child(1):last-child) .coming-soon-card,
    .flex:has(.presave-card:nth-child(1):last-child) .presave-card {
      min-width: 260px;
      max-width: 320px;
    }
  }

  .coming-soon-content {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    @include glassmorphic-base;
    @include hover-lift;

    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    &::before {
      content: '';
      @include absolute-overlay;
      @include gradient-overlay;
      border-radius: 16px;
      opacity: 0.8;
    }

    &::after {
      content: '';
      @include absolute-overlay;
      @include noise-texture;
    }
  }

  .coming-soon-icon {
    position: relative;
    z-index: 2;
    color: rgba(255, 255, 255, 0.9);
    font-size: 2.5rem;
  }

  .coming-soon-title {
    position: relative;
    z-index: 2;
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.125rem;
    font-weight: 600;
    @include text-shadow-light;
  }

  .coming-soon-text {
    position: relative;
    z-index: 2;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    line-height: 1.5;
    max-width: 85%;
    @include text-shadow-light;
  }

  /* New Release Preview */
  .new-release-preview {
    @include card-sizing-large;
    // Other styles inherited from card-base
  }

  .new-release-content {
    position: relative;
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    width: 100%;
    /* Match UiMusicCard transition */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  /* Desktop-like hover/active effects to match UiMusicCard */
  .new-release-content:hover {
    transform: translateY(-8px);
  }
  .new-release-content:active {
    transform: translateY(-4px) scale(0.98);
  }

  /* Mobile and touch device specific styles (mirror UiMusicCard) */
  @media (max-width: 767px) {
    .new-release-content:hover {
      transform: none;
    }
    .new-release-content:active {
      transform: scale(0.95);
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .new-release-overlay {
    @include absolute-overlay;
    /* Background layer under text */
    // Heavy blur and tints are baked into the preprocessed image now
    background:
      radial-gradient(60% 60% at 50% 50%, rgba(0, 0, 0, 0.25), transparent 70%),
      linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(147, 51, 234, 0.18) 100%);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    transition:
      opacity $hover-duration $hover-easing,
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0; /* hidden by default, shown on hover-capable devices */
    z-index: 1; /* stay under text */

    &::before {
      content: '';
      @include absolute-overlay;
      // Keep ultra-subtle noise only
      @include noise-texture;
      mix-blend-mode: overlay;
      opacity: 0.025;
    }
  }

  /* Desktop hover effects only */
  /* Keep overlay static to match other items (no extra hover-only changes) */

  .new-release-info {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 1.5rem;
    transition: all $hover-duration $hover-easing;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    @include absolute-overlay;
  }

  /* Remove extra internal hover motion for consistency */

  /* Hover-capable fine pointers: animate unique elements (overlay, icon, title, date) */
  @media (hover: hover) and (pointer: fine) {
    /* Overlay breathes slightly */
    .new-release-content:hover .new-release-overlay {
      transform: scale(1.03);
      opacity: 0.98;
    }
    /* Scale underlying image without relying on group */
    .new-release-content:hover :deep(img) {
      transform: scale(1.05);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    /* Icon lifts a bit more for emphasis */
    .new-release-content:hover .new-release-icon {
      transform: translateY(-2px) scale(1.1);
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25));
    }
    /* Title gets tiny emphasis */
    .new-release-content:hover .new-release-title {
      transform: translateY(-1px) scale(1.07);
      letter-spacing: 0.2px;
    }
    /* Date gently lifts and brightens */
    .new-release-content:hover .new-release-date {
      transform: translateY(-1px) scale(1.07);
      opacity: 0.92;
    }
    .new-release-content:hover .new-release-days {
      transform: translateY(-1px) scale(1.07);
      opacity: 0.92;
    }
  }

  .new-release-icon {
    color: rgba(255, 255, 255, 0.9);
    font-size: 2rem;
    transition: all $hover-duration $hover-easing;

    @media (max-width: 767px) {
      font-size: 1.6rem !important;

      &.has-date {
        margin-top: 1rem;
      }
    }
  }

  /* No icon size/color change on hover to match other items */

  .new-release-title {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.125rem;
    font-weight: 600;
    @include text-shadow-medium;
    transition: all $hover-duration $hover-easing;
    line-height: 1.5;
    margin-bottom: 0.2rem;
    white-space: nowrap;

    @media (max-width: 767px) {
      font-size: 1rem !important;
    }
  }

  /* Keep title static on hover */

  .new-release-date {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    margin-bottom: 0.1rem;
    @include text-shadow-light;
    white-space: nowrap;
    transition: all $hover-duration $hover-easing;

    @media (max-width: 767px) {
      font-size: 0.8rem !important;
    }
  }

  .new-release-days {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    @include text-shadow-light;
    transition: all $hover-duration $hover-easing;

    @media (max-width: 767px) {
      font-size: 0.725rem !important;
    }
  }

  /* Keep date static on hover */

  .new-release-label {
    display: inline-block;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    @include text-shadow-light;
    transition: all $hover-duration $hover-easing;
  }

  /* Keep label static on hover */

  /* Pre-save Card (clickable, similar to new-release-preview but with different styling) */
  .presave-card {
    @include card-sizing-large;
  }

  .presave-content {
    position: relative;
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    width: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;

    // Add a subtle dark overlay to improve text readability
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.4) 100%);
      z-index: 1;
      pointer-events: none;
    }
  }

  .presave-content:hover {
    transform: translateY(-8px);
  }

  .presave-content:active {
    transform: translateY(-4px) scale(0.98);
  }

  @media (max-width: 767px) {
    .presave-content:hover {
      transform: none;
    }
    .presave-content:active {
      transform: scale(0.95);
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .presave-overlay {
    @include absolute-overlay;
    background:
      radial-gradient(60% 60% at 50% 50%, rgba(0, 0, 0, 0.3), transparent 70%),
      linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    transition:
      opacity $hover-duration $hover-easing,
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    z-index: 1;

    &::before {
      content: '';
      @include absolute-overlay;
      @include noise-texture;
      mix-blend-mode: overlay;
      opacity: 0.025;
    }
  }

  .presave-info {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 1.5rem;
    transition: all $hover-duration $hover-easing;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    @include absolute-overlay;
    /* Always-on darkening behind the centered text so it stays legible over
       bright cover art. The .presave-overlay above only fades in on hover, which
       left the text low-contrast at rest and on touch devices. */
    background: radial-gradient(
      120% 95% at 50% 55%,
      rgba(0, 0, 0, 0.42) 0%,
      rgba(0, 0, 0, 0.2) 55%,
      transparent 82%
    );
  }

  @media (hover: hover) and (pointer: fine) {
    .presave-content:hover .presave-overlay {
      transform: scale(1.03);
      opacity: 0.98;
    }
    .presave-content:hover :deep(img) {
      transform: scale(1.05);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .presave-content:hover .presave-icon {
      transform: translateY(-2px) scale(1.1);
      filter: drop-shadow(0 6px 16px rgba(168, 85, 247, 0.4));
    }
    .presave-content:hover .presave-title {
      transform: translateY(-1px) scale(1.07);
      letter-spacing: 0.2px;
    }
    .presave-content:hover .presave-date {
      transform: translateY(-1px) scale(1.07);
      opacity: 0.92;
    }
    .presave-content:hover .presave-days {
      transform: translateY(-1px) scale(1.07);
      opacity: 0.92;
    }
  }

  .presave-icon {
    color: rgba(255, 255, 255, 0.9);
    font-size: 2rem;
    transition: all $hover-duration $hover-easing;
    filter: drop-shadow(0 4px 12px rgba(168, 85, 247, 0.3));

    @media (max-width: 767px) {
      font-size: 1.6rem !important;

      &.has-date {
        margin-top: 1rem;
      }
    }
  }

  .presave-title {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.125rem;
    font-weight: 600;
    white-space: nowrap;
    @include text-shadow-medium;
    transition: all $hover-duration $hover-easing;
    line-height: 1.5;
    margin-bottom: 0.2rem;

    @media (max-width: 767px) {
      font-size: 1rem !important;
    }
  }

  .presave-date {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    margin-bottom: 0.1rem;
    @include text-shadow-light;
    white-space: nowrap;
    transition: all $hover-duration $hover-easing;

    @media (max-width: 767px) {
      font-size: 0.8rem !important;
    }
  }

  .presave-days {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    @include text-shadow-light;
    transition: all $hover-duration $hover-easing;

    @media (max-width: 767px) {
      font-size: 0.725rem !important;
    }
  }

  /* Show More Button */
  .show-more-button {
    position: relative;
    overflow: hidden;

    &:active {
      transform: scale(0.98);
    }
  }

  /* Mobile optimizations */
  @media (max-width: 767px) {
    .card-base {
      transition-duration: ($fade-in-duration * 0.8);
      min-width: 140px;
      max-width: 180px;
    }

    .coming-soon-content,
    .new-release-content,
    .presave-content {
      min-height: 140px;
      min-width: 140px;
    }

    .coming-soon-content {
      padding: 1.5rem;
    }

    .coming-soon-title {
      font-size: 1rem;
    }

    .coming-soon-text {
      font-size: 0.75rem;
    }

    .show-more-button {
      &:hover {
        transform: none;
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .flex-wrap {
      gap: 0.75rem;
    }

    // Disable hover effects on mobile for coming soon card
    .coming-soon-content:hover {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      transform: none !important;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    }

    // Mobile active state for coming soon card touch feedback
    .coming-soon-content:active {
      transform: scale(0.96) !important;
      transition-duration: ($hover-duration * 0.5) !important;
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .card-base {
      transition-duration: ($fade-in-duration * 0.5);
      transform: translateY(0.5rem);
    }

    .coming-soon-content:hover,
    .new-release-content:hover,
    .presave-content:hover {
      transform: none !important;

      .new-release-info,
      .new-release-icon,
      .new-release-title,
      .new-release-date,
      .new-release-label,
      .presave-info,
      .presave-icon,
      .presave-title,
      .presave-date {
        transform: none !important;
      }
    }

    .new-release-content:active,
    .presave-content:active {
      transform: none !important;
    }
  }
</style>
