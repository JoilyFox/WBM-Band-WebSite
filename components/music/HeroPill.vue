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
  const pillClass = computed(() => [
    'music-hero-pill inline-flex appearance-none items-center justify-center self-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1 text-sm font-medium leading-5 text-primary-200/70 bg-white/5 border border-white/15 backdrop-blur-md transition-[transform,background-color,border-color] duration-100 ease-in-out hover:bg-white/10 hover:border-white/20 active:scale-[0.98] active:bg-white/15 active:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25',
    { 'music-hero-pill--video': props.accent === 'video' }
  ])
</script>

<style scoped>
  /* Music Video pill (`accent="video"`): a red-brown left border (#573138) by the
     YouTube play logo and an opaque grey right border (#3d383e). Both are opaque,
     so the soft red background glow can't bleed THROUGH them — only the
     translucent top/bottom edges pick the glow up. On hover/active the left &
     right edges follow the same white/20 → white/30 lightening as the top/bottom
     borders, so all four stay in sync. */
  .music-hero-pill--video {
    border-left-color: #573138;
    border-right-color: #3d383e;
    /* Red YouTube glow from the left edge. Drawn as a sized, non-repeating box so
       its WIDTH (background-size) is animatable — it widens as the pill reduces in
       the lyrics view (45% → 60% → 100%; see MusicDetailContent.styles.css). The
       gradient itself reaches transparent at the box edge, so background-size 45%
       reproduces the original "transparent 45%" look. */
    background-image: radial-gradient(circle at 0% 50%, rgba(255, 0, 0, 0.2) 0%, transparent 100%);
    background-repeat: no-repeat;
    background-position: left center;
    background-size: 45% 100%;
  }

  @media (hover: hover) and (pointer: fine) {
    .music-hero-pill--video:hover {
      border-left-color: #613d43;
      border-right-color: #4b444d;
    }
  }

  .music-hero-pill--video:active {
    border-left-color: #73575d;
    border-right-color: #5f5a61;
  }
</style>
