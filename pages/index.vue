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
        <Button 
          label="Test Global Loader" 
          class="btn-primary"
          icon="pi pi-spinner"
          @click="testGlobalLoader"
          :disabled="isGlobalLoading"
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

    <!-- API Caching Demo -->
    <section class="mt-16">
      <div class="card max-w-4xl mx-auto animate-scale-in">
        <h3 class="text-xl font-semibold text-surface-50 mb-6 text-center">
          API Caching System Demo
        </h3>
        
        <!-- Cache Stats -->
        <div class="mb-6 p-4 bg-surface-900/50 rounded-lg border border-surface-800">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-surface-200">Cache Statistics</span>
            <Button 
              label="Refresh Stats"
              size="sm"
              class="btn-outline"
              @click="refreshCacheStats"
              :loading="statsLoading"
            />
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-surface-400">Entries:</span>
              <span class="text-surface-200 ml-2">{{ cacheStats.entries }}</span>
            </div>
            <div>
              <span class="text-surface-400">Size:</span>
              <span class="text-surface-200 ml-2">{{ formatBytes(cacheStats.size) }}</span>
            </div>
          </div>
        </div>
        
        <!-- API Test Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Button 
            label="Fetch Users (Cached)"
            class="btn-primary"
            icon="pi pi-users"
            @click="fetchUsers"
            :loading="usersLoading"
          />
          <Button 
            label="Fetch Posts (Cached)"
            class="btn-secondary"
            icon="pi pi-file"
            @click="fetchPosts"
            :loading="postsLoading"
          />
          <Button 
            label="Get Stats (Cached)"
            class="btn-outline"
            icon="pi pi-chart-bar"
            @click="fetchStats"
            :loading="statsApiLoading"
          />
          <Button 
            label="Slow Endpoint"
            class="btn-outline"
            icon="pi pi-clock"
            @click="fetchSlowData"
            :loading="slowLoading"
          />
        </div>
        
        <!-- Cache Management -->
        <div class="flex flex-wrap gap-3 mb-6">
          <Button 
            label="Clear All Cache"
            class="btn-outline"
            icon="pi pi-trash"
            @click="clearAllCache"
          />
          <Button 
            label="Clear Users Cache"
            class="btn-outline"
            icon="pi pi-user-minus"
            @click="clearUsersCache"
          />
          <Button 
            label="Clear Posts Cache"
            class="btn-outline"
            icon="pi pi-file-minus"
            @click="clearPostsCache"
          />
        </div>
        
        <!-- API Response Display -->
        <div v-if="apiResponse" class="mt-6">
          <h4 class="text-lg font-semibold text-surface-50 mb-3">Last API Response:</h4>
          <div class="bg-surface-900/70 rounded-lg p-4 border border-surface-800">
            <pre class="text-sm text-surface-300 overflow-auto max-h-64">{{ JSON.stringify(apiResponse, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- Instructions -->
        <div class="mt-6 p-4 bg-primary-900/20 rounded-lg border border-primary-800/30">
          <h4 class="text-sm font-semibold text-primary-200 mb-2">💡 Try This:</h4>
          <ul class="text-sm text-primary-300 space-y-1">
            <li>• Click "Fetch Users" twice - notice the second call is instant (cached)</li>
            <li>• Try the "Slow Endpoint" - it takes 3+ seconds first time, instant when cached</li>
            <li>• Clear specific cache entries and see the difference</li>
            <li>• Check cache stats to monitor storage usage</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Error Page Demo -->
    <section class="mt-16">
      <div class="card max-w-4xl mx-auto animate-scale-in">
        <h3 class="text-xl font-semibold text-surface-50 mb-6 text-center">
          Error Page System Demo
        </h3>
        
        <p class="text-surface-300 text-center mb-6">
          Test the error page functionality with different scenarios and custom messages.
        </p>
        
        <!-- Error Demo Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Button 
            label="404 Page Not Found"
            class="btn-outline"
            icon="pi pi-question-circle"
            @click="redirectTo404"
          />
          <Button 
            label="Data Load Error"
            class="btn-outline"
            icon="pi pi-exclamation-triangle"
            @click="() => redirectToDataError()"
          />
          <Button 
            label="Access Denied"
            class="btn-outline"
            icon="pi pi-ban"
            @click="redirectToAccessError"
          />
          <Button 
            label="Under Maintenance"
            class="btn-outline"
            icon="pi pi-wrench"
            @click="redirectToMaintenance"
          />
          <Button 
            label="Custom Error"
            class="btn-outline"
            icon="pi pi-cog"
            @click="redirectToCustomError"
          />
          <Button 
            label="Navigate to /unknown"
            class="btn-outline"
            icon="pi pi-search"
            @click="navigateToUnknown"
          />
        </div>
        
        <!-- Instructions -->
        <div class="p-4 bg-amber-900/20 rounded-lg border border-amber-800/30">
          <h4 class="text-sm font-semibold text-amber-200 mb-2">🚀 Error Page Features:</h4>
          <ul class="text-sm text-amber-300 space-y-1">
            <li>• <strong>Automatic 404 handling</strong> - Navigate to any unknown URL to see the error page</li>
            <li>• <strong>Custom error messages</strong> - Pass custom title, message, button text via query params</li>
            <li>• <strong>Multiple error types</strong> - Different icons and styling for different error scenarios</li>
            <li>• <strong>Easy programmatic redirect</strong> - Use the useErrorPage composable in your components</li>
            <li>• <strong>Glassmorphism design</strong> - Modern, responsive design that matches your app's theme</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'

// Meta
definePageMeta({
  title: 'Home'
})

useHead({
  title: 'WBM Band Website - Modern Nuxt 3 Application',
  meta: [
    {
      name: 'description',
      content: 'A modern full-stack application built with Nuxt 3, Vue 3, TypeScript, Tailwind CSS, and PrimeVue'
    }
  ]
})

// Composables
const snackbar = useSnackbar()
const { showLoading, hideLoading, setProgress, isLoading: isGlobalLoading } = useGlobalLoading()
const api = useApi()

// Reactive state
const isSubmitting = ref(false)
const form = ref({
  name: '',
  email: '',
  message: ''
})

// API Demo state
const usersLoading = ref(false)
const postsLoading = ref(false)
const statsApiLoading = ref(false)
const slowLoading = ref(false)
const statsLoading = ref(false)
const apiResponse = ref<any>(null)
const cacheStats = ref({ entries: 0, size: 0 })

// Methods
const showSuccess = () => {
  snackbar.success(
    'Success!',
    'Primary button clicked successfully'
  )
}

const showInfo = () => {
  snackbar.info(
    'Information',
    'Secondary button clicked for more info'
  )
}

const showWarn = () => {
  snackbar.warning(
    'Warning!',
    'Outline button clicked - proceed with caution'
  )
}

const testGlobalLoader = async () => {
  showLoading()
  
  // Simulate progress updates
  for (let i = 0; i <= 100; i += 10) {
    setProgress(i)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  hideLoading()
  
  snackbar.success(
    'Global Loader Test Complete!',
    'The top bar loading animation has finished successfully.',
    4000
  )
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email) {
    snackbar.error(
      'Validation Error',
      'Please fill in all required fields (Name and Email)',
      5000
    )
    return
  }

  isSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    snackbar.success(
      'Form Submitted Successfully!',
      `Thank you ${form.value.name}! Your message has been received and we'll get back to you soon.`,
      6000
    )
    
    // Reset form
    form.value = {
      name: '',
      email: '',
      message: ''
    }
  } catch (error) {
    snackbar.error(
      'Submission Failed',
      'There was an error submitting your form. Please try again.',
      5000
    )
  } finally {
    isSubmitting.value = false
  }
}

// Utility functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// API Demo methods
const refreshCacheStats = async () => {
  statsLoading.value = true
  try {
    const stats = await api.getCacheStats()
    cacheStats.value = stats
  } catch (error) {
    console.error('Failed to get cache stats:', error)
  } finally {
    statsLoading.value = false
  }
}

const fetchUsers = async () => {
  usersLoading.value = true
  try {
    const startTime = Date.now()
    const result = await api.get('/api/users', {
      cache: { enabled: true, ttl: 2 * 60 * 1000 } // 2 minutes cache
    })
    const duration = Date.now() - startTime
    
    if (result) {
      apiResponse.value = { ...result, _meta: { duration: `${duration}ms`, cached: duration < 100 } }
      snackbar.success(
        'Users Fetched!',
        `Retrieved ${result.data?.length || 0} users in ${duration}ms${duration < 100 ? ' (cached)' : ''}`,
        3000
      )
    }
  } finally {
    usersLoading.value = false
    await refreshCacheStats()
  }
}

const fetchPosts = async () => {
  postsLoading.value = true
  try {
    const startTime = Date.now()
    const result = await api.get('/api/posts', {
      cache: { enabled: true, ttl: 3 * 60 * 1000 } // 3 minutes cache
    })
    const duration = Date.now() - startTime
    
    if (result) {
      apiResponse.value = { ...result, _meta: { duration: `${duration}ms`, cached: duration < 100 } }
      snackbar.success(
        'Posts Fetched!',
        `Retrieved ${result.data?.length || 0} posts in ${duration}ms${duration < 100 ? ' (cached)' : ''}`,
        3000
      )
    }
  } finally {
    postsLoading.value = false
    await refreshCacheStats()
  }
}

const fetchStats = async () => {
  statsApiLoading.value = true
  try {
    const startTime = Date.now()
    const result = await api.get('/api/stats', {
      cache: { enabled: true, ttl: 1 * 60 * 1000 } // 1 minute cache
    })
    const duration = Date.now() - startTime
    
    if (result) {
      apiResponse.value = { ...result, _meta: { duration: `${duration}ms`, cached: duration < 100 } }
      snackbar.info(
        'Stats Fetched!',
        `Retrieved app statistics in ${duration}ms${duration < 100 ? ' (cached)' : ''}`,
        3000
      )
    }
  } finally {
    statsApiLoading.value = false
    await refreshCacheStats()
  }
}

const fetchSlowData = async () => {
  slowLoading.value = true
  try {
    const startTime = Date.now()
    const result = await api.get('/api/slow-endpoint', {
      cache: { enabled: true, ttl: 5 * 60 * 1000 } // 5 minutes cache
    })
    const duration = Date.now() - startTime
    
    if (result) {
      apiResponse.value = { ...result, _meta: { duration: `${duration}ms`, cached: duration < 2000 } }
      snackbar.warning(
        'Slow Endpoint Complete!',
        `Took ${duration}ms${duration < 2000 ? ' (cached - much faster!)' : ' (first load - very slow)'}`,
        4000
      )
    }
  } finally {
    slowLoading.value = false
    await refreshCacheStats()
  }
}

const clearAllCache = async () => {
  try {
    await api.clearCache()
    await refreshCacheStats()
    snackbar.success(
      'Cache Cleared!',
      'All cached API responses have been removed',
      3000
    )
  } catch (error) {
    snackbar.error('Failed to clear cache', 'An error occurred while clearing the cache')
  }
}

const clearUsersCache = async () => {
  try {
    await api.clearCache('users')
    await refreshCacheStats()
    snackbar.info(
      'Users Cache Cleared!',
      'Cached users data has been removed',
      3000
    )
  } catch (error) {
    snackbar.error('Failed to clear users cache', 'An error occurred')
  }
}

const clearPostsCache = async () => {
  try {
    await api.clearCache('posts')
    await refreshCacheStats()
    snackbar.info(
      'Posts Cache Cleared!',
      'Cached posts data has been removed',
      3000
    )
  } catch (error) {
    snackbar.error('Failed to clear posts cache', 'An error occurred')
  }
}

// Error Page Demo methods
const { 
  redirectTo404, 
  redirectToDataError, 
  redirectToAccessError, 
  redirectToMaintenance, 
  redirectToError 
} = useErrorPage()

const router = useRouter()

const redirectToCustomError = () => {
  return redirectToError({
    title: 'Custom Error Example',
    message: 'This is a custom error message to demonstrate how you can pass your own title, message, button text, and navigation target.',
    buttonText: 'Back to Demo',
    buttonLink: '/',
    buttonIcon: 'pi pi-arrow-left'
  })
}

const navigateToUnknown = () => {
  return router.push('/this-page-does-not-exist')
}

// Initialize cache stats on mount
onMounted(() => {
  refreshCacheStats()
})
</script>
