<template>
  <!-- Inline SVG icon: sized in em and painted with currentColor, so it behaves
       exactly like the Font Awesome <i> it replaced (same 1.25em x 1em box,
       glyph centered) — set the size with font-size / Tailwind text-* and the
       colour with `color`. Decorative by default; pass `title` to label it. -->
  <svg
    class="ui-icon"
    :viewBox="glyph.viewBox"
    preserveAspectRatio="xMidYMid meet"
    fill="currentColor"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : 'true'"
    :aria-label="title || undefined"
    focusable="false"
  >
    <path :d="glyph.d" />
  </svg>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ICON_GLYPHS, type IconName } from '~/utils/icons'

  const props = defineProps<{
    /** Glyph key from `utils/icons.ts` (unknown names fall back to `music`). */
    name: IconName | string
    /** Accessible label; omit for purely decorative icons. */
    title?: string
  }>()

  const glyph = computed(
    () =>
      (ICON_GLYPHS as Record<string, (typeof ICON_GLYPHS)[IconName]>)[props.name] ??
      ICON_GLYPHS.music
  )
</script>

<style scoped>
  .ui-icon {
    display: inline-block;
    /* Same box the FA webfont gave every glyph: 1.25em wide, 1em tall (line-height 1). */
    width: 1.25em;
    height: 1em;
    flex: none;
    overflow: visible;
  }
</style>
