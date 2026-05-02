<template>
  <div class="music-page">
    <MusicDetailContent :release="release" :is-modal="false" />
    <SectionsFooterSection :minimized="true" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useMasterPage } from '~/composables/useMasterPage'
  import { SOURCE_PREFIXES, type SourcePrefix } from '~/utils/sourceAttribution'

  definePageMeta({
    layout: 'empty',
    middleware: ['listen-access']
  })

  const route = useRoute()
  const slug = route.params.slug as string
  const sourcePrefix = route.params.source as string

  // Unknown prefixes redirect to the clean URL — keeps attribution honest
  // (we don't want random /listen/foo/<slug> attempts polluting events).
  if (!(sourcePrefix in SOURCE_PREFIXES)) {
    const localePath = useLocalePath()
    await navigateTo(localePath(`/listen/${slug}`), { redirectCode: 302 })
  }

  const { release, localizedTitle, localizedDescription, metaImageUrl, pageUrl, keywords } =
    useMasterPage({ slug, pageType: 'listen', sourcePrefix })

  const pageTitle = computed(() => `${localizedTitle.value} | WBM Band`)
  const platformLabel = SOURCE_PREFIXES[sourcePrefix as SourcePrefix]

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: localizedDescription },
      { name: 'keywords', content: keywords },
      // Discourage search-engine indexing of attribution variants — the
      // canonical clean URL is what should rank.
      { name: 'robots', content: 'noindex, follow' },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: localizedDescription },
      { property: 'og:image', content: metaImageUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '1200' },
      { property: 'og:type', content: 'music.song' },
      { property: 'og:url', content: pageUrl },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: localizedDescription },
      { name: 'twitter:image', content: metaImageUrl }
    ],
    link: [
      // Canonical points at the clean URL so search engines consolidate
      // ranking signals there instead of splitting them across prefixes.
      { rel: 'canonical', href: `https://www.wbmband.com/listen/${slug}` }
    ]
  })

  // Mark unused so TS doesn't complain — kept for clarity at the
  // call site that this prefix is the attribution we lock in.
  void platformLabel
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
