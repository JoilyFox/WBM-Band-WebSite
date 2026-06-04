---
name: work-with-images
description: 'Use when adding/optimizing images on the WBM site — AVIF/WebP/JPEG pipeline, <UiProgressiveImage>, responsive srcset/presets, blur placeholders, or favicons (npm run compress-images / generate-blurred / generate-favicons).'
---

## When to use

Adding or swapping site imagery, tuning the AVIF/WebP/JPEG pipeline, rendering via `<UiProgressiveImage>`, adjusting responsive presets/srcset, generating blur backdrops, or regenerating favicons/PWA icons.

## Steps

1. Drop the original (high-res) file in `public/images/...` (a preset subfolder is fine; sources live outside `optimized/`).
2. `npm run compress-images` → emits `public/images/optimized/**` as `name.<ext>` (widest) + `name-<w>.<ext>` per preset width, in avif/webp/jpg.
3. Reference the **extension-less optimized-or-original** path in data/config; render with `<UiProgressiveImage src="..." alt="..." preset="album" sizes="..." />`. It builds the `<picture>` (AVIF→WebP→JPEG), placeholder, and load-fade.
4. Above-the-fold images: set `loading="eager" fetch-priority="high"`, and preload via `useImagePreloader()` passing the **same `IMAGE_SIZES` value** as the rendered `<img>`.
5. Blur backdrop (album cards): `npm run generate-blurred -- public/images/albums-images/cover.jpg` → `cover-blurred.jpg` (flags `--sigma --saturation --darken --suffix`); commit it.
6. Favicons: replace `public/favicon.svg`, run `npm run generate-favicons`.
7. Commit generated `optimized/`, `-blurred`, and favicon assets (static hosting — no runtime processing).

## Source of truth

- `docs/image-optimization-guide.md` — pipeline, presets, ProgressiveImage, preloading; read on demand.
- `docs/image-utilities.md` — `imageHelpers` composables/helpers; read on demand.
- `docs/pre-blurred-images.md` — blur backdrop generation + flags; read on demand.
- `docs/favicon-setup.md` — favicon/PWA set + `DEPLOY_TARGET` href prefixing; read on demand.

## Key files

- `utils/imageHelpers.ts` — `generatePictureSources()`, `getResponsiveImageSrcSet()`, `preloadCriticalImages()`, `useImageLoading()`, `IMAGE_SIZES`, `preloadImage()`.
- `composables/useImagePreloader.ts` — `useImagePreloader()`; `preloadHeroImages()`, `preloadAlbumCovers()`.
- `composables/useImagePerformance.ts` — `useImagePerformance()`; `startMonitoring()`, `getSlowImages()`.
- `composables/useAssetUrl.ts` — `useAssetUrl()`; `resolveUrl()`, `resolveSrcSet()` (base-path/srcset prefixing).
- `constants/imagePresets.json` — single source for widths/aspect/quality/formats (build + runtime).
- `components/ui/ProgressiveImage.vue` — `<UiProgressiveImage>`; props incl. `srcPortrait`/`presetPortrait` for art-direction.

## Gotchas

- `imagePresets.json` feeds BOTH `compress-images.js` and `imageHelpers.ts` — add a width here and both pick it up; never hardcode widths elsewhere.
- The `<img>` `sizes` and the preloader `sizes` MUST match (use `IMAGE_SIZES.*`) or the browser double-fetches.
- Use base-path helpers under GitHub Pages: `resolveUrl()` for a single URL, `resolveSrcSet()` for a srcset (plain `resolveUrl` mis-prefixes only the first URL).
- Reference paths WITHOUT extension; the component adds `.avif/.webp/.jpg`. Originals stay outside `optimized/`.
- Single-width presets (team/thumbnail/meta) are non-responsive (one-URL srcset); `meta` is jpg/png only.
- Favicon hrefs need the `DEPLOY_TARGET=github` prefix pattern already in `nuxt.config.ts`.

## Related

- Skills: release-page-theming (cover palette extraction), performance-optimization (device-tier blur/animation vars).
- Agents: i18n-checker, release-coordinator.
- Commands: `npm run compress-images`, `npm run generate-blurred`, `npm run generate-favicons`.
