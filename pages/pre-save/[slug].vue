<template>
  <div class="music-page">
    <MusicDetailContent :release="release" :is-modal="false" :is-pre-save="true" />
    <SectionsFooterSection :minimized="true" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useMasterPage } from '~/composables/useMasterPage'
  import { useAnalytics } from '~/composables/useAnalytics'
  import { isUpcomingRelease } from '~/utils/configHelpers'

  definePageMeta({
    layout: 'empty',
    middleware: ['presave-access']
  })

  const route = useRoute()
  const slug = route.params.slug as string

  const { release, localizedTitle, localizedDescription, metaImageUrl } = useMasterPage({
    slug,
    pageType: 'pre-save'
  })

  const { trackReleaseView, trackPlatformClick } = useAnalytics()

  if (!isUpcomingRelease(release.releaseDate)) {
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
      data: { slug }
    })
  }

  // Distributor redirect runs client-side so query params are reachable in static builds.
  onMounted(() => {
    trackReleaseView({ releaseSlug: slug, pageType: 'pre-save' })
    const bypassDistributor = route.query.bypass === 'true'
    if (release.useDistributorPreSave && release.distributorPreSaveUrl && !bypassDistributor) {
      // Fire the conversion event before navigation tears down the page.
      // transport_type: 'beacon' inside trackPlatformClick keeps the
      // request alive past unload.
      trackPlatformClick({ platformName: 'distributor', releaseSlug: slug, pageType: 'pre-save' })
      navigateTo(release.distributorPreSaveUrl, { external: true, redirectCode: 302 })
    }
  })

  useSeoMeta({
    title: () => `Pre-save ${localizedTitle.value} | WBM Band`,
    description: () => localizedDescription.value,
    ogTitle: () => `Pre-save ${localizedTitle.value} | WBM Band`,
    ogDescription: () => localizedDescription.value,
    ogImage: () => metaImageUrl.value,
    ogType: 'music.song',
    twitterCard: 'summary_large_image',
    twitterTitle: () => `Pre-save ${localizedTitle.value} | WBM Band`,
    twitterDescription: () => localizedDescription.value,
    twitterImage: () => metaImageUrl.value
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

  .music-page :deep(.music-detail-content) {
    flex: 1;
    min-height: 0;
  }
</style>
