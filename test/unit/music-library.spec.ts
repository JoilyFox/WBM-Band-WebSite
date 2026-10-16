import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  musicLibrary,
  getFeaturedReleases,
  getLatestReleases,
  getReleasesByType,
  getAllReleases,
  getReleaseBySlug,
  getReleaseById,
  getNearestUpcomingPreSaveRelease
} from '~/data/musicLibrary'
import type { MusicRelease } from '~/data/musicLibrary'

// The library is a static module-level array. The lookup tests below pin a few
// stable ids from the real data; everything that depends on ORDER or on the CURRENT
// DATE (latest/all/nearest-upcoming) runs against a fixture library instead, so
// adding a release to data/musicLibrary.ts never breaks this file.
const ALINA = '3'
const CHORNI = '2'
const MANIA = '1'

const idsOf = (releases: MusicRelease[]) => releases.map((r) => r.id)

const fixtureRelease = (
  id: string,
  releaseDate: string,
  extra: Partial<MusicRelease> = {}
): MusicRelease => ({
  id,
  slug: `fixture-${id}`,
  title: `Fixture ${id}`,
  type: 'single',
  releaseDate,
  imageUrl: '/images/fixture.jpg',
  musicPlatformLinks: {},
  ...extra
})

// Newest -> oldest: F_LAST, F_DIST, F_LINKS, F_NOLINKS.
const F_NOLINKS = fixtureRelease('f-nolinks', '2029-12-01T00:00:00Z')
const F_LINKS = fixtureRelease('f-links', '2030-01-10T00:00:00Z', {
  preSaveMusicPlatformLinks: { spotify: 'https://example.com/presave' }
})
// Distributor-only pre-save (no preSaveMusicPlatformLinks) must still qualify.
const F_DIST = fixtureRelease('f-dist', '2030-03-20T00:00:00Z', {
  distributorPreSaveUrl: 'https://example.com/distributor'
})
const F_LAST = fixtureRelease('f-last', '2030-06-01T22:00:00Z', {
  distributorPreSaveUrl: 'https://example.com/last'
})
const FIXTURE: MusicRelease[] = [F_NOLINKS, F_LINKS, F_DIST, F_LAST]
const NEWEST_FIRST = [F_LAST.id, F_DIST.id, F_LINKS.id, F_NOLINKS.id]

/** Swap the shared module-level library for FIXTURE around each test, then restore it. */
const useFixtureLibrary = () => {
  let saved: MusicRelease[] = []
  beforeEach(() => {
    saved = musicLibrary.splice(0, musicLibrary.length, ...FIXTURE)
  })
  afterEach(() => {
    musicLibrary.splice(0, musicLibrary.length, ...saved)
  })
}

describe('musicLibrary (module-level data)', () => {
  it('exposes a non-empty array of releases', () => {
    expect(Array.isArray(musicLibrary)).toBe(true)
    expect(musicLibrary.length).toBeGreaterThan(0)
  })

  it('has unique ids across every release', () => {
    const ids = idsOf(musicLibrary)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique slugs across every release', () => {
    const slugs = musicLibrary.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every release has a musicPlatformLinks object', () => {
    for (const release of musicLibrary) {
      expect(typeof release.musicPlatformLinks).toBe('object')
      expect(release.musicPlatformLinks).not.toBeNull()
    }
  })
})

describe('getReleaseBySlug', () => {
  it('returns the matching record on a hit', () => {
    const release = getReleaseBySlug('alina')
    expect(release).toBeDefined()
    expect(release?.id).toBe(ALINA)
    expect(release?.slug).toBe('alina')
  })

  it('returns the exact module-level reference (no copy)', () => {
    const release = getReleaseBySlug('mania')
    expect(release).toBe(musicLibrary.find((r) => r.slug === 'mania'))
  })

  it('returns undefined when no slug matches', () => {
    expect(getReleaseBySlug('does-not-exist')).toBeUndefined()
  })

  it('returns undefined for an empty string slug', () => {
    expect(getReleaseBySlug('')).toBeUndefined()
  })

  it('is case-sensitive (exact slug match only)', () => {
    expect(getReleaseBySlug('Alina')).toBeUndefined()
    expect(getReleaseBySlug('ALINA')).toBeUndefined()
  })

  it('does not match on surrounding whitespace', () => {
    expect(getReleaseBySlug(' alina')).toBeUndefined()
    expect(getReleaseBySlug('alina ')).toBeUndefined()
  })

  it('resolves every slug present in the library', () => {
    for (const release of musicLibrary) {
      expect(getReleaseBySlug(release.slug)?.id).toBe(release.id)
    }
  })
})

