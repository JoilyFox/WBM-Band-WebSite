# Snackbar Notifications

The WBM Band Website includes a comprehensive snackbar notification system for displaying user feedback messages. The system supports multiple simultaneous notifications with automatic dismissal, smooth modern animations, and customizable styling.

## Overview

The snackbar system is built around three main components that work together to provide a seamless notification experience:

- **[`useSnackbarStore`](../store/snackbar.ts)** - Pinia store for managing notification state
- **[`Snackbar.vue`](../components/common/Snackbar.vue)** - Vue component for rendering notifications  
- **[`useSnackbar`](../composables/useSnackbar.ts)** - Composable hook for easy integration

## Features

- 🔄 Multiple simultaneous notifications
- ⏰ Automatic dismissal with configurable timeout
- ❌ Manual dismissal with close button
- 🎨 Four notification types (success, error, info, warning)
- 🎭 Smooth slide-in/slide-out animations with progress bars
- 📱 Responsive design that works on all screen sizes
- 🎯 Modern glassmorphism design with backdrop blur
- ♿ Accessible with proper ARIA labels
- 🔧 TypeScript support for better DX
- 🎨 PrimeVue icons integration

## Quick Start

### Basic Usage

```vue
<script setup>
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();

// Show different types of notifications
const handleSuccess = () => {
  snackbar.success('Operation completed!', 'Data saved successfully');
};

const handleError = () => {
  snackbar.error('Something went wrong', 'Please try again later');
};

const handleWarning = () => {
  snackbar.warning('Are you sure?', 'This action cannot be undone');
};

const handleInfo = () => {
  snackbar.info('New feature available', 'Check out our latest update');
};
</script>

<template>
  <div>
    <Button @click="handleSuccess">Show Success</Button>
    <Button @click="handleError">Show Error</Button>
    <Button @click="handleWarning">Show Warning</Button>
    <Button @click="handleInfo">Show Info</Button>
  </div>
</template>
```

### Global Setup

The snackbar component is already included in `app.vue`:

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- Global Snackbar Component -->
  <Snackbar />
</template>
```

## API Reference

### useSnackbar Composable

The main composable for showing notifications.

**Methods:**

**`success(message, subtitle?, timeout?)`**
- Shows a success notification with green styling
- `message` (string) - Main message text
- `subtitle` (string, optional) - Additional detail text  
- `timeout` (number, optional) - Auto-hide duration in ms (default: 4000)
- Returns: notification ID (number)

**`error(message, subtitle?, timeout?)`**
- Shows an error notification with red styling
- `timeout` default: 6000ms (longer for errors)

**`warning(message, subtitle?, timeout?)`**
- Shows a warning notification with yellow styling
- `timeout` default: 5000ms

**`info(message, subtitle?, timeout?)`**
- Shows an info notification with blue styling
- `timeout` default: 4000ms

**`show(options)`**
- Shows a custom notification
- `options.message` (string) - Main message
- `options.subtitle` (string, optional) - Subtitle text
- `options.type` ('success' | 'error' | 'info' | 'warning', optional) - Type
- `options.timeout` (number, optional) - Auto-hide duration

**`hide(id)`**
- Hides a specific notification by ID
- `id` (number) - Notification ID returned from show methods

**`hideAll()`**
- Hides all active notifications immediately

### useSnackbarStore (Pinia Store)

Direct access to the Pinia store for advanced usage.

**State:**
- `snackbars` (Snackbar[]) - Array of all notifications
- `nextId` (number) - Auto-incrementing ID counter

**Getters:**
- `visibleSnackbars` - Filtered array of visible notifications

**Actions:**
- `showSnackbar(options)` - Core method for showing notifications
- `hideSnackbar(id)` - Hide specific notification
- `hideAllSnackbars()` - Hide all notifications
- `showSuccess/showError/showInfo/showWarning` - Convenience methods

## Real-World Examples

### Form Validation Feedback

```vue
<script setup>
import { ref } from 'vue';
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();
const form = ref({ email: '', password: '' });

