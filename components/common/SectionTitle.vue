<template>
  <component
    :is="tag"
    class="section-title font-bold tracking-tight text-white"
    :class="computedClasses"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  level?: 1 | 2 | 3 | 4
  align?: 'left' | 'center' | 'right'
  size?: 'sm' | 'base' | 'lg' | 'xl'
  clamp?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 2,
  align: 'center',
  size: 'xl'
})

const tag = computed(() => `h${props.level}`)

const computedClasses = computed(() => {
  const sizeMap: Record<string, string> = {
    sm: 'text-2xl md:text-3xl',
    base: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-4xl md:text-5xl lg:text-6xl'
  }
  const alignMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }
  return [
    sizeMap[props.size],
    alignMap[props.align],
    props.clamp ? `line-clamp-${props.clamp}` : ''
  ].join(' ')
})
</script>

<style scoped>
.section-title { text-shadow: 0 4px 22px rgba(0,0,0,0.55); }
</style>
