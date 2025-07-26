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

const props = defineProps<{
  error: any
}>()

// Handle different error types
const errorTitle = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Page Not Found'
  }
  if (props.error?.statusCode === 500) {
    return 'Server Error'
  }
  return 'Oops! Something went wrong'
})

const errorMessage = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Sorry, the page you are looking for does not exist. It might have been moved, deleted, or you entered the wrong URL.'
  }
  if (props.error?.statusCode === 500) {
    return 'We encountered an internal server error. Our team has been notified and is working on fixing this issue.'
  }
  return 'We encountered an unexpected error. Please try again or return to the homepage.'
})

const buttonText = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Go to Home'
  }
  return 'Try Again'
})

const buttonLink = computed(() => {
  return '/'
})

const buttonIcon = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'pi pi-home'
  }
  return 'pi pi-refresh'
})

// Handle the error for better SEO and user experience
useHead({
  title: `${props.error?.statusCode || 'Error'} - WBM Band Website`,
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
</script>
