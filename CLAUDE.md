# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                # Dev server on 0.0.0.0:3000
npm run generate           # SSG build + create non-localized route aliases (use this, not `build`)
npm run build:production   # Alias for `npm run generate` (production output)
npm run deploy:github      # SSG build for GitHub Pages (sets DEPLOY_TARGET=github → /WBM-Band-WebSite/ baseURL)
npm run deploy:production  # Build + FTP upload to wbmband.com (requires .env.production)

npm run lint               # ESLint
npm run lint:fix           # ESLint with autofix
npm run format             # Prettier write
npm run analyze            # Bundle analyzer

npm run compress-images    # Convert sources to AVIF/WebP (run before committing new images)
npm run generate-blurred   # Pre-generate blur placeholders
npm run generate-favicons  # Regenerate favicon set from source
```

`postinstall` runs `nuxt prepare`. A husky `pre-commit` hook runs `lint-staged` (Prettier + ESLint --fix on staged JS/TS/Vue/JSON/MD).

## Architecture

Nuxt 3 (Vue 3 Composition API, TypeScript, Tailwind, PrimeVue unstyled, Pinia) static site for the WBM Band. Static-first with build-time image optimization — no runtime image processing.

### Dual-deploy via `DEPLOY_TARGET`

`nuxt.config.ts` keys all asset paths off `process.env.DEPLOY_TARGET`:

- `DEPLOY_TARGET=github` → `baseURL=/WBM-Band-WebSite/` and every favicon/meta `href` is prefixed with `/WBM-Band-WebSite`.
- Unset → `baseURL=/` for `wbmband.com` production.

When adding head links/meta with paths, follow the same conditional-prefix pattern that already exists in `nuxt.config.ts`.

### i18n (prefix strategy, default `ua`)

- Locales: `ua` (Ukrainian, default, file `locales/uk.json`) and `en` (`locales/en.json`). Config in `i18n/i18n.config.ts`.
- All internal navigation must use `useLocalePath()` — never hardcode `/en/...` or `/ua/...`.
- `middleware/i18n-root-redirect.global.ts` redirects bare `/` to the localized home (client-only).
- Non-localized share URLs: `/pre-save/*` and `/listen/*` work without a locale prefix because `scripts/create-nonlocalized-aliases.js` (run by `npm run generate`) copies the built `ua/pre-save/*` and `ua/listen/*` directories to root. The runtime middleware `redirect-share-urls.global.ts` is intentionally disabled — server-side `.htaccess` handles it. Don't re-enable it.

### Static generation & prerender list

`nitro.prerender.routes` in `nuxt.config.ts` is the explicit list of pages that get generated. **When adding a new page, add both `/en/path` and `/ua/path` entries** — otherwise the route won't be in the static output. `failOnError: false` is set so maintenance mode (returning 503) doesn't break the build.

`experimental.appManifest: false` is intentional — disabled to prevent 404s for build-metadata requests on static hosts.

### Music release state machine

The state of a release is derived from `releaseDate` in `data/musicLibrary.ts` plus feature flags in `config/general.ts`:

1. **Preview** (future date, `enableNextReleasePreview=true`, `enablePreSave=false`) → non-clickable card.
2. **Pre-save** (future date, `enablePreSave=true`) → uses `preSaveMusicPlatformLinks`, page `/pre-save/{slug}`. If `useDistributorPreSave=true`, redirects to `distributorPreSaveUrl`.
3. **Released** (past date) → uses `musicPlatformLinks`, page `/listen/{slug}`.

`middleware/presave-access.ts` auto-redirects pre-save → listen once `releaseDate` passes, and 404s when pre-save is globally disabled or links are missing. `middleware/listen-access.ts` mirrors this for the listen page.

### Configuration access

Central config lives in `config/general.ts` (band info, contact, social, feature flags like `enablePreSave`, `enableNextReleasePreview`, `maintenanceMode`) and `config/navigation.ts`. Read it via `getConfig('general.contact.email', { fallback: '...' })` from `utils/configHelpers.ts` — uses dot-notation against a `configRegistry`. Add new config files to that registry to make them readable by path.

### State, API, caching

- Pinia stores: `store/globalLoading.ts`, `store/snackbar.ts`. Prefer the composable wrappers `useGlobalLoading()` and `useSnackbar()` over direct store imports.
- API layer: `composables/useApi.ts` wraps `utils/api.ts`. Caching via `utils/cache.ts` (`ApiCache` uses Web Cache API with `localStorage` fallback, default 5-min TTL on GET, key = `METHOD|URL|params|body`). Invalidate with `invalidateCache(url)` or `apiCache.clear()`.

### Performance system

`composables/usePerformanceOptimization.ts` and friends auto-detect device tier (RAM, CPU, connection) and set CSS variables (`--perf-blur-strength`, `--perf-animation-duration`, etc.). **Use those variables in styles** rather than hardcoding values, and apply tier-conditioned classes via Tailwind rather than runtime JS branching. See `docs/performance-optimization.md`.

### Images

Originals in `public/images/`, optimized variants in `public/images/optimized/`, pre-blurred placeholders alongside (e.g. `*-blurred.jpg`). Use `<ProgressiveImage>` for AVIF → WebP → JPEG `<picture>` fallback. Critical above-the-fold images need `fetchpriority="high"` and preloading via `useImagePreloader()`. Run `npm run compress-images` and `npm run generate-blurred` after adding new source images.

### Styling

Tailwind utility-first (`tailwind.config.js`). Custom SCSS only in `assets/css/base.scss` (reset) and `assets/css/utilities.scss` (perf vars). PrimeVue is in unstyled mode (`theme: 'none'`) — components are styled via Tailwind. Custom breakpoint `md2: 951px` in addition to defaults.

### Error pages

Navigate to `/404` with query params `{ title, message, buttonText, buttonLink, buttonIcon }` to render a contextual error via `components/common/ErrorPage.vue`. The `useErrorPage()` composable provides typed helpers. Several middlewares already use this pattern (e.g. `presave-access.ts`).

### Code style

Prettier (`.prettierrc`): no semis, single quotes, 2-space, no trailing commas, 100-col, `vueIndentScriptAndStyle: true`. ESLint (`eslint.config.mjs`) extends Nuxt config + Prettier; `vue/multi-word-component-names`, `vue/no-v-html`, `vue/require-default-prop` are off; unused-vars and `any` are warnings.

## Documentation (`docs/`)

This file is a high-level map. Every feature area below has a deep-dive doc that is the source of truth for its API, edge cases, and gotchas. **Before modifying or extending a feature, read its doc.** Before adding a new feature that touches any of these systems, read the relevant doc(s) and follow the patterns established there. When you add a new feature/system, add a doc to `docs/` (use the template in `docs/README.md`), link it from `docs/README.md`, and add a one-liner to the list below.

- [`docs/README.md`](docs/README.md) — index of all feature docs and the template for adding new ones.
- [`docs/deployment-guide.md`](docs/deployment-guide.md) — production deploy to wbmband.com via FTP, GitHub Pages deploy, `DEPLOY_TARGET` mechanics, `.env.production` setup, `.htaccess` rules for non-localized share URLs.
- [`docs/performance-optimization.md`](docs/performance-optimization.md) — device-tier detection, CSS performance variables, tier-conditioned classes, `usePerformanceOptimization` composables.
- [`docs/api-caching.md`](docs/api-caching.md) — `ApiCache` (Web Cache API + `localStorage` fallback), TTLs, cache keys, invalidation via `invalidateCache()` / `apiCache.clear()`, `useApi()` composable.
- [`docs/global-loading-system.md`](docs/global-loading-system.md) — top-bar progress indicator, `useGlobalLoading()` composable, `store/globalLoading.ts`.
- [`docs/snackbar-notifications.md`](docs/snackbar-notifications.md) — toast/snackbar system, `useSnackbar()` composable, `store/snackbar.ts`.
- [`docs/error-page-system.md`](docs/error-page-system.md) — `/404` route with query-param contract, `useErrorPage()` helpers, `components/common/ErrorPage.vue`, middleware integration pattern.
- [`docs/image-optimization-guide.md`](docs/image-optimization-guide.md) — AVIF/WebP/JPEG pipeline, `<ProgressiveImage>`, `npm run compress-images`, SSG-compatible image strategy.
- [`docs/pre-blurred-images.md`](docs/pre-blurred-images.md) — build-time blur/tint placeholder generation (`npm run generate-blurred`) replacing runtime overlay blur.
- [`docs/image-utilities.md`](docs/image-utilities.md) — image composables and helpers (loading state, preloading, `useImagePreloader()`).
- [`docs/favicon-setup.md`](docs/favicon-setup.md) — multi-platform favicon set, PWA icons, `npm run generate-favicons`, `DEPLOY_TARGET`-aware href prefixing.
- [`docs/presave-functionality.md`](docs/presave-functionality.md) — pre-save page, distributor redirect flow, `preSaveMusicPlatformLinks`, `middleware/presave-access.ts`.
- [`docs/release-states-system.md`](docs/release-states-system.md) — preview / pre-save / released state derivation, feature flags, automatic transitions when `releaseDate` passes.
- [`docs/web3forms-setup.md`](docs/web3forms-setup.md) — contact form integration via Web3Forms, env keys, submission flow.

## Other pointers

- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — covers similar architectural ground in more detail; worth reading for additional pitfalls.
