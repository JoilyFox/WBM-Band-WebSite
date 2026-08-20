/**
 * Campaign attribution: WHICH promo placement brought this visitor.
 *
 * Complements source attribution (utils/sourceAttribution.ts), which answers
 * WHICH platform. A campaign is one specific paid/barter/partner placement on
 * that platform — "the story on @kyiv.music blog, 21 Aug" — so the two are
 * orthogonal and both ride every conversion event:
 *
 *   /listen/i/khvyli?c=khvyli-kyiv-music-0821
 *    └ platform ┘        └ campaign id ┘
 *
 * Why a query param and not another path segment: campaigns are created ad hoc
 * and would each need their own prerendered route on a static site. A query
 * param needs no build; the prerendered page serves as-is and the id is read
 * client-side.
 *
 * `utm_campaign` is accepted as an alias, so a link someone pasted with the
 * standard UTM tags still resolves (and GA4's own campaign reports fill in too).
 *
 * The id is captured FIRST-TOUCH into sessionStorage, so it survives the
 * pre-save → listen redirect and any internal navigation before the visitor
 * clicks a streaming platform.
 *
 * The registry of campaigns (media name, cost, dates) lives in
 * data/campaigns.json — see docs/analytics-campaigns.md. Nothing here reads it:
 * the id in the URL is the join key, keeping the client bundle free of it.
 */

/** Short query param that carries the campaign id. */
export const CAMPAIGN_PARAM = 'c'

/** Standard UTM param accepted as an alias for {@link CAMPAIGN_PARAM}. */
export const CAMPAIGN_UTM_PARAM = 'utm_campaign'

export const CAMPAIGN_STORAGE_KEY = 'wbm_campaign_id'

/**
 * Value sent when there is no campaign. An explicit token (rather than an
 * omitted param) keeps GA4 reports readable — `none` instead of `(not set)`,
 * which in GA4 also means "dimension never registered / not yet backfilled".
 */
export const NO_CAMPAIGN = 'none'

/** GA4 event-param values are capped well above this; 40 keeps ids postable. */
export const CAMPAIGN_ID_MAX_LENGTH = 40

/** Canonical id shape: lowercase kebab-case, starts alphanumeric. */
export const CAMPAIGN_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/

/**
 * Coerce arbitrary input into a canonical campaign id, or null if nothing
 * usable remains. Lenient on purpose: an id typed into a media DM as
 * "Khvyli_Kyiv Music 0821" still resolves to `khvyli-kyiv-music-0821`, so a
 * cosmetic mistake in a published link doesn't silently lose the campaign.
 */
export function normalizeCampaignId(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, CAMPAIGN_ID_MAX_LENGTH)
    .replace(/-+$/, '')
  return CAMPAIGN_ID_PATTERN.test(cleaned) ? cleaned : null
}

/**
 * Read the campaign id out of a query string (`?c=…`, else `?utm_campaign=…`).
 */
export function detectCampaignFromSearch(search: string): string | null {
  if (!search) return null
  let params: URLSearchParams
  try {
    params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  } catch {
    return null
  }
  return (
    normalizeCampaignId(params.get(CAMPAIGN_PARAM)) ??
    normalizeCampaignId(params.get(CAMPAIGN_UTM_PARAM))
  )
}

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(id: string): void {
  try {
    window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, id)
  } catch {
    // Storage disabled/full — attribution degrades to "current page only".
  }
}

/**
 * First-touch campaign for this session. A campaign id present in the current
 * URL always wins (a second campaign link clicked mid-session re-attributes,
 * mirroring how a path-prefix overrides the stored source platform).
 */
export function getOrPersistCampaign(search?: string): string {
  if (typeof window === 'undefined') return NO_CAMPAIGN

  const fromUrl = detectCampaignFromSearch(search ?? window.location.search)
  if (fromUrl) {
    writeStored(fromUrl)
    return fromUrl
  }

  return normalizeCampaignId(readStored()) ?? NO_CAMPAIGN
}

export function setExplicitCampaign(id: string): void {
  if (typeof window === 'undefined') return
  const normalized = normalizeCampaignId(id)
  if (normalized) writeStored(normalized)
}

export function resetCampaign(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(CAMPAIGN_STORAGE_KEY)
  } catch {
    // ignore — see writeStored()
  }
}
