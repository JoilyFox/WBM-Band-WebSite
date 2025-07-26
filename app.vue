<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- Global Snackbar Component -->
  <Snackbar />
</template>

<script setup>
// Import the Snackbar component
import Snackbar from '~/components/common/Snackbar.vue';
</script>