<template>
  <div :class="rootClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    /** layout width preset */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    /** horizontal padding density */
    padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg'
    /** center content (default true) */
    center?: boolean
    /** allow content to overflow horizontally (no clipping) */
    overflowVisible?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'xl',
    padding: 'md',
    center: true,
    overflowVisible: false
  })

  const rootClasses = computed(() => {
    const sizeMap: Record<string, string> = {
      sm: 'max-w-3xl', // ~768px
      md: 'max-w-5xl', // ~1024px
      lg: 'max-w-6xl', // ~1152px
      xl: 'max-w-7xl', // ~1280px (matches existing header/footer)
      full: 'max-w-none'
    }
    const paddingMap: Record<string, string> = {
      none: 'px-0',
      xs: 'px-2 sm:px-3',
      sm: 'px-3 sm:px-4 lg:px-6',
      md: 'px-4 sm:px-6 lg:px-8',
      lg: 'px-6 sm:px-8 lg:px-12'
    }
    return [
      props.center !== false && 'mx-auto',
      sizeMap[props.size],
      paddingMap[props.padding],
      !props.overflowVisible && 'overflow-x-hidden'
    ]
      .filter(Boolean)
      .join(' ')
  })
</script>
