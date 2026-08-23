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
  import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'

  definePageMeta({
    layout: 'empty',
    middleware: ['presave-access']
  })

  const route = useRoute()
  const slug = route.params.slug as string
  const sourcePrefix = route.params.source as string

  if (!(sourcePrefix in SOURCE_PREFIXES)) {
    const localePath = useLocalePath()
    await navigateTo(localePath(`/pre-save/${slug}`), { redirectCode: 302 })
  }

  const { release, localizedTitle, localizedDescription, metaImageUrl, canonicalUrl } =
    useMasterPage({
      slug,
      pageType: 'pre-save',
      sourcePrefix
    })

  if (!isUpcomingRelease(release.releaseDate)) {
    const localePath = useLocalePath()
    // Preserve the source prefix when transitioning to listen page —
    // otherwise we'd lose attribution for users who land here via a
    // bio link AFTER release date.
    await navigateTo(localePath(`/listen/${sourcePrefix}/${slug}`), { redirectCode: 301 })
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

  const { trackReleaseView, trackPlatformClick } = useAnalytics()

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

  onMounted(async () => {
    const bypass = route.query.bypass === 'true'
    if (willAutoRedirect.value && bypass) {
      // Debug escape hatch: show the body, don't redirect, don't log a conversion.
      bypassDistributor.value = true
      trackReleaseView({ releaseSlug: slug, pageType: 'pre-save' })
      return
    }
    if (willAutoRedirect.value) {
      // AWAIT delivery before the external redirect tears the page down — gtag
      // has no real beacon transport here, so fire-and-forget events are
      // cancelled on unload (which silently lost every per-source view +
      // distributor conversion). Releases flagged skipDistributorConversionEvent
      // opt out of the synthetic conversion; release_view still counts the
      // per-source visit (the whole point of the /pre-save/<source>/<slug> link).
      const pending = [trackReleaseView({ releaseSlug: slug, pageType: 'pre-save' })]
      if (!release.skipDistributorConversionEvent) {
        pending.push(
          trackPlatformClick({
            platformName: 'distributor',
            releaseSlug: slug,
            pageType: 'pre-save'
          })
        )
      }
      await Promise.all(pending)
      await navigateTo(release.distributorPreSaveUrl, { external: true, redirectCode: 302 })
      return
    }
    trackReleaseView({ releaseSlug: slug, pageType: 'pre-save' })
  })

  useSeoMeta({
    title: () => `Pre-save ${localizedTitle.value} | WBM Band`,
    description: () => localizedDescription.value,
    robots: 'noindex, follow',
    ogTitle: () => `Pre-save ${localizedTitle.value} | WBM Band`,
    ogDescription: () => localizedDescription.value,
    ogImage: () => metaImageUrl.value,
    ogType: 'music.song',
    twitterCard: 'summary_large_image',
    twitterTitle: () => `Pre-save ${localizedTitle.value} | WBM Band`,
    twitterDescription: () => localizedDescription.value,
    twitterImage: () => metaImageUrl.value
  })

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }]
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
