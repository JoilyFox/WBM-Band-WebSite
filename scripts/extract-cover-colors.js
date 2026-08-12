#!/usr/bin/env node
/**
 * extract-cover-colors.js
 *
 * Build-time palette extraction for release covers. For every album cover under
 * `public/images/optimized/albums-images/<slug>/cover.jpg`, this derives a small
 * colour palette (primary / secondary / accent + a tinted near-black base and a
 * light tint) and writes a typed manifest to `data/coverColors.generated.ts`.
 *
 * The release pages (`MusicDetailContent.vue` via `useReleaseTheme`) consume that
 * manifest to paint the cover-driven "Ambient Bloom" atmosphere — so the page
 * literally glows the colours of each artwork. This runs at build time only
 * (the site is fully static); there is zero runtime image processing.
 *
 * Re-run after adding or changing a cover:
 *   npm run extract-colors
 *
 * Covers that extract to a muddy/monochrome palette (e.g. a black-and-white
 * photo) can be hand-tuned via the optional `theme` field on the release in
 * `data/musicLibrary.ts` — that override always wins over this generated data.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ALBUMS_DIR = path.join(__dirname, '../public/images/optimized/albums-images')
const OUTPUT_FILE = path.join(__dirname, '../data/coverColors.generated.ts')

// Analyse at a small size — heavy blur on the page hides any loss of detail and
// this keeps extraction near-instant.
const SAMPLE_SIZE = 64

// ---------------------------------------------------------------------------
// Colour-space helpers (no dependencies — plain math)
// ---------------------------------------------------------------------------

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: h * 360, s, l }
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  h /= 360
  let r
  let g
  let b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

const toHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')

const hslToHex = (h, s, l) => {
  const { r, g, b } = hslToRgb(h, s, l)
  return toHex(r, g, b)
}

// Perceptual luminance (0–1), used to decide whether a cover reads as dark.
const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

// Smallest absolute distance between two hues on the colour wheel (0–180).
const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

// ---------------------------------------------------------------------------
// Palette extraction
// ---------------------------------------------------------------------------

async function extractPalette(coverPath) {
  const { data } = await sharp(coverPath)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Quantise into a coarse colour cube (4 bits/channel → 4096 buckets) and keep
  // a running average per bucket plus an overall average for the dark base.
  const buckets = new Map()
  let sumR = 0
  let sumG = 0
  let sumB = 0
  const pixelCount = data.length / 3

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    sumR += r
    sumG += g
    sumB += b
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { count: 0, r: 0, g: 0, b: 0 }
      buckets.set(key, bucket)
    }
    bucket.count++
    bucket.r += r
    bucket.g += g
    bucket.b += b
  }

  const avg = {
    r: sumR / pixelCount,
    g: sumG / pixelCount,
    b: sumB / pixelCount
  }
  const overallLuma = luma(avg.r, avg.g, avg.b)

  // Score each bucket: weight its frequency by saturation (vibrant colours win)
  // and by a mid-tone lightness band (so the accent isn't a near-black or a
  // blown-out highlight). Near-black / near-white buckets are dropped entirely.
  const scored = []
  for (const bucket of buckets.values()) {
    const r = bucket.r / bucket.count
    const g = bucket.g / bucket.count
    const b = bucket.b / bucket.count
    const { h, s, l } = rgbToHsl(r, g, b)
    if (l > 0.96 || l < 0.05) continue
    const lumaWeight = clamp(1 - Math.abs(l - 0.55) * 1.4, 0.15, 1)
    const score = bucket.count * (0.18 + s * s) * lumaWeight
    scored.push({ h, s, l, r, g, b, count: bucket.count, score })
  }
  scored.sort((a, b) => b.score - a.score || a.h - b.h)

  // Fallback when an image is so flat/empty that nothing survived the filter.
  if (scored.length === 0) {
    const { h, s } = rgbToHsl(avg.r, avg.g, avg.b)
    const flat = hslToHex(h, clamp(s, 0.1, 0.4), 0.5)
    return buildResult({
      primary: flat,
      secondary: flat,
      accent: flat,
      avg,
      overallLuma,
      muted: true
    })
  }

  // Pick primary, then secondary/accent that are hue-separated for variety.
  const picks = [scored[0]]
  for (const cand of scored.slice(1)) {
    if (picks.length >= 3) break
    const farEnough = picks.every((p) => hueDistance(p.h, cand.h) > 22)
    if (farEnough) picks.push(cand)
  }
  // Top up from the ranking if the cover lacks hue variety (e.g. monochrome).
  for (let i = 1; picks.length < 3 && i < scored.length; i++) {
    if (!picks.includes(scored[i])) picks.push(scored[i])
  }

  // Normalise each pick to a confident, page-friendly version of itself
  // (refine() lives at module scope so buildResult can reuse it).
  const primary = refine(picks[0])
  const secondary = refine(picks[1] || picks[0])
  const accent = refine(picks[2] || picks[1] || picks[0])
  const muted = picks[0].s < 0.2

  return buildResult({ primary, secondary, accent, picks, avg, overallLuma, muted })
}

function buildResult({ primary, secondary, accent, picks, avg, overallLuma, muted }) {
  // Tinted near-black base: take the overall average hue, crush lightness so it
  // reads as black with a faint colour cast under the bloom.
  const avgHsl = rgbToHsl(avg.r, avg.g, avg.b)
  const dark = hslToHex(
    avgHsl.h,
    clamp(avgHsl.s * 0.9, 0.05, 0.55),
    clamp(avgHsl.l * 0.32, 0.035, 0.1)
  )

  // Light tint derived from the primary, for subtle highlights / title glow.
  const primHsl = rgbToHsl(...hexToRgb(primary))
  const light = hslToHex(primHsl.h, clamp(primHsl.s, 0.12, 0.5), 0.86)

  // De-duplicated palette list for the aura mesh (primary first).
  const palette = []
  for (const hex of [primary, secondary, accent, ...(picks || []).map((p) => refine(p))]) {
    if (hex && !palette.includes(hex)) palette.push(hex)
    if (palette.length >= 5) break
  }

  return {
    primary,
    secondary,
    accent,
    dark,
    light,
    palette,
    isDark: overallLuma < 0.42,
    isMuted: !!muted
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Needed by buildResult's palette top-up (declared after use above is fine in JS,
// but keep a stable reference for clarity).
function refine(c) {
  const s = clamp(c.s * 1.1, 0.18, 0.92)
  const l = clamp(c.l, 0.42, 0.66)
  return hslToHex(c.h, s, l)
}

// ---------------------------------------------------------------------------
// Manifest generation
// ---------------------------------------------------------------------------

// Prettier's `quoteProps: 'as-needed'` strips quotes from keys that are valid
// identifiers, so emitting every slug quoted makes the generated file fail lint
// (`prettier/prettier`) on every regeneration. Quote only what actually needs it
// (e.g. 'chorni-ptahy', whose hyphen isn't identifier-legal).
const keyLiteral = (slug) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(slug) ? slug : `'${slug}'`)

function serialize(map) {
  const entries = Object.keys(map)
    .sort()
    .map((slug) => {
      const p = map[slug]
      const palette = p.palette.map((c) => `'${c}'`).join(', ')
      return `  ${keyLiteral(slug)}: {
    primary: '${p.primary}',
    secondary: '${p.secondary}',
    accent: '${p.accent}',
    dark: '${p.dark}',
    light: '${p.light}',
    palette: [${palette}],
    isDark: ${p.isDark},
    isMuted: ${p.isMuted}
  }`
    })
    .join(',\n')

  return `/**
 * AUTO-GENERATED by scripts/extract-cover-colors.js — DO NOT EDIT BY HAND.
 *
 * Per-release colour palettes extracted from each album cover at build time and
 * consumed by composables/useReleaseTheme.ts to paint the cover-driven release
 * page atmosphere. Regenerate with: npm run extract-colors
 *
 * To override a release's palette (e.g. a muddy monochrome cover), set the
 * optional \`theme\` field on that release in data/musicLibrary.ts — the override
 * always wins over this generated data.
 */

