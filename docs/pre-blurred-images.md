# Pre‑Blurred Image Workflow

This document describes how to generate blurred, tinted album cover variants at build-time and use them in the UI to avoid runtime backdrop-filter costs. It complements the overall Image Optimization Guide and is fully compatible with static site generation (GitHub Pages).

## Why pre‑blur?

- Eliminates expensive CSS backdrop-filter on mobile and low-end devices
- Keeps the same aesthetic (blur + saturation + subtle gradient tints + darkening)
- Ships as static assets — zero runtime processing

## What’s included

- Node script: `scripts/generate-blurred-image.js` (uses `sharp`)
- New Release card uses the `-blurred` variant automatically
- Overlay updated to remove heavy blur; keeps ultra‑subtle noise only

## Files

- [`scripts/generate-blurred-image.js`](../scripts/generate-blurred-image.js) — generator
- [`components/sections/MusicLibrarySection.vue`](../components/sections/MusicLibrarySection.vue) — wiring and overlay tweaks
- [`package.json`](../package.json) — added npm script `generate-blurred`

## Quick start

1) Generate a blurred variant for a cover image:

```bash
npm run generate-blurred -- public/images/albums-images/cover.jpg
```

Options (all optional):
- `--sigma=100`      Gaussian blur strength
- `--saturation=1.8` Saturation multiplier
- `--darken=0.4`     Dark layer opacity (0..1)
- `--suffix=-blurred` Custom filename suffix

The output is saved next to the input with the suffix, e.g. `cover-blurred.jpg`.

2) Ensure your New Release config points to the original image path. The component computes the blurred URL automatically (inserting `-blurred` before the extension).

## Component changes

In `MusicLibrarySection.vue`, the New Release card now loads the pre‑blurred image:

- Uses a computed `blurredNewReleaseImageUrl` that maps `cover.jpg` → `cover-blurred.jpg`
- Overlay `backdrop-filter` removed; background set to transparent; retains minimal noise for texture

This approach preserves the design while removing the heaviest GPU effect.

## Batch processing (optional)

If you maintain many covers, you can loop over a directory. Example snippet you can run with node (or extend the script):

```js
// pseudo: batch-generate-blurred.js
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = 'public/images/albums-images'
for (const file of fs.readdirSync(dir)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue
  const full = path.join(dir, file)
  spawnSync('node', ['scripts/generate-blurred-image.js', full], { stdio: 'inherit' })
}
```

## Tips and best practices

- Keep `sigma` around 80–120 for very soft backgrounds; adjust to taste
- Slightly boost saturation (1.6–1.9) for a pleasing blurred backdrop
- Darken 0.35–0.45 improves text/icon contrast
- Commit generated `-blurred` files to the repo (static hosting)

## Troubleshooting

- If the blurred image 404s, verify you generated it for the configured path
- Consider a fallback: detect image error and swap back to the original (can be added if needed)
- For AVIF/WebP pipelines, generate blurred variants per format if you want fully modern stacks; otherwise JPEG alone is fine for the blurred background layer

## Related docs

- [Image Optimization Guide](./image-optimization-guide.md)
- [Image Utilities](./image-utilities.md)
