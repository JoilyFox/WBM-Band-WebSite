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
    --lg-saturate: 150%;
    --lg-saturate-full: 165%;
    --lg-brightness: 1.06;
    /* Softer rim/edge — dimmed, less contrasty glass. */
    --lg-rim: rgb(255 255 255 / 0.4);
    --lg-rim-soft: rgb(255 255 255 / 0.12);
    --lg-gloss: rgb(255 255 255 / 0.14);
    border-color: rgb(255 255 255 / 0.1);
    /* A badge sits flat on the art — keep the elevation modest, not panel-deep. */
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.28);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  /* Tints ~half as opaque as the original so the colour reads dimmed/glassy,
     not a rich fill. */
  .app-badge--single {
    --lg-tint: rgb(37 99 235 / 0.23); /* blue-600 */
  }
  .app-badge--album {
    --lg-tint: rgb(147 51 234 / 0.23); /* purple-600 */
  }
  .app-badge--ep {
    --lg-tint: rgb(219 39 119 / 0.23); /* pink-600 */
  }
  .app-badge--new {
    --lg-tint: rgb(22 163 74 / 0.23); /* green-600 */
  }
  .app-badge--presave {
    --lg-tint: linear-gradient(135deg, rgb(147 51 234 / 0.26) 0%, rgb(219 39 119 / 0.26) 100%);
  }
  .app-badge--glass,
  .app-badge--contrast {
    --lg-tint: rgb(8 10 16 / 0.34);
  }
</style>
