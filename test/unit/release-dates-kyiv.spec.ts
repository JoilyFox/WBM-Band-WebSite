import { describe, it, expect, afterEach } from 'vitest'
import { formatReleaseDate, formatReleaseDateShort } from '~/utils/configHelpers'

// B-04: releases go live at midnight KYIV time, so the day printed in the
// "unlocks on …" copy must not depend on the build machine's zone (UTC on CI) or
// the visitor's browser.
describe('configHelpers release dates are pinned to Europe/Kyiv', () => {
  const originalTz = process.env.TZ
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ
    else process.env.TZ = originalTz
  })

  // 2026-10-29T22:00:00Z is midnight Kyiv (EET, UTC+2) → 30 October in Kyiv.
  it.each(['UTC', 'America/Los_Angeles', 'Pacific/Auckland', 'Europe/Kyiv'])(
    'prints the Kyiv day regardless of the machine zone (%s)',
    (tz) => {
      process.env.TZ = tz
      expect(formatReleaseDate('2026-10-29T22:00:00Z', 'en-US', { includeTime: false })).toBe(
        'October 30, 2026'
      )
      expect(formatReleaseDate('2026-10-29T22:00:00Z', 'uk-UA', { includeTime: false })).toContain(
        '30 жовтня 2026'
      )
      expect(formatReleaseDateShort('2026-10-29T22:00:00Z')).toBe('Oct 30, 2026')
    }
  )

  it('keeps the wall-clock time in Kyiv when time is requested', () => {
    process.env.TZ = 'America/Los_Angeles'
    expect(formatReleaseDate('2026-10-29T22:00:00Z', 'en-US')).toMatch(/12:00\s?AM/)
  })

  it('handles the summer-time offset (EEST, UTC+3)', () => {
    process.env.TZ = 'UTC'
    // 2026-08-20T21:00:00Z is midnight Kyiv on 21 August.
    expect(formatReleaseDate('2026-08-20T21:00:00Z', 'en-US', { includeTime: false })).toBe(
      'August 21, 2026'
    )
  })
})
