#!/usr/bin/env node

/**
 * Promo-campaign registry + link generator.
 *
 * A "campaign" is one specific placement you paid for or arranged — an
 * Instagram blog story, a Telegram channel post, a radio mention. Each gets a
 * short id that rides the URL as `?c=<id>`; the site attaches that id to every
 * GA4 `release_view` / `platform_click` (utils/campaignAttribution.ts), so the
 * dashboards can answer "what did THIS placement actually bring".
 *
 * The registry (data/campaigns.json) holds what GA4 can never know: who
 * published it, what it cost, when it ran. `campaign_id` is the join key.
 *
 *   node scripts/campaigns.mjs                        list campaigns + links
 *   node scripts/campaigns.mjs add --release khvyli \
 *        --media "Kyiv Music" --channel i --cost 1500 add one (prints the link)
 *   node scripts/campaigns.mjs links [id]             just the URLs, to copy
 *   node scripts/campaigns.mjs export                 .output/campaigns.{md,csv}
 *
 * `add` flags:
 *   --media   <name>      who publishes it            (required)
 *   --release <slug>      release it promotes         (required unless --path)
 *   --path    </some/page> promote any page instead of a release
 *   --channel <prefix>    source prefix: i tt yt fb … (optional but recommended)
 *   --page    <listen|pre-save|auto>                  (default: auto, by date)
 *   --lang    <ua|en>                                 (default: ua)
 *   --medium  <paid|barter|organic|…>                 (default: paid)
 *   --cost    <number>    what you paid               (default: 0)
 *   --currency <UAH|USD|…>            (default: registry defaultCurrency)
 *   --start / --end <YYYY-MM-DD>      (default start: today)
 *   --notes   <text>      free-form reminder
 *   --id      <custom-id> override the generated id
 *   --dry                 print what would be added, write nothing
 *
 * Read alongside docs/analytics-campaigns.md.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const registryPath = path.join(repoRoot, 'data', 'campaigns.json')
const outDir = path.join(repoRoot, '.output')

const CAMPAIGN_PARAM = 'c'
const ID_MAX_LENGTH = 40

// ---------------------------------------------------------------------------
// Canonical sources. This script runs under plain `node`, so it can't import
// the typed TS modules; it text-parses them instead — the same single-source-of
// truth approach as scripts/generate-bio-links.js, guarded by the drift tests
// in test/unit/build-script-drift.spec.ts.
// ---------------------------------------------------------------------------

function readRepoFile(...segments) {
  return fs.readFileSync(path.join(repoRoot, ...segments), 'utf8')
}

function extractSourcePrefixes() {
  const src = readRepoFile('utils', 'sourceAttribution.ts')
  const block = src.match(/export const SOURCE_PREFIXES = \{([\s\S]*?)\} as const/)
  if (!block) {
    throw new Error('campaigns: could not locate SOURCE_PREFIXES in utils/sourceAttribution.ts')
  }
  return Object.fromEntries([...block[1].matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]))
}

function extractSiteUrl() {
  const src = readRepoFile('constants', 'app.ts')
  const m = src.match(/export const SITE_URL = '([^']+)'/)
  if (!m) throw new Error('campaigns: could not locate SITE_URL in constants/app.ts')
  return m[1]
}

function extractReleases() {
  const src = readRepoFile('data', 'musicLibrary.ts')
  return src
    .split(/\{\s*id:/)
    .slice(1)
    .map((block) => {
      const slug = block.match(/slug:\s*'([^']+)'/)?.[1]
      if (!slug) return null
      return {
        slug,
        title: block.match(/title:\s*'([^']+)'/)?.[1] ?? slug,
        releaseDate: block.match(/releaseDate:\s*'([^']+)'/)?.[1] ?? null
      }
    })
    .filter(Boolean)
}

const SOURCE_PREFIXES = extractSourcePrefixes()
const SITE_URL = extractSiteUrl()

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

// Local, deliberately small transliteration table: media names are usually
// Ukrainian ("Радіо Промінь") and campaign ids must stay ASCII kebab-case so
// they survive being typed, shortened and pasted by other people.
const TRANSLIT = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
  ы: 'y',
  э: 'e',
  ъ: '',
  ё: 'e'
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .split('')
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeId(raw) {
  const cleaned = slugify(raw).slice(0, ID_MAX_LENGTH).replace(/-+$/, '')
  return /^[a-z0-9][a-z0-9-]*$/.test(cleaned) ? cleaned : null
}

/** `<release|page>-<media>-<MMDD>`, shortened to fit and made unique. */
function buildCampaignId({ subject, media, start }, taken) {
  const stamp = start.slice(5).replace('-', '') // YYYY-MM-DD → MMDD
  const base = normalizeId(`${subject}-${media}-${stamp}`) ?? normalizeId(`campaign-${stamp}`)
  if (!taken.has(base)) return base
  for (let n = 2; n < 100; n++) {
    const candidate = `${base.slice(0, ID_MAX_LENGTH - 3)}-${n}`.replace(/-+/g, '-')
    if (!taken.has(candidate)) return candidate
  }
  throw new Error(`campaigns: could not derive a unique id from "${base}"`)
}

