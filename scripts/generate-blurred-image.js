#!/usr/bin/env node
/**
 * generate-blurred-image.js
 *
 * Create a blurred, saturated, and subtly tinted version of an image, saved next
 * to the original with a "-blurred" suffix. This bakes in effects similar to the
 * CSS overlay used in the New Release Preview card.
 *
 * Usage:
 *   node scripts/generate-blurred-image.js <inputPath> [--sigma=100] [--saturation=1.8] [--darken=0.4] [--suffix=-blurred]
 *
 * Examples:
 *   node scripts/generate-blurred-image.js public/assets/images/cover.jpg
 *   node scripts/generate-blurred-image.js public/img/cover.png --sigma=12 --saturation=1.6 --darken=0.35
 */

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const args = { _: [] }
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      args[k] = v === undefined ? true : isNaN(Number(v)) ? v : Number(v)
    } else {
      args._.push(a)
    }
  }
  return args
}

function withSuffix(filePath, suffix = '-blurred') {
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const base = path.basename(filePath, ext)
  return path.join(dir, `${base}${suffix}${ext}`)
}

function buildGradientOverlaySVG(width, height, options) {
  const w = width || 1200
  const h = height || 1200
  const {
    darken = 0.4,
    tintA = 'rgba(120,119,198,0.20)', // matches rgba(120, 119, 198, 0.2)
    tintB = 'rgba(255,119,198,0.10)' // matches rgba(255, 119, 198, 0.1)
  } = options || {}

  // Build an SVG with a semi-transparent dark layer + two radial tints
  // Positions roughly match CSS: 20% 80% and 80% 20%
  // Note: We use userSpaceOnUse so circles are sized in pixels relative to the image
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="tintA" cx="${w * 0.2}" cy="${h * 0.8}" r="${Math.max(w, h) * 0.6}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${tintA}" />
      <stop offset="60%" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
    <radialGradient id="tintB" cx="${w * 0.8}" cy="${h * 0.2}" r="${Math.max(w, h) * 0.6}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${tintB}" />
      <stop offset="60%" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>

  <!-- Darken layer to improve text contrast -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="rgba(0,0,0,${darken})" />

  <!-- Subtle colored lights -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#tintA)" />
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#tintB)" />
</svg>`
}

async function main() {
  const args = parseArgs(process.argv)
  const inputPath = args._[0]
  if (!inputPath) {
    console.error('Error: Input image path is required.')
    console.error(
      'Usage: node scripts/generate-blurred-image.js <inputPath> [--sigma=100] [--saturation=1.8] [--darken=0.4] [--suffix=-blurred]'
    )
    process.exit(1)
  }

  const sigma = Number(args.sigma ?? 100)
  const saturation = Number(args.saturation ?? 1.8)
  const darken = Number(args.darken ?? 0.4)
  const suffix = String(args.suffix ?? '-blurred')

  const absInput = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath)
  if (!fs.existsSync(absInput)) {
    console.error(`Error: File not found: ${absInput}`)
    process.exit(1)
  }

  const outputPath = withSuffix(absInput, suffix)

  try {
    const img = sharp(absInput)
    const meta = await img.metadata()

    // 1) Blur the image
    let pipeline = img.blur(sigma)

    // 2) Increase saturation
    pipeline = pipeline.modulate({ saturation })

    // 3) Composite gradient+tint overlay
    const overlaySVG = buildGradientOverlaySVG(meta.width, meta.height, { darken })
    pipeline = pipeline.composite([{ input: Buffer.from(overlaySVG), top: 0, left: 0 }])

    await pipeline.toFile(outputPath)

    const rel = path.relative(process.cwd(), outputPath)
    console.log(`Blurred image created: ${rel}`)
  } catch (err) {
    console.error('Failed to generate blurred image:', err)
    process.exit(1)
  }
}

main()
