# Release Page Theming ("Ambient Bloom")

Cover-driven theming for the release pages (`/listen/*`, `/pre-save/*`). Each
page paints a whole-page **atmosphere** derived from the song's cover art — the
page literally glows the colours of the artwork — instead of the old static
purple/pink gradient that was identical for every release.

## Overview

Three things work together:

1. **Build-time palette extraction** ([`scripts/extract-cover-colors.js`](../scripts/extract-cover-colors.js))
   reads every cover and writes a typed palette manifest
   ([`data/coverColors.generated.ts`](../data/coverColors.generated.ts)). Zero
   runtime image work — the site is fully static.
2. **A resolver composable** ([`composables/useReleaseTheme.ts`](../composables/useReleaseTheme.ts))
   merges, field by field, an optional manual override → the auto-extracted
   palette → a deterministic slug-hash fallback, and emits the CSS custom
   properties that drive the look.
3. **The atmosphere layers** in
   [`components/music/MusicDetailContent.vue`](../components/music/MusicDetailContent.vue)
   consume those variables to render the "Ambient Bloom" effect.

The old slug-hash accent guess (`stringToHue`) is gone — the same `--accent1/2/edge`
variable names are now fed real cover colours, so the existing hero glow upgraded
for free.

## The atmosphere layers

Rendered in `.release-atmosphere` (absolute, behind all content, `pointer-events:
none`, skipped entirely in modal mode):

| Layer         | What                                             | Where it runs                         |
| ------------- | ------------------------------------------------ | ------------------------------------- |
| `.atmo-aura`  | Static radial-gradient mesh of the palette       | **Every device** (GPU-cheap, no blur) |
| `.atmo-bloom` | Blurred full-bleed cover image (the thumbnail)   | **High-perf desktop only** (≥768px)   |
| `.atmo-veil`  | Transparent vignette gradients for text contrast | **Every device**                      |

Plus a palette-tinted halo behind the album cover (`.music-album-cover::before`).

### Performance model (important)

The whole design is "cheap path by default, expensive path opt-in":

- **Mobile / low / medium tiers** get **only** the static aura mesh + veil — no
  blur filter, no animation, and the cover thumbnail is **never even fetched**
  (the `background-image` lives solely inside the `@media (min-width: 768px)
.perf-high` rule, so narrower/lower-tier devices don't request it).
- **High-perf desktop** additionally renders the blurred cover image and a slow,
  transform-based aura drift (compositor-friendly).
- Everything is killed by `.reduce-animations` and
  `@media (prefers-reduced-motion: reduce)`.
- Disabling the old `.music-hero::before/::after` pseudo-layers also **removed a
  blur that used to run on low-end mobile** — net win for phones.

Tiering keys off the existing `usePerformanceOptimization` classes
(`perf-high/medium/low`) — see [performance-optimization.md](./performance-optimization.md).

## CSS variables emitted

`useReleaseTheme` spreads these onto `.music-detail-content`:

| Variable                                    | Meaning                               |
| ------------------------------------------- | ------------------------------------- |
| `--accent1` / `--accent2` / `--accent-edge` | Hero accent layers (real palette now) |
| `--bloom-image`                             | `url()` of the cover thumbnail        |
| `--bloom-primary/secondary/accent`          | Aura mesh blob colours (rgba)         |
| `--bloom-dark`                              | Tinted near-black page base           |
| `--bloom-intensity`                         | 0–1 multiplier on bloom/aura strength |
| `--atmo-tint` / `--title-accent`            | Subtle tints for the rest of the page |

## Regenerating palettes

Run after adding or changing any cover (alongside `compress-images` /
`generate-blurred`):

```bash
npm run extract-colors
```

This rewrites `data/coverColors.generated.ts` (committed). It scans
`public/images/optimized/albums-images/<slug>/cover.jpg`, so run
`npm run compress-images` first if the optimized cover doesn't exist yet.

## Overriding a release (and bespoke variants)

Some covers extract poorly — e.g. a black-and-white photo lands on a muddy grey.
Set the optional `theme` field on the release in
[`data/musicLibrary.ts`](../data/musicLibrary.ts); it wins field by field over the
generated palette. Real example (the monochrome "Chorni Ptahy" cover, given an
intentional cold steel-blue palette):

```ts
{
  slug: 'chorni-ptahy',
  // ...
  theme: {
    primary: '#4f6d8a',
    secondary: '#5d6b80',
    accent: '#7d93ab',
    dark: '#0b0e12',
    light: '#d4dde6'
  }
}
```

`ReleaseTheme` (see `data/musicLibrary.ts`) also carries:

- `palette?: string[]` — explicit aura blob colours.
- `intensity?: number` — 0–1 effect strength.
- `variant?: 'bloom' | 'liquid'` — `'bloom'` (default) is the ambient effect.
  `'liquid'` is a reserved, dormant **bespoke** treatment: an animated SVG
  displacement filter that warps the cover (high-perf desktop only, falls back to
  bloom elsewhere). No release uses it yet — flip the flag to enable per drop.

## Files

- [`scripts/extract-cover-colors.js`](../scripts/extract-cover-colors.js) — build-time extractor (`npm run extract-colors`)
- [`data/coverColors.generated.ts`](../data/coverColors.generated.ts) — auto-generated manifest (do not edit by hand)
- [`composables/useReleaseTheme.ts`](../composables/useReleaseTheme.ts) — override → generated → fallback resolver
- [`data/musicLibrary.ts`](../data/musicLibrary.ts) — `ReleaseTheme` interface + `theme?` field
- [`components/music/MusicDetailContent.vue`](../components/music/MusicDetailContent.vue) — `.release-atmosphere` layers + styles

## Troubleshooting

- **A page looks grey / muddy** → the cover is near-monochrome (logged as
  `(muted — consider a theme override)` by `extract-colors`). Add a `theme`
  override.
- **No bloom image on desktop** → it only renders on the `perf-high` tier at
  ≥768px; mid-tier devices intentionally get the aura mesh only.
- **Colours didn't change after swapping a cover** → re-run `npm run extract-colors`
  (the manifest is baked at build time).
