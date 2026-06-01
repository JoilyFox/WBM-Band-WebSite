#!/usr/bin/env node

/**
 * Bio-link cheat sheet generator.
 *
 * Emits .output/bio-links.md with every source-prefixed URL for every
 * release × every page type × every locale. Saves you the copy-paste
 * dance when updating Instagram/TikTok/YouTube bio links — the file
 * regenerates on every build, so adding a new release in
 * data/musicLibrary.ts auto-updates the sheet.
 *
 * Output is intentionally written outside .output/public so it isn't
 * deployed to wbmband.com. Open it locally with `open .output/bio-links.md`
 * (or your editor) after `npm run generate`.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..')
const musicLibPath = path.join(repoRoot, 'data', 'musicLibrary.ts')
const outDir = path.join(repoRoot, '.output')
const outFile = path.join(outDir, 'bio-links.md')

// This script runs under plain `node`, so it can't import the typed TS modules
// directly. To avoid drift, derive the reserved prefixes and the site URL from
// their canonical source files by text-parsing them (same approach used for
// releases below) — a single source of truth, no hand-maintained copies.
function readRepoFile(...segments) {
  return fs.readFileSync(path.join(repoRoot, ...segments), 'utf8')
}

function extractSourcePrefixes() {
  const src = readRepoFile('utils', 'sourceAttribution.ts')
  const block = src.match(/export const SOURCE_PREFIXES = \{([\s\S]*?)\} as const/)
  if (!block) {
    throw new Error(
      'generate-bio-links: could not locate SOURCE_PREFIXES in utils/sourceAttribution.ts'
    )
  }
  // -> [ [prefix, platform], ... ] in declaration order
  return [...block[1].matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]])
}

function extractSiteUrl() {
  const src = readRepoFile('constants', 'app.ts')
  const m = src.match(/export const SITE_URL = '([^']+)'/)
  if (!m) {
    throw new Error('generate-bio-links: could not locate SITE_URL in constants/app.ts')
  }
  return m[1]
}

// Pretty display names per prefix. Any prefix without an entry falls back to a
// humanized form of its canonical platform value, so a newly-added prefix still
// renders correctly without touching this script.
const PREFIX_LABELS = {
  i: 'Instagram',
  tt: 'TikTok',
  yt: 'YouTube',
  fb: 'Facebook',
  x: 'X (Twitter)',
  sc: 'Snapchat',
  ln: 'LinkedIn',
  th: 'Threads',
  tg: 'Telegram',
  pin: 'Pinterest',
  qr: 'QR code',
  em: 'Email'
}

const humanize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// [ [prefix, platform], ... ] derived from the canonical map
const SOURCE_PREFIXES = extractSourcePrefixes()
const SITE_BASE_URL = extractSiteUrl()

function extractReleases() {
  const src = fs.readFileSync(musicLibPath, 'utf8')
  // Pull each object literal that looks like a release entry. We only
  // need slug + title; a small regex is enough — no need to parse TS.
  const blocks = src.split(/\{\s*id:/).slice(1)
  return blocks
    .map((block) => {
      const slugMatch = block.match(/slug:\s*'([^']+)'/)
      const titleMatch = block.match(/title:\s*'([^']+)'/)
      if (!slugMatch) return null
      return { slug: slugMatch[1], title: titleMatch?.[1] ?? slugMatch[1] }
    })
    .filter(Boolean)
}

function buildSheet(releases) {
  const lines = []
  lines.push('# WBM Band — Bio Link Cheat Sheet')
  lines.push('')
  lines.push(
    `_Generated at build time. Paste these into your social-media bios so each click is attributed to the right platform in GA4._`
  )
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')

  for (const release of releases) {
    lines.push(`## ${release.title} — \`${release.slug}\``)
    lines.push('')
    lines.push(
      `**Plain (no attribution):** ${SITE_BASE_URL}/listen/${release.slug} · ${SITE_BASE_URL}/pre-save/${release.slug}`
    )
    lines.push('')
    lines.push('| Platform | Listen URL | Pre-save URL |')
    lines.push('|---|---|---|')
    for (const [prefix, platform] of SOURCE_PREFIXES) {
      const name = PREFIX_LABELS[prefix] || humanize(platform)
      const listen = `${SITE_BASE_URL}/listen/${prefix}/${release.slug}`
      const presave = `${SITE_BASE_URL}/pre-save/${prefix}/${release.slug}`
      lines.push(`| ${name} | ${listen} | ${presave} |`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push(
    `_Reserved prefixes (must not collide with song slugs): ${SOURCE_PREFIXES.map(([prefix]) => prefix).join(', ')}_`
  )
  lines.push('')

  return lines.join('\n')
}

function main() {
  const releases = extractReleases()
  if (releases.length === 0) {
    console.warn('⚠️  generate-bio-links: no releases found in data/musicLibrary.ts; skipping.')
    return
  }
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, buildSheet(releases))
  console.log(
    `📝 Wrote bio-link cheat sheet for ${releases.length} release(s) → ${path.relative(repoRoot, outFile)}`
  )
}

main()
