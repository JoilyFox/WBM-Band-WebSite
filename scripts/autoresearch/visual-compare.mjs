#!/usr/bin/env node
/**
 * Visual gate for the image autoresearch loop (KB: locked-evaluator — SSIM can
 * be Goodharted, so a human must see the pixels before any winner ships).
 *
 * For each fixture, encodes AVIF at several qualities (full image, at the
 * preset's max width — exactly as production would), decodes each, extracts a
 * 1:1 center crop so real compression detail is visible, and lays them out as a
 * labeled montage (quality · full-image KB · absolute SSIM vs the uncompressed
 * reference). Output PNGs are universally viewable.
 *
 * Usage:
 *   node scripts/autoresearch/visual-compare.mjs --fixtures about-us-images/1.jpg,hero-images/horizontal/hero-1.jpg --qualities 85,80,78
 *   node scripts/autoresearch/visual-compare.mjs --preset about --qualities 85,82,80  # all train fixtures of a preset
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ssim } from './lib/ssim.mjs'
import imagePresets from '../../constants/imagePresets.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const OUT_DIR = path.join(__dirname, '.scratch', 'compare')

const CROP_W = 880
const CROP_H = 620
const LABEL_H = 54

function parseArgs(argv) {
  const args = { fixtures: null, preset: null, qualities: [85, 80, 78] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--fixtures') args.fixtures = argv[++i].split(',')
    else if (a === '--preset') args.preset = argv[++i]
    else if (a === '--qualities') args.qualities = argv[++i].split(',').map(Number)
  }
  return args
}

function presetForFixture(rel) {
  if (rel.includes('hero-images/vertical')) return 'heroVertical'
  if (rel.includes('hero-images')) return 'hero'
  if (rel.includes('about-us')) return 'about'
  if (rel.includes('albums-images')) return 'album'
  if (rel.includes('our-team')) return 'team'
  if (rel.includes('meta-images')) return 'meta'
  throw new Error(`Cannot infer preset for ${rel}`)
}

function dimsFor(width, aspect) {
  const [arW, arH] = aspect || [1, 1]
  return { width, height: Math.round((width * arH) / arW) }
}

async function rawResized(input, w, h) {
  const { data, info } = await sharp(input)
    .resize(w, h, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}

async function rawDecode(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}

function labelSvg(text, sub, width) {
  return Buffer.from(
    `<svg width="${width}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#111"/>
      <text x="14" y="22" font-family="monospace" font-size="20" fill="#fff" font-weight="bold">${text}</text>
      <text x="14" y="44" font-family="monospace" font-size="16" fill="#9fe">${sub}</text>
    </svg>`
  )
}

async function buildMontage(fixtureRel, qualities) {
  const src = path.resolve(REPO_ROOT, 'public/images', fixtureRel)
  const presetKey = presetForFixture(fixtureRel)
  const preset = imagePresets[presetKey]
  const maxWidth = Math.max(...(preset.widths || [preset.width]))
  const { width: w, height: h } = dimsFor(maxWidth, preset.aspect)

  const cropW = Math.min(CROP_W, w)
  const cropH = Math.min(CROP_H, h)
  const left = Math.floor((w - cropW) / 2)
  const top = Math.floor((h - cropH) / 2)

  const ref = await rawResized(src, w, h)

  const panels = []
  for (const q of qualities) {
    const buf = await sharp(src)
      .resize(w, h, { fit: 'cover', position: 'center' })
      .avif({ quality: q, effort: 4, chromaSubsampling: '4:4:4' })
      .toBuffer()
    const dec = await rawDecode(buf)
    const s = ssim(ref.data, dec.data, ref.width, ref.height, ref.channels)
    // 1:1 crop of the decoded candidate.
    const cropPng = await sharp(buf).extract({ left, top, width: cropW, height: cropH }).png().toBuffer()
    const labeled = await sharp({
      create: { width: cropW, height: cropH + LABEL_H, channels: 3, background: '#111' }
    })
      .composite([
        { input: labelSvg(`AVIF q${q}`, `${(buf.length / 1024).toFixed(0)} KB · SSIM ${s.mean.toFixed(4)}`, cropW), top: 0, left: 0 },
        { input: cropPng, top: LABEL_H, left: 0 }
      ])
      .png()
      .toBuffer()
    panels.push({ q, labeled, cropW, cropH })
  }

  const gap = 8
  const totalW = panels.reduce((sum, p) => sum + p.cropW, 0) + gap * (panels.length - 1)
  const totalH = cropH + LABEL_H
  let x = 0
  const composites = []
  for (const p of panels) {
    composites.push({ input: p.labeled, top: 0, left: x })
    x += p.cropW + gap
  }
  const montage = await sharp({
    create: { width: totalW, height: totalH, channels: 3, background: '#000' }
  })
    .composite(composites)
    .png()
    .toBuffer()

  const outName = fixtureRel.replace(/[^a-z0-9]/gi, '_') + '.png'
  const outPath = path.join(OUT_DIR, outName)
  await fs.writeFile(outPath, montage)
  return { fixtureRel, presetKey, outPath, crop: `${cropW}x${cropH}` }
}

async function main() {
  const args = parseArgs(process.argv)
  await fs.mkdir(OUT_DIR, { recursive: true })

  let fixtures = args.fixtures
  if (!fixtures && args.preset) {
    const manifest = JSON.parse(await fs.readFile(path.join(__dirname, 'fixtures.json'), 'utf8'))
    fixtures = manifest.fixtures
      .filter((f) => f.preset === args.preset)
      .map((f) => f.src.replace('public/images/', ''))
  }
  if (!fixtures) throw new Error('Pass --fixtures a,b,c or --preset <key>')

  for (const f of fixtures) {
    const r = await buildMontage(f, args.qualities)
    process.stderr.write(`  montage: ${r.fixtureRel} (${r.presetKey}, 1:1 crop ${r.crop}) → ${path.relative(REPO_ROOT, r.outPath)}\n`)
  }
}

main().catch((err) => {
  process.stderr.write(`visual-compare failed: ${err.stack || err.message}\n`)
  process.exit(1)
})
