<template>
  <div class="music-lyrics w-full">
    <!-- Header: centered title. The open/close control is the morphing hero
         pill (Lyrics ⇄ Back to Music) in MusicDetailContent — this pane no longer
         carries its own back button. -->
    <div class="mb-6">
      <h2
        class="text-center text-2xl md:text-3xl font-extrabold bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-md"
      >
        {{ t('music.detail.lyrics_title') }}
      </h2>
    </div>

    <!-- Lyrics body: labeled sections, original-language lines. -->
    <div class="lyrics-body mx-auto max-w-2xl text-center">
      <section v-for="(section, sIndex) in sections" :key="sIndex" class="lyrics-section">
        <h3 v-if="labelFor(section)" class="lyrics-section__label">{{ labelFor(section) }}</h3>
        <p class="lyrics-section__lines">
          <template v-for="(line, lIndex) in section.lines" :key="lIndex">
            <span>{{ line }}</span
            ><br v-if="lIndex < section.lines.length - 1" />
          </template>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { LyricsSection } from '~/data/musicLibrary'

  interface Props {
    sections: LyricsSection[]
  }

  defineProps<Props>()

  // Global scope keeps SSR/CSR in sync, matching the other music components.
  const { t } = useI18n({ useScope: 'global' })

  // Localized section heading. Returns '' when the part is unset OR has no
  // translation, so the section renders its lines with no heading ("if not set,
  // so not render"). An optional ordinal is appended, e.g. "Verse 2" / "Куплет 2".
  const labelFor = (section: LyricsSection): string => {
    if (!section.part) return ''
    const key = `music.parts.${section.part}`
    const label = t(key)
    if (!label || label === key) return ''
    return section.num ? `${label} ${section.num}` : label
  }
</script>

<style scoped>
  .lyrics-section + .lyrics-section {
    margin-top: 1.75rem;
  }

  .lyrics-section__label {
    display: inline-block;
    margin-bottom: 0.55rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    /* Cover-driven accent (release theme), with a safe fallback. Uses the strong
       (near-opaque) accent so the label is clearly legible while still reading a
       touch dimmer than the lyric lines below it. */
    color: var(--bloom-accent-strong, #a5b4fc);
    opacity: 0.95;
  }

  .lyrics-section__lines {
    color: rgba(224, 231, 255, 0.92);
    font-size: 1.05rem;
    line-height: 1.85;
  }

  @media (min-width: 768px) {
    .lyrics-section__lines {
      font-size: 1.15rem;
    }
  }
</style>
