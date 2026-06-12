#!/usr/bin/env node
/**
 * GA4 Admin/Data maintenance — verify & (optionally) fix the analytics config.
 *
 * Read-only by default: lists custom dimensions + key events and runs a sanity
 * report so you can SEE whether `source_platform` carries real values or
 * `(not set)`. Pass `--apply` to create any missing custom dimensions / key
 * events (idempotent: list-then-create, safe to re-run). `--apply` needs an
 * Editor-or-higher identity; read-only mode needs only Viewer/Analyst.
 *
 * Auth = Application Default Credentials, auto-discovered (no flag needed):
 *   • a service-account key via GOOGLE_APPLICATION_CREDENTIALS, OR
 *   • your own login via `gcloud auth application-default login`.
 *
 * Usage (see docs/analytics-debugging.md §5):
 *   npm i -D @google-analytics/admin @google-analytics/data
 *   # GA4_PROPERTY_ID is OPTIONAL — if unset, we discover the properties this
 *   # identity can access and auto-pick the WBM one (or list them to choose).
 *   export GA4_PROPERTY_ID=NNNNNNNNN
 *   node scripts/ga-admin.mjs                 # verify / report (read-only)
 *   node scripts/ga-admin.mjs --apply         # create missing config (Editor)
 *
 * A service-account JSON key is a secret — keep it OUTSIDE the repo.
 */

import { AnalyticsAdminServiceClient } from '@google-analytics/admin'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

const APPLY = process.argv.includes('--apply')

// ── Desired config ──────────────────────────────────────────────────────────
// Event-scoped dims are fed by ep.* (our release_view/platform_click params and
// the gtag('set',{…}) default param). The optional USER-scoped source_platform
// is fed by up.* (the user_properties carrier) for user-level analysis.
const DESIRED_DIMENSIONS = [
  { parameterName: 'source_platform', displayName: 'Source Platform', scope: 'EVENT' },
  { parameterName: 'release_slug', displayName: 'Release Slug', scope: 'EVENT' },
  { parameterName: 'page_type', displayName: 'Page Type', scope: 'EVENT' },
  { parameterName: 'platform_name', displayName: 'Platform Name', scope: 'EVENT' },
  // Optional user-scoped twin (only created with --apply). Comment out if unwanted.
  { parameterName: 'source_platform', displayName: 'Source Platform User', scope: 'USER' }
]
const DESIRED_KEY_EVENTS = [{ eventName: 'platform_click', countingMethod: 'ONCE_PER_EVENT' }]

const admin = new AnalyticsAdminServiceClient()
const data = new BetaAnalyticsDataClient()
const sameDim = (a, b) => a.parameterName === b.parameterName && a.scope === b.scope

/** Find the GA4 property to operate on: env override, else discover + auto-pick WBM. */
async function resolvePropertyId() {
  if (process.env.GA4_PROPERTY_ID) return process.env.GA4_PROPERTY_ID
  console.log('No GA4_PROPERTY_ID set — discovering properties this account can access…\n')
  const [summaries] = await admin.listAccountSummaries()
  const props = []
  for (const acc of summaries) {
    for (const p of acc.propertySummaries || []) {
      const id = p.property.split('/')[1] // "properties/NNN" → "NNN"
      props.push({ id, name: p.displayName, account: acc.displayName })
      console.log(`  • ${id.padEnd(12)} "${p.displayName}"  (account: ${acc.displayName})`)
    }
  }
  if (!props.length) {
    console.error(
      '\n✗ This identity can access NO GA4 properties. Check it has access to the property.'
    )
    return null
  }
  const wbm = props.find((p) => /wbm|wbmband/i.test(`${p.name} ${p.account}`))
  if (wbm) {
    console.log(`\n→ Auto-selected WBM property: ${wbm.id} ("${wbm.name}")`)
    return wbm.id
  }
  if (props.length === 1) {
    console.log(`\n→ Only one property; using ${props[0].id}`)
    return props[0].id
  }
  console.error(
    '\n✗ Multiple properties and no obvious WBM match. Re-run with GA4_PROPERTY_ID=<id> from the list above.'
  )
  return null
}

