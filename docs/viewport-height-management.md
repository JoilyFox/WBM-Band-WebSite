# Viewport Height Management

The `useViewportHeight` composable provides a stable viewport height solution that prevents layout jumps on mobile browsers when the address bar shows/hides.

## How It Works

The composable uses CSS custom properties to set a fixed viewport height based on the initial page load, preventing layout shifts during scrolling.

### CSS Integration

The composable sets a CSS custom property `--vh` that can be used in your styles:

```css
.hero-section {
  height: calc(var(--vh) * 100);
  min-height: 100vh; /* Fallback for older browsers */
}
```

### Global Integration

The composable is integrated globally in `pages/index.vue` to manage viewport height for the entire application:

```typescript
import { useViewportHeight } from '~/composables/useViewportHeight'

const { initializeViewportHeight } = useViewportHeight()

onMounted(() => {
  const cleanupViewportHeight = initializeViewportHeight()
  
  onUnmounted(() => {
    cleanupViewportHeight?.()
  })
})
```

## Benefits

- **No Layout Jumps**: Fixed height prevents jarring layout shifts
- **Mobile Optimized**: Specifically designed for mobile browser UI changes
- **Performance**: Minimal JavaScript overhead with CSS-based solution
- **Global**: Set once, use everywhere in your CSS

## Usage

### For Components Using Full Viewport Height

Use the CSS custom property in your component styles:

```css
.full-height-section {
  height: calc(var(--vh) * 100);
  min-height: 100vh; /* Fallback */
}
```

### For Custom Heights

You can also use fractions of the viewport height:

```css
.half-height-section {
  height: calc(var(--vh) * 50); /* 50% of viewport height */
}
```

## API

### `useViewportHeight()`

Returns an object with the following methods:

- `initializeViewportHeight()`: Sets up viewport height management and returns cleanup function
- `updateViewportHeight()`: Manually update the viewport height (rarely needed)
- `isInitialized`: Readonly ref indicating if the composable has been initialized

### Events Handled

- **Initial Load**: Sets the viewport height immediately
- **Orientation Change**: Updates height when device orientation changes (with 100ms delay)
- **Not on Resize**: Deliberately ignores window resize to prevent jumps during scrolling

## Browser Support

- **Modern Browsers**: Full support with CSS custom properties
- **Fallback**: Uses `min-height: 100vh` for older browsers
- **Mobile**: Optimized for iOS Safari and Android Chrome mobile browsers
