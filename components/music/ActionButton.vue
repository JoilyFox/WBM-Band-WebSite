<template>
  <!--
    Glassmorphic desktop hero action button (Music Video / Lyrics / Share). Wraps
    the shared `.btn-glassmorphic` look (assets/css/primevue/buttons.scss) so the
    actions sit in one row with a consistent design.

    Rendered as explicit native <a>/<button> (NOT <component :is="'button'">) on
    purpose: Vue resolves the dynamic-component string 'button' to the globally
    registered PrimeVue Button, which in unstyled mode drags in a broken ripple —
    see the longer note in HeroPill.vue.
  -->
  <a
    v-if="as === 'a'"
    class="btn-glassmorphic music-action-btn"
    :class="stateClasses"
    :href="href"
    :target="target"
    :rel="rel"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <i :class="icon" aria-hidden="true"></i>
    <span v-if="!iconOnly" class="music-action-btn__label">{{ label }}</span>
  </a>
  <button
    v-else
    type="button"
    class="btn-glassmorphic music-action-btn"
    :class="stateClasses"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <i :class="icon" aria-hidden="true"></i>
    <span v-if="!iconOnly" class="music-action-btn__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
  /**
   * Desktop hero action button — Music Video, Lyrics or Share. `iconOnly` drops
   * the label (used for the Share button once other actions share its row) and
   * squares up the padding. Renders an <a> (external link) or a <button>.
   */
  interface Props {
    as?: 'button' | 'a'
    icon: string
    label?: string
    iconOnly?: boolean
    /** Low-perf tier → the cheaper `.btn-glassmorphic--optimized` variant. */
    optimized?: boolean
    href?: string
    target?: string
    rel?: string
    ariaLabel?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'button',
    iconOnly: false,
    optimized: false
  })

  defineEmits<{ click: [MouseEvent] }>()

  const stateClasses = computed(() => ({
    'btn-glassmorphic--optimized': props.optimized,
    'music-action-btn--icon-only': props.iconOnly
  }))
</script>

<style scoped>
  /* Uniform height so the icon-only Share matches the labelled buttons. The
     glassmorphic base is height:auto, so without a label the textless button's
     line box (just the icon) was ~6px shorter. 3rem (48px) keeps the text buttons
     visually unchanged and is a comfortable click/touch target. */
  .music-action-btn {
    min-height: 3rem;
  }

  /* Match the share button's icon size (PrimeVue gave .p-button-icon 1rem). */
  .music-action-btn i {
    font-size: 1rem;
    line-height: 1;
  }

  .music-action-btn__label {
    white-space: nowrap;
  }

  /* Icon-only (e.g. Share once Lyrics joins the row): drop the horizontal padding
     and square the button — width = the 3rem height — with the glyph centred. The
     scoped [data-v] + !important outrank the global `.btn-glassmorphic`
     width/min-width/padding (all !important). */
  .music-action-btn--icon-only {
    width: 3rem !important;
    min-width: 3rem !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    justify-content: center;
  }
</style>