async function listKeyEvents(parent) {
  // Newer API: keyEvents; older properties: conversionEvents. Try both.
  try {
    const [rows] = await admin.listKeyEvents({ parent })
    return { rows, create: (keyEvent) => admin.createKeyEvent({ parent, keyEvent }) }
  } catch {
    const [rows] = await admin.listConversionEvents({ parent })
    return {
      rows: rows.map((r) => ({ eventName: r.eventName })),
      create: (k) =>
        admin.createConversionEvent({ parent, conversionEvent: { eventName: k.eventName } })
    }
  }
}

async function main() {
  const propertyId = await resolvePropertyId()
  if (!propertyId) process.exit(1)
  const parent = `properties/${propertyId}`
  console.log(
    `\nGA4 property ${parent} — mode: ${APPLY ? 'APPLY (writes enabled)' : 'READ-ONLY'}\n`
  )

  // 1. Custom dimensions
  const [dims] = await admin.listCustomDimensions({ parent })
  console.log(`Custom dimensions (${dims.length}/50 event-scoped cap shared):`)
  for (const d of dims)
    console.log(`  • ${d.parameterName.padEnd(18)} scope=${d.scope.padEnd(6)} "${d.displayName}"`)
  const missingDims = DESIRED_DIMENSIONS.filter((want) => !dims.some((have) => sameDim(have, want)))
  if (missingDims.length) {
    console.log('\n  MISSING:')
    for (const m of missingDims)
      console.log(`  ✗ ${m.parameterName} (${m.scope}) — "${m.displayName}"`)
    if (APPLY) {
      for (const m of missingDims) {
        await admin.createCustomDimension({ parent, customDimension: m })
        console.log(`  ✓ created ${m.parameterName} (${m.scope})`)
      }
    }
  } else {
    console.log('  ✓ all desired dimensions present')
  }

  // 2. Key events
  const ke = await listKeyEvents(parent)
  console.log(`\nKey events (${ke.rows.length}):`)
  for (const k of ke.rows) console.log(`  • ${k.eventName}`)
  const missingKe = DESIRED_KEY_EVENTS.filter(
    (want) => !ke.rows.some((have) => have.eventName === want.eventName)
  )
  if (missingKe.length) {
    console.log('\n  MISSING:')
    for (const m of missingKe) console.log(`  ✗ ${m.eventName}`)
    if (APPLY) {
      for (const m of missingKe) {
        await ke.create(m)
        console.log(`  ✓ marked ${m.eventName} as key event`)
      }
    }
  } else {
    console.log('  ✓ platform_click is a key event')
  }

  // 3. Sanity report — does source_platform carry real values, or (not set)?
  console.log('\nLast 30 days — release_view/platform_click by source_platform:')
  try {
    const [report] = await data.runReport({
      property: parent,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }, { name: 'customEvent:source_platform' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: ['release_view', 'platform_click'] }
        }
      }
    })
    if (!report.rows?.length)
      console.log('  (no rows — no data in range, or events not flowing / consent-denied only)')
    for (const r of report.rows || []) {
      const [ev, src] = r.dimensionValues.map((v) => v.value)
      console.log(
        `  ${ev.padEnd(16)} source=${(src || '').padEnd(12)} count=${r.metricValues[0].value}`
      )
    }
  } catch (e) {
    console.log(`  (report failed: ${e.message})`)
  }

  if (!APPLY && (missingDims.length || missingKe.length)) {
    console.log('\nRe-run with --apply (Editor role) to create the missing config above.')
  }
  console.log('')
}

main().catch((e) => {
  console.error('✗', e.message)
  process.exit(1)
})
