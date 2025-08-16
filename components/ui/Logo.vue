<template>
  <button
    v-if="clickable"
    :class="computedContainerClass"
    @click="handleClick"
    type="button"
  >
    <LogoSvg :class="computedImageClass" />
  </button>
  
  <div v-else :class="computedContainerClass">
    <LogoSvg :class="computedImageClass" />
  </div>
</template>

<script setup lang="ts">
import { useScrollTo } from '~/composables/useScrollTo'
import LogoSvg from './LogoSvg.vue'

interface Props {
  clickable?: boolean
  onClick?: () => void
  containerClass?: string
  imageClass?: string
  blendMode?: 'normal' | 'exclusion' | 'multiply' | 'screen' | 'overlay'
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  blendMode: 'normal'
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