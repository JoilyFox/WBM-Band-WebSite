# CSS Architecture

This project uses a modular CSS architecture with separate files for different concerns.

## Structure

```
assets/css/
├── main.css                 # Main entry point with imports only
├── base.scss               # Base styles and typography
├── utilities.scss          # Custom utility classes and animations
├── components/
│   └── general.scss        # General component styles (cards, inputs, etc.)
└── primevue/
    ├── buttons.scss        # PrimeVue Button customizations
    ├── dialog.scss         # PrimeVue Dialog customizations
    └── inputs.scss         # PrimeVue Input customizations
```

## How to Use

### Adding New PrimeVue Component Styles
1. Create a new `.scss` file in `assets/css/primevue/`
2. Add your component-specific styles using Tailwind's `@apply` directive
3. Import the file in `main.css`

Example for a new DataTable component:
```scss
// assets/css/primevue/datatable.scss
@layer components {
  .p-datatable {
    @apply bg-surface-800 border border-surface-700 rounded-lg;
    
    .p-datatable-header {
      @apply bg-surface-900 text-surface-50 px-4 py-3;
    }
  }
}
```

Then add to `main.css`:
```css
@import './primevue/datatable.scss';
```

### Adding General Component Styles
Add new styles to `assets/css/components/general.scss` or create new files in the `components/` directory.

### Adding Utilities
Add new utility classes to `assets/css/utilities.scss`.

## Guidelines

1. **Use `@layer` directives** to organize styles properly
2. **Prefer `@apply` with Tailwind classes** over custom CSS when possible
3. **Keep component-specific styles** in their respective files
4. **Use semantic naming** for custom classes
5. **Import files in the correct order** in `main.css`

## Import Order in main.css

1. External CSS (PrimeIcons, etc.)
2. Tailwind directives
3. Base styles
4. General components
5. PrimeVue component customizations
6. Utilities

This ensures proper CSS cascade and Tailwind layer ordering.