// ---------------------------------------------------------------------------
// Registry I/O
// ---------------------------------------------------------------------------

function loadRegistry() {
  if (!fs.existsSync(registryPath)) return { defaultCurrency: 'UAH', campaigns: [] }
  const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  parsed.campaigns ??= []
  parsed.defaultCurrency ??= 'UAH'
  return parsed
}

function saveRegistry(registry) {
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
}

// ---------------------------------------------------------------------------
// URL building
// ---------------------------------------------------------------------------

function resolvePageType(campaign, releases) {
  if (campaign.pageType && campaign.pageType !== 'auto') return campaign.pageType
  const release = releases.find((r) => r.slug === campaign.release)
  if (!release?.releaseDate) return 'listen'
  return new Date(release.releaseDate).getTime() > Date.now() ? 'pre-save' : 'listen'
}

/** The URL to hand to the media outlet. */
function campaignUrl(campaign, releases) {
  const localePrefix = campaign.locale === 'en' ? '/en' : ''
  let route
  if (campaign.path) {
    route = campaign.path.startsWith('/') ? campaign.path : `/${campaign.path}`
  } else {
    const pageType = resolvePageType(campaign, releases)
    const channel = campaign.channel ? `/${campaign.channel}` : ''
    route = `/${pageType}${channel}/${campaign.release}`
  }
  return `${SITE_URL}${localePrefix}${route}?${CAMPAIGN_PARAM}=${campaign.id}`
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const flags = {}
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) {
      positional.push(token)
      continue
    }
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      flags[key] = true
    } else {
      flags[key] = next
      i++
    }
  }
  return { positional, flags }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function commandAdd(flags) {
  const registry = loadRegistry()
  const releases = extractReleases()

  const media = typeof flags.media === 'string' ? flags.media.trim() : ''
  if (!media) fail('--media "<who publishes it>" is required.')

  const release = typeof flags.release === 'string' ? flags.release : null
  const customPath = typeof flags.path === 'string' ? flags.path : null
  if (!release && !customPath) fail('Pass --release <slug> (or --path </some/page>).')
  if (release && !releases.some((r) => r.slug === release)) {
    fail(
      `Unknown release "${release}". Known slugs: ${releases.map((r) => r.slug).join(', ')}.\n` +
        '  (Add the release to data/musicLibrary.ts first.)'
    )
  }

  const channel = typeof flags.channel === 'string' ? flags.channel : null
  if (channel && !(channel in SOURCE_PREFIXES)) {
    fail(`Unknown --channel "${channel}". Valid: ${Object.keys(SOURCE_PREFIXES).join(', ')}.`)
  }

  const pageType = typeof flags.page === 'string' ? flags.page : 'auto'
  if (!['auto', 'listen', 'pre-save'].includes(pageType)) {
    fail(`--page must be auto, listen or pre-save (got "${pageType}").`)
  }

  const start = typeof flags.start === 'string' ? flags.start : today()
  const end = typeof flags.end === 'string' ? flags.end : null
  for (const [label, value] of [
    ['--start', start],
    ['--end', end]
  ]) {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`${label} must be YYYY-MM-DD.`)
  }

  const cost = flags.cost === undefined ? 0 : Number(flags.cost)
  if (!Number.isFinite(cost) || cost < 0) fail(`--cost must be a non-negative number.`)

  const taken = new Set(registry.campaigns.map((c) => c.id))
  const id =
    (typeof flags.id === 'string' ? normalizeId(flags.id) : null) ??
    buildCampaignId({ subject: release ?? slugify(customPath), media, start }, taken)
  if (taken.has(id)) fail(`Campaign id "${id}" already exists in data/campaigns.json.`)

  const campaign = {
    id,
    label: media,
    release: release ?? null,
    path: customPath,
    channel,
    platform: channel ? SOURCE_PREFIXES[channel] : null,
    pageType,
    locale: flags.lang === 'en' ? 'en' : 'ua',
    medium: typeof flags.medium === 'string' ? flags.medium : 'paid',
    cost,
    currency: typeof flags.currency === 'string' ? flags.currency : registry.defaultCurrency,
    startDate: start,
    endDate: end,
    notes: typeof flags.notes === 'string' ? flags.notes : null
  }

  const url = campaignUrl(campaign, releases)

  if (flags.dry) {
    console.log('\n(dry run — nothing written)\n')
    console.log(JSON.stringify(campaign, null, 2))
    console.log(`\n  ${url}\n`)
    return
  }

  registry.campaigns.push(campaign)
  saveRegistry(registry)

  console.log(`\n✓ Added campaign "${id}" → data/campaigns.json\n`)
  console.log(`  ${url}\n`)
  console.log(`  Give that exact URL to ${media}. Then track it with:`)
  console.log(`    node scripts/ga-report.mjs --campaign ${id}\n`)
}

