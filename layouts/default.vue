<template>
  <div class="min-h-screen bg-surface-950">
    <NuxtRouteAnnouncer />
    
    <!-- Header -->
    <header class="bg-surface-900 border-b border-surface-800 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-surface-50">
              Your App
            </h1>
          </div>
          
          <nav class="flex items-center space-x-4">
            <Button 
              label="Get Started" 
              class="btn-primary"
              @click="showToast"
            />
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Toast Container -->
    <PrimeToast position="top-right" />
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

// Composables
const toast = useToast()

// Methods
const showToast = () => {
  toast.add({
    severity: 'info',
    summary: 'Welcome!',
    detail: 'Your Nuxt 3 app is ready to go!',
    life: 3000
  })
}
</script>
