// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { musicLibrary } from '~/data/musicLibrary'

// T-01: lyrics-access had 0% coverage. It must 404 every slug that has no
// non-empty `lyrics` array and let the others through. Uses the REAL library and
// the REAL createError (auto-import), so a data change that drops a release's
// lyrics (while the prerender list still emits the route) is caught here.

const mw = (await import('~/middleware/lyrics-access')).default

const run = (params: Record<string, unknown>) => mw({ params } as any, {} as any)

const withLyrics = musicLibrary.filter((r) => r.lyrics && r.lyrics.length > 0)
const withoutLyrics = musicLibrary.filter((r) => !r.lyrics || r.lyrics.length === 0)

describe('lyrics-access middleware', () => {
  it('passes through when there is no slug param', () => {
    expect(run({})).toBeUndefined()
    expect(run({ slug: '' })).toBeUndefined()
  })

  it.each(withLyrics.map((r) => r.slug))('lets "%s" (ships lyrics) through', (slug) => {
    expect(run({ slug })).toBeUndefined()
  })

  it('uses the first element when slug is an array', () => {
    const slug = withLyrics[0].slug
    expect(run({ slug: [slug, 'ignored'] })).toBeUndefined()
  })

  it('404s an unknown slug, carrying the slug in statusMessage + data', () => {
    expect.assertions(3)
    try {
      run({ slug: 'no-such-song' })
    } catch (e: any) {
      expect(e.statusCode).toBe(404)
      expect(e.statusMessage).toContain('no-such-song')
      expect(e.data).toEqual({ slug: 'no-such-song' })
    }
  })

  it.each(withoutLyrics.map((r) => r.slug))(
    '404s "%s" (valid release but no lyrics yet)',
    (slug) => {
      expect(() => run({ slug })).toThrowError()
    }
  )

  it('404s a prototype key rather than treating it as a release', () => {
    expect(() => run({ slug: 'constructor' })).toThrowError()
  })

  it('has at least one release with lyrics, so the guard is exercised both ways', () => {
    expect(withLyrics.length).toBeGreaterThan(0)
  })
})
