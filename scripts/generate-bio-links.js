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

// Mirror SOURCE_PREFIXES from utils/sourceAttribution.ts. Keep in sync
// when you add/remove prefixes there.
const SOURCE_PREFIXES = {
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

const SITE_BASE_URL = 'https://www.wbmband.com'

const repoRoot = path.resolve(__dirname, '..')
const musicLibPath = path.join(repoRoot, 'data', 'musicLibrary.ts')
const outDir = path.join(repoRoot, '.output')
const outFile = path.join(outDir, 'bio-links.md')

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
    for (const [prefix, name] of Object.entries(SOURCE_PREFIXES)) {
      const listen = `${SITE_BASE_URL}/listen/${prefix}/${release.slug}`
      const presave = `${SITE_BASE_URL}/pre-save/${prefix}/${release.slug}`
      lines.push(`| ${name} | ${listen} | ${presave} |`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push(
    `_Reserved prefixes (must not collide with song slugs): ${Object.keys(SOURCE_PREFIXES).join(', ')}_`
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
