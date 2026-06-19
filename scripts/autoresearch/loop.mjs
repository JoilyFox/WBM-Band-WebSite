#!/usr/bin/env node
/**
 * ============================================================================
 *  Autoresearch loop harness — image encoding
 * ============================================================================
 *
 *  The propose → score → keep/discard machinery around the LOCKED scorer
 *  (score-images.mjs). This file is bookkeeping only; it must NOT contain or
 *  duplicate the reward function — it shells out to the scorer as a SEPARATE
 *  PROCESS so the metric genuinely lives in an artifact the proposer can't edit
 *  (KB: locked-evaluator). The "proposer" is whoever authors the candidate
 *  patches (you / the agent, per the in-session orchestration choice).
 *
 *  A candidate is the current best presets with a PATCH of encoder-knob
 *  overrides deep-merged in. Widths/aspect/formats are never patched (the scorer
 *  rejects width changes anyway — they break the runtime srcset contract).
 *
 *  Candidates spec (JSON array), each item:
 *    { "name": "avif-q-down", "patch": { "hero": { "avifQuality": 78 }, "*": { "avifChromaSubsampling": "4:2:0" } } }
 *  "*" applies its knobs to every preset (harmless on presets lacking that format).
 *
 *  Usage:
 *    node scripts/autoresearch/loop.mjs --candidates round1.json     # score a batch, rank, log, maybe promote best
 *    node scripts/autoresearch/loop.mjs --candidates r.json --set holdout
 *    node scripts/autoresearch/loop.mjs --base constants/imagePresets.json --candidates r.json   # explore from production, not best
 *    node scripts/autoresearch/loop.mjs --reset                      # clear best back to current production presets
 *
 *  State (all under scripts/autoresearch/):
 *    best-presets.json   the best feasible presets found so far (seeds the next batch's base)
 *    results/run.jsonl   append-only log of every candidate scored, with score + deltas
 *    .scratch/           temp candidate presets handed to the scorer (gitignored)
 * ============================================================================
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const PRODUCTION_PRESETS = path.join(REPO_ROOT, 'constants/imagePresets.json')
const BEST_PRESETS = path.join(__dirname, 'best-presets.json')
const RESULTS_DIR = path.join(__dirname, 'results')
const SCRATCH_DIR = path.join(__dirname, '.scratch')
const SCORER = path.join(__dirname, 'score-images.mjs')

function parseArgs(argv) {
  const args = { candidates: null, set: 'train', base: null, reset: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--candidates') args.candidates = argv[++i]
    else if (a === '--set') args.set = argv[++i]
    else if (a === '--base') args.base = argv[++i]
    else if (a === '--reset') args.reset = true
  }
  return args
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'))
}

// Deep-merge a knob patch onto a presets object. "*" applies to every preset.
function applyPatch(base, patch) {
  const next = structuredClone(base)
  const wildcard = patch['*'] || {}
  for (const key of Object.keys(next)) {
    if (typeof next[key] !== 'object' || !next[key].formats) continue
    Object.assign(next[key], wildcard)
  }
  for (const [key, knobs] of Object.entries(patch)) {
    if (key === '*') continue
    if (!next[key]) throw new Error(`Patch targets unknown preset "${key}"`)
    Object.assign(next[key], knobs)
  }
  return next
}

function runScorer(presetsPath, set) {
  return new Promise((resolve, reject) => {
    execFile(
      'node',
      [SCORER, '--presets', presetsPath, '--set', set],
      { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(new Error(`scorer failed: ${err.message}`))
        try {
          resolve(JSON.parse(stdout.trim().split('\n').pop()))
        } catch (e) {
          reject(new Error(`could not parse scorer output: ${e.message}`))
        }
      }
    )
  })
}

async function main() {
  const args = parseArgs(process.argv)
  await fs.mkdir(RESULTS_DIR, { recursive: true })
  await fs.mkdir(SCRATCH_DIR, { recursive: true })

  if (args.reset) {
    await fs.copyFile(PRODUCTION_PRESETS, BEST_PRESETS)
    process.stderr.write(`  Reset best-presets.json ← current production presets\n`)
    return
  }

  // Seed best from production on first run.
  try {
    await fs.access(BEST_PRESETS)
  } catch {
    await fs.copyFile(PRODUCTION_PRESETS, BEST_PRESETS)
  }

  const basePath = args.base ? path.resolve(REPO_ROOT, args.base) : BEST_PRESETS
  const base = await readJson(basePath)

  if (!args.candidates) throw new Error('Pass --candidates <file.json> (a JSON array of {name, patch}).')
  const candidates = await readJson(path.resolve(REPO_ROOT, args.candidates))
  if (!Array.isArray(candidates)) throw new Error('Candidates file must be a JSON array.')

  // Score the current base too, as the reference row for this batch.
  const baseScratch = path.join(SCRATCH_DIR, 'base.json')
  await fs.writeFile(baseScratch, JSON.stringify(base, null, 2))
  const baseResult = await runScorer(baseScratch, args.set)

  const rows = [{ name: '(base)', patch: null, result: baseResult }]
  for (const cand of candidates) {
    const merged = applyPatch(base, cand.patch)
    const scratch = path.join(SCRATCH_DIR, `cand-${cand.name.replace(/[^a-z0-9_-]/gi, '_')}.json`)
    await fs.writeFile(scratch, JSON.stringify(merged, null, 2))
    const result = await runScorer(scratch, args.set)
    rows.push({ name: cand.name, patch: cand.patch, result, scratch })
  }

  // Log every candidate (append-only provenance).
  const stamp = process.env.AUTORESEARCH_STAMP || 'unstamped'
  const logLines = rows
    .filter((r) => r.name !== '(base)')
    .map((r) =>
      JSON.stringify({
        stamp,
        set: args.set,
        name: r.name,
        patch: r.patch,
        score: r.result.score,
        feasible: r.result.feasible,
        objectiveKB: r.result.objectiveKB,
        savingsPct: r.result.weightedSavingsPct,
        penalty: r.result.penalty
      })
    )
  if (logLines.length) await fs.appendFile(path.join(RESULTS_DIR, 'run.jsonl'), logLines.join('\n') + '\n')

  // Rank: feasible first, then lowest objective (= smallest served bytes).
  const ranked = [...rows].sort((a, b) => {
    if (a.result.feasible !== b.result.feasible) return a.result.feasible ? -1 : 1
    return a.result.objectiveKB - b.result.objectiveKB
  })

  const pad = (s, n) => String(s).padEnd(n)
  process.stderr.write(`\n  Batch over base "${path.relative(REPO_ROOT, basePath)}" — set: ${args.set}\n`)
  process.stderr.write(`  ${pad('candidate', 24)} ${pad('objKB', 9)} ${pad('save%', 8)} ${pad('feasible', 9)} worstΔSSIM\n`)
  for (const r of ranked) {
    const worst = Math.min(0, ...r.result.fixtures.map((f) => f.worstSSIMDelta))
    process.stderr.write(
      `  ${pad(r.name, 24)} ${pad(r.result.objectiveKB, 9)} ${pad((r.result.weightedSavingsPct ?? 0) + '%', 8)} ${pad(r.result.feasible ? '✓' : '✗', 9)} ${worst.toFixed(5)}\n`
    )
  }

  // Promote: best feasible candidate that beats base objective becomes new best.
  const baseObj = baseResult.objectiveKB
  const winner = ranked.find((r) => r.name !== '(base)' && r.result.feasible)
  if (winner && winner.result.objectiveKB < baseObj) {
    const mergedWinner = applyPatch(base, winner.patch)
    await fs.writeFile(BEST_PRESETS, JSON.stringify(mergedWinner, null, 2) + '\n')
    const saved = (100 * (1 - winner.result.objectiveKB / baseObj)).toFixed(2)
    process.stderr.write(
      `\n  ➤ PROMOTED "${winner.name}" → best-presets.json  (${saved}% smaller than base this round, ${winner.result.weightedSavingsPct}% vs production)\n\n`
    )
  } else {
    process.stderr.write(`\n  No feasible candidate beat the base this round; best-presets.json unchanged.\n\n`)
  }

  process.stdout.write(
    JSON.stringify({
      base: path.relative(REPO_ROOT, basePath),
      baseObjectiveKB: baseObj,
      promoted: winner && winner.result.objectiveKB < baseObj ? winner.name : null,
      ranked: ranked.map((r) => ({
        name: r.name,
        objectiveKB: r.result.objectiveKB,
        savingsPct: r.result.weightedSavingsPct,
        feasible: r.result.feasible
      }))
    }) + '\n'
  )
}

main().catch((err) => {
  process.stderr.write(`loop failed: ${err.stack || err.message}\n`)
  process.exit(1)
})
