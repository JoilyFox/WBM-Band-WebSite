/**
 * Source attribution: figure out which platform a visitor came from.
 *
 * Three signals, in priority order:
 *   1. Path prefix    e.g. /listen/i/<slug>  → instagram (100% accurate)
 *   2. document.referrer hostname              (~70-80% accurate)
 *   3. navigator.userAgent fingerprint         (catches in-app browsers
 *                                              that strip the referrer)
 *
 * First-touch attribution is persisted in sessionStorage so platform-button
 * clicks made after internal navigation still carry the original source.
 */

/**
 * URL prefix → canonical platform name. Reserved: these keys MUST NOT be
 * used as release slugs in data/musicLibrary.ts; assertNoSlugCollisions()
 * is the build-time guard.
 */
export const SOURCE_PREFIXES = {
  i: 'instagram',
  tt: 'tiktok',
  yt: 'youtube',
  fb: 'facebook',
  x: 'twitter',
  sc: 'snapchat',
  ln: 'linkedin',
  th: 'threads',
  tg: 'telegram',
  pin: 'pinterest',
  qr: 'qr',
  em: 'email'
} as const

export type SourcePrefix = keyof typeof SOURCE_PREFIXES
export type PrefixedPlatform = (typeof SOURCE_PREFIXES)[SourcePrefix]

export type SourcePlatform =
  | PrefixedPlatform
  | 'whatsapp'
  | 'reddit'
  | 'search'
  | 'direct'
  | 'other'

const PREFIX_KEYS = Object.keys(SOURCE_PREFIXES) as SourcePrefix[]

const REFERRER_HOST_MAP: ReadonlyArray<{ pattern: RegExp; platform: SourcePlatform }> = [
  { pattern: /(^|\.)instagram\.com$/i, platform: 'instagram' },
  { pattern: /(^|\.)tiktok\.com$/i, platform: 'tiktok' },
  { pattern: /(^|\.)(youtube\.com|youtu\.be)$/i, platform: 'youtube' },
  {
    pattern: /(^|\.)(facebook\.com|fb\.me|m\.facebook\.com|l\.facebook\.com|lm\.facebook\.com)$/i,
    platform: 'facebook'
  },
  { pattern: /(^|\.)(twitter\.com|x\.com|t\.co)$/i, platform: 'twitter' },
  { pattern: /(^|\.)snapchat\.com$/i, platform: 'snapchat' },
  { pattern: /(^|\.)(linkedin\.com|lnkd\.in)$/i, platform: 'linkedin' },
  { pattern: /(^|\.)threads\.net$/i, platform: 'threads' },
  { pattern: /(^|\.)t\.me$/i, platform: 'telegram' },
  { pattern: /(^|\.)pinterest\.[a-z.]+$/i, platform: 'pinterest' },
  { pattern: /(^|\.)reddit\.com$/i, platform: 'reddit' },
  { pattern: /(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia)\.[a-z.]+$/i, platform: 'search' }
]

const UA_FINGERPRINT_MAP: ReadonlyArray<{ pattern: RegExp; platform: SourcePlatform }> = [
  // More specific tags first; FB tags are unique enough to disambiguate
  { pattern: /FBAN|FBAV|FB_IAB/, platform: 'facebook' },
  { pattern: /Instagram/, platform: 'instagram' },
  { pattern: /TikTok|musical_ly|Bytedance|BytedanceWebview/, platform: 'tiktok' },
  { pattern: /Snapchat/, platform: 'snapchat' },
  { pattern: /Twitter|TwitterAndroid/, platform: 'twitter' },
  { pattern: /Pinterest/, platform: 'pinterest' },
  { pattern: /LinkedInApp/, platform: 'linkedin' },
  { pattern: /Threads/, platform: 'threads' },
  { pattern: /WhatsApp/, platform: 'whatsapp' },
  { pattern: /Telegram/, platform: 'telegram' }
]