describe('getReleaseById', () => {
  it('returns the matching record on a hit', () => {
    const release = getReleaseById(CHORNI)
    expect(release).toBeDefined()
    expect(release?.slug).toBe('chorni-ptahy')
  })

  it('returns the exact module-level reference (no copy)', () => {
    const release = getReleaseById(MANIA)
    expect(release).toBe(musicLibrary.find((r) => r.id === MANIA))
  })

  it('returns undefined when no id matches', () => {
    expect(getReleaseById('99999')).toBeUndefined()
  })

  it('returns undefined for an empty string id', () => {
    expect(getReleaseById('')).toBeUndefined()
  })

  it('does not coerce numeric-looking input (string strict match)', () => {
    // ids are strings; a number would be passed through find's === and miss.
    expect(getReleaseById(3 as unknown as string)).toBeUndefined()
    expect(getReleaseById(ALINA)).toBeDefined()
  })

  it('resolves every id present in the library', () => {
    for (const release of musicLibrary) {
      expect(getReleaseById(release.id)?.slug).toBe(release.slug)
    }
  })
})

describe('getFeaturedReleases', () => {
  it('returns only releases flagged featured', () => {
    const featured = getFeaturedReleases()
    expect(featured.length).toBeGreaterThan(0)
    for (const release of featured) {
      expect(release.featured).toBe(true)
    }
  })

  it('matches the manual filter over the library', () => {
    const expected = musicLibrary.filter((r) => r.featured)
    expect(getFeaturedReleases()).toEqual(expected)
  })

  it('excludes releases without the featured flag', () => {
    const featuredIds = idsOf(getFeaturedReleases())
    for (const release of musicLibrary) {
      if (!release.featured) {
        expect(featuredIds).not.toContain(release.id)
      }
    }
  })

  it('returns records by reference (not deep copies)', () => {
    const featured = getFeaturedReleases()
    for (const release of featured) {
      expect(musicLibrary).toContain(release)
    }
  })
})

describe('getReleasesByType', () => {
  it('returns only releases of the requested type (single)', () => {
    const singles = getReleasesByType('single')
    expect(singles.length).toBeGreaterThan(0)
    for (const release of singles) {
      expect(release.type).toBe('single')
    }
  })

  it('matches the manual filter for the requested type', () => {
    const expected = musicLibrary.filter((r) => r.type === 'single')
    expect(getReleasesByType('single')).toEqual(expected)
  })

  it.each(['album', 'ep', 'new release'] as MusicRelease['type'][])(
    'returns an empty array when no release has type "%s"',
    (type) => {
      const expected = musicLibrary.filter((r) => r.type === type)
      const result = getReleasesByType(type)
      expect(result).toEqual(expected)
      // Sanity: result only contains the requested type (or is empty).
      for (const release of result) {
        expect(release.type).toBe(type)
      }
    }
  )

  it('returns records by reference (not deep copies)', () => {
    for (const release of getReleasesByType('single')) {
      expect(musicLibrary).toContain(release)
    }
  })
})

describe('getLatestReleases', () => {
  useFixtureLibrary()

  it('sorts releases newest-first by release date', () => {
    expect(idsOf(getLatestReleases())).toEqual(NEWEST_FIRST)
  })

  it('defaults to a limit of 4', () => {
    expect(getLatestReleases().length).toBe(Math.min(4, musicLibrary.length))
  })

  it('honours an explicit limit', () => {
    expect(getLatestReleases(1)).toHaveLength(1)
    expect(getLatestReleases(2)).toHaveLength(2)
  })

  it('returns the single newest release with limit 1', () => {
    expect(getLatestReleases(1)[0].id).toBe(F_LAST.id)
  })

  it('returns an empty array with limit 0', () => {
    expect(getLatestReleases(0)).toEqual([])
  })

  it('clamps to the library size when limit exceeds count', () => {
    expect(getLatestReleases(1000)).toHaveLength(musicLibrary.length)
  })

  it('treats a negative limit like slice (returns from the end)', () => {
    // slice(0, -1) drops the last element — assert ACTUAL slice semantics.
    expect(getLatestReleases(-1)).toHaveLength(musicLibrary.length - 1)
  })

  it('does NOT mutate the shared module-level array (bug #2 fixed)', () => {
    const before = idsOf(musicLibrary)
    getLatestReleases()
    expect(idsOf(musicLibrary)).toEqual(before)
  })

  it('returns a new array instance, not the library itself', () => {
    expect(getLatestReleases()).not.toBe(musicLibrary)
  })
})