const handleSubmit = async () => {
  try {
    await saveUserData(form.value);
    
    snackbar.success(
      'Account created successfully!', 
      'Welcome to WBM Band'
    );
  } catch (error) {
    snackbar.error(
      'Registration failed',
      error.message || 'Please check your information and try again',
      8000 // Longer timeout for errors
    );
  }
};
</script>
```

### API Error Handling

```typescript
// utils/api.ts
import { useSnackbar } from '~/composables/useSnackbar';

export const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    const snackbar = useSnackbar();
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      snackbar.error(
        'Network Error',
        'Unable to connect to the server. Please check your connection.',
        6000
      );
      throw error;
    }
  }
};
```

### Multi-step Process Feedback

```vue
<script setup>
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();

const uploadFiles = async (files: File[]) => {
  let successCount = 0;
  let errorCount = 0;
  
  // Show initial info
  snackbar.info(
    'Upload started',
    `Processing ${files.length} files...`,
    2000
  );
  
  for (const file of files) {
    try {
      await uploadFile(file);
      successCount++;
      
      // Show individual success (short timeout)
      snackbar.success(`${file.name} uploaded`, undefined, 2000);
    } catch (error) {
      errorCount++;
      
      // Show individual error
      snackbar.error(
        `Failed to upload ${file.name}`,
        error.message,
        5000
      );
    }
  }
  
  // Show final summary
  if (errorCount === 0) {
    snackbar.success(
      'All files uploaded successfully!',
      `${successCount} files processed`,
      6000
    );
  } else {
    snackbar.warning(
      'Upload completed with errors',
      `${successCount} successful, ${errorCount} failed`,
      8000
    );
  }
};
</script>
```

### Real-time Notifications

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();
let eventSource: EventSource;

onMounted(() => {
  // Set up WebSocket or SSE for real-time updates
  eventSource = new EventSource('/api/notifications');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    snackbar.info(
      data.title,
      data.message,
      data.urgent ? 10000 : 5000
    );
  };
});

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
</script>
```

## Styling and Customization

### Design System

The snackbar uses a modern glassmorphism design with:

- **Backdrop blur**: Creates depth and modern aesthetics
- **Gradient backgrounds**: Subtle gradients for each notification type
- **Color-coded borders**: Left border indicates notification type
- **Progress bars**: Visual timeout indicator
- **Smooth animations**: Slide-in from right with bounce effect

### Notification Types

**Success** (Green)
- Background: Dark green gradient with transparency
- Icon: `pi-check-circle`
- Use for: Successful operations, confirmations

**Error** (Red)  
- Background: Dark red gradient with transparency
- Icon: `pi-times-circle`
- Use for: Failures, validation errors, critical issues

**Warning** (Yellow)
- Background: Dark orange gradient with transparency  
- Icon: `pi-exclamation-triangle`
- Use for: Cautions, confirmations needed, important notices

**Info** (Blue)
- Background: Dark blue gradient with transparency
- Icon: `pi-info-circle`  
- Use for: General information, tips, feature announcements

### Animation Details

```scss
// Enter animation: slide in from right with spring effect
.snackbar-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

// Leave animation: slide out to right  
.snackbar-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

// Progress bar animation
@keyframes progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}
```

### Responsive Behavior

- **Desktop**: Fixed position in bottom-right corner
- **Mobile**: Full-width notifications at bottom with side margins
- **Stacking**: Multiple notifications stack vertically with smooth repositioning

## Best Practices

### 1. Choose Appropriate Types
```typescript
// ✅ Good: Match type to action result
snackbar.success('Data saved successfully');
snackbar.error('Validation failed', 'Email is required');
snackbar.warning('Unsaved changes', 'Are you sure you want to leave?');
snackbar.info('New feature available', 'Check out dark mode!');

// ❌ Avoid: Mismatched types
snackbar.error('Welcome to the site'); // Error for welcome message
snackbar.success('Server is down'); // Success for error condition
```