export interface CoverPalette {
  /** Most vibrant dominant colour. */
  primary: string
  /** Second hue-separated colour for the aura mesh. */
  secondary: string
  /** Third accent colour. */
  accent: string
  /** Tinted near-black base for the page background. */
  dark: string
  /** Light tint derived from the primary (highlights / title glow). */
  light: string
  /** De-duplicated colour list (primary first) for the aura blobs. */
  palette: string[]
  /** Whether the cover reads as overall dark. */
  isDark: boolean
  /** Whether the cover is near-monochrome (low saturation) — a good override candidate. */
  isMuted: boolean
}

export const coverColors: Record<string, CoverPalette> = {
${entries}
}

export const getCoverPalette = (slug: string): CoverPalette | undefined => coverColors[slug]
`
}

async function main() {
  let dirents
  try {
    dirents = await fs.readdir(ALBUMS_DIR, { withFileTypes: true })
  } catch (err) {
    console.error(`Could not read albums dir: ${ALBUMS_DIR}`, err.message)
    process.exit(1)
  }

  const result = {}
  for (const dirent of dirents) {
    if (!dirent.isDirectory() || dirent.name === 'thumbs') continue
    const slug = dirent.name
    const coverPath = path.join(ALBUMS_DIR, slug, 'cover.jpg')
    try {
      await fs.access(coverPath)
    } catch {
      continue // not a release folder
    }
    try {
      const palette = await extractPalette(coverPath)
      result[slug] = palette
      console.log(
        `🎨 ${slug.padEnd(16)} primary ${palette.primary}  secondary ${palette.secondary}  accent ${palette.accent}` +
          `${palette.isMuted ? '  (muted — consider a theme override)' : ''}`
      )
    } catch (err) {
      console.error(`Failed to extract ${slug}:`, err.message)
    }
  }

  await fs.writeFile(OUTPUT_FILE, serialize(result), 'utf8')
  const rel = path.relative(path.join(__dirname, '..'), OUTPUT_FILE)
  console.log(`\n✅ Wrote ${Object.keys(result).length} palette(s) → ${rel}`)
}

main()