describe('getAllReleases', () => {
  useFixtureLibrary()

  it('returns every release', () => {
    expect(getAllReleases()).toHaveLength(musicLibrary.length)
  })

  it('sorts newest-first by release date', () => {
    expect(idsOf(getAllReleases())).toEqual(NEWEST_FIRST)
  })

  it('contains exactly the same id set as the library', () => {
    expect(new Set(idsOf(getAllReleases()))).toEqual(new Set(idsOf(musicLibrary)))
  })

  it('does NOT mutate the shared module-level array (bug #2 fixed)', () => {
    const before = idsOf(musicLibrary)
    getAllReleases()
    expect(idsOf(musicLibrary)).toEqual(before)
  })

  it('returns a new array instance, not the library itself', () => {
    expect(getAllReleases()).not.toBe(musicLibrary)
  })
})

describe('no-mutation invariant across repeated sorter calls', () => {
  it('keeps the library order stable after many sorts', () => {
    const before = idsOf(musicLibrary)
    getAllReleases()
    getLatestReleases()
    getLatestReleases(2)
    getReleasesByType('single')
    getAllReleases()
    expect(idsOf(musicLibrary)).toEqual(before)
  })
})

describe('getNearestUpcomingPreSaveRelease', () => {
  useFixtureLibrary()
  afterEach(() => {
    vi.useRealTimers()
  })

  const freeze = (iso: string | number) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
  }
  const time = (r: MusicRelease) => new Date(r.releaseDate as string).getTime()

  it('returns the soonest future release that has pre-save links', () => {
    // Just after F_NOLINKS: F_LINKS, F_DIST and F_LAST are future; F_LINKS is soonest.
    freeze(time(F_NOLINKS) + 1)
    expect(getNearestUpcomingPreSaveRelease()?.id).toBe(F_LINKS.id)
  })

  it('skips an earlier future release that has no pre-save links', () => {
    // Before everything: F_NOLINKS is the soonest release but cannot be pre-saved.
    freeze(time(F_NOLINKS) - 86_400_000)
    expect(getNearestUpcomingPreSaveRelease()?.id).toBe(F_LINKS.id)
  })

  it('counts a release with only a distributorPreSaveUrl as having pre-save links', () => {
    freeze(time(F_LINKS) + 1)
    const result = getNearestUpcomingPreSaveRelease()
    expect(result?.id).toBe(F_DIST.id)
    expect(result?.preSaveMusicPlatformLinks).toBeUndefined()
    expect(result?.distributorPreSaveUrl).toBeTruthy()
  })

  it('returns undefined when every release date is in the past', () => {
    freeze(time(F_LAST) + 86_400_000)
    expect(getNearestUpcomingPreSaveRelease()).toBeUndefined()
  })

  it('treats a release whose moment exactly equals now as NOT upcoming (strict >)', () => {
    // Frozen exactly at the newest release's instant, every other release is already
    // past; releaseTime > now is false for an exact match -> no upcoming pre-save.
    freeze(time(F_LAST))
    expect(getNearestUpcomingPreSaveRelease()).toBeUndefined()
  })

  it('returns the release one millisecond before its release instant', () => {
    freeze(time(F_DIST) - 1)
    expect(getNearestUpcomingPreSaveRelease()?.id).toBe(F_DIST.id)
  })

  it('returns a record held by reference within the library', () => {
    freeze(time(F_NOLINKS) + 1)
    const result = getNearestUpcomingPreSaveRelease()
    expect(musicLibrary).toContain(result)
  })

  it('does not mutate the library order while sorting upcoming candidates', () => {
    freeze(time(F_NOLINKS) - 86_400_000)
    const before = idsOf(musicLibrary)
    getNearestUpcomingPreSaveRelease()
    expect(idsOf(musicLibrary)).toEqual(before)
  })
})
