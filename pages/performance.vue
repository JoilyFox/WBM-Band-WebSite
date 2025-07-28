<template>
  <div class="min-h-screen pt-20 p-6 bg-surface-900">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-surface-50 mb-8">
        📊 Performance Monitor
      </h1>
      
      <!-- Performance Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card bg-surface-800 p-6">
          <div class="flex items-center mb-4">
            <i class="pi pi-image text-primary-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-semibold text-surface-50">Image Performance</h3>
          </div>
          <div v-if="performanceStats">
            <p class="text-surface-300 mb-2">
              Total Images: <span class="text-primary-400 font-medium">{{ performanceStats.totalImages }}</span>
            </p>
            <p class="text-surface-300 mb-2">
              Avg Load Time: <span class="text-primary-400 font-medium">{{ performanceStats.averageLoadTime.toFixed(2) }}ms</span>
            </p>
            <p class="text-surface-300 mb-2">
              Total Size: <span class="text-primary-400 font-medium">{{ formatBytes(performanceStats.totalSize) }}</span>
            </p>
          </div>
          <div v-else class="text-surface-400">
            No data yet
          </div>
        </div>
        
        <div class="card bg-surface-800 p-6">
          <div class="flex items-center mb-4">
            <i class="pi pi-clock text-green-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-semibold text-surface-50">Load Times</h3>
          </div>
          <div v-if="performanceStats">
            <p class="text-surface-300 mb-2">
              Fastest: <span class="text-green-400 font-medium">{{ performanceStats.fastestImage.toFixed(2) }}ms</span>
            </p>
            <p class="text-surface-300 mb-2">
              Slowest: <span class="text-red-400 font-medium">{{ performanceStats.slowestImage.toFixed(2) }}ms</span>
            </p>
          </div>
          <div v-else class="text-surface-400">
            No data yet
          </div>
        </div>
        
        <div class="card bg-surface-800 p-6">
          <div class="flex items-center mb-4">
            <i class="pi pi-chart-line text-blue-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-semibold text-surface-50">Preloading Status</h3>
          </div>
          <div>
            <p class="text-surface-300 mb-2">
              Preloaded: <span class="text-blue-400 font-medium">{{ preloadedImages.length }}</span>
            </p>
            <p class="text-surface-300 mb-2">
              Failed: <span class="text-red-400 font-medium">{{ preloadErrors.length }}</span>
            </p>
            <p class="text-surface-300">
              Status: <span :class="isPreloading ? 'text-yellow-400' : 'text-green-400'" class="font-medium">
                {{ isPreloading ? 'Loading...' : 'Complete' }}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Slow Images Alert -->
      <div v-if="slowImages.length > 0" class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <h3 class="text-red-400 font-semibold mb-2">
          ⚠️ Slow Loading Images (>1s)
        </h3>
        <div class="space-y-2">
          <div v-for="image in slowImages" :key="image.src" class="text-surface-300 text-sm">
            {{ image.src }} - {{ image.loadTime.toFixed(2) }}ms
          </div>
        </div>
      </div>
      
      <!-- Image Metrics Table -->
      <div class="card bg-surface-800 mb-8">
        <div class="p-6 border-b border-surface-700">
          <h3 class="text-lg font-semibold text-surface-50">Image Loading Metrics</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-surface-700">
              <tr>
                <th class="text-left p-4 text-surface-300 font-medium">Image</th>
                <th class="text-left p-4 text-surface-300 font-medium">Load Time</th>
                <th class="text-left p-4 text-surface-300 font-medium">Size</th>
                <th class="text-left p-4 text-surface-300 font-medium">Loaded At</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="metric in metrics" :key="metric.src" class="border-b border-surface-700">
                <td class="p-4 text-surface-300 text-sm">
                  {{ metric.src.split('/').pop() }}
                </td>
                <td class="p-4">
                  <span 
                    :class="metric.loadTime > 1000 ? 'text-red-400' : metric.loadTime > 500 ? 'text-yellow-400' : 'text-green-400'"
                    class="font-medium"
                  >
                    {{ metric.loadTime.toFixed(2) }}ms
                  </span>
                </td>
                <td class="p-4 text-surface-300">
                  {{ metric.size ? formatBytes(metric.size) : 'N/A' }}
                </td>
                <td class="p-4 text-surface-300 text-sm">
                  {{ metric.loadedAt.toLocaleTimeString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Performance Tips -->
      <div class="card bg-surface-800 p-6">
        <h3 class="text-lg font-semibold text-surface-50 mb-4">
          💡 Performance Tips
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mt-1 mr-3"></i>
              <div>
                <p class="text-surface-300 text-sm">
                  <strong>AVIF Format:</strong> Up to 50% smaller than WebP
                </p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mt-1 mr-3"></i>
              <div>
                <p class="text-surface-300 text-sm">
                  <strong>Lazy Loading:</strong> Images load only when needed
                </p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mt-1 mr-3"></i>
              <div>
                <p class="text-surface-300 text-sm">
                  <strong>Preloading:</strong> Critical images load immediately
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mt-1 mr-3"></i>
              <div>
                <p class="text-surface-300 text-sm">
                  <strong>Progressive Loading:</strong> Blur placeholder while loading
                </p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mt-1 mr-3"></i>
              <div>
                <p class="text-surface-300 text-sm">
                  <strong>Responsive Images:</strong> Right size for each device
                </p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mt-1 mr-3"></i>
              <div>
                <p class="text-surface-300 text-sm">
                  <strong>Format Fallbacks:</strong> Browser selects best format
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Control Buttons -->
      <div class="flex gap-4 mt-6">
        <Button 
          label="Clear Metrics" 
          class="btn-outline"
          icon="pi pi-trash"
          @click="clearMetrics"
        />
        <Button 
          label="Refresh Data" 
          class="btn-secondary"
          icon="pi pi-refresh"
          @click="refreshData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useImagePerformance } from '~/composables/useImagePerformance'
import { useImagePreloader } from '~/composables/useImagePreloader'
import Button from 'primevue/button'

// Meta
definePageMeta({
  title: 'Performance Monitor'
})

useHead({
  title: 'Performance Monitor - WBM Band',
  meta: [
    {
      name: 'description',
      content: 'Monitor image loading performance and optimization metrics'
    }
  ]
})

// Composables
const {
  metrics,
  isMonitoring,
  startMonitoring,
  getPerformanceStats,
  getSlowImages,
  clearMetrics: clearImageMetrics
} = useImagePerformance()

const {
  preloadedImages,
  preloadErrors,
  isPreloading
} = useImagePreloader()

// Computed values
const performanceStats = computed(() => getPerformanceStats())
const slowImages = computed(() => getSlowImages(1000))

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Actions
const clearMetrics = () => {
  clearImageMetrics()
}

const refreshData = () => {
  // Refresh would typically reload the current data
  // For now, we'll just log current stats
  console.log('Current performance stats:', performanceStats.value)
}

// Start monitoring on mount
onMounted(() => {
  startMonitoring()
})
</script>

<style scoped>
.card {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

table {
  border-collapse: collapse;
}
</style>
