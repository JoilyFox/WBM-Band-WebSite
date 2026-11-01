#!/usr/bin/env node
// Cut a release's hero background clip from a source video and encode the renditions
// that <MusicHeroMedia> expects (see docs/hero-media.md):
//
//   npm run hero-media -- <source.mp4> <slug> [--from 20] [--to 44]
//
// Writes public/videos/releases/<slug>/
//   hero-1280.{av1,h264}.mp4         16:9, 1280×720  (windows ≥ 768px)
//   hero-540x960.{av1,h264}.mp4      9:16 centre crop, 540×960 (phones), slightly softened
//   <rendition>.poster.{avif,webp,jpg}  the first frame (still / reduced motion / low tier)
// No audio, 24 fps, keyframe every 4 s, faststart. Film grain is denoised first: it is
// what makes a background clip expensive, and nobody sees it under the darkening.
// Needs ffmpeg with libsvtav1 + libx264 (Homebrew's has both).
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? Number(args.splice(i, 2)[1]) : fallback
}
const from = opt('from', 20)
const to = opt('to', 44)
const [source, slug] = args
if (!source || !slug || !(to > from)) {
  console.error('usage: npm run hero-media -- <source.mp4> <slug> [--from 20] [--to 44]')
  process.exit(1)
}

const out = join('public/videos/releases', slug)
mkdirSync(out, { recursive: true })
const tmp = mkdtempSync(join(tmpdir(), 'hero-media-'))
const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' })

// 1. The segment at 1080p, near-lossless, so both renditions start from the same frames.
const mid = join(tmp, 'mid.mp4')
console.log(`▸ cutting ${from}–${to} s`)
ff('-ss', String(from), '-t', String(to - from), '-i', source, '-an',
  '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '10', '-preset', 'fast', mid)

const DENOISE = 'hqdn3d=6:5:10:8'
const renditions = [
  { name: 'hero-1280', vf: `${DENOISE},scale=1280:720:flags=lanczos` },
  // 9:16 from the centre; softened a little because the phone crop enlarges the clip
  // (lyrics burnt into it would otherwise compete with the page title)
  { name: 'hero-540x960', vf: `crop=608:1080,${DENOISE},scale=540:960:flags=lanczos,gblur=sigma=3.5` }
]
const common = ['-g', '96', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
for (const r of renditions) {
  const base = join(out, r.name)
  console.log(`▸ ${r.name}: AV1 + H.264`)
  ff('-i', mid, '-vf', r.vf, '-c:v', 'libsvtav1', '-crf', '44', '-preset', '5', '-svtav1-params', 'progress=0', ...common, `${base}.av1.mp4`)
  ff('-i', mid, '-vf', r.vf, '-c:v', 'libx264', '-crf', '30', '-preset', 'slower', '-profile:v', 'high', ...common, `${base}.h264.mp4`)
  const png = join(tmp, `${r.name}.png`)
  ff('-i', `${base}.h264.mp4`, '-frames:v', '1', png)
  await sharp(png).avif({ quality: 45 }).toFile(`${base}.poster.avif`)
  await sharp(png).webp({ quality: 60 }).toFile(`${base}.poster.webp`)
  await sharp(png).jpeg({ quality: 70, mozjpeg: true }).toFile(`${base}.poster.jpg`)
  for (const ext of ['av1.mp4', 'h264.mp4', 'poster.avif'])
    console.log(`  ${r.name}.${ext}  ${Math.round(statSync(`${base}.${ext}`).size / 1024)} KB`)
}
rmSync(tmp, { recursive: true, force: true })
console.log(`✓ ${out}\n  add to the release in data/musicLibrary.ts:
  heroMedia: { kind: 'video', wide: '/videos/releases/${slug}/hero-1280', tall: '/videos/releases/${slug}/hero-540x960' }`)
