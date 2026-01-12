<template>
  <span
    class="flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/25 shadow-md transition-all duration-300 md:px-3 md:py-1 max-md:px-2 max-md:py-0.5 max-md:text-[0.65rem] whitespace-nowrap"
    :class="variantClasses"
  >
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    text?: string
    variant?: 'glass' | 'presave' | 'single' | 'album' | 'ep' | 'new' | 'contrast'
  }

  const props = withDefaults(defineProps<Props>(), {
    text: '',
    variant: 'glass'
  })

  const variantClasses = computed(() => {
    switch (props.variant) {
      case 'presave':
        return 'bg-gradient-to-br from-purple-600/50 to-pink-600/50 text-white backdrop-blur-md shadow-purple-500/20'
      case 'single':
        return 'bg-blue-600/40 text-white backdrop-blur-md'
      case 'album':
        return 'bg-purple-600/40 text-white backdrop-blur-md'
      case 'ep':
        return 'bg-pink-600/40 text-white backdrop-blur-md'
      case 'new':
        return 'bg-green-600/40 text-white backdrop-blur-md'
      case 'contrast':
      case 'glass':
      default:
        return 'bg-black/70 text-white backdrop-blur-md'
    }
  })
</script>

<style scoped>
  span {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
</style>
