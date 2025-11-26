<template>
  <component
    :is="tag"
    class="small-section-title font-bold tracking-wide text-white mb-4"
    :class="computedClasses"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    align?: 'left' | 'center' | 'right'
    color?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    level: 3,
    align: 'center',
    color: 'text-white'
  })

  const tag = computed(() => `h${props.level}`)

  const computedClasses = computed(() => {
    const alignMap: Record<string, string> = {
      left: 'text-left',
      center: 'text-center mx-auto',
      right: 'text-right ml-auto'
    }

    return [
      'text-xl md:text-2xl', // Smaller than the main section title
      alignMap[props.align],
      props.color
    ].join(' ')
  })
</script>

<style scoped>
  .small-section-title {
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    letter-spacing: 0.05em;
  }
</style>
