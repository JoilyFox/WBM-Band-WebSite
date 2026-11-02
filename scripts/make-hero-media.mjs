#!/usr/bin/env node
// Cut a release's hero background clip from a source video and encode the renditions
// that <MusicHeroMedia> expects (see docs/hero-media.md):
//
//   npm run hero-media -- <source.mp4> <slug> [--from 20] [--to 44] [--xfade 1.5]
//
// --squeeze N raises both CRFs by N for busy footage (3–5 roughly halves the size).
//
// The loop is seamless: the clip is cut --xfade seconds longer and its last seconds
// dissolve into its first ones (a plain crossfade, no dip to black), so the last frame
// of the file continues straight into its first.
//
// Writes public/videos/releases/<slug>/
//   hero-1280.{av1,h264}.mp4         16:9, 1280×720  (windows ≥ 768px)
//   hero-640.{av1,h264}.mp4          16:9, 640×360  (phones)
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
const xf = opt('xfade', 1.5)
// added to both CRFs: busy, high-motion footage (cuts, flares) needs it to stay small
const squeeze = opt('squeeze', 0)
const [source, slug] = args
if (!source || !slug || !(to > from) || !(xf >= 0 && xf < (to - from) / 2)) {
  console.error(
    'usage: npm run hero-media -- <source.mp4> <slug> [--from 20] [--to 44] [--xfade 1.5] [--squeeze 0]'
  )
  process.exit(1)
}

const out = join('public/videos/releases', slug)
mkdirSync(out, { recursive: true })
const tmp = mkdtempSync(join(tmpdir(), 'hero-media-'))
const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' })

// 1. The segment at 1080p, near-lossless, so both renditions start from the same frames.
//    Cut `xf` longer: the extra tail [d, d+xf) dissolves into the head [0, xf), and the
//    file is body [xf, d) + that dissolve, so it ends on the frame before its first.
const d = to - from
const mid = join(tmp, 'mid.mp4')
console.log(`▸ cutting ${from}–${to} s, ${xf} s crossfade loop`)
const base1080 = 'scale=1920:1080:flags=lanczos,format=yuv420p,settb=AVTB,fps=24'
const loop =
  xf > 0
    ? `[0:v]${base1080},split=3[a][b][c];` +
      `[a]trim=start=${xf}:end=${d},setpts=PTS-STARTPTS[body];` +
      `[b]trim=start=${d}:end=${d + xf},setpts=PTS-STARTPTS[tail];` +
      `[c]trim=start=0:end=${xf},setpts=PTS-STARTPTS[head];` +
      `[tail][head]xfade=transition=fade:duration=${xf}:offset=0[x];` +
      `[body][x]concat=n=2:v=1:a=0[v]`
    : `[0:v]${base1080}[v]`
ff(
  '-ss',
  String(from),
  '-t',
  String(d + xf),
  '-i',
  source,
  '-an',
  '-filter_complex',
  loop,
  '-map',
  '[v]',
  '-c:v',
  'libx264',
  '-crf',
  '10',
  '-preset',
  'fast',
  mid
)

const DENOISE = 'hqdn3d=6:5:10:8'
const renditions = [
  { name: 'hero-1280', vf: `${DENOISE},scale=1280:720:flags=lanczos` },
  // phones show the clip whole-width at its own shape (a blurred copy fills the rest)
  { name: 'hero-640', vf: `${DENOISE},scale=640:360:flags=lanczos` }
]
const common = ['-g', '96', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
for (const r of renditions) {
  const base = join(out, r.name)
  console.log(`▸ ${r.name}: AV1 + H.264`)
  ff(
    '-i',
    mid,
    '-vf',
    r.vf,
    '-c:v',
    'libsvtav1',
    '-crf',
    String(44 + squeeze),
    '-preset',
    '5',
    '-svtav1-params',
    'progress=0',
    ...common,
    `${base}.av1.mp4`
  )
  ff(
    '-i',
    mid,
    '-vf',
    r.vf,
    '-c:v',
    'libx264',
    '-crf',
    String(30 + squeeze),
    '-preset',
    'slower',
    '-profile:v',
    'high',
    ...common,
    `${base}.h264.mp4`
  )
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
  heroMedia: { kind: 'video', wide: '/videos/releases/${slug}/hero-1280', small: '/videos/releases/${slug}/hero-640' }`)
