<template>
  <!-- Global Loading Bar -->
  <GlobalLoadingBar />
  
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- Global Snackbar Component -->
  <Snackbar />
</template>

<script setup>
// Import global components
import Snackbar from '~/components/common/Snackbar.vue';
import GlobalLoadingBar from '~/components/common/GlobalLoadingBar.vue';
</script>