#!/usr/bin/env node
/**
 * ============================================================================
 *  LOCKED EVALUATOR — image-encoding autoresearch loop
 * ============================================================================
 *
 *  This file is the reward function. The autoresearch loop may edit ONLY the
 *  candidate presets file (constants/imagePresets.json or a scratch copy). It
 *  must NEVER edit this scorer, the SSIM_FLOORS below, the penalty math, or
 *  scripts/autoresearch/fixtures.json. That is the whole safety property: an
 *  agent that can rewrite its own scorer reward-hacks instantly. (KB:
 *  locked-evaluator — "autoresearch IS reward-function design".)
 *
 *  Locking stops the crudest hack. It does NOT stop Goodharting:
 *    - SSIM is computed across R/G/B (see lib/ssim.mjs) so chroma subsampling
 *      can't be gamed for free, but
 *    - a high-SSIM-yet-mushy winner is still possible, so EVERY winner must
 *      pass a human before/after visual gate before it ships. Do not skip it.
 *
 *  REWARD (relative-to-production, calibrated 2026-06-19):
 *    - Absolute SSIM is content-dependent and counter-intuitive: current
 *      production (quality 85) scores as low as 0.80 on noisy concert photos
 *      because SSIM penalizes JPEG's denoising of sensor grain. An absolute
 *      floor would reject the live site. So instead we ANCHOR to current
 *      production: a candidate may not drop any (fixture, format) SSIM more than
 *      SSIM_MARGIN below its CURRENT value (see baseline-images.json). That is a
 *      sound constraint because production quality is, by definition, shippable.
 *    - The byte objective is weighted toward AVIF (SERVED_WEIGHT), the format
 *      ~95% of browsers actually download via <picture>; WebP/JPEG are fallbacks
 *      almost nobody fetches, so shrinking them barely helps real page weight.
 *    score = servedWeightedKB + Σ max(0, (baseSSIM-MARGIN) - candSSIM) * PENALTY
 *    Lower is better. The loop tunes ENCODER KNOBS ONLY (quality/effort/chroma);
 *    widths/aspect/formats are fixed — changing widths breaks the runtime srcset
 *    contract in utils/imageHelpers.ts and invalidates this byte/SSIM baseline.
 *
 *  Usage:
 *    node scripts/autoresearch/score-images.mjs --write-baseline   # capture production baseline (run once)
 *    node scripts/autoresearch/score-images.mjs                     # score current presets, train set
 *    node scripts/autoresearch/score-images.mjs --presets <p>       # score a candidate presets file
 *    node scripts/autoresearch/score-images.mjs --set holdout       # holdout (overfit check) — run ONCE
 *    node scripts/autoresearch/score-images.mjs --set all
 *  stdout: one JSON object (machine-readable). stderr: a human summary table.
 * ============================================================================
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ssim } from './lib/ssim.mjs'
import { formatOptions, applyFormat } from '../lib/encode-options.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')

// --- LOCKED reward parameters (human-tunable, loop-untouchable) --------------
// A candidate may not drop any (fixture, format) SSIM more than this far below
// its CURRENT production value. Absolute, anchored to baseline-images.json.
// Set to 0.02 on 2026-06-19 after the visual gate (visual-compare.mjs): at q80
// (worst train fixture −0.026, most ~−0.01) the 1:1 crops are indistinguishable
// from production, so 0.005 was needlessly strict. The visual montage remains
// the backstop — do not raise this without re-running the gate.
const SSIM_MARGIN = 0.02
// Approximate fraction of real traffic that downloads each format (AVIF is first
// in every <picture>, supported by ~95%+ of browsers; WebP/JPEG are fallbacks
// almost nobody hits). The byte objective weights formats by this so the loop
// optimizes the bytes users actually pay for. Roughly from caniuse served share.
const SERVED_WEIGHT = { avif: 1.0, webp: 0.15, jpg: 0.03, png: 0.03 }
// Any SSIM deficit must dominate any plausible byte saving (served-weighted train
// totals are O(10^3) KB), so an infeasible candidate always loses to a feasible one.
const PENALTY = 1e6
const BASELINE_PATH = 'baseline-images.json'
// -----------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    presets: 'constants/imagePresets.json',
    set: 'train',
    concurrency: 4,
    writeBaseline: false
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--presets') args.presets = argv[++i]
    else if (a === '--set') args.set = argv[++i]
    else if (a === '--concurrency') args.concurrency = Number(argv[++i])
    else if (a === '--write-baseline') args.writeBaseline = true
  }
  return args
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'))
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++
      results[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return results
}

function dimsFor(width, aspect) {
  const [arW, arH] = aspect || [1, 1]
  return { width, height: Math.round((width * arH) / arW) }
}

async function encode(src, width, height, format, opts) {
  const pipeline = sharp(src).resize(width, height, { fit: 'cover', position: 'center' })
  return applyFormat(pipeline, format, opts).toBuffer()
}

async function rawOf(input, width, height) {
  // Decode (and, for the reference, resize) to interleaved RGB so SSIM compares
  // only codec loss, not resize loss. removeAlpha → 3 channels on both sides.
  let pipeline = sharp(input)
  if (width && height)
    pipeline = pipeline.resize(width, height, { fit: 'cover', position: 'center' })
  const { data, info } = await pipeline.removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}

async function scoreFixture(fixture, presets) {
  const preset = presets[fixture.preset]
  if (!preset) throw new Error(`Fixture references unknown preset: ${fixture.preset}`)
  const widths = preset.widths || [preset.width]
  const maxWidth = Math.max(...widths)
  const { width: maxW, height: maxH } = dimsFor(maxWidth, preset.aspect)

  // Reference (ideal uncompressed downscale) once per fixture, at the gate width.
  const ref = await rawOf(fixture.src, maxW, maxH)

  let bytes = 0
  const formats = {}
  for (const format of preset.formats) {
    const opts = formatOptions(format, preset)
    let fmtBytes = 0
    let largestBuf = null
    for (const w of widths) {
      const { width, height } = dimsFor(w, preset.aspect)
      const buf = await encode(fixture.src, width, height, format, opts)
      fmtBytes += buf.length
      if (w === maxWidth) largestBuf = buf
    }
    bytes += fmtBytes
    const cand = await rawOf(largestBuf)
    if (cand.width !== ref.width || cand.height !== ref.height) {
      throw new Error(
        `Dim mismatch for ${fixture.src} ${format}: cand ${cand.width}x${cand.height} vs ref ${ref.width}x${ref.height}`
      )
    }
    const s = ssim(ref.data, cand.data, ref.width, ref.height, ref.channels)
    formats[format] = {
      bytes: fmtBytes,
      ssim: Number(s.mean.toFixed(5)),
      perChannel: s.perChannel.map((v) => Number(v.toFixed(5)))
    }
  }

  return {
    src: fixture.src,
    rel: path.relative(REPO_ROOT, fixture.src),
    preset: fixture.preset,
    bytes,
    formats
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const started = process.hrtime.bigint()

  const presetsPath = path.resolve(REPO_ROOT, args.presets)
  const presets = await readJson(presetsPath)
  const manifest = await readJson(path.join(__dirname, 'fixtures.json'))

  let fixtures = manifest.fixtures
  if (args.set !== 'all') fixtures = fixtures.filter((f) => f.set === args.set)
  if (fixtures.length === 0) throw new Error(`No fixtures for set "${args.set}"`)

  // Resolve fixture src paths relative to the repo root.
  const resolved = fixtures.map((f) => ({ ...f, src: path.resolve(REPO_ROOT, f.src) }))

  const results = await mapLimit(resolved, args.concurrency, (f) => scoreFixture(f, presets))
  const durationMs = Number((process.hrtime.bigint() - started) / 1_000_000n)
  const pad = (s, n) => String(s).padEnd(n)

  // --- Baseline-capture mode: record current per-(fixture,format) ssim+bytes ---
  if (args.writeBaseline) {
    const baseline = {
      _comment:
        'LOCKED production baseline for the image autoresearch loop. Per-(fixture,format) SSIM + bytes from the CURRENT imagePresets.json. The scorer anchors quality constraints to this (candidate SSIM >= baseSSIM - SSIM_MARGIN). Regenerate ONLY when you deliberately re-baseline (e.g. after shipping a loop winner or changing source images). The loop must never edit this file.',
      generatedFrom: path.relative(REPO_ROOT, presetsPath),
      ssimMargin: SSIM_MARGIN,
      fixtures: {}
    }
    for (const r of results) {
      baseline.fixtures[r.rel] = {
        preset: r.preset,
        bytes: r.bytes,
        formats: Object.fromEntries(
          Object.entries(r.formats).map(([fmt, v]) => [fmt, { ssim: v.ssim, bytes: v.bytes }])
        )
      }
    }
    const outPath = path.join(__dirname, BASELINE_PATH)
    await fs.writeFile(outPath, JSON.stringify(baseline, null, 2) + '\n')
    process.stderr.write(
      `\n  Wrote baseline for ${results.length} fixtures → ${path.relative(REPO_ROOT, outPath)} (${durationMs}ms)\n\n`
    )
    process.stdout.write(JSON.stringify({ wroteBaseline: outPath, count: results.length }) + '\n')
    return
  }

  // --- Scoring mode: reward = served-weighted bytes + SSIM-regression penalty ---
  let baseline = null
  try {
    baseline = await readJson(path.join(__dirname, BASELINE_PATH))
  } catch {
    throw new Error(
      `Missing ${BASELINE_PATH}. Run \`node scripts/autoresearch/score-images.mjs --write-baseline --set all\` first.`
    )
  }

  let objectiveBytes = 0 // served-weighted (what the loop minimizes)
  let baseObjectiveBytes = 0 // served-weighted baseline, for savings %
  let rawBytes = 0 // unweighted, all formats (real disk payload)
  let penalty = 0
  const perFixture = []

  for (const r of results) {
    const base = baseline.fixtures[r.rel]
    let worstDrop = 0 // most-negative SSIM delta vs baseline across formats
    let fixtureWeighted = 0
    const fmtRows = {}
    for (const [fmt, v] of Object.entries(r.formats)) {
      const weight = SERVED_WEIGHT[fmt] ?? 0.03
      objectiveBytes += weight * v.bytes
      fixtureWeighted += weight * v.bytes
      rawBytes += v.bytes
      const baseSSIM = base?.formats?.[fmt]?.ssim
      const baseBytes = base?.formats?.[fmt]?.bytes
      baseObjectiveBytes += weight * (baseBytes ?? v.bytes)
      const delta = baseSSIM == null ? 0 : v.ssim - baseSSIM
      const deficit = baseSSIM == null ? 0 : Math.max(0, baseSSIM - SSIM_MARGIN - v.ssim)
      penalty += deficit * PENALTY
      worstDrop = Math.min(worstDrop, delta)
      fmtRows[fmt] = {
        ssim: v.ssim,
        baseSSIM: baseSSIM ?? null,
        ssimDelta: Number(delta.toFixed(5)),
        bytes: v.bytes,
        baseBytes: baseBytes ?? null,
        bytesDelta: baseBytes == null ? null : v.bytes - baseBytes
      }
    }
    perFixture.push({
      rel: r.rel,
      preset: r.preset,
      bytes: r.bytes,
      baseBytes: base?.bytes ?? null,
      weightedKB: Number((fixtureWeighted / 1024).toFixed(1)),
      worstSSIMDelta: Number(worstDrop.toFixed(5)),
      feasible: penalty === 0 || worstDrop >= -SSIM_MARGIN - 1e-9,
      formats: fmtRows
    })
  }

  const objectiveKB = objectiveBytes / 1024
  const score = objectiveKB + penalty
  const feasible = penalty === 0

  const out = {
    presetsPath: path.relative(REPO_ROOT, presetsPath),
    set: args.set,
    score: Number(score.toFixed(2)),
    feasible,
    objectiveKB: Number(objectiveKB.toFixed(1)),
    baselineObjectiveKB: Number((baseObjectiveBytes / 1024).toFixed(1)),
    weightedSavingsPct:
      baseObjectiveBytes > 0
        ? Number((100 * (1 - objectiveBytes / baseObjectiveBytes)).toFixed(2))
        : null,
    rawTotalKB: Number((rawBytes / 1024).toFixed(1)),
    penalty: Number(penalty.toFixed(2)),
    ssimMargin: SSIM_MARGIN,
    fixtures: perFixture,
    durationMs
  }

  // Human summary → stderr (stdout stays clean JSON for the loop).
  process.stderr.write(`\n  Scoring "${out.presetsPath}" — set: ${args.set}\n`)
  process.stderr.write(
    `  ${pad('fixture', 46)} ${pad('preset', 13)} ${pad('wKB', 7)} worstΔSSIM  ok\n`
  )
  for (const r of perFixture) {
    process.stderr.write(
      `  ${pad(r.rel, 46)} ${pad(r.preset, 13)} ${pad(r.weightedKB, 7)} ${pad(r.worstSSIMDelta, 10)} ${r.feasible ? '✓' : '✗ REGRESS'}\n`
    )
  }
  process.stderr.write(
    `  ${'-'.repeat(92)}\n  objective=${objectiveKB.toFixed(1)} wKB (base ${(baseObjectiveBytes / 1024).toFixed(1)}, ${out.weightedSavingsPct ?? '?'}% saved)  raw=${(rawBytes / 1024).toFixed(0)}KB  score=${score.toFixed(1)}  feasible=${feasible}  ${durationMs}ms\n\n`
  )

  process.stdout.write(JSON.stringify(out) + '\n')
}

main().catch((err) => {
  process.stderr.write(`score-images failed: ${err.stack || err.message}\n`)
  process.exit(1)
})
