#!/usr/bin/env node

/**
 * Sitemap generator.
 *
 * Emits .output/public/sitemap.xml listing the canonical, indexable URLs of the
 * site. Runs as part of `npm run generate` (production) AFTER the non-localized
 * aliases are created, so /listen/<slug> exists.
 *
 * Only canonical URLs are included:
 *   - localized homes and policy pages
 *   - per-release listen + lyrics URLs, BOTH the clean UA hub and the /en/ self-
 *     canonical (each locale self-canonicalizes; see composables/useReleaseHead.ts)
 * Source-attribution variants (/listen/<prefix>/<slug>) are `noindex` and the
 * transient pre-save pages are deliberately excluded.
 *
 * The host is always the production origin (SITE_URL) — a sitemap must point at
 * the real domain, never the GitHub Pages staging mirror — so this is keyed off
 * the canonical constant, not DEPLOY_TARGET.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..')
const outputRoot = path.join(repoRoot, '.output', 'public')
const outFile = path.join(outputRoot, 'sitemap.xml')

function readRepoFile(...segments) {
  return fs.readFileSync(path.join(repoRoot, ...segments), 'utf8')
}

// Single source of truth — text-parse the canonical TS files (this script runs
// under plain `node` and can't import typed modules directly).
function extractSiteUrl() {
  const m = readRepoFile('constants', 'app.ts').match(/export const SITE_URL = '([^']+)'/)
  if (!m) throw new Error('generate-sitemap: could not locate SITE_URL in constants/app.ts')
  return m[1].replace(/\/+$/, '')
}

function extractReleases() {
  const src = readRepoFile('data', 'musicLibrary.ts')
  const blocks = src.split(/\{\s*id:/).slice(1)
  return blocks
    .map((block) => {
      const slug = block.match(/slug:\s*'([^']+)'/)?.[1]
      const releaseDate = block.match(/releaseDate:\s*'([^']+)'/)?.[1]
      // A non-empty `lyrics: [ { ... } ]` array means this release ships a
      // dedicated, indexable /lyrics/<slug> page (matches LYRICS_SLUGS in
      // nuxt.config.ts + the prerender list). `lyrics: []` does NOT count.
      const hasLyrics = /lyrics:\s*\[\s*\{/.test(block)
      return slug ? { slug, releaseDate, hasLyrics } : null
    })
    .filter(Boolean)
}

const LOCALES = ['ua', 'en']
const POLICY_PATHS = ['privacy-policy', 'terms-of-service', 'cookies-policy']

function buildSitemap(siteUrl, releases) {
  /** @type {{ loc: string, lastmod?: string }[]} */
  const entries = []

  // Localized homes (ua canonical is the bare origin — no trailing slash, to
  // match the <link rel="canonical"> + hreflang in pages/index.vue).
  entries.push({ loc: `${siteUrl}` })
  entries.push({ loc: `${siteUrl}/en` })

  // Policy pages, both locales.
  for (const locale of LOCALES) {
    for (const p of POLICY_PATHS) {
      entries.push({ loc: `${siteUrl}/${locale}/${p}` })
    }
  }

  // Per-release listen URLs. Each locale self-canonicalizes (UA hub = clean
  // non-localized URL, EN = /en/...), so BOTH are listed for discovery; the
  // ua/en language pairing itself lives in each page's <head> hreflang (one
  // method — we don't duplicate hreflang into the sitemap).
  for (const release of releases) {
    const lastmod = release.releaseDate ? release.releaseDate.slice(0, 10) : undefined
    entries.push({ loc: `${siteUrl}/listen/${release.slug}`, lastmod })
    entries.push({ loc: `${siteUrl}/en/listen/${release.slug}`, lastmod })
  }

  // Dedicated lyrics pages — only for releases that ship lyrics (matches the
  // per-locale canonical each lyrics page declares + the prerender list).
  for (const release of releases) {
    if (!release.hasLyrics) continue
    const lastmod = release.releaseDate ? release.releaseDate.slice(0, 10) : undefined
    entries.push({ loc: `${siteUrl}/lyrics/${release.slug}`, lastmod })
    entries.push({ loc: `${siteUrl}/en/lyrics/${release.slug}`, lastmod })
  }

  const urls = entries
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${e.loc}</loc>${lastmod}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function main() {
  if (!fs.existsSync(outputRoot)) {
    console.warn(`⚠️  generate-sitemap: output not found (${outputRoot}); skipping.`)
    return
  }

  const siteUrl = extractSiteUrl()
  const releases = extractReleases()
  fs.writeFileSync(outFile, buildSitemap(siteUrl, releases))
  console.log(
    `🗺️  Wrote sitemap with ${releases.length} release URL(s) → ${path.relative(repoRoot, outFile)}`
  )
}

main()
