import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getConfig,
  isUpcomingRelease,
  getTimeUntilRelease,
  formatReleaseDate,
  formatReleaseDateShort,
  isPreSaveMode,
  shouldShowNextReleasePreview
} from '~/utils/configHelpers'
import { generalConfig } from '~/config/general'

// The release-state date functions all read `new Date()` for "now". They must be
// tested under a frozen clock. We freeze at a fixed UTC instant and restore real
// timers after every test. NOTE: the suite runs in a UTC+3 (EEST) host TZ — a
// date-only ISO string (`YYYY-MM-DD`) parses as UTC midnight, i.e. 03:00 local.
const NOW = '2026-06-02T12:00:00Z'

describe('configHelpers.getConfig', () => {
  beforeEach(() => {
    // Silence the helper's own console.warn/error so a deliberate miss doesn't
    // pollute test output; spies are restored in afterEach.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves a deep dot-path against the live config registry', () => {
    expect(getConfig('general.contact.email')).toBe(generalConfig.contact.email)
    expect(getConfig('general.bandName')).toBe('WBM Band')
    expect(getConfig('general.legal.dataResponseTime')).toBe('30 days')
  })

  it('returns the whole config object when the path is just the registry name', () => {
    expect(getConfig('general')).toBe(generalConfig)
  })

  it('returns the default null fallback when no fallback option is given', () => {
    expect(getConfig('general.does.not.exist')).toBeNull()
  })

  it('returns the provided fallback when the registry name is unknown', () => {
    expect(getConfig('nope.whatever', { fallback: 'DEFAULT' })).toBe('DEFAULT')
  })

  it('returns the provided fallback when an intermediate key is missing', () => {
    expect(getConfig('general.contact.missing', { fallback: 'x@y.z' })).toBe('x@y.z')
  })

  it('returns the fallback when descending into a primitive (non-object) value', () => {
    // general.bandName is a string; descending further must fall back, not throw.
    expect(getConfig('general.bandName.length', { fallback: 'FB' })).toBe('FB')
  })

  it('RETURNS falsy-but-valid values (false / 0 / "") rather than replacing them', () => {
    // enableComingSoonCard is `false` in config — must not be swapped for fallback.
    expect(getConfig('general.enableComingSoonCard', { fallback: 'WRONG' })).toBe(false)
    // contact.phone is '' (empty string) — also falsy but valid.
    expect(getConfig('general.contact.phone', { fallback: 'WRONG' })).toBe('')
    // maxReleasesBeforeHideComingSoon is a truthy number, but verify a numeric path too.
    expect(getConfig('general.maxReleasesBeforeHideComingSoon')).toBe(
      generalConfig.maxReleasesBeforeHideComingSoon
    )
  })

  it('logs a warning for an unknown registry name when errorLogging defaults on', () => {
    const warn = vi.spyOn(console, 'warn')
    getConfig('ghost.path')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('ghost')
  })

  it('logs a warning for a missing nested key when errorLogging defaults on', () => {
    const warn = vi.spyOn(console, 'warn')
    getConfig('general.contact.nope')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('does not exist')
  })

  it('silences warnings entirely when errorLogging:false', () => {
    const warn = vi.spyOn(console, 'warn')
    const err = vi.spyOn(console, 'error')
    expect(getConfig('ghost.path', { fallback: 'fb', errorLogging: false })).toBe('fb')
    expect(getConfig('general.contact.nope', { errorLogging: false })).toBeNull()
    expect(warn).not.toHaveBeenCalled()
    expect(err).not.toHaveBeenCalled()
  })
})

describe('configHelpers.isUpcomingRelease', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('treats undefined as upcoming (TBA rule)', () => {
    expect(isUpcomingRelease(undefined)).toBe(true)
  })

  it('treats an empty string as upcoming (falsy guard, also TBA)', () => {
    expect(isUpcomingRelease('')).toBe(true)
  })

  it('returns true for a clearly future date', () => {
    expect(isUpcomingRelease('2030-01-01')).toBe(true)
  })

  it('returns false for a clearly past date', () => {
    expect(isUpcomingRelease('2020-01-01')).toBe(false)
  })

  it('is strict at the exact same instant (equal is NOT upcoming)', () => {
    expect(isUpcomingRelease('2026-06-02T12:00:00Z')).toBe(false)
  })

  it('flips across the boundary by a single millisecond', () => {
    expect(isUpcomingRelease('2026-06-02T12:00:00.001Z')).toBe(true)
    expect(isUpcomingRelease('2026-06-02T11:59:59.999Z')).toBe(false)
  })

  it('returns false for an unparseable date string (NaN > now is false)', () => {
    expect(isUpcomingRelease('not-a-date')).toBe(false)
  })

  it('respects UTC-midnight parsing of date-only strings (TZ hazard)', () => {
    // Frozen now is 2026-06-02T12:00:00Z. A bare date-only string for the SAME
    // calendar day parses to 2026-06-02T00:00:00Z, which is in the PAST → false.
    expect(isUpcomingRelease('2026-06-02')).toBe(false)
    // The next calendar day (UTC midnight) is still in the future → true.
    expect(isUpcomingRelease('2026-06-03')).toBe(true)
  })
})

