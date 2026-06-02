import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatCurrency,
  debounce,
  throttle,
  generateId,
  isValidEmail,
  truncateText
} from '~/utils/helpers'

describe('formatDate', () => {
  it('formats a Date object as a long en-US string', () => {
    // 2024-01-15 UTC midnight; formatter has no timeZone so it renders in the
    // host TZ. Assert the structural parts rather than an exact host-dependent day.
    const out = formatDate(new Date('2024-06-15T12:00:00Z'))
    expect(out).toMatch(/^June \d{1,2}, 2024$/)
  })

  it('accepts an ISO string and produces the same shape', () => {
    const out = formatDate('2024-12-25T12:00:00Z')
    expect(out).toMatch(/^December \d{1,2}, 2024$/)
  })

  it('returns an empty string for an unparseable date instead of throwing', () => {
    // Guard added: an unparseable input yields an Invalid Date, which the
    // function now short-circuits to '' rather than letting Intl.format() throw.
    expect(formatDate('not-a-date')).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate(new Date('nope'))).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats a number as USD by default', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
  })

  it('honours an explicit currency code', () => {
    // EUR in en-US locale renders with the € symbol prefix.
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
  })

  it('formats zero and negative amounts', () => {
    expect(formatCurrency(0)).toBe('$0.00')
    expect(formatCurrency(-5)).toBe('-$5.00')
  })
})

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name@example.co.uk')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
    expect(isValidEmail('x@y.io')).toBe(true)
    expect(isValidEmail('UPPER@EXAMPLE.COM')).toBe(true)
    expect(isValidEmail('user@sub.domain.com')).toBe(true)
  })

  it('rejects consecutive dots (defect #9 is FIXED: a@b..c is invalid)', () => {
    expect(isValidEmail('a@b..c')).toBe(false)
    expect(isValidEmail('user..name@example.com')).toBe(false)
    expect(isValidEmail('user@exam..ple.com')).toBe(false)
  })

  it('rejects a leading or trailing dot in the local part', () => {
    expect(isValidEmail('.user@example.com')).toBe(false)
    expect(isValidEmail('user.@example.com')).toBe(false)
  })

  it('rejects a leading or trailing dot in the domain', () => {
    expect(isValidEmail('user@.example.com')).toBe(false)
    expect(isValidEmail('user@example.com.')).toBe(false)
  })

  it('requires a TLD of at least two letters', () => {
    expect(isValidEmail('a@b.c')).toBe(false)
    expect(isValidEmail('user@example.c')).toBe(false)
    expect(isValidEmail('user@example')).toBe(false)
  })

  it('rejects whitespace, missing/double @, and empty input', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('user name@example.com')).toBe(false)
    expect(isValidEmail('user@@example.com')).toBe(false)
    expect(isValidEmail('userexample.com')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })

  it('does NOT validate hyphen placement in domain labels (regex permits it)', () => {
    // Behavior note: this regex treats hyphen as an ordinary label char, so a
    // leading-hyphen label like "-example.com" is accepted even though real
    // hostnames forbid it. Documented, not a bug fix.
    expect(isValidEmail('user@-example.com')).toBe(true)
  })
})

describe('truncateText', () => {
  it('returns the text unchanged when shorter than maxLength', () => {
    expect(truncateText('hello', 10)).toBe('hello')
  })

  it('returns the text unchanged at the exact maxLength boundary (<=)', () => {
    expect(truncateText('hello', 5)).toBe('hello')
  })

  it('truncates and appends an ellipsis one char over the boundary', () => {
    // length 6 > maxLength 5 → first 5 chars + '...'
    expect(truncateText('hello!', 5)).toBe('hello...')
  })

  it('truncates a long string to maxLength chars plus ellipsis', () => {
    const out = truncateText('abcdefghij', 4)
    expect(out).toBe('abcd...')
    expect(out.length).toBe(4 + 3)
  })

  it('handles an empty string and maxLength 0', () => {
    expect(truncateText('', 0)).toBe('')
    expect(truncateText('a', 0)).toBe('...')
  })
})

describe('generateId', () => {
  it('produces an id of the default length using base36 charset', () => {
    const id = generateId()
    // base36 = lowercase letters + digits. Length is at most the requested
    // length; it can occasionally be shorter when Math.random()'s base36
    // expansion drops trailing zeros, so assert <= rather than ===.
    expect(id).toMatch(/^[0-9a-z]+$/)
    expect(id.length).toBeGreaterThan(0)
    expect(id.length).toBeLessThanOrEqual(8)
  })

  it('respects a custom length as an upper bound', () => {
    const id = generateId(12)
    expect(id.length).toBeLessThanOrEqual(12)
    expect(id).toMatch(/^[0-9a-z]+$/)
  })

  it('typically yields exactly the requested length', () => {
    // The short-id case is extremely rare; over many draws at least one hits
    // the full requested length.
    const hitFull = Array.from({ length: 50 }, () => generateId(8)).some((id) => id.length === 8)
    expect(hitFull).toBe(true)
  })

  it('generates distinct ids across successive calls', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateId(10)))
    // Collisions are astronomically unlikely; allow a tiny margin but expect
    // near-total uniqueness.
    expect(ids.size).toBeGreaterThan(495)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the function before the wait elapses', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('fires exactly once with the LAST args when called rapidly', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)
    debounced('a')
    debounced('b')
    debounced('c')
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('restarts the timer on each call (trailing edge)', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(80)
    debounced()
    vi.advanceTimersByTime(80)
    // 160ms total but only 80ms since the last call → still pending
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(20)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('fires again for a separate burst after the first settles', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced(1)
    vi.advanceTimersByTime(50)
    debounced(2)
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 1)
    expect(fn).toHaveBeenNthCalledWith(2, 2)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires immediately on the leading edge', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('first')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('first')
  })

  it('drops calls made within the limit window', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('a')
    throttled('b')
    throttled('c')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('allows the next call once the window elapses', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('a')
    vi.advanceTimersByTime(100)
    throttled('b')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'a')
    expect(fn).toHaveBeenNthCalledWith(2, 'b')
  })

  it('does not fire a trailing call for drops within the window', () => {
    // This impl has no trailing edge: 'b' is dropped and never replayed.
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('a')
    throttled('b')
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('still allows a call exactly at the window boundary', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)
    throttled(1)
    vi.advanceTimersByTime(49)
    throttled(2)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    throttled(3)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(2, 3)
  })
})
