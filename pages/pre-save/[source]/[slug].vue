<template>
  <div class="music-page">
    <MusicDetailContent :release="release" :is-modal="false" :is-pre-save="true" />
    <SectionsFooterSection :minimized="true" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useMasterPage } from '~/composables/useMasterPage'
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

  const { release, localizedTitle, localizedDescription, metaImageUrl } = useMasterPage({
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

  onMounted(() => {
    const bypassDistributor = route.query.bypass === 'true'
    if (release.useDistributorPreSave && release.distributorPreSaveUrl && !bypassDistributor) {
      navigateTo(release.distributorPreSaveUrl, { external: true, redirectCode: 302 })
    }
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
    link: [{ rel: 'canonical', href: `https://www.wbmband.com/pre-save/${slug}` }]
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
