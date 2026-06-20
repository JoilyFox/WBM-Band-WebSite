#!/usr/bin/env node
/**
 * Lighthouse regression gate — "PageSpeed as a test".
 *
 * Runs the REAL Lighthouse engine (the same one https://pagespeed.web.dev uses)
 * against a set of routes and exits non-zero if any category score or resource
 * budget regresses below its threshold. This is the local replacement for
 * polling the PageSpeed Insights API, whose keyless quota is now 0 (Google
 * requires an API key). Running Lighthouse ourselves needs no key, no quota, and
 * gives the identical lab metrics.
 *
 * Usage:
 *   npm run test:perf                                  # audit the live prod site
 *   LH_BASE_URL=http://localhost:3000 npm run test:perf # audit a local preview
 *   node scripts/perf/lighthouse-check.mjs --json       # dump raw LHR JSON too
 *
 * It mirrors PageSpeed's "mobile" profile: mobile form factor + simulated Slow-4G
 * + 4x CPU throttling (Lighthouse defaults).
 *
 * NOT wired into the husky pre-commit/pre-push hooks on purpose: a full run is
 * ~30-60s per URL and simulated throttling is mildly noisy, so gating every
 * commit on it would be painful. Run it manually before a deploy, or in a
 * dedicated CI job (see docs/pagespeed-regression-testing.md).
 *
 * Want Google's FIELD (CrUX/real-user) data too? That still needs the PSI API
 * with a key — see scripts/perf/psi-check.mjs (opt-in via PAGESPEED_API_KEY).
 */
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { writeFileSync } from 'node:fs'

const BASE = (process.env.LH_BASE_URL || 'https://wbmband.com').replace(/\/$/, '')
const DUMP_JSON = process.argv.includes('--json')

// ---------------------------------------------------------------------------
// Per-route budgets. Thresholds sit a little BELOW the current (post-fix) scores
// so this catches genuine regressions without flapping on throttling noise.
//
//   minPerf is intentionally lower for `/` than for the localized routes: the
//   bare root client-redirects to the user's locale, and that extra hop costs a
//   few points that no on-page fix removes. `/ua` and `/en` are the real content
//   pages and carry the strict bar.
// ---------------------------------------------------------------------------
const ROUTES = [
  { path: '/', minPerf: 70 },
  { path: '/ua', minPerf: 85 },
  { path: '/en', minPerf: 85 }
]

// Category minimums applied to every route (0-100). SEO is 90 (not 100) because
// the bare `/` is a redirect shell whose SEO scores a little lower than the real
// localized pages — a hard 100 there would false-fail.
const CATEGORY_MINS = {
  accessibility: 100,
  'best-practices': 95,
  seo: 90
}

// Resource budgets (KB transferred on initial load). The imageKB budget is the
// guard that would have caught the "all ~12 hero slides load eagerly" (~6MB)
// regression that prompted this whole effort.
const BUDGETS = {
  imageKB: 2200,
  scriptKB: 1200,
  totalKB: 4500
}

const fmt = (n) => (n == null ? '—' : Math.round(n))
const kb = (bytes) => Math.round((bytes || 0) / 1024)

async function audit(url, port) {
  const result = await lighthouse(
    url,
    { port, output: 'json', logLevel: 'error' },
    {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    }
  )
  return result.lhr
}

function resourceKB(lhr) {
  const items = lhr.audits['network-requests']?.details?.items || []
  const sum = (type) =>
    items
      .filter((i) => (type ? i.resourceType === type : true))
      .reduce((a, i) => a + (i.transferSize || 0), 0)
  return { imageKB: kb(sum('Image')), scriptKB: kb(sum('Script')), totalKB: kb(sum()) }
}

async function main() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  })

  const failures = []
  const rows = []
  const dump = {}

  try {
    for (const route of ROUTES) {
      const url = `${BASE}${route.path}`
      process.stderr.write(`▸ auditing ${url} …\n`)
      const lhr = await audit(url, chrome.port)
      if (DUMP_JSON) dump[route.path] = lhr

      const scores = Object.fromEntries(
        Object.entries(lhr.categories).map(([k, v]) => [k, v.score == null ? null : v.score * 100])
      )
      const res = resourceKB(lhr)
      const a = lhr.audits
      rows.push({
        route: route.path,
        finalUrl: lhr.finalDisplayedUrl?.replace(BASE, '') || route.path,
        perf: fmt(scores.performance),
        a11y: fmt(scores.accessibility),
        bp: fmt(scores['best-practices']),
        seo: fmt(scores.seo),
        lcp: a['largest-contentful-paint']?.displayValue,
        si: a['speed-index']?.displayValue,
        tbt: a['total-blocking-time']?.displayValue,
        cls: a['cumulative-layout-shift']?.displayValue,
        ...res
      })

      // Assert category thresholds.
      const minPerf = route.minPerf
      if (scores.performance != null && scores.performance < minPerf)
        failures.push(`${route.path}: performance ${fmt(scores.performance)} < ${minPerf}`)
      for (const [cat, min] of Object.entries(CATEGORY_MINS)) {
        if (scores[cat] != null && scores[cat] < min)
          failures.push(`${route.path}: ${cat} ${fmt(scores[cat])} < ${min}`)
      }
      // Assert resource budgets.
      for (const [k, max] of Object.entries(BUDGETS)) {
        if (res[k] > max) failures.push(`${route.path}: ${k} ${res[k]}KB > ${max}KB budget`)
      }
    }
  } finally {
    await chrome.kill()
  }

  // Report.
  console.log(`\nLighthouse regression check — base: ${BASE}\n`)
  for (const r of rows) {
    console.log(
      `${r.route.padEnd(5)} → ${r.finalUrl.padEnd(5)}  ` +
        `Perf ${String(r.perf).padStart(3)}  A11y ${String(r.a11y).padStart(3)}  ` +
        `BP ${String(r.bp).padStart(3)}  SEO ${String(r.seo).padStart(3)}  |  ` +
        `LCP ${r.lcp}  SI ${r.si}  TBT ${r.tbt}  CLS ${r.cls}  |  ` +
        `img ${r.imageKB}KB  js ${r.scriptKB}KB  total ${r.totalKB}KB`
    )
  }

  if (DUMP_JSON) {
    writeFileSync('lighthouse-results.json', JSON.stringify(dump, null, 2))
    console.log('\nRaw LHR written to lighthouse-results.json')
  }

  if (failures.length) {
    console.error(`\n❌ ${failures.length} regression(s):`)
    for (const f of failures) console.error(`   • ${f}`)
    process.exit(1)
  }
  console.log('\n✅ All routes within budget.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
