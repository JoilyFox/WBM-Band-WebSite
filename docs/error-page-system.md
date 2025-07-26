# Error Page System

The WBM Band Website includes a comprehensive error page system that provides a unified user experience for handling navigation errors, failed data fetches, and unknown routes with modern glassmorphism design.

## Overview

The error page system automatically handles 404 errors and server errors while providing functionality to manually redirect users to custom error pages with personalized messages, button text, and navigation targets.

## Components

- [`ErrorPage.vue`](../components/common/ErrorPage.vue) - Main error page component with glassmorphism design
- [`error.vue`](../error.vue) - Nuxt 3 global error page handler
- [`pages/404.vue`](../pages/404.vue) - Dedicated 404 page for manual redirections
- [`useErrorPage.ts`](../composables/useErrorPage.ts) - Composable for programmatic error page redirections

## Features

- **Automatic Error Handling**: Catches all 404 and server errors automatically
- **Custom Error Messages**: Pass custom title, message, button text via query parameters
- **Multiple Error Types**: Different scenarios with appropriate icons and messaging
- **Glassmorphism Design**: Modern design that matches the application theme
- **Mobile Responsive**: Works perfectly on all device sizes
- **SEO Friendly**: Proper meta tags and no-index for error pages
- **Easy Integration**: Simple composable for programmatic redirections

## Quick Start

### Automatic Error Handling

The error system automatically handles:

```typescript
// 404 errors - when users navigate to unknown URLs
/unknown-page → Shows "Page Not Found" error

// 500 errors - server-side errors
throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })

// Any other errors - generic error handling
throw new Error('Something went wrong')
```

### Manual Error Redirections

```vue
<template>
  <div>
    <button @click="handleDataError">Show Data Error</button>
    <button @click="handleCustomError">Show Custom Error</button>
  </div>
</template>

<script setup lang="ts">
const { redirectToDataError, redirectToError } = useErrorPage()

const handleDataError = () => {
  redirectToDataError('Failed to load user data from the server')
}

const handleCustomError = () => {
  redirectToError({
    title: 'Feature Unavailable',
    message: 'This feature is temporarily unavailable. Please try again later.',
    buttonText: 'Go Back',
    buttonLink: '/dashboard',
    buttonIcon: 'pi pi-arrow-left'
  })
}
</script>
```

## API Reference

### useErrorPage Composable

```typescript
const errorPage = useErrorPage()

// Quick redirect methods
errorPage.redirectTo404()                                    // Standard 404 page
errorPage.redirectToDataError(customMessage?: string)       // Data loading errors
errorPage.redirectToAccessError()                           // Permission denied
errorPage.redirectToMaintenance()                           // Maintenance mode

// Custom error with full control
errorPage.redirectToError(options: ErrorPageOptions)
```

#### ErrorPageOptions Interface

```typescript
interface ErrorPageOptions {
  title?: string           // Error page title
  message?: string         // Detailed error message
  buttonText?: string      // Action button text
  buttonLink?: string      // Where button navigates to
  buttonIcon?: string      // PrimeIcons class for button icon
}
```

### ErrorPage Component Props

```typescript
interface ErrorPageProps {
  title?: string           // Default: 'Oops! Something went wrong'
  message?: string         // Default: 'We encountered an unexpected error...'
  buttonText?: string      // Default: 'Go to Home'
  buttonLink?: string      // Default: '/'
  buttonIcon?: string      // Default: 'pi pi-home'
}
```

### Query Parameter Support

You can also redirect using query parameters:

```typescript
// Manual navigation with query params
router.push({
  path: '/404',
  query: {
    title: 'Custom Title',
    message: 'Custom message here',
    buttonText: 'Custom Button',
    buttonLink: '/custom-target',
    buttonIcon: 'pi pi-custom-icon'
  }
})
```

## Error Types and Scenarios

### 404 - Page Not Found
- **Triggered**: Unknown URLs, missing pages
- **Icon**: Exclamation triangle (amber)
- **Default Message**: "Sorry, the page you are looking for does not exist..."
- **Button**: "Go to Home" → `/`

### 500 - Server Error
- **Triggered**: Server-side errors, API failures
- **Icon**: Times circle (red)
- **Default Message**: "We encountered an internal server error..."
- **Button**: "Try Again" → refresh or home

### Data Load Error
- **Triggered**: API fetch failures, network issues
- **Icon**: Exclamation triangle
- **Default Message**: "Failed to load the requested data..."
- **Button**: "Try Again" → `/`

