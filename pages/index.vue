<template>
  <div class="animate-fade-in">
    <!-- Hero Section -->
    <section class="text-center py-12">
      <h1 class="text-4xl md:text-6xl font-bold text-surface-50 mb-6">
        Welcome to Your
        <span class="text-primary-500">Nuxt 3</span>
        App
      </h1>
      
      <p class="text-xl text-surface-300 mb-8 max-w-2xl mx-auto">
        A modern full-stack application built with Nuxt 3, Vue 3, TypeScript, Tailwind CSS, and PrimeVue
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          label="Primary Button" 
          class="btn-primary"
          icon="pi pi-check"
          @click="showSuccess"
        />
        <Button 
          label="Secondary Button" 
          class="btn-secondary"
          icon="pi pi-cog"
          @click="showInfo"
        />
        <Button 
          label="Outline Button" 
          class="btn-outline"
          icon="pi pi-heart"
          @click="showWarn"
        />
      </div>
    </section>

    <!-- Feature Cards -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
      <div class="card animate-slide-up">
        <div class="flex items-center mb-4">
          <i class="pi pi-bolt text-primary-500 text-2xl mr-3"></i>
          <h3 class="text-lg font-semibold text-surface-50">Fast Development</h3>
        </div>
        <p class="text-surface-300">
          Built with Nuxt 3 for lightning-fast development and optimal performance.
        </p>
      </div>
      
      <div class="card animate-slide-up" style="animation-delay: 0.1s">
        <div class="flex items-center mb-4">
          <i class="pi pi-palette text-primary-500 text-2xl mr-3"></i>
          <h3 class="text-lg font-semibold text-surface-50">Beautiful UI</h3>
        </div>
        <p class="text-surface-300">
          Styled with Tailwind CSS and PrimeVue components for a polished interface.
        </p>
      </div>
      
      <div class="card animate-slide-up" style="animation-delay: 0.2s">
        <div class="flex items-center mb-4">
          <i class="pi pi-shield text-primary-500 text-2xl mr-3"></i>
          <h3 class="text-lg font-semibold text-surface-50">Type Safe</h3>
        </div>
        <p class="text-surface-300">
          Full TypeScript support for better development experience and fewer bugs.
        </p>
      </div>
    </section>

    <!-- Demo Form -->
    <section class="mt-16">
      <div class="card max-w-md mx-auto animate-scale-in">
        <h3 class="text-xl font-semibold text-surface-50 mb-6 text-center">
          Try the Components
        </h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-surface-200 mb-2">
              Name
            </label>
            <InputText
              id="name"
              v-model="form.name"
              placeholder="Enter your name"
              class="input-primary"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-surface-200 mb-2">
              Email
            </label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Enter your email"
              class="input-primary"
            />
          </div>
          
          <div>
            <label for="message" class="block text-sm font-medium text-surface-200 mb-2">
              Message
            </label>
            <Textarea
              id="message"
              v-model="form.message"
              rows="3"
              placeholder="Enter your message"
              class="input-primary resize-none"
            />
          </div>
          
          <Button 
            type="submit"
            label="Submit Form"
            class="btn-primary w-full"
            :loading="isSubmitting"
          />
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

// Meta
definePageMeta({
  title: 'Home'
})

useHead({
  title: 'Nuxt 3 + Vue 3 + TypeScript + Tailwind + PrimeVue',
  meta: [
    {
      name: 'description',
      content: 'A modern full-stack application built with the latest web technologies'
    }
  ]
})

// Composables
const toast = useToast()

// Reactive state
const isSubmitting = ref(false)
const form = ref({
  name: '',
  email: '',
  message: ''
})

// Methods
const showSuccess = () => {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Primary button clicked!',
    life: 3000
  })
}

const showInfo = () => {
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Secondary button clicked!',
    life: 3000
  })
}

const showWarn = () => {
  toast.add({
    severity: 'warn',
    summary: 'Warning',
    detail: 'Outline button clicked!',
    life: 3000
  })
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please fill in all required fields',
      life: 3000
    })
    return
  }

  isSubmitting.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  toast.add({
    severity: 'success',
    summary: 'Form Submitted',
    detail: `Thank you ${form.value.name}! Your message has been received.`,
    life: 4000
  })
  
  // Reset form
  form.value = {
    name: '',
    email: '',
    message: ''
  }
  
  isSubmitting.value = false
}
</script>
