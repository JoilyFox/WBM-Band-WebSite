<template>
  <component
    :is="as"
    class="music-hero-pill inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1 text-sm font-medium text-primary-200/70 bg-white/5 border border-white/15 backdrop-blur-md transition-all duration-100 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-[0.98] active:bg-white/15 active:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
    :class="{ 'music-hero-pill--video': accent === 'video' }"
    v-bind="elementAttrs"
    @click="$emit('click', $event)"
  >
    <i v-if="icon" :class="icon" aria-hidden="true"></i>
    <slot>
      <UiResponsiveText
        v-if="narrowLabel || wideLabel"
        :narrow="narrowLabel || wideLabel || ''"
        :wide="wideLabel || narrowLabel || ''"
        :breakpoint="breakpoint"
      />
      <span v-else-if="label">{{ label }}</span>
    </slot>
  </component>
</template>

<script setup lang="ts">
  /**
   * Shared glass "pill" used for the release-page hero actions (Music Video,
   * Lyrics, Collapse, Back). One look, prop-driven states:
   *  - `as`        : 'button' (default) or 'a' (renders the matching element)
   *  - `icon`      : full icon class string incl. size, e.g. 'fab fa-youtube text-base'
   *  - `label`     : fixed label, OR
   *  - narrow/wide : responsive label that swaps at `breakpoint` (UiResponsiveText)
   *  - `accent`    : 'video' adds the soft red YouTube glow on the LEFT edge
   * A default <slot> overrides the label entirely when needed.
   */
  interface Props {
    as?: 'button' | 'a'
    icon?: string
    label?: string
    narrowLabel?: string
    wideLabel?: string
    breakpoint?: number
    accent?: 'none' | 'video'
    href?: string
    target?: string
    rel?: string
    ariaLabel?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'button',
    accent: 'none',
    breakpoint: 440
  })

  defineEmits<{ click: [MouseEvent] }>()

  const elementAttrs = computed(() =>
    props.as === 'a'
      ? { href: props.href, target: props.target, rel: props.rel, 'aria-label': props.ariaLabel }
      : { type: 'button', 'aria-label': props.ariaLabel }
  )
</script>

<style scoped>
  /* Soft red YouTube cue: a hint of red anchored to the LEFT edge (grey on the
     right). Used by the Music Video pill via `accent="video"`. */
  .music-hero-pill--video {
    background-image: radial-gradient(circle at 0% 50%, rgba(255, 0, 0, 0.2) 0%, transparent 52%);
  }
</style>