### Access Denied
- **Triggered**: Permission errors, authentication failures
- **Icon**: Ban circle
- **Default Message**: "You do not have permission to access this page..."
- **Button**: "Go to Home" → `/`

### Maintenance Mode
- **Triggered**: Feature temporarily unavailable
- **Icon**: Wrench
- **Default Message**: "This feature is currently under maintenance..."
- **Button**: "Go to Home" → `/`

## Real-World Examples

### API Error Handling

```vue
<script setup lang="ts">
const { redirectToDataError } = useErrorPage()

const fetchUserData = async (userId: string) => {
  try {
    const user = await $fetch(`/api/users/${userId}`)
    return user
  } catch (error) {
    // Redirect to error page instead of showing blank page
    redirectToDataError(`Failed to load user ${userId}. Please check your connection.`)
  }
}
</script>
```

### Route Guard Protection

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { redirectToAccessError } = useErrorPage()
  const user = useAuthUser()
  
  if (!user.value) {
    return redirectToAccessError()
  }
})
```

### Feature Flag Handling

```vue
<script setup lang="ts">
const { redirectToMaintenance } = useErrorPage()

const checkFeatureAvailability = () => {
  const config = useRuntimeConfig()
  
  if (!config.public.featureEnabled) {
    redirectToMaintenance()
  }
}

onMounted(() => {
  checkFeatureAvailability()
})
</script>
```

### Form Submission Error

```vue
<script setup lang="ts">
const { redirectToError } = useErrorPage()

const handleFormSubmit = async (formData: any) => {
  try {
    await $fetch('/api/submit', { method: 'POST', body: formData })
    // Success handling
  } catch (error) {
    redirectToError({
      title: 'Submission Failed',
      message: 'Your form could not be submitted. Please check your internet connection and try again.',
      buttonText: 'Back to Form',
      buttonLink: '/contact',
      buttonIcon: 'pi pi-arrow-left'
    })
  }
}
</script>
```

## Styling and Design

### Glassmorphism Effects

The error page features modern glassmorphism design:

```scss
.error-container {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

### Responsive Design

```scss
@media (max-width: 640px) {
  .error-container {
    margin: 0 1rem;
    padding: 1.5rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
}
```

### Interactive Button Effects

```scss
.error-button {
  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
  }
  
  &:active {
    transform: translateY(0) scale(0.95);
  }
}
```

## Icons

The error page uses [PrimeIcons](https://primevue.org/icons/) for visual feedback:

- `pi pi-exclamation-triangle` - Warning/404 errors
- `pi pi-times-circle` - Critical errors
- `pi pi-ban` - Access denied
- `pi pi-wrench` - Maintenance
- `pi pi-home` - Navigate home
- `pi pi-refresh` - Try again
- `pi pi-arrow-left` - Go back

## SEO and Accessibility

### Meta Tags

```typescript
useHead({
  title: '404 - Page Not Found | WBM Band Website',
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
```

### Accessibility Features

- Semantic HTML structure
- Proper heading hierarchy
- High contrast text
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Testing the Error System

The home page includes an interactive demo section where you can test all error scenarios:

1. **404 Page Not Found** - Standard not found error
2. **Data Load Error** - Simulates API failure
3. **Access Denied** - Permission error example
4. **Under Maintenance** - Maintenance mode example
5. **Custom Error** - Custom message demonstration
6. **Navigate to /unknown** - Triggers automatic 404 handling

## Best Practices

1. **Choose Appropriate Error Types**: Use specific error methods for different scenarios
2. **Provide Helpful Messages**: Give users clear information about what went wrong
3. **Guide User Actions**: Make button text and links help users recover
4. **Maintain Brand Consistency**: Error pages should feel part of your application
5. **Test Error Scenarios**: Regularly test different error conditions
6. **Monitor Error Patterns**: Track which errors occur most frequently

## Troubleshooting

**Error page not showing?**

- Check that `ErrorPage.vue` is in the correct location
- Verify the component is properly imported
- Ensure Nuxt 3 error handling is configured

**Custom redirections not working?**

- Verify `useErrorPage` composable is imported
- Check router navigation permissions
- Ensure query parameters are properly formatted

**Styling issues?**

- Check for CSS conflicts
- Verify PrimeIcons are loaded
- Test backdrop-filter browser support

**Mobile responsiveness problems?**

- Test on actual devices
- Check viewport meta tag
- Verify touch interactions work properly

## Browser Support

- **Chrome/Edge 76+**: Full support including backdrop-filter
- **Firefox 72+**: Full support
- **Safari 14+**: Full support
- **Older browsers**: Graceful degradation without backdrop-filter effects
