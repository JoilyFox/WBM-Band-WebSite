# Global Loading System

The WBM Band Website includes a streamlined global loading system that provides visual feedback during async operations using a top bar progress indicator.

## Overview

The global loading system is built around a **[`GlobalLoadingBar`](../components/common/GlobalLoadingBar.vue)** component with supporting Pinia store and composable for easy state management.

## Components

- [`GlobalLoadingBar.vue`](../components/common/GlobalLoadingBar.vue) - Top bar progress indicator component
- [`globalLoading.ts`](../store/globalLoading.ts) - Pinia store for loading state management
- [`useGlobalLoading.ts`](../composables/useGlobalLoading.ts) - Composable hook for loading control

## Features

- Top bar progress indicator with gradient animations
- Manual progress control (0-100%)
- Automatic progress simulation for async operations
- Responsive design for mobile and desktop
- Smooth CSS transitions and animations
- Integration with global app layout

## Quick Start

### Basic Usage

```vue
<template>
  <div>
    <button @click="performAction" :disabled="isLoading">
      {{ isLoading ? 'Loading...' : 'Start Action' }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { showLoading, hideLoading, isLoading } = useGlobalLoading()

const performAction = async () => {
  showLoading()
  
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000))
  } finally {
    hideLoading()
  }
}
</script>
```

### With Progress Updates

```vue
<script setup lang="ts">
const { showLoading, hideLoading, setProgress } = useGlobalLoading()

const uploadFile = async () => {
  showLoading()
  
  // Simulate upload progress
  for (let i = 0; i <= 100; i += 10) {
    setProgress(i)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  hideLoading()
}
</script>
```

### Using the Async Wrapper

```vue
<script setup lang="ts">
const { withLoading } = useGlobalLoading()

const fetchData = async () => {
  await withLoading(async () => {
    // Your async operation here
    const response = await api.get('/api/data')
    return response
  }, {
    simulateProgress: true,
    progressDuration: 2000
  })
}
</script>
```

## API Reference

### useGlobalLoading Composable

```typescript
const {
  // State
  isLoading,        // ComputedRef<boolean>
  loadingProgress,  // ComputedRef<number>
  
  // Methods
  showLoading,      // () => void
  hideLoading,      // () => void
  setProgress,      // (progress: number) => void
  withLoading       // (fn: Function, options?) => Promise<any>
} = useGlobalLoading()
```

#### Methods

**`showLoading(): void`**

- Shows the loading bar and starts automatic progress animation
- Progress automatically animates from 0% to 90% over time

**`hideLoading(): void`**

- Hides the loading bar after completing animation to 100%
- Automatically resets progress to 0 after hiding

**`setProgress(progress: number): void`**

- Manually sets the progress percentage (0-100)
- Parameters:
  - `progress` (number) - Progress percentage between 0 and 100

**`withLoading(fn: Function, options?): Promise<any>`**

- Wraps an async function with loading state management
- Parameters:
  - `fn` (Function) - Async function to execute
  - `options` (object) - Configuration options
    - `simulateProgress` (boolean) - Whether to simulate progress updates
    - `progressDuration` (number) - Duration for progress simulation in ms
- Returns: Promise with the result of the wrapped function

### Global Loading Store

```typescript
// Direct store access (rarely needed)
const globalLoadingStore = useGlobalLoadingStore()

// State
globalLoadingStore.isLoading        // boolean
globalLoadingStore.loadingProgress  // number (0-100)

// Actions
globalLoadingStore.showLoading()    // Show loading
globalLoadingStore.hideLoading()    // Hide loading
globalLoadingStore.setProgress(n)   // Set progress
```

## Real-World Examples

### API Integration

```typescript
// composables/useApiWithLoading.ts
export function useApiWithLoading() {
  const { withLoading } = useGlobalLoading()
  const api = useApi()
  
  const fetchUsers = async () => {
    return await withLoading(async () => {
      return await api.get('/api/users')
    }, {
      simulateProgress: true,
      progressDuration: 1500
    })
  }
  
  const saveUser = async (userData: any) => {
    return await withLoading(async () => {
      return await api.post('/api/users', userData)
    })
  }
  
  return {
    fetchUsers,
    saveUser
  }
}
```

### Navigation Loading

```typescript
// middleware/loading.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const { showLoading, hideLoading } = useGlobalLoading()
    
    // Show loading when navigating
    showLoading()
    
    // Hide loading after navigation completes
    nextTick(() => {
      hideLoading()
    })
  }
})
```

### File Upload with Progress

```vue
<template>
  <div>
    <input 
      type="file" 
      @change="uploadFile" 
      :disabled="isLoading"
    />
    <div v-if="isLoading">
      Upload Progress: {{ loadingProgress }}%
    </div>
  </div>
</template>

<script setup lang="ts">
const { showLoading, hideLoading, setProgress, isLoading, loadingProgress } = useGlobalLoading()

const uploadFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  showLoading()
  
  try {
    // Simulate upload progress
    const chunks = 10
    for (let i = 0; i <= chunks; i++) {
      const progress = (i / chunks) * 100
      setProgress(progress)
      
      // Simulate chunk upload
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    snackbar.success('Upload Complete!', 'File uploaded successfully')
  } catch (error) {
    snackbar.error('Upload Failed', 'Please try again')
  } finally {
    hideLoading()
  }
}
</script>
```

## Styling and Animation

The GlobalLoadingBar component features:

- **Gradient Background**: Primary color gradient with smooth transitions
- **Hardware Acceleration**: GPU-accelerated transforms for smooth animations
- **Responsive Design**: Adapts to mobile and desktop viewports
- **Z-Index Management**: Appears above all other content (z-index: 9999)

### CSS Classes Used

```scss
.loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg, 
    theme('colors.primary.400'),
    theme('colors.primary.500'),
    theme('colors.primary.600')
  );
  transform-origin: left;
  transition: transform 0.3s ease-out;
}
```

## Integration

The GlobalLoadingBar is automatically included in the main app layout:

```vue
<!-- app.vue -->
<template>
  <!-- Global Loading Bar -->
  <GlobalLoadingBar />
  
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- Other global components -->
  <Snackbar />
</template>
```

## Best Practices

1. **Use withLoading wrapper** - Prefer the async wrapper over manual show/hide calls
2. **Set realistic progress** - Only use manual progress for operations with known steps
3. **Provide user feedback** - Combine with snackbar notifications for completion status
4. **Avoid nested loading** - Don't start new loading operations while one is active
5. **Handle errors gracefully** - Always ensure hideLoading() is called in finally blocks

## Troubleshooting

**Loading bar not appearing?**

- Verify GlobalLoadingBar is included in app.vue
- Check that the component is not being overridden by other fixed elements
- Ensure z-index is sufficient (currently set to 9999)

**Progress not updating smoothly?**

- Avoid calling setProgress too frequently (max every 100ms)
- Use the automatic progress simulation for unknown-duration operations
- Check that progress values are between 0 and 100

**Loading state not clearing?**

- Always call hideLoading() in finally blocks
- Use the withLoading wrapper to ensure proper cleanup
- Check for multiple concurrent loading operations
