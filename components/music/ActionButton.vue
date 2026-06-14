<template>
  <!--
    Desktop hero action button (Music Video / Lyrics / Share). Thin adapter over
    the unified <UiButton> in the DIMMED glass family — the soft translucent wash
    that matches the old `.btn-glassmorphic` look, now controlled in one place.

    `id` / `@click` (and any other attrs) fall through this single-root wrapper to
    UiButton's native element, so `#desktop-share-button` still anchors the share
    popup and clicks still reach the parent.
  -->
  <UiButton
    variant="dimmed"
    size="lg"
    shape="rounded"
    :href="as === 'a' ? href : undefined"
    :target="target"
    :rel="rel"
    :icon="icon"
    :label="iconOnly ? undefined : label"
    :icon-only="iconOnly"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  />
</template>

<script setup lang="ts">
  /**
   * Desktop hero action button — Music Video, Lyrics or Share. `iconOnly` drops
   * the label (used for the Share button once other actions share its row).
   * Renders an <a> (external link, `as="a"`) or a <button>. The visual + the
   * interaction now come from <UiButton variant="dimmed">.
   */
  interface Props {
    as?: 'button' | 'a'
    icon: string
    label?: string
    iconOnly?: boolean
    /** Retained for API compatibility; perf tiering is handled by the glass system. */
    optimized?: boolean
    href?: string
    target?: string
    rel?: string
    ariaLabel?: string
  }

  withDefaults(defineProps<Props>(), {
    as: 'button',
    iconOnly: false,
    optimized: false
  })

  defineEmits<{ click: [MouseEvent] }>()
</script>
