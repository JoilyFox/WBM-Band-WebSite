<template>
  <div class="music-page">
    <MusicDetailContent :release="release" :is-modal="false" />
    <SectionsFooterSection :minimized="true" />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useMasterPage } from '~/composables/useMasterPage'
  import { useAnalytics } from '~/composables/useAnalytics'

  definePageMeta({
    layout: 'empty',
    middleware: ['listen-access']
  })

  const route = useRoute()
  const slug = route.params.slug as string

  const { release, localizedTitle, localizedDescription, metaImageUrl, pageUrl, keywords } =
    useMasterPage({ slug, pageType: 'listen' })

  const { trackReleaseView } = useAnalytics()
  onMounted(() => trackReleaseView({ releaseSlug: slug, pageType: 'listen' }))

  const pageTitle = computed(() => `${localizedTitle.value} | WBM Band`)

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: localizedDescription },
      { name: 'keywords', content: keywords },
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
    ]
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
