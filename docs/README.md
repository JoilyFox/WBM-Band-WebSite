# WBM Band Website - Documentation

This directory contains documentation for all the main features of the WBM Band Website application.

## Features Documentation

- [API Caching](./api-caching.md) - Browser-based API response caching system with localStorage fallback
- [Global Loading System](./global-loading-system.md) - Top bar progress indicator for async operations
- [Snackbar Notifications](./snackbar-notifications.md) - Custom notification system with modern animations and multiple types
- [Error Page System](./error-page-system.md) - Comprehensive error handling with custom messages and glassmorphism design
- [Image Optimization Guide](./image-optimization-guide.md) - Comprehensive image optimization implementation with static site generation support
- [Image Utilities](./image-utilities.md) - Composables and helper functions for image loading states and optimization
- [Favicon Setup](./favicon-setup.md) - Complete favicon generation system with multi-platform support and PWA compatibility

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Tailwind CSS + SCSS with modular architecture
- **State Management**: Pinia for reactive state management
- **UI Components**: PrimeVue with custom extensions
- **TypeScript**: Full type safety across the application
- **Icons**: PrimeIcons for consistent iconography

## Adding New Documentation

To add documentation for a new feature:

1. **Create a new `.md` file** in the `docs/` directory (e.g., `my-feature.md`)
2. **Follow the standard structure**:
   - Feature title and overview
   - Components list with clickable links to source files
   - Quick start examples
   - API reference
   - Real-world examples
   - Best practices and troubleshooting
3. **Add your feature to the list above** with a brief description
4. **Use relative links** to source files: `[ComponentName.vue](../components/path/to/component.vue)`
5. **Keep it developer-focused** with practical examples and clear API documentation

### Documentation Template

```markdown
# Feature Name

Brief description of what this feature does.

## Overview

Explain the main components and how they work together.

## Components

- [`ComponentName.vue`](../components/path/to/component.vue) - Description
- [`useFeatureComposable`](../composables/useFeature.ts) - Description
- [`featureStore`](../store/feature.ts) - Description

## Quick Start

### Basic Usage

\`\`\`vue
<template>
  <!-- Template example -->
</template>

<script setup lang="ts">
// Script example
</script>
\`\`\`

## API Reference

Detailed API documentation...

## Real-World Examples

Practical usage scenarios...

## Best Practices

Guidelines for optimal usage...

## Troubleshooting

Common issues and solutions...
```

---

_More feature documentation will be added as the project grows._
