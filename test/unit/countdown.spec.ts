import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getLocalizedCountdown } from '~/utils/countdown'

// ---------------------------------------------------------------------------
// Translation tables mirror locales/uk.json and locales/en.json
// (music.days_remaining.*). The translator below behaves like vue-i18n's
// missing-key default: when a key is present it returns the localized string,
// otherwise it echoes the key back unchanged — which is exactly the signal
// getLocalizedCountdown uses to decide whether to fall back to its hardcoded map.
// ---------------------------------------------------------------------------
const ukStrings: Record<string, string> = {
  'music.days_remaining.prefix': 'через',
  'music.days_remaining.day': 'день',
  'music.days_remaining.days_2_4': 'дні',
  'music.days_remaining.days_many': 'днів',
  'music.days_remaining.hour': 'годину',
  'music.days_remaining.hours_2_4': 'години',
  'music.days_remaining.hours_many': 'годин',
  'music.days_remaining.minute': 'хвилину',
  'music.days_remaining.minutes_2_4': 'хвилини',
  'music.days_remaining.minutes_many': 'хвилин'
}

const enStrings: Record<string, string> = {
  'music.days_remaining.prefix': 'in',
  'music.days_remaining.day': 'day',
  'music.days_remaining.days': 'days',
  'music.days_remaining.hour': 'hour',
  'music.days_remaining.hours': 'hours',
  'music.days_remaining.minute': 'minute',
  'music.days_remaining.minutes': 'minutes'
}

// vue-i18n-like translator: known key → string, unknown key → the key itself.
const makeT = (table: Record<string, string>) => (key: string) => (key in table ? table[key] : key)

const tUk = makeT(ukStrings)
const tEn = makeT(enStrings)

// A translator that always echoes the key — drives every fallbackMap branch.
const tEcho = (key: string) => key

// Frozen "now". UTC anchor so date-only ISO strings (parsed as UTC midnight)
// are reasoned about unambiguously.
const NOW = '2026-06-02T00:00:00Z'

// Build an ISO target offset from NOW by a number of minutes.
const targetInMinutes = (minutes: number) =>
  new Date(Date.parse(NOW) + minutes * 60_000).toISOString()

