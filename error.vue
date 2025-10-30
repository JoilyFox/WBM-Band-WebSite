<template>
  <CommonErrorPage
    :title="errorTitle"
    :message="errorMessage"
    :button-text="buttonText"
    :button-link="buttonLink"
    :button-icon="buttonIcon"
  />
</template>

<script setup lang="ts">
// Remove default layout for error pages
definePageMeta({
  layout: false
})

import { createErrorTitle } from '~/constants/app'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

const { t } = useI18n()
const localePath = useLocalePath()

const props = defineProps<{
  error: any
}>()

// Handle different error types
const errorTitle = computed(() => {
  // Maintenance mode (503)
  if (props.error?.statusCode === 503 || (props.error?.data?.isMaintenance)) {
    return t('errors.maintenance.title') as string
  }
  if (props.error?.statusCode === 404) {
    return t('errors.page_not_found.title') as string
  }
  if (props.error?.statusCode === 500) {
    return '500'
  }
  return t('errors.default_title') as string
})

const errorMessage = computed(() => {
  // Maintenance mode (503)
  if (props.error?.statusCode === 503 || (props.error?.data?.isMaintenance)) {
    return t('errors.maintenance.message') as string
  }
  // Handle music track specific errors
  if (props.error?.statusCode === 404 && props.error?.statusMessage?.includes('Music track')) {
    return t('errors.page_not_found.message') as string
  }
  
  if (props.error?.statusCode === 404) {
    return t('errors.page_not_found.message') as string
  }
  if (props.error?.statusCode === 500) {
    return t('errors.default_message') as string
  }
  return t('errors.default_message') as string
})

const buttonText = computed(() => {
  // Maintenance mode - show "Coming Soon" instead of action button
  if (props.error?.statusCode === 503 || (props.error?.data?.isMaintenance)) {
    return t('errors.maintenance.coming_soon') as string
  }
  // Handle music track specific errors
  if (props.error?.statusCode === 404 && props.error?.statusMessage?.includes('Music track')) {
    return t('errors.go_home') as string
  }
  
  if (props.error?.statusCode === 404) {
    return t('errors.go_home') as string
  }
  return t('errors.go_home') as string
})

const buttonLink = computed(() => {
  // Maintenance mode - no link (button will be disabled)
  if (props.error?.statusCode === 503 || (props.error?.data?.isMaintenance)) {
    return ''
  }
  // Handle music track specific errors - redirect to home with music section anchor
  if (props.error?.statusCode === 404 && props.error?.statusMessage?.includes('Music track')) {
    return localePath('/') + '#music'
  }
  
  return localePath('/')
})

const buttonIcon = computed(() => {
  // Handle music track specific errors
  if (props.error?.statusCode === 404 && props.error?.statusMessage?.includes('Music track')) {
    return 'pi pi-arrow-left'
  }
  
  if (props.error?.statusCode === 404) {
    return 'pi pi-home'
  }
  return 'pi pi-refresh'
})

// Handle the error for better SEO and user experience
useHead({
  title: createErrorTitle(props.error?.statusCode || 'Error'),
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
</script>
