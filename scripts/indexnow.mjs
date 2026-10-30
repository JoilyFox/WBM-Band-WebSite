#!/usr/bin/env node
/**
 * IndexNow ping after a production deploy (Bing, Yandex, Seznam, Naver… share it).
 *
 * Tells the engines which URLs changed, so a new release page reaches Bing (and the
 * Copilot answers built on it) in minutes instead of waiting for a crawl.
 *
 * Only changed URLs are sent: the deploy script saves the LIVE sitemap before rsync, and
 * this compares it with the one just built. A URL is sent when it is new or its
 * <lastmod> moved (lastmod = date of the last commit touching its source, see
 * scripts/generate-sitemap.js). Re-sending unchanged URLs on every deploy is what
 * IndexNow asks sites not to do.
 *
 * The key is public by design: it must be served at /<key>.txt (public/<key>.txt).
 *
 * Usage:
 *   node scripts/indexnow.mjs --before <old-sitemap.xml> [--after .output/public/sitemap.xml]
 *   node scripts/indexnow.mjs --all          # send every sitemap URL (first setup)
 *   DRY_RUN=1 node scripts/indexnow.mjs --all
 */
import { readFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const KEY = '71141a0999f8cf6d51894c1f5317f855'
const HOST = 'www.wbmband.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

/** @returns {Map<string, string>} loc → lastmod ('' when absent) */
export function parseSitemap(xml) {
  const map = new Map()
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1]
    if (loc) map.set(loc, block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1] ?? '')
  }
  return map
}

export function changedUrls(before, after) {
  return [...after].filter(([loc, lastmod]) => before.get(loc) !== lastmod).map(([loc]) => loc)
}

async function main() {
  const afterPath = arg('--after') ?? '.output/public/sitemap.xml'
  if (!existsSync(afterPath)) {
    console.log(`IndexNow: ${afterPath} not found, skipped`)
    return
  }
  const after = parseSitemap(readFileSync(afterPath, 'utf8'))
  const beforePath = arg('--before')
  const before =
    beforePath && existsSync(beforePath) ? parseSitemap(readFileSync(beforePath, 'utf8')) : null

  if (!args.includes('--all') && !before?.size) {
    // No readable live sitemap (site was down, first deploy…): sending everything blind
    // is the behaviour IndexNow discourages, so do nothing and say how to force it.
    console.log('IndexNow: no previous sitemap to compare, skipped (use --all to send every URL)')
    return
  }
  const urlList = args.includes('--all') ? [...after.keys()] : changedUrls(before, after)
  if (!urlList.length) {
    console.log('IndexNow: no changed URLs')
    return
  }

  const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }
  if (process.env.DRY_RUN === '1') {
    console.log(
      `IndexNow (dry run): would send ${urlList.length} URL(s):\n  ${urlList.join('\n  ')}`
    )
    return
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  })
  // 200 = accepted, 202 = accepted, key check pending. 403 = key file not reachable.
  const ok = res.status === 200 || res.status === 202
  console.log(
    `${ok ? '✓' : '✗'} IndexNow: ${urlList.length} URL(s) → HTTP ${res.status}${ok ? '' : ` ${await res.text()}`}`
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // A failed ping must never fail a deploy that already went out.
  main().catch((err) => console.log(`✗ IndexNow: ${err.message}`))
}
