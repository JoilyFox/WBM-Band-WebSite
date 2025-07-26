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

// Set page meta
useHead({
  title: '404 - Page Not Found | WBM Band Website',
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
</script>
