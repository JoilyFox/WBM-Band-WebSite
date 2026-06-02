<template>
  <span :class="['responsive-text', scopeClass]">
    <span class="responsive-text__narrow">{{ narrow }}</span>
    <span class="responsive-text__wide">{{ wide }}</span>
  </span>
</template>

<script setup lang="ts">
  import { computed, useId } from 'vue'

  // Swaps a short (narrow) label for a longer (wide) one at a viewport-width
  // breakpoint. Pure CSS — both strings are in the DOM and CSS reveals exactly
  // one per width, so it is SSR-safe with NO hydration flash and no resize
  // listener. Only the visible label contributes to the accessible name
  // (display:none text is excluded), so the control reads correctly at any width.
  //
  // The breakpoint is a PROP. A CSS @media width can't read a CSS variable, and a
  // Tailwind `min-[..]:` class can't be built from a runtime value (JIT needs a
  // static literal), so the per-instance swap rule is injected into <head> via
  // useHead — still pure CSS, still flash-free, but now the threshold is settable.
  interface Props {
    /** Short label, shown below `breakpoint` (mobile-first default). */
    narrow: string
    /** Longer label, shown at/above `breakpoint`. */
    wide: string
    /** Viewport width (px) at/above which the wide label replaces the narrow. */
    breakpoint?: number
  }

  const props = withDefaults(defineProps<Props>(), { breakpoint: 440 })

  // SSR-stable, per-instance class so each instance's injected rule targets only
  // its own spans (different instances may pass different breakpoints).
  const scopeClass = `rt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Descendant combinators only (no `>`) so the CSS text has no HTML-special
  // characters that head serialization might escape.
  const css = computed(
    () =>
      `.${scopeClass} .responsive-text__wide{display:none}` +
      `@media (min-width:${props.breakpoint}px){` +
      `.${scopeClass} .responsive-text__narrow{display:none}` +
      `.${scopeClass} .responsive-text__wide{display:inline}}`
  )

  useHead(
    computed(() => ({
      style: [{ key: scopeClass, innerHTML: css.value }]
    }))
  )
</script>
