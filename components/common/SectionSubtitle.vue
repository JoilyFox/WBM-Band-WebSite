<template>
  <p class="section-subtitle text-white/80 leading-relaxed" :class="computedClasses">
    <slot />
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  align?: 'left' | 'center' | 'right'
  maxWidth?: 'sm' | 'md' | 'lg' | 'full'
  size?: 'sm' | 'base' | 'lg'
  clamp?: number
}

const props = withDefaults(defineProps<Props>(), {
  align: 'center',
  maxWidth: 'md',
  size: 'base'
})

const computedClasses = computed(() => {
  const alignMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }
  const widthMap: Record<string, string> = {
    sm: 'max-w-xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    full: 'max-w-none'
  }
  const sizeMap: Record<string, string> = {
    sm: 'text-base md:text-lg',
    base: 'text-lg md:text-xl',
    lg: 'text-xl md:text-2xl'
  }
  return [
    alignMap[props.align],
    widthMap[props.maxWidth],
    sizeMap[props.size],
    props.clamp ? `line-clamp-${props.clamp}` : ''
  ].join(' ')
})
</script>

<style scoped>
.section-subtitle { text-shadow: 0 2px 12px rgba(0,0,0,0.45); }
</style>
