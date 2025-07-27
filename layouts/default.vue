<template>
  <div class="min-h-screen bg-surface-950">
    <NuxtRouteAnnouncer />
    
    <!-- Header -->
    <header class="bg-surface-900 border-b border-surface-800 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-surface-50">
              {{ WEBSITE_TITLE }}
            </h1>
          </div>
          
          <nav class="flex items-center space-x-4">
            <NuxtLink 
              to="/" 
              class="text-surface-300 hover:text-surface-50 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-surface-800"
              active-class="text-surface-50 bg-surface-800"
            >
              Home
            </NuxtLink>
            <Button 
              label="Get Started" 
              class="btn-primary ml-4"
              @click="showWelcome"
            />
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar'
import { WEBSITE_TITLE, createWelcomeMessage } from '~/constants/app'

// Composables
const snackbar = useSnackbar()

// Methods
const showWelcome = () => {
  snackbar.success(
    createWelcomeMessage(),
    'Your modern Nuxt 3 application is ready to rock! 🎸',
    5000
  )
}
</script>
