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

      <!-- Our Team Section (Subsection of About Us) — STILL IN DEVELOPMENT, hidden on prod.
           Re-enable by uncommenting the line below once the team section is ready. -->
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
  import { useBandStructuredData } from '~/composables/useStructuredData'
  import { createPageTitle, SITE_URL } from '~/constants/app'
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
    return `${SITE_URL}/images/optimized/meta-images/meta-cover.jpg`
  })

  // Page URL for og:url - handles root URL (wbmband.com) to show Ukrainian
  const pageUrl = computed(() => {
    // For Ukrainian locale, use root URL or /ua
    if (locale.value === 'ua') {
      return SITE_URL
    }
    // For other locales, include the locale prefix
    return `${SITE_URL}/${locale.value}`
  })

  useHead({
    title: pageTitle,
    meta: [
      {
        name: 'description',
        content: pageDescription
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
    ],
    link: [
      // Self-referential canonical (ua → origin root, en → /en) so the home
      // page consolidates onto one URL, matching the sitemap.
      { rel: 'canonical', href: pageUrl },
      // Reciprocal language alternates so Google serves the right-language home
      // and pairs ua/en instead of treating them as duplicates (x-default → ua,
      // the default locale). The home is one of the few surfaces where BOTH
      // locales are independently indexed, so hreflang applies here.
      { rel: 'alternate', hreflang: 'uk-UA', href: SITE_URL },
      { rel: 'alternate', hreflang: 'en-US', href: `${SITE_URL}/en` },
      { rel: 'alternate', hreflang: 'x-default', href: SITE_URL }
    ]
  })

  // Emit the site-wide band entity (MusicGroup + WebSite) JSON-LD into the
  // prerendered HTML for Google + AI/LLM entity understanding.
  useBandStructuredData()

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
      alt: `${bandName.value} performing live on stage`,
      preset: 'hero'
    },
    {
      src: '/images/optimized/hero-images/vertical/hero-1.avif',
      alt: `${bandName.value} performing live on stage`,
      preset: 'heroVertical'
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
