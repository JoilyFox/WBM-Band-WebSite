# WBM Band Website - AI Coding Instructions

## Architecture Overview

Nuxt 3 static site for a music band with dual-deployment strategy: GitHub Pages for testing, FTP to production (wbmband.com). Built with Vue 3 Composition API, TypeScript, Tailwind CSS, PrimeVue, and Pinia.

**Key architectural pattern**: Static-first with aggressive performance optimization. No runtime image processing—all assets pre-optimized at build time.

## Critical Workflows

### Development

```bash
npm run dev              # Starts dev server on 0.0.0.0:3000
npm run generate         # Full SSG build + creates non-localized route aliases
npm run build:production # Alias for generate (production-ready)
```

### Deployment

```bash
npm run deploy:github      # Sets DEPLOY_TARGET=github, builds for GH Pages with /WBM-Band-WebSite/ baseURL
npm run deploy:production  # Runs generate + FTP upload to wbmband.com (needs .env.production)
```

**Environment variable pattern**: `DEPLOY_TARGET=github` switches `nuxt.config.ts` to GitHub Pages paths. Without it, uses root paths for production.

### Image Processing

```bash
npm run compress-images    # Batch convert JPG to AVIF/WebP
npm run generate-blurred   # Pre-generate blur placeholders
npm run generate-favicons  # Generate multi-platform icons from source
```

## Project-Specific Conventions

### i18n Architecture

- **Strategy**: Prefix-based (`/en/*`, `/ua/*`)
- **Default locale**: `ua` (Ukrainian)
- **Translation keys**: Defined in `locales/en.json` and `locales/uk.json`
- **Non-localized routes**: `/pre-save/*` and `/listen/*` work without locale prefix via `scripts/create-nonlocalized-aliases.js` (copies `/ua/pre-save/*` to `/pre-save/*` in build output)
- **Root `/`**: serves the Ukrainian home (build copies `ua/index.html` → `index.html`); no browser-language redirect — see `docs/search-console.md`

### Configuration System

- **Central configs**: `config/general.ts` (band info, feature flags), `config/navigation.ts`
- **Access pattern**: Use `getConfig('general.contact.email')` from `utils/configHelpers.ts` with dot notation
- **Feature flags**: `enablePreSave`, `enableNextReleasePreview`, `maintenanceMode`

### Music Release States

Files: `data/musicLibrary.ts`, `middleware/presave-access.ts`, `utils/configHelpers.ts`

Three states based on `releaseDate` and config:

1. **Preview** (future date, `enableNextReleasePreview=true`, `enablePreSave=false`): Non-clickable card
2. **Pre-save** (future date, `enablePreSave=true`): Uses `preSaveMusicPlatformLinks`, navigates to `/pre-save/{slug}`
3. **Released** (past date): Uses `musicPlatformLinks`, navigates to `/listen/{slug}`

**Critical**: Pre-save middleware auto-redirects to `/listen/*` after release date passes.

### Image Optimization Pattern

Components: `components/ui/ProgressiveImage.vue`, composables: `useImagePreloader.ts`, `useImagePerformance.ts`

- **Picture elements**: AVIF → WebP → JPEG fallback (no runtime processing)
- **Critical images**: Use `fetchpriority="high"` and preload via `useImagePreloader()`
- **Lazy loading**: Native `loading="lazy"` for non-critical images
- **Placeholders**: Pre-generated blurred JPGs in `public/images/*-blurred.jpg`
- **Directory structure**: Original in `public/images/`, optimized in `public/images/optimized/`

### Performance System

Files: `composables/useScrollAnimation.ts`, `composables/usePerformanceOptimization.ts`, docs: `docs/performance-optimization.md`

Auto-detects device capabilities (RAM, CPU cores, connection) and sets CSS variables:

- `--perf-blur-strength`: 12px (high) / 6px (medium) / 0px (low)
- `--perf-animation-duration`: Scales based on performance tier
- **Target**: Smooth 60fps on iPhone 7/8 level devices

Apply via Tailwind classes conditioned on performance tier, not runtime JS.

### State Management

- **Pinia stores**: `store/globalLoading.ts` (top progress bar), `store/snackbar.ts` (notifications)
- **Composables pattern**: Prefer `useGlobalLoading()` over direct store access for better encapsulation
- **API layer**: `composables/useApi.ts` wraps `utils/api.ts` with loading states and error handling

### Caching Strategy

Files: `utils/cache.ts`, `utils/api.ts`, `composables/useApi.ts`

- **ApiCache class**: Uses Web Cache API, falls back to localStorage
- **Default TTL**: 5 minutes for GET requests
- **Key format**: `METHOD|URL|params|body`
- **Invalidation**: `invalidateCache(url)` or `apiCache.clear()`

### Styling Conventions

- **Tailwind utility-first**: Avoid custom CSS when Tailwind exists
- **Custom SCSS**: Only in `assets/css/base.scss` (reset), `assets/css/utilities.scss` (performance variables)
- **PrimeVue**: Unstyled mode (`theme: 'none'`), Tailwind integration only
- **Responsive breakpoints**: `xs:420px`, `sm:640px`, `md:768px`, `md2:951px` (custom), `lg:1024px`

### Route Middleware Execution Order

1. `redirect-share-urls.global.ts`: Converts old share URLs to new format
2. (removed) `i18n-root-redirect.global.ts` — `/` now serves the Ukrainian build output directly
3. `presave-access.ts`: Validates pre-save access and redirects to `/listen/*` if released
4. `listen-access.ts`: Validates listen page access

### Component Organization

- `components/common/`: Reusable UI primitives (Container, SectionTitle, etc.)
- `components/sections/`: Page sections (HeroSection, MusicLibrarySection)
- `components/music/`: Music-specific (MusicDetailModal, MusicDetailContent)
- `components/ui/`: Low-level UI components (ProgressiveImage, buttons, forms)

### Error Handling Pattern

- **Custom error pages**: Navigate with query params to `/404` with `{ title, message, buttonText, buttonLink, buttonIcon }`
- **Component**: `components/common/ErrorPage.vue` reads query params
- **Composable**: `useErrorPage()` provides type-safe error navigation

### Static Site Generation

- **Prerender routes**: Manually defined in `nuxt.config.ts` → `nitro.prerender.routes`
- **Add new routes**: Must add both `/en/path` and `/ua/path` to prerender list
- **Maintenance mode**: When `general.maintenanceMode=true`, main page redirects to error (other pages accessible)

## Common Pitfalls

1. **Forgetting to run `npm run generate`**: Always run full generate (not just `build`) to create non-localized route aliases
2. **Adding images without optimization**: Run `npm run compress-images` and `npm run generate-blurred` before committing
3. **Hardcoded URLs**: Use `useLocalePath()` from Nuxt i18n module for all internal navigation
4. **Locale-sensitive dates**: Always use `formatReleaseDate(date, locale)` from `configHelpers.ts`
5. **Missing prerender routes**: Add to `nuxt.config.ts` or route won't be generated
6. **Direct store access**: Use composable wrappers (`useGlobalLoading()`, `useSnackbar()`) instead
7. **Performance CSS without variables**: Always use `--perf-*` CSS variables, not hardcoded values

## Documentation

See `docs/` for deep dives: `deployment-guide.md`, `performance-optimization.md`, `image-optimization-guide.md`, `presave-functionality.md`, `api-caching.md`, `global-loading-system.md`, `snackbar-notifications.md`.
