#!/usr/bin/env node
/**
 * On-demand GA4 per-release source breakdown — visits vs conversions per platform.
 *
 * Usage:
 *   node scripts/ga-report.mjs                  # list ALL releases with totals
 *   node scripts/ga-report.mjs chorni-ptahy     # one release, broken down by source
 *   node scripts/ga-report.mjs mania 7          # ...over the last 7 days (default 28)
 *   node scripts/ga-report.mjs --campaigns      # every promo campaign: cost per click
 *   node scripts/ga-report.mjs --campaign <id>  # one campaign, broken down by release
 *
 * It auto-discovers every release_slug present in the data, so new songs appear
 * automatically — nothing to edit here when you publish a release. Campaign
 * modes join GA4 against data/campaigns.json (which holds what GA can't know:
 * the outlet and what it cost) — see docs/analytics-campaigns.md.
 *
 * Auth = Application Default Credentials (gcloud auth application-default login)
 * or a service-account key via GOOGLE_APPLICATION_CREDENTIALS. See
 * docs/analytics-debugging.md §5. Quota project + property have sane defaults
 * for this repo; override with GOOGLE_CLOUD_QUOTA_PROJECT / GA4_PROPERTY_ID.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { AnalyticsAdminServiceClient } from '@google-analytics/admin'

// User ADC needs a quota project; default to this repo's GCP project.
process.env.GOOGLE_CLOUD_QUOTA_PROJECT ||= 'wbm-social-publisher'

const argv = process.argv.slice(2)
const flags = argv.filter((a) => a.startsWith('--'))
const rest = argv.filter((a) => !a.startsWith('--'))
const wantsAllCampaigns = flags.includes('--campaigns')
const wantsOneCampaign = flags.includes('--campaign')
// Positionals mean <release|campaign-id> then [days], depending on the flags.
const [slugArg, daysArg] = rest
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

// ---------------------------------------------------------------------------
// Promo campaigns. GA4 knows the traffic; data/campaigns.json knows the outlet
// and the money. `campaign_id` is the join key between them.
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadCampaignRegistry() {
  const file = path.join(repoRoot, 'data', 'campaigns.json')
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8')).campaigns ?? []
}

/** Cost per converted click — the number that decides "buy from them again?". */
function costPer(cost, clicks) {
  if (!cost) return '—'
  return clicks ? (cost / clicks).toFixed(0) : '∞'
}

async function reportCampaigns(property) {
  const registry = loadCampaignRegistry()
  const [r] = await data.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'customEvent:campaign_id' }, { name: 'eventName' }],
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

  // Untagged traffic lands in `none` / `(not set)` and would dwarf every real
  // campaign row; it's the baseline, not a campaign.
  const rows = fold(r.rows, 0).filter(([id]) => id !== 'none' && id !== '(not set)')
  if (!rows.length) {
    console.log(`\nNo campaign traffic in the last ${days} days.`)
    console.log('Registered campaigns:  node scripts/campaigns.mjs\n')
    return
  }

  const maxV = Math.max(...rows.map(([, c]) => c.release_view), 1)
  console.log(`\nPromo campaigns — last ${days} days\n`)
  console.log(
    '  ' +
      'campaign'.padEnd(26) +
      num('views', 6) +
      num('clicks', 7) +
      num('conv%', 7) +
      num('cost', 8) +
      num('per click', 10) +
      '  visits'
  )
  for (const [id, c] of rows) {
    const meta = registry.find((entry) => entry.id === id)
    const cost = meta?.cost ?? 0
    console.log(
      '  ' +
        id.slice(0, 25).padEnd(26) +
        num(c.release_view, 6) +
        num(c.platform_click, 7) +
        pct(c.platform_click, c.release_view).padStart(7) +
        num(cost || '—', 8) +
        num(costPer(cost, c.platform_click), 10) +
        '  ' +
        bar(c.release_view, maxV)
    )
    if (meta) console.log('  ' + `↳ ${meta.label} · ${meta.release ?? meta.path}`.padEnd(26))
  }

  const unregistered = rows.filter(([id]) => !registry.some((entry) => entry.id === id))
  if (unregistered.length) {
    console.log(
      `\n  ⚠ Not in data/campaigns.json (cost unknown): ${unregistered.map(([id]) => id).join(', ')}`
    )
  }
  console.log(`\n→ One campaign in detail:  node scripts/ga-report.mjs --campaign <id> [days]\n`)
}

async function reportCampaign(property, id) {
  const meta = loadCampaignRegistry().find((entry) => entry.id === id)
  const [r] = await data.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'customEvent:release_slug' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: 'customEvent:campaign_id', stringFilter: { value: id } } },
          { filter: { fieldName: 'eventName', inListFilter: { values: EVENTS } } },
          ...hostFilter
        ]
      }
    }
  })
  const rows = fold(r.rows, 0)
  if (!rows.length) {
    console.log(`\nNo data for campaign "${id}" in the last ${days} days.`)
    console.log('(The id must match the `?c=` value in the published link.)\n')
    return
  }

  const tot = rows.reduce((a, [, c]) => ({ v: a.v + c.release_view, k: a.k + c.platform_click }), {
    v: 0,
    k: 0
  })
  const header = meta ? `"${id}" — ${meta.label}` : `"${id}" (not in data/campaigns.json)`
  console.log(`\n${header}, last ${days} days\n`)
  if (meta) {
    console.log(
      `  outlet: ${meta.label} · ${meta.platform ?? 'no channel'} · ${meta.medium}` +
        ` · ${meta.startDate}${meta.endDate ? `→${meta.endDate}` : ''}`
    )
    console.log(`  cost:   ${meta.cost ? `${meta.cost} ${meta.currency}` : '—'}`)
    if (meta.notes) console.log(`  note:   ${meta.notes}`)
    console.log('')
  }
  console.log('  ' + 'release'.padEnd(18) + num('views', 6) + num('clicks', 7) + num('conv%', 7))
  for (const [slug, c] of rows) {
    console.log(
      '  ' +
        slug.padEnd(18) +
        num(c.release_view, 6) +
        num(c.platform_click, 7) +
        pct(c.platform_click, c.release_view).padStart(7)
    )
  }
  console.log(
    '  ' + 'TOTAL'.padEnd(18) + num(tot.v, 6) + num(tot.k, 7) + pct(tot.k, tot.v).padStart(7)
  )
  if (meta?.cost) {
    console.log(`\n  ${meta.cost} ${meta.currency} → ${costPer(meta.cost, tot.k)} per click`)
  }
  console.log('')
}

const property = `properties/${await resolvePropertyId()}`
if (wantsOneCampaign) {
  if (!slugArg) {
    console.error('\nUsage: node scripts/ga-report.mjs --campaign <campaign-id> [days]\n')
    process.exit(1)
  }
  await reportCampaign(property, slugArg)
} else if (wantsAllCampaigns) await reportCampaigns(property)
else if (slugArg) await reportRelease(property, slugArg)
else await listReleases(property)