function rowsFor(registry, releases, filterId) {
  return registry.campaigns
    .filter((c) => !filterId || c.id === filterId)
    .map((c) => ({ ...c, url: campaignUrl(c, releases) }))
}

function commandList(flags) {
  const registry = loadRegistry()
  const releases = extractReleases()
  const rows = rowsFor(registry, releases, typeof flags.id === 'string' ? flags.id : null)

  if (rows.length === 0) {
    console.log('\nNo campaigns yet. Create one:\n')
    console.log(
      '  node scripts/campaigns.mjs add --release <slug> --media "<name>" --channel i --cost 0\n'
    )
    return
  }

  console.log(`\n${rows.length} campaign(s) — data/campaigns.json\n`)
  for (const row of rows) {
    const target = row.path ?? row.release
    const spend = row.cost ? `${row.cost} ${row.currency}` : 'no cost'
    console.log(`  ${row.id}`)
    console.log(
      `    ${row.label} · ${target} · ${row.platform ?? 'no channel'} · ${row.medium} · ${spend}` +
        ` · ${row.startDate}${row.endDate ? `→${row.endDate}` : ''}`
    )
    if (row.notes) console.log(`    note: ${row.notes}`)
    console.log(`    ${row.url}`)
    console.log('')
  }
  console.log('  Results:  node scripts/ga-report.mjs --campaigns [days]\n')
}

function commandLinks(positional) {
  const registry = loadRegistry()
  const releases = extractReleases()
  const rows = rowsFor(registry, releases, positional[0] ?? null)
  if (rows.length === 0) return console.log('No matching campaigns.')
  for (const row of rows) console.log(row.url)
}

function toCsv(rows) {
  const columns = [
    'campaign_id',
    'label',
    'release',
    'platform',
    'medium',
    'start_date',
    'end_date',
    'cost',
    'currency',
    'url',
    'notes'
  ]
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = [columns.join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.label,
        row.release ?? row.path,
        row.platform ?? '',
        row.medium,
        row.startDate,
        row.endDate ?? '',
        row.cost,
        row.currency,
        row.url,
        row.notes ?? ''
      ]
        .map(escape)
        .join(',')
    )
  }
  return `${lines.join('\n')}\n`
}

function toMarkdown(rows) {
  const lines = ['# WBM Band — Promo campaigns', '']
  lines.push('_Generated by `node scripts/campaigns.mjs export`. Hand each URL to its outlet._')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('| Campaign id | Outlet | Target | Channel | Cost | Link |')
  lines.push('|---|---|---|---|---|---|')
  for (const row of rows) {
    lines.push(
      `| \`${row.id}\` | ${row.label} | ${row.release ?? row.path} | ${row.platform ?? '—'} | ` +
        `${row.cost ? `${row.cost} ${row.currency}` : '—'} | ${row.url} |`
    )
  }
  lines.push('')
  return lines.join('\n')
}

function commandExport() {
  const registry = loadRegistry()
  const releases = extractReleases()
  const rows = rowsFor(registry, releases, null)
  fs.mkdirSync(outDir, { recursive: true })

  const csvPath = path.join(outDir, 'campaigns.csv')
  const mdPath = path.join(outDir, 'campaigns.md')
  fs.writeFileSync(csvPath, toCsv(rows))
  fs.writeFileSync(mdPath, toMarkdown(rows))

  console.log(`\n📝 ${rows.length} campaign(s) →`)
  console.log(`   ${path.relative(repoRoot, mdPath)}   (links to copy)`)
  console.log(`   ${path.relative(repoRoot, csvPath)}  (upload to Google Sheets for Looker)\n`)
}

// ---------------------------------------------------------------------------

const { positional, flags } = parseArgs(process.argv.slice(2))
const command = positional[0] ?? 'list'

switch (command) {
  case 'add':
    commandAdd(flags)
    break
  case 'links':
    commandLinks(positional.slice(1))
    break
  case 'export':
    commandExport()
    break
  case 'list':
    commandList(flags)
    break
  default:
    fail(`Unknown command "${command}". Use: list | add | links | export`)
}