### 2. Provide Clear, Actionable Messages
```typescript
// ✅ Good: Clear and helpful
snackbar.error(
  'Login failed', 
  'Invalid email or password. Please try again.'
);

// ❌ Avoid: Vague or technical
snackbar.error('Error 500', 'Internal server error occurred');
```

### 3. Use Appropriate Timeouts
```typescript
// ✅ Good: Appropriate timeouts for content
snackbar.success('Saved!', undefined, 2000); // Quick confirmation
snackbar.error('Network error', 'Check connection', 8000); // Important error
snackbar.info('Tip: Use keyboard shortcuts', undefined, 6000); // Helpful info

// ❌ Avoid: Inappropriate timeouts  
snackbar.error('Critical error', undefined, 1000); // Too fast for error
snackbar.info('Minor tip', undefined, 10000); // Too long for simple info
```

### 4. Avoid Notification Spam
```typescript
// ✅ Good: Debounce rapid actions
let saveTimeout: NodeJS.Timeout;
const debouncedSave = () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    snackbar.success('Auto-saved');
  }, 1000);
};

// ❌ Avoid: Too many notifications
items.forEach(item => {
  processItem(item);
  snackbar.success(`Processed ${item.name}`); // Spam!
});
```

### 5. Handle Edge Cases
```typescript
// ✅ Good: Graceful error handling
try {
  await riskyOperation();
  snackbar.success('Operation completed');
} catch (error) {
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
    
  snackbar.error('Operation failed', message);
}
```

## Common Use Cases

- **Form Submissions** - Success/error feedback for data operations
- **File Uploads** - Progress and completion notifications  
- **Real-time Updates** - WebSocket message notifications
- **User Actions** - Confirmation of button clicks and operations
- **API Operations** - Status updates for CRUD operations
- **System Events** - Connection status, maintenance notices
- **Feature Announcements** - New functionality introductions

## Troubleshooting

**Notifications not appearing?**
- Verify `<Snackbar />` is included in `app.vue`
- Check that Pinia is properly installed and configured
- Ensure there are no z-index conflicts with other fixed elements

**Animations not smooth?**
- Check for global CSS that might disable transitions
- Verify Tailwind CSS is properly configured
- Ensure SCSS preprocessing is working

**TypeScript errors?**
- Make sure all types are imported from the store
- Check that the composable is properly typed
- Verify Pinia types are available

**Mobile layout issues?**
- Check viewport meta tag is set correctly
- Verify responsive breakpoints in Tailwind
- Test on actual devices, not just browser simulation

**Performance issues with many notifications?**
- Use `hideAll()` when navigating away from pages
- Consider debouncing rapid notification triggers
- Monitor memory usage in browser dev tools

## Advanced Usage

### Custom Notification Component

```vue
<script setup>
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();

// Create a custom notification with longer timeout and custom styling
const showCustomNotification = () => {
  const id = snackbar.show({
    message: 'Custom notification',
    subtitle: 'This has special behavior',
    type: 'info',
    timeout: 0 // Persistent until manually closed
  });
  
  // Auto-hide after user interaction
  setTimeout(() => {
    snackbar.hide(id);
  }, 30000);
};
</script>
```

### Integration with Error Boundaries

```vue
<script setup>
import { onErrorCaptured } from 'vue';
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();

onErrorCaptured((error, instance, info) => {
  console.error('Component error:', error);
  
  snackbar.error(
    'Component Error',
    'Something went wrong. The page will reload automatically.',
    0 // Persistent
  );
  
  // Auto-reload after delay
  setTimeout(() => {
    window.location.reload();
  }, 3000);
  
  return false; // Prevent error from propagating
});
</script>
```

---

This snackbar system provides a solid foundation for user feedback throughout the WBM Band Website, with modern styling, smooth animations, and excellent developer experience.
