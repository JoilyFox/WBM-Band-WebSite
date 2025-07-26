<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-surface-900">
          {{ title }}
        </h3>
      </slot>
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'medium'
})

const cardClasses = computed(() => {
  const baseClasses = 'bg-white rounded-xl overflow-hidden'
  
  const variantClasses = {
    default: 'shadow-sm border border-surface-200',
    bordered: 'border-2 border-surface-300',
    elevated: 'shadow-lg border border-surface-100'
  }
  
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }
  
  return [
    baseClasses,
    variantClasses[props.variant],
    paddingClasses[props.padding]
  ].join(' ')
})
</script>

<style scoped>
.card-header {
  @apply border-b border-surface-200 pb-4 mb-4;
}

.card-footer {
  @apply border-t border-surface-200 pt-4 mt-4;
}
</style>