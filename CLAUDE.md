# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                # Dev server on 0.0.0.0:3000
npm run generate           # SSG build + sitemap + bio-link sheet (use this, not `build`)
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

### i18n (`prefix_except_default`, default `ua`)

- Locales: `ua` (Ukrainian, **default and unprefixed**, file `locales/uk.json`) and `en` (`/en/...`, `locales/en.json`). Config in `i18n/i18n.config.ts`.
- **Ukrainian URLs carry no prefix**: `/`, `/listen/<slug>`, `/lyrics/<slug>`, `/privacy-policy`. There is no `/ua/...` — `public/.htaccess` 301s the retired prefix to the clean form. English is `/en/...`.
- All internal navigation must use `useLocalePath()` — never hardcode `/en/...`.
- `detectBrowserLanguage` is **`false`** and must stay that way. With it on, Googlebot (English `Accept-Language`) rendered the English home at `/` and Google indexed `<html lang="en-US">` at the Ukrainian canonical URL. Language choice is `<CommonLanguageSwitcher>`. See `docs/search-console.md`.
- The empty SPA shell is `200.html` — that is what the `.htaccess` fallback serves. `index.html` is the real Ukrainian home.
- The runtime middleware `redirect-share-urls.global.ts` is intentionally disabled — the routes are native now. Don't re-enable it.

### Static generation & prerender list

`nitro.prerender.routes` in `nuxt.config.ts` is the explicit list of pages that get generated. **When adding a new page, add both `/path` (Ukrainian, unprefixed) and `/en/path` entries** — otherwise the route won't be in the static output. `failOnError: false` is set so maintenance mode (returning 503) doesn't break the build.

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

Tailwind utility-first (`tailwind.config.js`). Custom SCSS only in `assets/css/base.scss` (reset) and `assets/css/utilities.scss` (animation keyframes, glassmorphism utilities). The `--perf-*` tier variables and `.perf-low/medium/high` classes live in `base.scss`. PrimeVue is in unstyled mode (`theme: 'none'`) — components are styled via Tailwind. Custom breakpoint `md2: 951px` in addition to defaults.

### Error pages

Navigate to `/404` with query params `{ title, message, buttonText, buttonLink, buttonIcon }` to render a contextual error via `components/common/ErrorPage.vue`. The `useErrorPage()` composable provides typed helpers. Several middlewares already use this pattern (e.g. `presave-access.ts`).

### Code style

Prettier (`.prettierrc`): no semis, single quotes, 2-space, no trailing commas, 100-col, `vueIndentScriptAndStyle: true`. ESLint (`eslint.config.mjs`) extends Nuxt config + Prettier; `vue/multi-word-component-names`, `vue/no-v-html`, `vue/require-default-prop` are off; unused-vars and `any` are warnings.

## Feature work (skills → docs)

Feature work starts with the task-oriented **skills** in [`.claude/skills/`](.claude/skills/) — each is auto-triggered by its description, bundles the procedure + the exact helper files, and links the deep-dive `docs/*.md` that remain the **source of truth** for API, edge-cases, and gotchas. Follow the matching skill instead of reading every doc. Full doc index + the new-doc template: [`docs/README.md`](docs/README.md). When you add a feature/system: add its doc to `docs/`, link it from `docs/README.md`, and fold it into the relevant skill (or add a new skill).

| Skill (`.claude/skills/`) | Covers — see linked `docs/*.md` for depth                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `new-release`             | **end-to-end release cycle** — intake → cover → data → verify → deploy → off-site catalogues → release-day flip                          |
| `add-release`             | release in `musicLibrary.ts`, preview/pre-save/released state, cover theming, lyrics                                                     |
| `work-with-images`        | AVIF/WebP/JPEG pipeline, `<UiProgressiveImage>`, blur placeholders, favicons                                                             |
| `add-page-route`          | new page/route, i18n (ua/en) parity, prerender list, `useLocalePath`                                                                     |
| `analytics-tracking`      | GA4 events, path-prefix source attribution (`useAnalytics`), promo-campaign `?c=` links (`npm run campaigns`)                            |
| `ui-feedback`             | global loading bar, snackbars, contextual `/404` error pages                                                                             |
| `performance`             | device-tier perf system, `--perf-*` CSS vars, reduced-motion                                                                             |
| `state-data-api`          | `useApi` + `ApiCache`, Pinia stores, `getConfig` config access                                                                           |
| `ship-deploy`             | tests/lint, `npm run generate`, FTP + GitHub Pages, `DEPLOY_TARGET`                                                                      |
| `search-console`          | **Google Search Console** — reading reports, indexing diagnostics, sitemap submission, post-release indexing pass, console configuration |
| `seo-entity`              | JSON-LD, MusicBrainz/Wikidata entity (never add llms.txt / Review schema)                                                                |
| `contact-form`            | Web3Forms contact submission                                                                                                             |

## Other pointers

- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — covers similar architectural ground in more detail; worth reading for additional pitfalls.
