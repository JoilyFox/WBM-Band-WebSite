<template>
  <!-- Explicit native elements (NOT <component :is="'button'">, which silently
       resolves to the global PrimeVue Button and inflates the tap target with an
       unstyled Ripple — see the iOS button-appearance gotcha). -->
  <NuxtLink
    v-if="to"
    :to="to"
    :class="rootClass"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
    v-bind="$attrs"
  >
    <span class="lg-btn__content">
      <i v-if="icon && iconPos === 'left'" :class="icon" class="lg-btn__icon" aria-hidden="true" />
      <span v-if="hasLabel" class="lg-btn__label"
        ><slot>{{ label }}</slot></span
      >
      <i v-if="icon && iconPos === 'right'" :class="icon" class="lg-btn__icon" aria-hidden="true" />
    </span>
  </NuxtLink>

  <a
    v-else-if="href"
    :href="href"
    :target="target"
    :rel="computedRel"
    :class="rootClass"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
    v-bind="$attrs"
  >
    <span class="lg-btn__content">
      <i v-if="icon && iconPos === 'left'" :class="icon" class="lg-btn__icon" aria-hidden="true" />
      <span v-if="hasLabel" class="lg-btn__label"
        ><slot>{{ label }}</slot></span
      >
      <i v-if="icon && iconPos === 'right'" :class="icon" class="lg-btn__icon" aria-hidden="true" />
    </span>
  </a>

  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :class="rootClass"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
    v-bind="$attrs"
  >
    <span class="lg-btn__content">
      <i v-if="icon && iconPos === 'left'" :class="icon" class="lg-btn__icon" aria-hidden="true" />
      <span v-if="hasLabel" class="lg-btn__label"
        ><slot>{{ label }}</slot></span
      >
      <i v-if="icon && iconPos === 'right'" :class="icon" class="lg-btn__icon" aria-hidden="true" />
    </span>
  </button>
</template>

<script setup lang="ts">
  import { computed, useSlots } from 'vue'

  type Variant = 'clear' | 'dimmed' | 'solid' | 'outline' | 'ghost'
  type Size = 'sm' | 'md' | 'lg'
  type Shape = 'capsule' | 'rounded' | 'circle'

  interface Props {
    /** Visual family. clear/dimmed are liquid-glass; solid/outline/ghost are flat. */
    variant?: Variant
    size?: Size
    /** capsule (default) | rounded | circle (use with iconOnly). */
    shape?: Shape
    /** Leading/trailing icon class, e.g. "pi pi-times" or "fab fa-spotify". */
    icon?: string | null
    iconPos?: 'left' | 'right'
    iconOnly?: boolean
    /** Text when not using the default slot. */
    label?: string
    /** Stretch to the container width. */
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    /** Required for icon-only buttons. */
    ariaLabel?: string
    /** Render as <a href>. */
    href?: string
    target?: string
    rel?: string
    /** Render as <NuxtLink to>. */
    to?: string | object
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'clear',
    size: 'md',
    shape: 'capsule',
    icon: null,
    iconPos: 'left',
    iconOnly: false,
    label: undefined,
    block: false,
    type: 'button',
    disabled: false,
    loading: false,
    ariaLabel: undefined,
    href: undefined,
    target: undefined,
    rel: undefined,
    to: undefined
  })

  // attrs (click handlers etc.) fall through to the rendered native element.
  defineOptions({ inheritAttrs: false })

  const slots = useSlots()
  const hasLabel = computed(() => !props.iconOnly && (!!slots.default || !!props.label))

  const isGlass = computed(() => props.variant === 'clear' || props.variant === 'dimmed')

  const computedRel = computed(
    () => props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined)
  )

  const rootClass = computed(() => [
    'lg-btn',
    `lg-btn--${props.variant}`,
    `lg-btn--${props.size}`,
    `lg-btn--${props.shape}`,
    {
      'lg-btn--icon-only': props.iconOnly,
      'lg-btn--block': props.block,
      'lg-btn--loading': props.loading,
      // The liquid-glass material + the shared Apple-glass morph live in the
      // global system so every glass surface (incl. modal close, switcher)
      // stays in sync — this component just opts in.
      'liquid-glass': isGlass.value,
      'liquid-glass-interactive': isGlass.value && !props.disabled
    }
  ])
</script>