describe('configHelpers.getTimeUntilRelease', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" only when the ceil(diff in days) is exactly 0', () => {
    // Same instant: diff = 0 → ceil(0) = 0 → Today.
    expect(getTimeUntilRelease('2026-06-02T12:00:00Z')).toBe('Today')
    // A few hours in the PAST still ceils to 0 (ceil of a small negative = 0).
    expect(getTimeUntilRelease('2026-06-02T11:00:00Z')).toBe('Today')
  })

  it('returns "Tomorrow" for any fractional day in the future and up to exactly 24h', () => {
    // 1 hour future: ceil(0.04) = 1 → Tomorrow (NOT Today).
    expect(getTimeUntilRelease('2026-06-02T13:00:00Z')).toBe('Tomorrow')
    // Exactly 24h: ceil(1.0) = 1 → Tomorrow.
    expect(getTimeUntilRelease('2026-06-03T12:00:00Z')).toBe('Tomorrow')
  })

  it('rolls to "In 2 days" one millisecond past the 24h mark', () => {
    expect(getTimeUntilRelease('2026-06-03T12:00:00.001Z')).toBe('In 2 days')
  })

  it('returns "Released" only once the date is a full day or more in the past', () => {
    // Exactly -24h: ceil(-1.0) = -1 → Released.
    expect(getTimeUntilRelease('2026-06-01T12:00:00Z')).toBe('Released')
    // -23h still ceils to 0 → Today (boundary documented).
    expect(getTimeUntilRelease('2026-06-01T13:00:00Z')).toBe('Today')
  })

  it('uses the day bucket below 7 days', () => {
    expect(getTimeUntilRelease('2026-06-08T12:00:00Z')).toBe('In 6 days')
  })

  it('switches to weeks at the 7-day boundary', () => {
    expect(getTimeUntilRelease('2026-06-09T12:00:00Z')).toBe('In 1 week')
    expect(getTimeUntilRelease('2026-06-16T12:00:00Z')).toBe('In 2 weeks')
  })

  it('switches to months at the 30-day boundary', () => {
    // 29 days → still weeks bucket (ceil(29/7)=5).
    expect(getTimeUntilRelease('2026-07-01T12:00:00Z')).toBe('In 5 weeks')
    // 30 days → months bucket, ceil(30/30)=1 → singular.
    expect(getTimeUntilRelease('2026-07-02T12:00:00Z')).toBe('In 1 month')
    // 60 days → ceil(60/30)=2 → plural.
    expect(getTimeUntilRelease('2026-08-01T12:00:00Z')).toBe('In 2 months')
  })

  it('switches to years at the 365-day boundary', () => {
    // 364 days < 365 → months bucket, ceil(364/30)=13 → "In 13 months".
    expect(getTimeUntilRelease('2027-06-01T12:00:00Z')).toBe('In 13 months')
    // ~400 days → years bucket, ceil(400/365)=2 → plural.
    expect(getTimeUntilRelease('2027-07-07T12:00:00Z')).toBe('In 2 years')
  })

  it('buckets date-only strings by UTC midnight (TZ hazard)', () => {
    // now = 2026-06-02T12:00:00Z. 2026-06-03 = +0.5 day → ceil = 1 → Tomorrow.
    expect(getTimeUntilRelease('2026-06-03')).toBe('Tomorrow')
    // 2026-06-04 = +1.5 days → ceil = 2 → In 2 days.
    expect(getTimeUntilRelease('2026-06-04')).toBe('In 2 days')
  })
})

describe('configHelpers.formatReleaseDate', () => {
  it('formats a date-only string with NO time component', () => {
    const out = formatReleaseDate('2026-06-02')
    expect(out).toContain('2026')
    expect(out).toContain('June')
    expect(out).toContain('2')
    expect(out).not.toMatch(/AM|PM/)
  })

  it('formats a date-time string WITH a time component (T branch)', () => {
    const out = formatReleaseDate('2026-06-02T15:30:00Z')
    expect(out).toContain('2026')
    expect(out).toContain('June')
    expect(out).toMatch(/AM|PM/)
  })

  it('enters the time branch on a colon even without a T', () => {
    const out = formatReleaseDate('2026-06-02 15:30')
    expect(out).toMatch(/AM|PM/)
  })

  it('honors a non-default locale argument', () => {
    // uk-UA renders the month in Ukrainian (Cyrillic) — proves the locale arg is used.
    const out = formatReleaseDate('2026-06-02', 'uk-UA')
    expect(out).toMatch(/[Ѐ-ӿ]/)
    expect(out).not.toBe(formatReleaseDate('2026-06-02', 'en-US'))
  })
})

describe('configHelpers.formatReleaseDateShort', () => {
  it('renders a short en-US date regardless of the format helper', () => {
    const out = formatReleaseDateShort('2026-06-02')
    expect(out).toContain('Jun')
    expect(out).toContain('2026')
    expect(out).not.toMatch(/AM|PM/)
  })
})

describe('configHelpers pre-save / preview precedence', () => {
  // These read the LIVE generalConfig (no DI), so they assert the config's actual
  // current state AND the precedence rule wired into the source.
  it('isPreSaveMode mirrors general.enablePreSave', () => {
    expect(isPreSaveMode()).toBe(generalConfig.enablePreSave)
  })

  it('shouldShowNextReleasePreview is suppressed when pre-save is enabled (precedence)', () => {
    // Config ships enablePreSave:true, so preview must be false even though
    // enableNextReleasePreview is also true.
    if (generalConfig.enablePreSave) {
      expect(shouldShowNextReleasePreview()).toBe(false)
    } else {
      expect(shouldShowNextReleasePreview()).toBe(generalConfig.enableNextReleasePreview)
    }
  })

  it('documents the live config: pre-save enabled, so preview is suppressed', () => {
    // Pins the shipped flags so an accidental flip is caught here too.
    expect(generalConfig.enablePreSave).toBe(true)
    expect(generalConfig.enableNextReleasePreview).toBe(true)
    expect(isPreSaveMode()).toBe(true)
    expect(shouldShowNextReleasePreview()).toBe(false)
  })
})
