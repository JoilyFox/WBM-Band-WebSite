import { describe, it, expect } from 'vitest'
import { hasPreSaveLinks } from '../../utils/preSave'
import {
  isSafeInternalPath,
  releaseGateLocation,
  RELEASE_GATE_REASONS
} from '../../utils/releaseGate'
import { getNearestUpcomingPreSaveRelease, musicLibrary } from '../../data/musicLibrary'
import uk from '../../locales/uk.json'
import en from '../../locales/en.json'

describe('hasPreSaveLinks (B-02 / COR-10: the ONE definition)', () => {
  it('is false with neither links nor a distributor URL', () => {
    expect(hasPreSaveLinks({})).toBe(false)
    expect(hasPreSaveLinks({ preSaveMusicPlatformLinks: undefined })).toBe(false)
  })

  it('is false for an object whose values are all empty (the old Object.keys().length bug)', () => {
    expect(hasPreSaveLinks({ preSaveMusicPlatformLinks: {} })).toBe(false)
    expect(
      hasPreSaveLinks({ preSaveMusicPlatformLinks: { spotify: '', appleMusic: undefined } })
    ).toBe(false)
  })

  it('is true with at least one non-empty platform link', () => {
    expect(
      hasPreSaveLinks({
        preSaveMusicPlatformLinks: { spotify: '', deezer: 'https://deezer.com/x' }
      })
    ).toBe(true)
  })

  it('is true with only a distributor URL (the Сліпа вулиця case)', () => {
    expect(hasPreSaveLinks({ distributorPreSaveUrl: 'https://kontrabass.lnk.to/x' })).toBe(true)
    expect(
      hasPreSaveLinks({
        preSaveMusicPlatformLinks: {},
        distributorPreSaveUrl: 'https://x.lnk.to/y'
      })
    ).toBe(true)
  })

  it('getNearestUpcomingPreSaveRelease agrees with the helper for every release', () => {
    const nearest = getNearestUpcomingPreSaveRelease()
    if (nearest) expect(hasPreSaveLinks(nearest)).toBe(true)
    // Every release the helper rejects must never be returned.
    for (const r of musicLibrary.filter((r) => !hasPreSaveLinks(r))) {
      expect(nearest?.slug).not.toBe(r.slug)
    }
  })
})

describe('isSafeInternalPath (W-02)', () => {
  it.each(['/', '/en', '/listen/khvyli', '/#music', '/en/404?x=1'])('accepts %s', (v) => {
    expect(isSafeInternalPath(v)).toBe(true)
  })

  it.each([
    '//evil.example',
    '///evil.example',
    '/\\evil.example',
    'https://evil.example',
    'http://evil.example',
    'javascript:alert(1)',
    'evil.example',
    '',
    undefined,
    null,
    42
  ])('rejects %s', (v) => {
    expect(isSafeInternalPath(v)).toBe(false)
  })
})

describe('releaseGateLocation (B-05)', () => {
  const localePath = (p: string) => `/en${p}`

  it('builds a localized /404 location carrying a reason code and the ISO date', () => {
    expect(releaseGateLocation(localePath, 'release_locked', '2026-10-29T22:00:00Z')).toEqual({
      path: '/en/404',
      query: { reason: 'release_locked', date: '2026-10-29T22:00:00Z' }
    })
  })

  it('omits the date when there is none', () => {
    expect(releaseGateLocation(localePath, 'presave_disabled')).toEqual({
      path: '/en/404',
      query: { reason: 'presave_disabled' }
    })
  })

  it('every reason code has title + message copy in BOTH locales', () => {
    for (const reason of Object.keys(RELEASE_GATE_REASONS)) {
      for (const locale of [uk, en] as const) {
        const entry = (locale.errors as Record<string, any>)[reason]
        expect(entry?.title, `${reason}.title`).toBeTruthy()
        expect(entry?.message, `${reason}.message`).toBeTruthy()
      }
    }
  })
})