<style scoped>
  .lg-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-family: inherit;
    font-weight: 500;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    appearance: none;
  }

  .lg-btn--block {
    display: flex;
    width: 100%;
  }

  .lg-btn[disabled],
  .lg-btn--loading {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Content wrapper — the hover "swell" and press "squish" deform THIS, not the
     glass host (a host transform would kill its own backdrop-filter). Sits above
     the glass pseudos. The elastic curve makes the swell feel like surface
     tension settling, not a linear zoom. */
  .lg-btn__content {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: transform 0.46s cubic-bezier(0.34, 1.6, 0.5, 1);
  }

  .lg-btn__icon {
    display: inline-flex;
    flex: none;
  }

  /* ---------- sizes ---------- */
  .lg-btn--sm {
    height: 2rem;
    padding: 0 0.75rem;
    font-size: 0.8125rem;
  }
  .lg-btn--sm .lg-btn__icon {
    font-size: 1rem;
  }

  .lg-btn--md {
    height: 2.5rem;
    padding: 0 1rem;
    font-size: 0.9375rem;
  }
  .lg-btn--md .lg-btn__icon {
    font-size: 1.125rem;
  }

  .lg-btn--lg {
    height: 3rem;
    padding: 0 1.5rem;
    font-size: 1rem;
  }
  .lg-btn--lg .lg-btn__icon {
    font-size: 1.25rem;
  }

  /* Icon-only → square, no horizontal padding. */
  .lg-btn--icon-only.lg-btn--sm {
    width: 2rem;
    padding: 0;
  }
  .lg-btn--icon-only.lg-btn--md {
    width: 2.5rem;
    padding: 0;
  }
  .lg-btn--icon-only.lg-btn--lg {
    width: 3rem;
    padding: 0;
  }

  /* ---------- shapes (radius via --lg-radius so the glass lens clips right) ---------- */
  .lg-btn--capsule {
    --lg-radius: 9999px;
    border-radius: 9999px;
  }
  .lg-btn--rounded {
    --lg-radius: 0.75rem;
    border-radius: 0.75rem;
  }
  .lg-btn--circle {
    --lg-radius: 50%;
    border-radius: 50%;
  }

  /* ---------- glass families (material + morph come from the global system) ---------- */
  /* CLEAR — bright, contrast "liquid" glass (the modal-close look). */
  .lg-btn--clear {
    --lg-blur: 4px;
    --lg-blur-full: 7px;
    --lg-saturate: 170%;
    --lg-saturate-full: 200%;
    --lg-brightness: 1.1;
    color: #fff;
  }

  /* DIMMED — softer translucent wash with a gentler rim (the glassmorphic look). */
  .lg-btn--dimmed {
    --lg-blur: 6px;
    --lg-blur-full: 10px;
    --lg-saturate: 150%;
    --lg-saturate-full: 165%;
    --lg-brightness: 1.05;
    --lg-tint: linear-gradient(135deg, rgb(255 255 255 / 0.1) 0%, rgb(255 255 255 / 0.05) 100%);
    --lg-rim: rgb(255 255 255 / 0.4);
    --lg-rim-soft: rgb(255 255 255 / 0.12);
    --lg-gloss: rgb(255 255 255 / 0.12);
    color: rgb(255 255 255 / 0.9);
  }

  /* Hover = the content swells (surface-tension bulge) while the glass plate
     keeps its frost. Press = the content squishes in with the host. */
  @media (hover: hover) and (pointer: fine) {
    .lg-btn:hover .lg-btn__content {
      transform: scale(1.09);
    }
  }

  .lg-btn:active .lg-btn__content {
    transform: scale(0.92);
    transition: transform 0.12s ease-out;
  }

  /* ---------- flat families ---------- */
  .lg-btn--solid {
    background: #ffffff; /* primary-50 */
    color: #000000; /* surface-950 */
    border: 1px solid transparent;
    transition:
      transform 0.46s cubic-bezier(0.34, 1.6, 0.5, 1),
      background-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .lg-btn--outline {
    background: transparent;
    color: #fff;
    border: 1px solid rgb(255 255 255 / 0.3);
    transition:
      transform 0.46s cubic-bezier(0.34, 1.6, 0.5, 1),
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .lg-btn--ghost {
    background: transparent;
    color: rgb(255 255 255 / 0.82);
    border: 1px solid transparent;
    transition:
      transform 0.46s cubic-bezier(0.34, 1.6, 0.5, 1),
      background-color 0.2s ease,
      color 0.2s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .lg-btn--solid:hover {
      background: #ededed;
      box-shadow: 0 6px 20px rgb(0 0 0 / 0.18);
    }
    .lg-btn--outline:hover {
      background: rgb(255 255 255 / 0.1);
      border-color: rgb(255 255 255 / 0.5);
    }
    .lg-btn--ghost:hover {
      background: rgb(255 255 255 / 0.06);
      color: #fff;
    }
  }

  /* Flat families can squash the host directly (no backdrop-filter to suppress),
     then spring back via the elastic base transition. */
  .lg-btn--solid:active,
  .lg-btn--outline:active,
  .lg-btn--ghost:active {
    transform: scale(0.9);
    transition: transform 0.12s cubic-bezier(0.5, 0, 0.75, 0.35);
  }

  /* ---------- focus ring (every variant, keyboard only) ---------- */
  .lg-btn:focus-visible {
    outline: 2px solid rgb(255 255 255 / 0.9);
    outline-offset: 2px;
  }
  .lg-btn--solid:focus-visible {
    outline-color: #000000; /* surface-950 */
  }

  @media (prefers-reduced-motion: reduce) {
    .lg-btn__content,
    .lg-btn--solid,
    .lg-btn--outline,
    .lg-btn--ghost {
      transition: none;
    }
    .lg-btn:hover .lg-btn__content,
    .lg-btn:active .lg-btn__content,
    .lg-btn--solid:active,
    .lg-btn--outline:active,
    .lg-btn--ghost:active {
      transform: none;
    }
  }
</style>
