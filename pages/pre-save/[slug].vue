<template>
  <div v-if="release" class="music-page">
    <MusicDetailContent :release="release" :is-modal="false" :is-pre-save="true" />
    <!-- Minimized Footer -->
    <SectionsFooterSection :minimized="true" />
  </div>
  <div v-else>
    <!-- Loading state or error will be handled by the error handling below -->
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { getReleaseBySlug } from '~/data/musicLibrary'
  import { isUpcomingRelease } from '~/utils/configHelpers'

  // Use the empty layout instead of default
  definePageMeta({
    layout: 'empty',
    middleware: ['presave-access']
  })

  const route = useRoute()

  // Get the slug from the route params
  const slug = route.params.slug as string

  // Find the release by slug
  const release = getReleaseBySlug(slug)
  const { t } = useI18n({ useScope: 'global' })

  // Validate that the release exists and is in pre-save mode
  if (!release) {
    throw createError({
      statusCode: 404,
      statusMessage: `Pre-save track "${slug}" not found`,
      data: {
        slug
      }
    })
  }

  // Check if we should redirect to distributor's pre-save page
  if (release.useDistributorPreSave && release.distributorPreSaveUrl) {
    // Redirect to distributor's pre-save URL without loading the page
    await navigateTo(release.distributorPreSaveUrl, { external: true, redirectCode: 302 })
  }

  // Check if this release is actually upcoming and has pre-save links
  if (!isUpcomingRelease(release.releaseDate)) {
    // Release date has passed, redirect to regular listen page
    const localePath = useLocalePath()
    await navigateTo(localePath(`/listen/${slug}`), { redirectCode: 301 })
  }

  if (
    (!release.preSaveMusicPlatformLinks ||
      Object.keys(release.preSaveMusicPlatformLinks).length === 0) &&
    !release.distributorPreSaveUrl
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: `Pre-save not available for "${slug}"`,
      data: {
        slug
      }
    })
  }

  const releaseTitleKey = release.titleKey || `releases.${release.slug}.title`
  const releaseDescriptionKey = release.descriptionKey || `releases.${release.slug}.description`
  const translatedTitle = t(releaseTitleKey) as string
  const localizedTitle =
    translatedTitle !== releaseTitleKey && translatedTitle
      ? translatedTitle
      : release.title || release.slug
  const translatedDescription = t(releaseDescriptionKey) as string
  const fallbackDescription =
    release.description || `Pre-save ${localizedTitle} by WBM Band on your favorite music platform.`
  const localizedDescription =
    translatedDescription !== releaseDescriptionKey && translatedDescription
      ? translatedDescription
      : fallbackDescription

  // Handle scroll position on page mount
  onMounted(() => {
    if (import.meta.client) {
      // Reset body overflow in case it was set by modal
      document.body.style.overflow = ''

      // Check if this is a navigation from the same site (not a direct load)
      const referrer = document.referrer
      const currentHost = window.location.host
      const isInternalNavigation =
        referrer.includes(currentHost) && referrer !== window.location.href

      // Only scroll to top if coming from internal navigation (like modal)
      if (isInternalNavigation) {
        nextTick(() => {
          window.scrollTo(0, 0)
        })
      }
    }
  })

  // Set page meta
  useSeoMeta({
    title: `Pre-save ${localizedTitle} | WBM Band`,
    description: localizedDescription,
    ogTitle: `Pre-save ${localizedTitle} | WBM Band`,
    ogDescription: localizedDescription,
    ogImage: release.imageUrl,
    ogType: 'music.song',
    twitterCard: 'summary_large_image',
    twitterTitle: `Pre-save ${localizedTitle} | WBM Band`,
    twitterDescription: localizedDescription,
    twitterImage: release.imageUrl
  })
</script>

<style scoped>
  .music-page {
    min-height: 100vh;
    width: 100%;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%),
      linear-gradient(to bottom, #0f0f0f, #000000);
    position: relative;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Ensure the main content takes available space and footer sticks to bottom */
  .music-page :deep(.music-detail-content) {
    flex: 1;
    min-height: 0; /* Override the min-height: 100vh from the component */
  }
</style>
