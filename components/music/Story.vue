<template>
  <!-- First-hand "about the song" prose, the band's own words. Rendered into the
       static /listen HTML (SSR) — unique, crawlable text that streaming/lyrics
       aggregators structurally can't have, and the single highest-value on-page
       SEO/E-E-A-T signal. The same text feeds the MusicRecording JSON-LD
       description, so structured data matches visible content. -->
  <section class="music-story mx-auto mt-14 max-w-2xl px-1">
    <h2
      class="music-story__title text-center text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-md"
    >
      {{ t('music.detail.about_title') }}
    </h2>
    <p class="music-story__body">{{ story }}</p>
  </section>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  interface Props {
    story: string
  }

  defineProps<Props>()

  // Global scope keeps SSR/CSR in sync, matching the other music components.
  const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped>
  .music-story__body {
    /* A touch dimmer than the lyric lines so it reads as supporting prose; left-
       aligned for long-form readability inside the centered column. */
    margin: 0 auto;
    max-width: 42rem;
    color: rgba(224, 231, 255, 0.82);
    font-size: 1rem;
    line-height: 1.8;
    text-align: left;
    text-wrap: pretty;
  }

  @media (min-width: 768px) {
    .music-story__body {
      font-size: 1.05rem;
    }
  }
</style>
