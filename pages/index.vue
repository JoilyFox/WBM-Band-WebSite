<template>
  <div>
    <!-- Hero Section -->
    <SectionsHeroSection @primary-action="handleListenNow" @secondary-action="handleTourDates" />

    <!-- Music Library Section -->
    <SectionsMusicLibrarySection
      :max-items="8"
      @release-click="handleReleaseClick"
      @show-more="handleShowAllMusic"
    />

    <CommonGradientSectionWrapper>
      <!-- About Us Section -->
      <SectionsAboutUsSection />

      <!-- Our Team Section (Subsection of About Us) *STILL IN PRODUCTION* -->
      <!-- <SectionsOurTeam /> -->

      <!-- Contacts Section -->
      <SectionsContactsSection />
    </CommonGradientSectionWrapper>

    <!-- Music Detail Modal -->
    <MusicDetailModal
      v-if="selectedRelease"
      :release="selectedRelease"
      :is-visible="isModalOpen"
      :is-pre-save="isSelectedReleasePreSave"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useSnackbar } from '~/composables/useSnackbar'
  import { useScrollTo } from '~/composables/useScrollTo'
  import { useImagePreloader } from '~/composables/useImagePreloader'
  import { useMusicNavigation } from '~/composables/useMusicNavigation'
  import { createPageTitle } from '~/constants/app'
  import { musicLibrary } from '~/data/musicLibrary'
  import { getConfig } from '~/utils/configHelpers'
  import type { MusicRelease } from '~/data/musicLibrary'

  const { t, locale } = useI18n()

  // Check for maintenance mode
  const maintenanceMode = computed(() => getConfig('general.maintenanceMode'))
  if (maintenanceMode.value) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Site Under Construction',
      data: {
        isMaintenance: true
      }
    })
  }

  // Computed properties for config values
  const bandName = computed(() => getConfig('general.bandName'))
  const fullBandName = computed(() => getConfig('general.fullBandName'))

  // Get the latest released track
  const latestRelease = computed(() => {
    const now = new Date()
    const released = musicLibrary
      .filter((release) => new Date(release.releaseDate) <= now)
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    return released.length > 0 ? released[0] : null
  })

  // Get release title (localized if available)
  const latestReleaseTitle = computed(() => {
    if (!latestRelease.value) return ''
    if (latestRelease.value.titleKey) {
      return t(latestRelease.value.titleKey)
    }
    return latestRelease.value.title
  })

  // Computed properties for page title and description
  const pageTitle = computed(() => fullBandName.value)
  const pageDescription = computed(() => {
    if (latestReleaseTitle.value) {
      return t('app.meta_description', { release: latestReleaseTitle.value })
    }
    return `${bandName.value} - ${t('app.tagline')}`
  })

  // Meta image URL
  const metaImageUrl = computed(() => {
    const baseUrl = 'https://www.wbmband.com'
    return `${baseUrl}/images/optimized/meta-images/meta-cover.jpg`
  })

  // Page URL for og:url - handles root URL (wbmband.com) to show Ukrainian
  const pageUrl = computed(() => {
    const baseUrl = 'https://www.wbmband.com'
    // For Ukrainian locale, use root URL or /ua
    if (locale.value === 'ua') {
      return baseUrl
    }
    // For other locales, include the locale prefix
    return `${baseUrl}/${locale.value}`
  })

  // Comprehensive keywords for SEO
  const keywords = computed(() => {
    const baseKeywords = [
      'WBM',
      'WBM Band',
      'Woman Based Mechanics',
      'ВМБ',
      'ВБМ гурт',
      'Вуман Бейсд Меканікс',
      'Вумен Бейсд Мекенікс',
      'rock',
      'punk',
      'alternative',
      'music',
      'band',
      'рок',
      'панк',
      'альтернатива',
      'музика',
      'гурт',
      'wbm music',
      'вбм музика',
      'вмб музика',
      'WBM Kyiv',
      'WBM Ukraine',
      'ВМБ Київ',
      'ВМБ Україна',
      'WBM concerts',
      'WBM tour',
      'ВМБ концерти',
      'ВМБ тур'
    ]
    return baseKeywords.join(', ')
  })

  useHead({
    title: pageTitle,
    meta: [
      {
        name: 'description',
        content: pageDescription
      },
      {
        name: 'keywords',
        content: keywords
      },
      // Open Graph
      {
        property: 'og:title',
        content: pageTitle
      },
      {
        property: 'og:description',
        content: pageDescription
      },
      {
        property: 'og:image',
        content: metaImageUrl
      },
      {
        property: 'og:image:width',
        content: '1200'
      },
      {
        property: 'og:image:height',
        content: '630'
      },
      {
        property: 'og:type',
        content: 'website'
      },
      {
        property: 'og:url',
        content: pageUrl
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: pageTitle
      },
      {
        name: 'twitter:description',
        content: pageDescription
      },
      {
        name: 'twitter:image',
        content: metaImageUrl
      }
    ]
  })

  // Composables
  const snackbar = useSnackbar()
  const { scrollToElement } = useScrollTo()
  const { preloadHeroImages, preloadAlbumCovers } = useImagePreloader()
  const { selectedRelease, isModalOpen, isSelectedReleasePreSave, handleMusicClick, closeModal } =
    useMusicNavigation()

  // Hero images for preloading — first slide of each orientation set so the
  // LCP image is warm regardless of device orientation. The hero slider
  // (orientation-aware) will pick whichever matches the viewport.
  const heroImages = computed(() => [
    {
      src: '/images/optimized/hero-images/horizontal/hero-1.avif',
      alt: `${bandName.value} performing live on stage`
    },
    {
      src: '/images/optimized/hero-images/vertical/hero-1.avif',
      alt: `${bandName.value} performing live on stage`
    }
  ])

  // Preload critical images on mount
  onMounted(async () => {
    // Preload hero images with high priority
    await preloadHeroImages(heroImages.value)

    // Preload first 6 album covers (above the fold)
    const albumImageUrls = musicLibrary.slice(0, 6).map((release) => release.imageUrl)

    preloadAlbumCovers(albumImageUrls, 6)
  })

  // Event handlers for hero section
  const handleListenNow = () => {
    // Always scroll to music section on all devices
    scrollToElement('music')
  }

  const handleTourDates = () => {
    // TODO: Implement navigation to tour dates section
    snackbar.show({
      type: 'info',
      message: t('snackbar.tour.title') as string,
      subtitle: t('snackbar.tour.subtitle') as string
    })
  }

  // Event handlers for music library section
  const handleReleaseClick = (release: MusicRelease) => {
    handleMusicClick(release)
  }

  const handleShowAllMusic = () => {
    // TODO: Navigate to dedicated music library page
    snackbar.show({
      type: 'info',
      message: t('snackbar.music_library.title') as string,
      subtitle: t('snackbar.music_library.subtitle') as string
    })
  }
</script>
