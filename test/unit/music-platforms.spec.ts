import { describe, it, expect } from 'vitest'
import { getMusicPlatform, getDefaultPlatform, musicPlatforms } from '~/utils/musicPlatforms'

// The full default ("Listen"-style) fallback shape, copied verbatim from the source
// so the test fails loudly if any field of the default platform changes.
const expectedDefault = {
  name: 'default',
  icon: 'pi pi-external-link',
  colors: {
    bg: 'from-gray-600 to-gray-500',
    hover: 'from-gray-700 to-gray-600',
    text: 'text-white',
    border: 'border-gray-500/30'
  },
  displayName: 'Listen'
}

describe('getDefaultPlatform', () => {
  it('returns the full "Listen" fallback shape', () => {
    expect(getDefaultPlatform()).toEqual(expectedDefault)
  })

  it('uses the external-link icon and gray gradient for the fallback', () => {
    const def = getDefaultPlatform()
    expect(def.name).toBe('default')
    expect(def.displayName).toBe('Listen')
    expect(def.icon).toBe('pi pi-external-link')
    expect(def.colors.text).toBe('text-white')
  })

  it('returns a fresh object on each call (factory, not a shared singleton)', () => {
    const a = getDefaultPlatform()
    const b = getDefaultPlatform()
    expect(a).not.toBe(b)
    expect(a.colors).not.toBe(b.colors)
    expect(a).toEqual(b)
  })

  it('mutating one returned default does not affect a subsequent call', () => {
    const a = getDefaultPlatform()
    a.displayName = 'Mutated'
    a.colors.bg = 'changed'
    const b = getDefaultPlatform()
    expect(b.displayName).toBe('Listen')
    expect(b.colors.bg).toBe('from-gray-600 to-gray-500')
  })
})

describe('getMusicPlatform — known keys', () => {
  it('returns the full Spotify platform object', () => {
    expect(getMusicPlatform('spotify')).toEqual({
      name: 'spotify',
      icon: 'pi pi-play-circle',
      colors: {
        bg: 'from-green-600 to-green-500',
        hover: 'from-green-700 to-green-600',
        text: 'text-white',
        border: 'border-green-500/30'
      },
      displayName: 'Spotify'
    })
  })

  it('returns the full Apple Music platform object', () => {
    expect(getMusicPlatform('appleMusic')).toEqual({
      name: 'appleMusic',
      icon: 'pi pi-apple',
      colors: {
        bg: 'from-red-600 to-pink-600',
        hover: 'from-red-700 to-pink-700',
        text: 'text-white',
        border: 'border-red-500/30'
      },
      displayName: 'Apple Music'
    })
  })

  it.each([
    ['spotify', 'Spotify', 'pi pi-play-circle'],
    ['appleMusic', 'Apple Music', 'pi pi-apple'],
    ['youtubeMusic', 'YouTube Music', 'pi pi-play-circle'],
    ['deezer', 'Deezer', 'pi pi-headphones'],
    ['soundcloud', 'SoundCloud', 'pi pi-cloud'],
    ['bandcamp', 'Bandcamp', 'pi pi-bookmark'],
    ['tidal', 'Tidal', 'pi pi-wave-pulse'],
    ['amazonMusic', 'Amazon Music', 'pi pi-amazon'],
    ['musicVideo', 'Music Video', 'pi pi-youtube']
  ])('maps "%s" → displayName "%s" with icon "%s"', (key, displayName, icon) => {
    const platform = getMusicPlatform(key)
    expect(platform.displayName).toBe(displayName)
    expect(platform.icon).toBe(icon)
    expect(platform.name).toBe(key)
  })

  it('returns an object with the complete MusicPlatform shape for every known key', () => {
    for (const key of Object.keys(musicPlatforms)) {
      const platform = getMusicPlatform(key)
      expect(platform).toMatchObject({
        name: expect.any(String),
        icon: expect.any(String),
        displayName: expect.any(String),
        colors: {
          bg: expect.any(String),
          hover: expect.any(String),
          text: expect.any(String),
          border: expect.any(String)
        }
      })
    }
  })

  it('returns the same registry reference for a known key (no defensive copy)', () => {
    expect(getMusicPlatform('spotify')).toBe(musicPlatforms.spotify)
  })

  it('every registry entry self-identifies via its `name` field', () => {
    for (const [key, platform] of Object.entries(musicPlatforms)) {
      expect(platform.name).toBe(key)
    }
  })
})

describe('getMusicPlatform — fallback / unknown keys', () => {
  it('returns the default platform for an unknown key', () => {
    expect(getMusicPlatform('myspace')).toEqual(expectedDefault)
  })

  it('returns the default platform for an empty string key', () => {
    expect(getMusicPlatform('')).toEqual(expectedDefault)
  })

  it('returns the default platform for a whitespace-only key', () => {
    expect(getMusicPlatform('  ')).toEqual(expectedDefault)
  })

  it.each([
    ['Spotify'],
    ['SPOTIFY'],
    ['applemusic'],
    ['AppleMusic'],
    ['youtubemusic'],
    ['YOUTUBEMUSIC']
  ])('is case-sensitive: "%s" does not match and falls back to default', (key) => {
    // Lookup keys are camelCase/lowercase; any case variation misses the registry.
    expect(getMusicPlatform(key)).toEqual(expectedDefault)
  })

  it('does not resolve keys that only differ by surrounding whitespace', () => {
    expect(getMusicPlatform(' spotify')).toEqual(expectedDefault)
    expect(getMusicPlatform('spotify ')).toEqual(expectedDefault)
  })

  it('returns a fresh default object on the fallback path (not a shared one)', () => {
    const a = getMusicPlatform('unknown-a')
    const b = getMusicPlatform('unknown-b')
    expect(a).toEqual(expectedDefault)
    expect(b).toEqual(expectedDefault)
    expect(a).not.toBe(b)
  })

  // Prototype-named keys must NOT leak inherited Object.prototype members. The
  // Object.hasOwn() guard makes them fall through to the "Listen" default.
  it('returns the default for prototype-named keys (own-property guarded)', () => {
    expect(getMusicPlatform('constructor')).toEqual(getDefaultPlatform())
    expect(getMusicPlatform('hasOwnProperty')).toEqual(getDefaultPlatform())
    expect(getMusicPlatform('toString')).toEqual(getDefaultPlatform())
    expect(getMusicPlatform('valueOf')).toEqual(getDefaultPlatform())
  })

  it('returns the default for "__proto__" rather than the prototype object', () => {
    const result = getMusicPlatform('__proto__')
    expect(result).toEqual(getDefaultPlatform())
    expect(result).not.toBe(Object.prototype)
  })
})
