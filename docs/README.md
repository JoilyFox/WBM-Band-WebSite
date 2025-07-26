# WBM Band Website - Documentation

This directory contains comprehensive documentation for all the core features and components of the WBM Band Website.

## Core Features Documentation

- [Snackbar Notifications](./snackbar-notifications.md) - Custom notification system with modern animations and multiple types

## Project Structure

```
├── components/
│   └── common/
│       └── Snackbar.vue           # Global snackbar component
├── composables/
│   └── useSnackbar.ts            # Snackbar composable hook
├── store/
│   └── snackbar.ts               # Pinia store for snackbar state
├── docs/
│   ├── README.md                 # This file
│   └── snackbar-notifications.md # Snackbar documentation
└── ...
```

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Tailwind CSS + SCSS for advanced styling
- **State Management**: Pinia for reactive state
- **UI Components**: PrimeVue for icons and base components
- **TypeScript**: Full type safety across the application

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation
```bash
npm install
npm run dev
```

### Using Components

All components are auto-imported in Nuxt 3. To use any feature:

```vue
<script setup>
import { useSnackbar } from '~/composables/useSnackbar';

const snackbar = useSnackbar();

const showNotification = () => {
  snackbar.success('Operation completed!', 'Data saved successfully');
};
</script>
```

## Adding New Documentation

When adding a new feature, please:

1. **Create a new `.md` file** in the `docs/` directory
2. **Follow the documentation template** (see template below)
3. **Update this README** to include your new feature
4. **Include practical examples** and API references

### Documentation Template

```markdown
# Feature Name

Brief description of what this feature does and why it's useful.

## Overview

Explain the main components and how they work together.

## Components

- [`ComponentName.vue`](../path/to/component.vue) - Description
- [`useFeature`](../path/to/composable.ts) - Description
- [`featureStore`](../path/to/store.ts) - Description

## Quick Start

### Basic Usage
\`\`\`vue
<script setup>
// Basic example here
</script>
\`\`\`

## API Reference

### Composable Methods
- `method()` - Description

### Store Actions  
- `action()` - Description

## Real-World Examples

Practical examples with common use cases.

## Best Practices

Guidelines for optimal usage.

## Troubleshooting

Common issues and solutions.
```

## Architecture Principles

### Component Design
- **Single Responsibility**: Each component has one clear purpose
- **Composition API**: Modern Vue 3 patterns with `<script setup>`
- **TypeScript First**: Full type safety and IntelliSense support
- **Accessible**: ARIA labels and keyboard navigation support

### State Management
- **Pinia Stores**: Centralized state for complex features
- **Composables**: Reusable logic with reactive state
- **Type Safety**: Strong typing for all store actions and getters

### Styling Approach
- **Utility First**: Tailwind CSS for rapid development
- **Component Styles**: SCSS for complex animations and component-specific styles
- **Design System**: Consistent spacing, colors, and typography
- **Responsive**: Mobile-first design principles

## Contributing

When contributing new features:

1. Follow the existing architecture patterns
2. Add comprehensive TypeScript types
3. Include unit tests for complex logic
4. Document all public APIs
5. Follow the established coding conventions
6. Ensure accessibility compliance

## Performance Considerations

- **Lazy Loading**: Components are automatically code-split
- **Tree Shaking**: Unused code is eliminated in production
- **Optimized Animations**: Hardware-accelerated CSS transitions
- **Minimal Bundle Size**: Only import what you need

---

_More feature documentation will be added as the project grows._
