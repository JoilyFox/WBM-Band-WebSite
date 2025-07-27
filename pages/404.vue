<template>
  <CommonErrorPage
    title="Page Not Found"
    message="Sorry, the page you are looking for does not exist. It might have been moved, deleted, or you entered the wrong URL."
    button-text="Go to Home"
    button-link="/"
    button-icon="pi pi-home"
  />
</template>

<script setup lang="ts">
// Remove default layout
definePageMeta({
  layout: false
})

import { createPageTitle } from '~/constants/app'

// Set page meta - don't throw error in 404 page
useHead({
  title: createPageTitle('404 - Page Not Found'),
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
</script>
