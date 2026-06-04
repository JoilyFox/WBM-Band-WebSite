<template>
  <div class="music-page">
    <MusicDetailContent
      :release="release"
      :is-modal="false"
      :initial-show-lyrics="true"
      :lyrics-url-sync="true"
      @view-change="view = $event"
    />
    <SectionsFooterSection :minimized="true" />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useMasterPage } from '~/composables/useMasterPage'
  import { useReleaseStructuredData } from '~/composables/useStructuredData'
  import { useReleaseHead, type ReleaseView } from '~/composables/useReleaseHead'
  import { useAnalytics } from '~/composables/useAnalytics'

  definePageMeta({
    layout: 'empty',
    middleware: ['lyrics-access']
  })

  const route = useRoute()
  const slug = route.params.slug as string

  // Same release lookup as the listen page; this page just boots the shared
  // MusicDetailContent with the lyrics view already open (lyrics SSR-rendered
  // into the static HTML so crawlers see the text without running JS).
  const { release, localizedTitle, localizedDescription, metaImageUrl } = useMasterPage({
    slug,
    pageType: 'lyrics'
  })

  // MusicRecording (+ embedded lyric text) + 3-level BreadcrumbList JSON-LD.
  useReleaseStructuredData({ release, localizedTitle, metaImageUrl, variant: 'lyrics' })

  // Starts on the lyrics view; flips to 'links' if the visitor cross-slides back
  // to the platform links (which also rewrites the URL to /listen/<slug>).
  const view = ref<ReleaseView>('lyrics')
  useReleaseHead({ slug, localizedTitle, localizedDescription, metaImageUrl, view })

  // A lyrics-page visit is still a release view; reuse the 'listen' funnel rather
  // than introduce a new analytics page_type (keeps the GA4 schema unchanged).
  const { trackReleaseView } = useAnalytics()
  onMounted(() => trackReleaseView({ releaseSlug: slug, pageType: 'listen' }))
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
