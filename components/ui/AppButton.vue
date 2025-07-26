<template>
  <Button
    :class="buttonClasses"
    :loading="loading"
    :disabled="disabled"
    v-bind="$attrs"
    @click="handleClick"
  >
    <template #default>
      <i v-if="icon && !loading" :class="iconClasses" />
      <span v-if="label">{{ label }}</span>
      <slot />
    </template>
  </Button>
</template>

<script setup lang="ts">
import type { ButtonVariant } from '~/types'

interface Props {
  variant?: ButtonVariant
  size?: 'small' | 'medium' | 'large'
  icon?: string
  iconPos?: 'left' | 'right'
  label?: string
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  iconPos: 'left'
})

const emit = defineEmits<{
  click: [event: Event]
}>()

// Computed classes
const buttonClasses = computed(() => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-surface-100 hover:bg-surface-200 text-surface-900 focus:ring-surface-500',
    outline: 'border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:ring-primary-500',
    text: 'text-primary-500 hover:bg-primary-50 focus:ring-primary-500'
  }
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  }
  
  return [
    baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size]
  ].join(' ')
})

const iconClasses = computed(() => {
  const baseClasses = 'pi'
  const positionClasses = props.iconPos === 'right' && props.label ? 'ml-2' : 'mr-2'
  return `${baseClasses} ${props.icon} ${props.label ? positionClasses : ''}`
})

// Methods
const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>