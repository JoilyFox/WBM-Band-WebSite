#!/usr/bin/env node
/**
 * On-demand GA4 per-release source breakdown — visits vs conversions per platform.
 *
 * Usage:
 *   node scripts/ga-report.mjs                  # list ALL releases with totals
 *   node scripts/ga-report.mjs chorni-ptahy     # one release, broken down by source
 *   node scripts/ga-report.mjs mania 7          # ...over the last 7 days (default 28)
 *
 * It auto-discovers every release_slug present in the data, so new songs appear
 * automatically — nothing to edit here when you publish a release.
 *
 * Auth = Application Default Credentials (gcloud auth application-default login)
 * or a service-account key via GOOGLE_APPLICATION_CREDENTIALS. See
 * docs/analytics-debugging.md §5. Quota project + property have sane defaults
 * for this repo; override with GOOGLE_CLOUD_QUOTA_PROJECT / GA4_PROPERTY_ID.
 */
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { AnalyticsAdminServiceClient } from '@google-analytics/admin'

// User ADC needs a quota project; default to this repo's GCP project.
process.env.GOOGLE_CLOUD_QUOTA_PROJECT ||= 'wbm-social-publisher'

const [, , slugArg, daysArg] = process.argv
const days = Number(daysArg) || 28
const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }]
const EVENTS = ['release_view', 'platform_click']

// Historical data in the property is heavily polluted by dev servers
// (localhost / 0.0.0.0) and the GitHub Pages staging host, so every query is
// scoped to the production hostnames. Set GA_ALL_HOSTS=1 to see everything.
const PRODUCTION_HOSTS = ['wbmband.com', 'www.wbmband.com']
const hostFilter = process.env.GA_ALL_HOSTS
  ? []
  : [{ filter: { fieldName: 'hostName', inListFilter: { values: PRODUCTION_HOSTS } } }]

const data = new BetaAnalyticsDataClient()

async function resolvePropertyId() {
  if (process.env.GA4_PROPERTY_ID) return process.env.GA4_PROPERTY_ID.replace(/^properties\//, '')
  const admin = new AnalyticsAdminServiceClient()
  const [summaries] = await admin.listAccountSummaries()
  const props = summaries.flatMap((a) => a.propertySummaries || [])
  const wbm =
    props.find((p) => /wbm website/i.test(p.displayName)) ||
    props.find((p) => /wbm/i.test(p.displayName))
  const chosen = wbm || props[0]
  if (!chosen) throw new Error('This identity can access no GA4 property.')
  return chosen.property.split('/')[1]
}

const bar = (n, max, w = 22) => '█'.repeat(max ? Math.round((n / max) * w) : 0).padEnd(w, '·')
const pct = (k, v) => (v ? `${((k / v) * 100).toFixed(0)}%` : '—')
const num = (n, w) => String(n).padStart(w)

function fold(rows, keyIdx) {
  const out = {}
  for (const r of rows || []) {
    const vals = r.dimensionValues.map((v) => v.value)
    const key = vals[keyIdx] || '(not set)'
    const ev = vals[vals.length - 1]
    out[key] ??= { release_view: 0, platform_click: 0 }
    out[key][ev] = Number(r.metricValues[0].value)
  }
  return Object.entries(out).sort((a, b) => b[1].release_view - a[1].release_view)
}

async function listReleases(property) {
  const [r] = await data.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'customEvent:release_slug' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: 'eventName', inListFilter: { values: EVENTS } } },
          ...hostFilter
        ]
      }
    }
  })
  const rows = fold(r.rows, 0)
  console.log(`\nAll releases — last ${days} days (visits vs conversions)\n`)
  console.log('  ' + 'release'.padEnd(18) + num('views', 7) + num('clicks', 8) + num('conv%', 7))
  for (const [slug, c] of rows) {
    console.log(
      '  ' +
        slug.padEnd(18) +
        num(c.release_view, 7) +
        num(c.platform_click, 8) +
        pct(c.platform_click, c.release_view).padStart(7)
    )
  }
  console.log(`\n→ One release by source:  node scripts/ga-report.mjs <release> [days]\n`)
}

async function reportRelease(property, slug) {
  const [r] = await data.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'customEvent:source_platform' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: 'customEvent:release_slug', stringFilter: { value: slug } } },
          { filter: { fieldName: 'eventName', inListFilter: { values: EVENTS } } },
          ...hostFilter
        ]
      }
    }
  })
  const rows = fold(r.rows, 0)
  if (!rows.length) return console.log(`\nNo data for "${slug}" in the last ${days} days.\n`)
  const maxV = Math.max(...rows.map(([, c]) => c.release_view), 1)
  const tot = rows.reduce((a, [, c]) => ({ v: a.v + c.release_view, k: a.k + c.platform_click }), {
    v: 0,
    k: 0
  })
  console.log(`\n"${slug}" — source breakdown, last ${days} days\n`)
  console.log(
    '  ' + 'source'.padEnd(14) + num('views', 6) + num('clicks', 7) + num('conv%', 7) + '  visits'
  )
  for (const [src, c] of rows) {
    console.log(
      '  ' +
        src.padEnd(14) +
        num(c.release_view, 6) +
        num(c.platform_click, 7) +
        pct(c.platform_click, c.release_view).padStart(7) +
        '  ' +
        bar(c.release_view, maxV)
    )
  }
  console.log(
    '  ' + 'TOTAL'.padEnd(14) + num(tot.v, 6) + num(tot.k, 7) + pct(tot.k, tot.v).padStart(7)
  )
  console.log('')
}

const property = `properties/${await resolvePropertyId()}`
if (slugArg) await reportRelease(property, slugArg)
else await listReleases(property)
