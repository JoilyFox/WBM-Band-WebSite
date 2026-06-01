<template>
  <div class="music-page">
    <MusicPreSaveRedirectScreen v-if="showRedirectScreen" :release="release" />
    <template v-else>
      <MusicDetailContent :release="release" :is-modal="false" :is-pre-save="true" />
      <SectionsFooterSection :minimized="true" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
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

  // Whether this page auto-redirects to a distributor smart-link. Known at
  // build time from static release data, so the prerendered HTML can show the
  // redirect screen instead of the (link-less) pre-save body — no flash.
  const willAutoRedirect = computed(() =>
    Boolean(release.useDistributorPreSave && release.distributorPreSaveUrl)
  )
  // ?bypass=true reveals the full pre-save body and cancels the redirect. It's
  // query-only, so it's unknowable at prerender time: start false so SSR + first
  // hydration render the redirect screen, then flip on mount if bypass is set.
  const bypassDistributor = ref(false)
  const showRedirectScreen = computed(() => willAutoRedirect.value && !bypassDistributor.value)

  // Distributor redirect runs client-side so query params are reachable in static builds.
  onMounted(() => {
    const bypass = route.query.bypass === 'true'
    if (willAutoRedirect.value && bypass) {
      // Debug escape hatch: show the body, don't redirect, don't log a conversion.
      bypassDistributor.value = true
      trackReleaseView({ releaseSlug: slug, pageType: 'pre-save' })
      return
    }
    // 'beacon' keeps the view alive past the external navigation below.
    trackReleaseView({
      releaseSlug: slug,
      pageType: 'pre-save',
      transport: willAutoRedirect.value ? 'beacon' : undefined
    })
    if (willAutoRedirect.value) {
      // Fire the conversion event before navigation tears down the page.
      // transport_type: 'beacon' inside trackPlatformClick keeps the
      // request alive past unload. Releases flagged skipDistributorConversionEvent
      // (distributor smart-links that complete the save off-site) opt out so the
      // auto-redirect isn't logged as a meaningless 100% conversion — release_view
      // above still records the per-source visit.
      if (!release.skipDistributorConversionEvent) {
        trackPlatformClick({ platformName: 'distributor', releaseSlug: slug, pageType: 'pre-save' })
      }
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
    /* Neutral near-black base; the cover-driven colour lives in the
       .release-atmosphere layers inside MusicDetailContent. */
    background: #050505;
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
