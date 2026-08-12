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

// The library is a static module-level array. These ids/slugs are the known
// fixtures at the time of writing; tests that depend on specific records assert
// against them, while invariant tests (no-mutation, type filtering) stay robust
// to additions by deriving expectations from `musicLibrary` itself.
const KHVYLI = '4'
const ALINA = '3'
const CHORNI = '2'
const MANIA = '1'

const idsOf = (releases: MusicRelease[]) => releases.map((r) => r.id)

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
  it('sorts releases newest-first by release date', () => {
    const latest = getLatestReleases()
    // khvyli (2026-08) > alina (2026-06) > chorni-ptahy (2026-02) > mania (2025-11)
    expect(idsOf(latest).slice(0, 4)).toEqual([KHVYLI, ALINA, CHORNI, MANIA])
  })

  it('defaults to a limit of 4', () => {
    expect(getLatestReleases().length).toBe(Math.min(4, musicLibrary.length))
  })

  it('honours an explicit limit', () => {
    expect(getLatestReleases(1)).toHaveLength(1)
    expect(getLatestReleases(2)).toHaveLength(2)
  })

  it('returns the single newest release with limit 1', () => {
    expect(getLatestReleases(1)[0].id).toBe(KHVYLI)
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
  it('returns every release', () => {
    expect(getAllReleases()).toHaveLength(musicLibrary.length)
  })

  it('sorts newest-first by release date', () => {
    expect(idsOf(getAllReleases())).toEqual([KHVYLI, ALINA, CHORNI, MANIA])
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
  afterEach(() => {
    vi.useRealTimers()
  })

  const freeze = (iso: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
  }

  it('returns the soonest future release that has pre-save links', () => {
    // 2026-01-01: chorni-ptahy (Feb) and alina (Jun) are future; mania is past.
    // chorni-ptahy is sooner → it wins.
    freeze('2026-01-01T00:00:00Z')
    const result = getNearestUpcomingPreSaveRelease()
    expect(result?.id).toBe(CHORNI)
  })

  it('returns the very nearest when all releases are still in the future', () => {
    // Before everything: mania (Nov 2025) is the nearest upcoming.
    freeze('2025-01-01T00:00:00Z')
    expect(getNearestUpcomingPreSaveRelease()?.id).toBe(MANIA)
  })

  it('counts a release with only a distributorPreSaveUrl as having pre-save links', () => {
    // 2026-03-01: only alina is future. alina has NO preSaveMusicPlatformLinks,
    // only distributorPreSaveUrl — it must still qualify.
    freeze('2026-03-01T00:00:00Z')
    const result = getNearestUpcomingPreSaveRelease()
    expect(result?.id).toBe(ALINA)
    expect(result?.preSaveMusicPlatformLinks).toBeUndefined()
    expect(result?.distributorPreSaveUrl).toBeTruthy()
  })

  it('returns undefined when every release date is in the past', () => {
    freeze('2027-01-01T00:00:00Z')
    expect(getNearestUpcomingPreSaveRelease()).toBeUndefined()
  })

  it('treats a release whose moment exactly equals now as NOT upcoming (strict >)', () => {
    // Frozen exactly at khvyli's release instant (the newest release); every
    // other release is already past. releaseTime > now is false for an exact
    // match → no upcoming presave. Keep this pinned to the LAST release in the
    // library, or a newer one stays ahead of `now` and the strict `>` never bites.
    freeze('2026-08-20T21:00:00Z')
    expect(getNearestUpcomingPreSaveRelease()).toBeUndefined()
  })

  it('returns alina one millisecond before its release instant', () => {
    freeze('2026-06-11T20:59:59.999Z')
    expect(getNearestUpcomingPreSaveRelease()?.id).toBe(ALINA)
  })

  it('returns a record held by reference within the library', () => {
    freeze('2026-01-01T00:00:00Z')
    const result = getNearestUpcomingPreSaveRelease()
    expect(musicLibrary).toContain(result)
  })

  it('does not mutate the library order while sorting upcoming candidates', () => {
    freeze('2025-01-01T00:00:00Z')
    const before = idsOf(musicLibrary)
    getNearestUpcomingPreSaveRelease()
    expect(idsOf(musicLibrary)).toEqual(before)
  })
})
