<template>
  <span
    class="app-badge liquid-glass flex items-center justify-center whitespace-nowrap px-3 py-1 text-xs font-bold uppercase tracking-wider text-white md:px-3 md:py-1 max-md:px-2 max-md:py-0.5 max-md:text-[0.65rem]"
    :class="`app-badge--${variant}`"
  >
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
  interface Props {
    text?: string
    variant?: 'glass' | 'presave' | 'single' | 'album' | 'ep' | 'new' | 'contrast'
  }

  withDefaults(defineProps<Props>(), {
    text: '',
    variant: 'glass'
  })
</script>

<style scoped>
  /* Liquid-glass badge: the frost + specular rim come from the .liquid-glass
     material; each release type just sets its colour as the translucent tint, so
     it frosts the artwork behind it while staying type-coded. */
  .app-badge {
    --lg-radius: 0.5rem;
    --lg-blur: 6px;
    --lg-blur-full: 9px;
    /* Low saturation boost — the 150%+ was what made the colour read rich. */
    --lg-saturate: 112%;
    --lg-saturate-full: 122%;
    --lg-brightness: 1.04;
    /* Softer rim/edge — dimmed, less contrasty glass. */
    --lg-rim: rgb(255 255 255 / 0.4);
    --lg-rim-soft: rgb(255 255 255 / 0.12);
    --lg-gloss: rgb(255 255 255 / 0.14);
    /* Drop the system's flat hairline border — the ::after glass rim is the only
       edge (otherwise the badge shows two borders). */
    border: none;
    /* A badge sits flat on the art — keep the elevation + text shadow light. */
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.16);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.32);
  }

  /* Faint colour tints — a dimmed colored-glass wash, not a rich fill. */
  .app-badge--single {
    --lg-tint: rgb(37 99 235 / 0.2); /* blue-600 */
  }
  .app-badge--album {
    --lg-tint: rgb(147 51 234 / 0.2); /* purple-600 */
  }
  .app-badge--ep {
    --lg-tint: rgb(219 39 119 / 0.2); /* pink-600 */
  }
  .app-badge--new {
    --lg-tint: rgb(22 163 74 / 0.2); /* green-600 */
  }
  .app-badge--presave {
    --lg-tint: linear-gradient(135deg, rgb(147 51 234 / 0.22) 0%, rgb(219 39 119 / 0.22) 100%);
  }
  .app-badge--glass,
  .app-badge--contrast {
    --lg-tint: rgb(8 10 16 / 0.31);
  }
</style>