describe('getLocalizedCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('empty / invalid / past inputs', () => {
    it('returns empty string when releaseDate is missing', () => {
      expect(getLocalizedCountdown({ releaseDate: undefined, locale: 'en', t: tEn })).toBe('')
    })

    it('returns empty string for an empty string releaseDate', () => {
      expect(getLocalizedCountdown({ releaseDate: '', locale: 'en', t: tEn })).toBe('')
    })

    it('returns empty string for an unparseable date string', () => {
      expect(getLocalizedCountdown({ releaseDate: 'not-a-real-date', locale: 'en', t: tEn })).toBe(
        ''
      )
    })

    it('returns empty string for an invalid Date object', () => {
      expect(
        getLocalizedCountdown({ releaseDate: new Date('nonsense'), locale: 'en', t: tEn })
      ).toBe('')
    })

    it('returns empty string for a past release date', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(-60), locale: 'en', t: tEn })
      ).toBe('')
    })

    it('returns empty string for a target exactly equal to now (diff = 0)', () => {
      // isUpcomingRelease requires release > now, so equality is not upcoming.
      expect(getLocalizedCountdown({ releaseDate: NOW, locale: 'en', t: tEn })).toBe('')
    })

    it('accepts a Date object input (round-tripped via toISOString)', () => {
      const target = new Date(Date.parse(NOW) + 3 * 24 * 60 * 60_000)
      expect(getLocalizedCountdown({ releaseDate: target, locale: 'en', t: tEn })).toBe('in 3 days')
    })
  })

  describe('Math.ceil unit bucketing & boundaries (English)', () => {
    it('exactly 1440 minutes ahead → "in 1 day" (singular at the day boundary)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'en', t: tEn })
      ).toBe('in 1 day')
    })

    it('1440 minutes + 1 minute ahead → "in 2 days" (rounds up)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1441), locale: 'en', t: tEn })
      ).toBe('in 2 days')
    })

    it('just under a day (1439 minutes) → falls into the hour bucket → "in 24 hours"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1439), locale: 'en', t: tEn })
      ).toBe('in 24 hours')
    })

    it('exactly 60 minutes ahead → "in 1 hour"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(60), locale: 'en', t: tEn })
      ).toBe('in 1 hour')
    })

    it('61 minutes ahead → ceil to "in 2 hours"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(61), locale: 'en', t: tEn })
      ).toBe('in 2 hours')
    })

    it('59 minutes ahead → minute bucket → "in 59 minutes"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(59), locale: 'en', t: tEn })
      ).toBe('in 59 minutes')
    })

    it('exactly 1 minute ahead → "in 1 minute"', () => {
      expect(getLocalizedCountdown({ releaseDate: targetInMinutes(1), locale: 'en', t: tEn })).toBe(
        'in 1 minute'
      )
    })

    it('30 seconds ahead → ceil to 1 minute → "in 1 minute"', () => {
      const target = new Date(Date.parse(NOW) + 30_000).toISOString()
      expect(getLocalizedCountdown({ releaseDate: target, locale: 'en', t: tEn })).toBe(
        'in 1 minute'
      )
    })
  })

  describe('English singular / plural selection', () => {
    it('uses singular "day" only at value 1', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'en', t: tEn })
      ).toBe('in 1 day')
    })

    it('uses plural "days" for value > 1', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(7 * 1440), locale: 'en', t: tEn })
      ).toBe('in 7 days')
    })

    it('uses singular "hour" at value 1 and plural "hours" otherwise', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(60), locale: 'en', t: tEn })
      ).toBe('in 1 hour')
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(180), locale: 'en', t: tEn })
      ).toBe('in 3 hours')
    })
  })

  describe('normalizeLocale mapping', () => {
    it('maps "ua" → "uk" (Ukrainian output)', () => {
      // 1 day → uk "one" form "день", prefix "через".
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'ua', t: tUk })
      ).toBe('через 1 день')
    })

    it('maps "uk-ua" → "uk"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'uk-ua', t: tUk })
      ).toBe('через 1 день')
    })

    it('maps "en-us" → "en"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'en-us', t: tEn })
      ).toBe('in 1 day')
    })

    it('treats an undefined locale as English', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: undefined, t: tEn })
      ).toBe('in 1 day')
    })

    it('lowercases an unknown locale and treats it as non-uk (English branch)', () => {
      // "FR" → "fr" → not uk → English key map; with tEn keys it renders English words.
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'FR', t: tEn })
      ).toBe('in 1 day')
    })

    it('uppercase "UA" is lowercased then mapped to uk', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'UA', t: tUk })
      ).toBe('через 1 день')
    })
  })

  describe('Ukrainian plural selection — "one" form (lastDigit 1, not 11)', () => {
    it('1 day → "день"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(1440), locale: 'uk', t: tUk })
      ).toBe('через 1 день')
    })

    it('21 days → "день" (lastDigit 1, lastTwoDigits 21)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(21 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 21 день')
    })

    it('1 hour → "годину"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(60), locale: 'uk', t: tUk })
      ).toBe('через 1 годину')
    })

    it('1 minute → "хвилину"', () => {
      expect(getLocalizedCountdown({ releaseDate: targetInMinutes(1), locale: 'uk', t: tUk })).toBe(
        'через 1 хвилину'
      )
    })
  })

  describe('Ukrainian plural selection — "few" form (lastDigit 2-4, not 12-14)', () => {
    it('2 days → "дні"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(2 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 2 дні')
    })

    it('3 days → "дні"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(3 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 3 дні')
    })

    it('4 days → "дні"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(4 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 4 дні')
    })

    it('22 days → "дні" (lastDigit 2, lastTwoDigits 22)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(22 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 22 дні')
    })

    it('3 hours → "години"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(180), locale: 'uk', t: tUk })
      ).toBe('через 3 години')
    })

    it('2 minutes → "хвилини"', () => {
      expect(getLocalizedCountdown({ releaseDate: targetInMinutes(2), locale: 'uk', t: tUk })).toBe(
        'через 2 хвилини'
      )
    })
  })

  describe('Ukrainian plural selection — "many" form', () => {
    it('5 days → "днів" (lastDigit 5)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(5 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 5 днів')
    })

    it('10 days → "днів" (lastDigit 0)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(10 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 10 днів')
    })

    it('25 minutes → "хвилин" (lastDigit 5)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(25), locale: 'uk', t: tUk })
      ).toBe('через 25 хвилин')
    })
  })

  describe('Ukrainian 11-19 "many" exception (overrides lastDigit rule)', () => {
    it('11 minutes → "хвилин" (lastDigit 1 but lastTwoDigits 11 → many)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(11), locale: 'uk', t: tUk })
      ).toBe('через 11 хвилин')
    })

    it('12 minutes → "хвилин" (lastDigit 2 but lastTwoDigits 12 → many)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(12), locale: 'uk', t: tUk })
      ).toBe('через 12 хвилин')
    })

    it('13 minutes → "хвилин"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(13), locale: 'uk', t: tUk })
      ).toBe('через 13 хвилин')
    })

    it('14 minutes → "хвилин"', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(14), locale: 'uk', t: tUk })
      ).toBe('через 14 хвилин')
    })

    it('19 days → "днів" (the exception extends through 19, not just 14)', () => {
      // The actual code guards lastTwoDigits 11..19 inclusive — verifies the
      // real behaviour, which is broader than the classic 11-14 rule.
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(19 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 19 днів')
    })

    it('111 days → "днів" (lastTwoDigits 11 even though hundreds present)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(111 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 111 днів')
    })

    it('121 days → "день" (lastTwoDigits 21, outside the exception, lastDigit 1 → one)', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(121 * 1440), locale: 'uk', t: tUk })
      ).toBe('через 121 день')
    })
  })

  describe('translator fallback behaviour (key echoed → hardcoded fallback map)', () => {
    it('uk: falls back to the built-in Ukrainian words and "через" prefix when keys are missing', () => {
      // tEcho returns the key for everything, so prefix and unit word both fall back.
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(2 * 1440), locale: 'uk', t: tEcho })
      ).toBe('через 2 дні')
    })

    it('en: falls back to the built-in English words and "in" prefix when keys are missing', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(3 * 1440), locale: 'en', t: tEcho })
      ).toBe('in 3 days')
    })

    it('uk fallback covers hours and minutes too', () => {
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(60), locale: 'uk', t: tEcho })
      ).toBe('через 1 годину')
      expect(
        getLocalizedCountdown({ releaseDate: targetInMinutes(11), locale: 'uk', t: tEcho })
      ).toBe('через 11 хвилин')
    })

    it('honours a custom prefix returned by the translator', () => {
      const tCustomPrefix = (key: string) =>
        key === 'music.days_remaining.prefix' ? 'залишилось' : (enStrings[key] ?? key)
      expect(
        getLocalizedCountdown({
          releaseDate: targetInMinutes(1440),
          locale: 'en',
          t: tCustomPrefix
        })
      ).toBe('залишилось 1 day')
    })
  })
})
