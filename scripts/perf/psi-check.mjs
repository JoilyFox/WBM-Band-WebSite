#!/usr/bin/env node
/**
 * OPT-IN PageSpeed Insights (field/CrUX) check.
 *
 * The local Lighthouse gate (lighthouse-check.mjs) covers LAB metrics, which is
 * what catches code regressions. This script additionally pulls Google's FIELD
 * data (real Chrome users, CrUX) — useful as a periodic health check, not a CI
 * gate (field data lags ~28 days and needs enough traffic to exist at all).
 *
 * The keyless PSI endpoint now has a per-day quota of 0, so a key is REQUIRED.
 * Get a free key: https://developers.google.com/speed/docs/insights/v5/get-started
 *
 *   PAGESPEED_API_KEY=xxx node scripts/perf/psi-check.mjs
 *
 * Exits 0 (skips) when no key is set, so it's safe to call unconditionally.
 */
const KEY = process.env.PAGESPEED_API_KEY
const URLS = (process.env.PSI_URLS || 'https://wbmband.com/ua,https://wbmband.com/en').split(',')

if (!KEY) {
  console.log('PAGESPEED_API_KEY not set — skipping PSI field check (lab gate covers regressions).')
  process.exit(0)
}

const endpoint = (url, strategy) =>
  `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=${strategy}&category=performance&key=${KEY}`

async function check(url, strategy) {
  const res = await fetch(endpoint(url, strategy))
  const data = await res.json()
  if (data.error) throw new Error(`${url} [${strategy}]: ${data.error.message}`)
  const lab = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100)
  const field = data.loadingExperience?.metrics || {}
  const lcp = field.LARGEST_CONTENTFUL_PAINT_MS?.percentile
  const cls = field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile
  const inp = field.INTERACTION_TO_NEXT_PAINT?.percentile
  const overall = data.loadingExperience?.overall_category || 'NO_DATA'
  console.log(
    `${strategy.padEnd(7)} ${url}\n  lab perf ${lab}  |  field: ${overall}  ` +
      `LCP ${lcp ?? '—'}ms  CLS ${cls != null ? cls / 100 : '—'}  INP ${inp ?? '—'}ms`
  )
}

for (const url of URLS) {
  for (const strategy of ['mobile', 'desktop']) {
    await check(url.trim(), strategy)
  }
}
