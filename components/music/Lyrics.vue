<template>
  <div class="music-lyrics w-full">
    <!-- Header: back-to-platforms control + centered title -->
    <div class="mb-6 flex items-center gap-2">
      <button
        type="button"
        class="lyrics-back inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium text-primary-200/80 bg-white/5 border border-white/15 transition-colors hover:bg-white/10 hover:border-white/25 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
        :aria-label="t('music.a11y.back_to_platforms')"
        @click="$emit('back')"
      >
        <i class="pi pi-arrow-left text-sm leading-none" aria-hidden="true"></i>
        <span>{{ t('music.buttons.back') }}</span>
      </button>
      <h2
        class="flex-1 text-center text-2xl md:text-3xl font-extrabold bg-gradient-to-br from-primary-50 to-primary-200 bg-clip-text text-transparent drop-shadow-md"
      >
        {{ t('music.detail.lyrics_title') }}
      </h2>
      <!-- Spacer balances the back button so the title stays optically centered. -->
      <span class="lyrics-header-spacer shrink-0" aria-hidden="true"></span>
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
  defineEmits<{ back: [] }>()

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
  /* Roughly matches the back-button width so the title is centered between them. */
  .lyrics-header-spacer {
    width: 4.5rem;
  }

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
    /* Cover-driven accent (release theme), with a safe fallback. */
    color: var(--bloom-accent, #a5b4fc);
    opacity: 0.9;
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
