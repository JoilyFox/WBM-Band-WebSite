<template>
  <button
    v-if="clickable"
    :class="computedContainerClass"
    type="button"
    :aria-label="ariaLabel || t('a11y.home')"
    @click="handleClick"
  >
    <img
      :src="logoSrc"
      alt=""
      :class="['wbm-logo-img', computedImageClass]"
      :loading="loading"
      :fetchpriority="fetchpriority"
      decoding="async"
      draggable="false"
    />
  </button>

  <div v-else :class="computedContainerClass">
    <img
      :src="logoSrc"
      alt=""
      :class="['wbm-logo-img', computedImageClass]"
      :loading="loading"
      :fetchpriority="fetchpriority"
      decoding="async"
      draggable="false"
    />
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useScrollTo } from '~/composables/useScrollTo'

  const { t } = useI18n()
  const { resolveUrl } = useAssetUrl()

  // One SVGO-optimized static file (browser-cached once) instead of ~110 KB of
  // inline <svg> markup per placement. The art is white; every placement renders it
  // white (currentColor was always #fff here), so an <img> is pixel-equivalent.
  const logoSrc = resolveUrl('/images/wbm-logo.svg')

  interface Props {
    clickable?: boolean
    onClick?: () => void
    containerClass?: string
    imageClass?: string
    blendMode?: 'normal' | 'exclusion' | 'multiply' | 'screen' | 'overlay'
    // Accessible name for the clickable logo button. Falls back to a11y.home.
    ariaLabel?: string
    loading?: 'eager' | 'lazy'
    fetchpriority?: 'high' | 'low' | 'auto'
  }

  const props = withDefaults(defineProps<Props>(), {
    clickable: true,
    blendMode: 'normal',
    loading: undefined,
    fetchpriority: undefined
  })

  // Computed class for the container (includes blend mode)
  const computedContainerClass = computed(() => {
    const classes = []

    if (props.containerClass) {
      classes.push(props.containerClass)
    }

    // Add blend mode class to container
    if (props.blendMode !== 'normal') {
      classes.push(`blend-${props.blendMode}`)
    }

    return classes.join(' ')
  })

  // Computed class for the image/SVG
  const computedImageClass = computed(() => {
    const classes = []

    if (props.imageClass) {
      classes.push(props.imageClass)
    }

    return classes.join(' ')
  })

  // Handle click events
  const handleClick = () => {
    if (props.onClick) {
      props.onClick()
    } else {
      // Default behavior: scroll to hero
      const { scrollToElementWithNavigation } = useScrollTo()
      scrollToElementWithNavigation('hero')
    }
  }
</script>

<style scoped>
  /* Reserve the box before the SVG arrives (same ratio as the artwork viewBox),
     so `h-* w-auto` / `w-* h-auto` placements never reflow. */
  .wbm-logo-img {
    aspect-ratio: 2158.53 / 2769.16;
  }

  .blend-exclusion {
    mix-blend-mode: exclusion;
    color: white;
  }

  .blend-multiply {
    mix-blend-mode: multiply;
    color: black;
  }

  .blend-screen {
    mix-blend-mode: screen;
    color: white;
  }

  .blend-overlay {
    mix-blend-mode: overlay;
    color: white;
  }
</style>
