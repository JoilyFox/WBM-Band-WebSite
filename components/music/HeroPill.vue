<template>
  <!--
    Render NATIVE <a>/<button> explicitly — do NOT use <component :is="as">.
    PrimeVue globally registers a `Button` component, and Vue resolves the
    dynamic-component string 'button' to it (case-insensitive), so `:is="'button'"`
    silently rendered a full PrimeVue Button + Ripple instead of a plain element.
    In unstyled mode (no PrimeVue CSS) the ripple's <span class="p-ink"> is not
    position:absolute, so on a real pointer-down it became a static block and
    inflated the pill to ~200px tall. Native elements avoid the whole class of bug.
  -->
  <a
    v-if="as === 'a'"
    :class="pillClass"
    :href="href"
    :target="target"
    :rel="rel"
    :aria-label="ariaLabel"
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
  </a>
  <button
    v-else
    type="button"
    :class="pillClass"
    :aria-label="ariaLabel"
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
  </button>
</template>

<script setup lang="ts">
  /**
   * Shared glass "pill" used for the release-page hero actions (Music Video,
   * Lyrics, Collapse, Back). One look, prop-driven states:
   *  - `as`        : 'button' (default) or 'a' (renders the matching NATIVE element)
   *  - `icon`      : full icon class string incl. size, e.g. 'fab fa-youtube text-base'
   *  - `label`     : fixed label, OR
   *  - narrow/wide : responsive label that swaps at `breakpoint` (UiResponsiveText)
   *  - `accent`    : 'video' adds the soft red YouTube glow on the LEFT edge
   * A default <slot> overrides the label entirely when needed.
   *
   * NOTE: rendered as explicit <a>/<button> (not <component :is>) on purpose —
   * see the template comment for the PrimeVue Button name-collision it avoids.
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

  // `appearance-none` keeps the native <button> from picking up platform control
  // sizing; `self-center` pins align-self so a flex parent can't stretch the pill.
  // `relative` anchors the scoped ::after specular rim/sheen (added in <style>).
  const pillClass = computed(() => [
    'music-hero-pill relative inline-flex appearance-none items-center justify-center self-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1 text-sm font-medium leading-5 text-primary-200/70 bg-white/5 backdrop-blur-md transition-[transform,background-color] duration-100 ease-in-out hover:bg-white/10 active:scale-[0.98] active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25',
    { 'music-hero-pill--video': props.accent === 'video' }
  ])
</script>

<style scoped>
  /*
   * Specular rim + faint top sheen so the pill reads as part of the liquid-glass
   * family WITHOUT a full .liquid-glass conversion — these pills live under the
   * MusicDetailContent perf root (perf-tier / mobile-tier ancestors) whose cascade
   * fights backdrop-filter, so we keep the existing Tailwind backdrop-blur-md
   * (already perf-tiered upstream) and only paint a lightweight inner highlight.
   * The ::after is purely decorative: it sits above the pill background but
   * BELOW the content (which is lifted to z-index:1), and never intercepts
   * pointer events.
   */
  .music-hero-pill::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 0;
    /* top-left bright rim, soft bottom-right rim, hairline inner edge */
    box-shadow:
      inset 1.5px 1.5px 1px -1px rgb(255 255 255 / 0.45),
      inset -1px -1px 1px -1px rgb(255 255 255 / 0.12),
      inset 0 0 0 1px rgb(255 255 255 / 0.04);
    /* faint sheen falling off from the top edge */
    background-image: linear-gradient(
      to bottom,
      rgb(255 255 255 / 0.1) 0%,
      rgb(255 255 255 / 0) 45%
    );
  }

  /* Keep icon + label above the decorative ::after rim/sheen. */
  .music-hero-pill > * {
    position: relative;
    z-index: 1;
  }

  .music-hero-pill--video {
    background-image: radial-gradient(circle at 0% 50%, rgba(255, 0, 0, 0.2) 0%, transparent 100%);
    background-repeat: no-repeat;
    background-position: left center;
    background-size: 45% 100%;
  }
</style>