/**
 * Strip leading locale segment (en|ua) from a path's segment array.
 * Centralizes the i18n-aware path parsing so callers don't repeat it.
 */
function stripLocaleSegment(segments: string[]): string[] {
  if (segments.length === 0) return segments
  const first = segments[0]
  return first === 'en' || first === 'ua' ? segments.slice(1) : segments
}

/**
 * Recognise a path of the shape  /(en|ua)?/(listen|pre-save)/<prefix>/<slug>
 * and return the platform attached to <prefix>. Returns null otherwise.
 */
export function detectFromPath(path: string): SourcePlatform | null {
  const segments = stripLocaleSegment(path.split('/').filter(Boolean))
  if (segments.length < 3) return null
  const [pageType, maybePrefix] = segments
  if (pageType !== 'listen' && pageType !== 'pre-save') return null
  if (!PREFIX_KEYS.includes(maybePrefix as SourcePrefix)) return null
  return SOURCE_PREFIXES[maybePrefix as SourcePrefix]
}

export function detectFromReferrer(referrer: string): SourcePlatform | null {
  if (!referrer) return null
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
  for (const { pattern, platform } of REFERRER_HOST_MAP) {
    if (pattern.test(host)) return platform
  }
  return null
}

export function detectFromUserAgent(userAgent: string): SourcePlatform | null {
  if (!userAgent) return null
  for (const { pattern, platform } of UA_FINGERPRINT_MAP) {
    if (pattern.test(userAgent)) return platform
  }
  return null
}

export interface AttributionInputs {
  path: string
  referrer: string
  userAgent: string
}

/**
 * Compose the three signals: path > referrer > UA > fallback. A non-empty
 * referrer that didn't match anything yields 'other' (so we can spot
 * patterns later). Empty everything = 'direct'.
 */
export function detectSourcePlatform(inputs: AttributionInputs): SourcePlatform {
  return (
    detectFromPath(inputs.path) ??
    detectFromReferrer(inputs.referrer) ??
    detectFromUserAgent(inputs.userAgent) ??
    (inputs.referrer ? 'other' : 'direct')
  )
}

const STORAGE_KEY = 'wbm_source_platform'

/**
 * Read first-touch source from sessionStorage, or detect-and-persist on
 * first call. A path-prefix match always overrides any stored value —
 * an explicit bio-link click resets attribution mid-session.
 */
export function getOrPersistSourcePlatform(inputs?: Partial<AttributionInputs>): SourcePlatform {
  if (typeof window === 'undefined') return 'direct'

  const path = inputs?.path ?? window.location.pathname
  const fromPath = detectFromPath(path)
  if (fromPath) {
    window.sessionStorage.setItem(STORAGE_KEY, fromPath)
    return fromPath
  }

  const stored = window.sessionStorage.getItem(STORAGE_KEY) as SourcePlatform | null
  if (stored) return stored

  const detected = detectSourcePlatform({
    path,
    referrer: inputs?.referrer ?? document.referrer,
    userAgent: inputs?.userAgent ?? navigator.userAgent
  })
  window.sessionStorage.setItem(STORAGE_KEY, detected)
  return detected
}

export function setExplicitSourcePlatform(platform: SourcePlatform): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(STORAGE_KEY, platform)
}

export function resetSourcePlatform(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * Throws if any release slug collides with a reserved source prefix.
 * Wired into the prerender route generator (Phase 2.4) to fail the build
 * loudly rather than silently breaking attribution for the colliding song.
 */
export function assertNoSlugCollisions(slugs: readonly string[]): void {
  const collisions = slugs.filter((slug) => PREFIX_KEYS.includes(slug as SourcePrefix))
  if (collisions.length > 0) {
    throw new Error(
      `Release slug(s) collide with reserved source prefixes: ${collisions.join(', ')}. ` +
        `Reserved prefixes: ${PREFIX_KEYS.join(', ')}.`
    )
  }
}

export { PREFIX_KEYS }
