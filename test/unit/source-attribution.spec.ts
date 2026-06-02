import { describe, it, expect } from 'vitest'
import {
  detectFromPath,
  detectFromReferrer,
  detectFromUserAgent,
  detectSourcePlatform,
  assertNoSlugCollisions
} from '../../utils/sourceAttribution'

// 1:1 port of the bespoke scripts/test-source-attribution.ts harness.
// Real UA strings — keep these realistic; the detectors key off these exact tags.
const igUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21A329 Instagram 308.0.0.31.110 (iPhone15,2; iOS 17_0; en_US; en-US; scale=3.00; 1179x2556; 528466069)'
const tiktokUa =
  'Mozilla/5.0 (Linux; U; Android 11; en-us) AppleWebKit/537.36 (KHTML, like Gecko) TikTok 23.5.0 musical_ly_2018'
const fbUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/410.0.0.46.117;FBBV/525463459]'
const desktopUa =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

describe('detectFromPath', () => {
  it('maps known source prefixes to platforms (with/without locale segment)', () => {
    expect(detectFromPath('/listen/i/mania')).toBe('instagram')
    expect(detectFromPath('/ua/listen/tt/mania')).toBe('tiktok')
    expect(detectFromPath('/en/pre-save/yt/mania')).toBe('youtube')
    expect(detectFromPath('/listen/qr/mania')).toBe('qr')
    expect(detectFromPath('/listen/em/mania')).toBe('email')
  })

  it('returns null when there is no source prefix', () => {
    expect(detectFromPath('/listen/mania')).toBeNull()
    expect(detectFromPath('/ua/listen/mania')).toBeNull()
  })

  it('returns null for unknown prefixes and unrelated paths', () => {
    expect(detectFromPath('/listen/badprefix/mania')).toBeNull()
    expect(detectFromPath('/unrelated')).toBeNull()
    expect(detectFromPath('/')).toBeNull()
  })
})

describe('detectFromReferrer', () => {
  it('maps social referrers to platforms', () => {
    expect(detectFromReferrer('https://www.instagram.com/')).toBe('instagram')
    expect(detectFromReferrer('https://www.tiktok.com/@user')).toBe('tiktok')
    expect(detectFromReferrer('https://t.co/abc')).toBe('twitter')
    expect(detectFromReferrer('https://x.com/')).toBe('twitter')
    expect(detectFromReferrer('https://m.facebook.com/')).toBe('facebook')
    expect(detectFromReferrer('https://youtu.be/abc')).toBe('youtube')
    expect(detectFromReferrer('https://www.threads.net/')).toBe('threads')
    expect(detectFromReferrer('https://t.me/wbm')).toBe('telegram')
  })

  it('maps search engines to the search bucket', () => {
    expect(detectFromReferrer('https://www.google.com/search?q=wbm')).toBe('search')
    expect(detectFromReferrer('https://yandex.ru/search/?text=wbm')).toBe('search')
  })

  it('returns null for empty, unknown, or malformed referrers', () => {
    expect(detectFromReferrer('')).toBeNull()
    expect(detectFromReferrer('https://example.com/')).toBeNull()
    expect(detectFromReferrer('not-a-url')).toBeNull()
  })
})

describe('detectFromUserAgent', () => {
  it('recognises in-app browser fingerprints', () => {
    expect(detectFromUserAgent(igUa)).toBe('instagram')
    expect(detectFromUserAgent(tiktokUa)).toBe('tiktok')
    expect(detectFromUserAgent(fbUa)).toBe('facebook')
  })

  it('returns null for a plain desktop browser', () => {
    expect(detectFromUserAgent(desktopUa)).toBeNull()
  })
})

describe('detectSourcePlatform (composite precedence path > referrer > UA)', () => {
  it('path wins over referrer and UA', () => {
    expect(
      detectSourcePlatform({
        path: '/listen/yt/mania',
        referrer: 'https://www.instagram.com/',
        userAgent: igUa
      })
    ).toBe('youtube')
  })

  it('referrer wins over UA when there is no path prefix', () => {
    expect(
      detectSourcePlatform({
        path: '/listen/mania',
        referrer: 'https://www.tiktok.com/',
        userAgent: igUa
      })
    ).toBe('tiktok')
  })

  it('falls back to UA when there is no path or referrer signal', () => {
    expect(detectSourcePlatform({ path: '/listen/mania', referrer: '', userAgent: igUa })).toBe(
      'instagram'
    )
  })

  it('empty everything resolves to direct', () => {
    expect(
      detectSourcePlatform({ path: '/listen/mania', referrer: '', userAgent: desktopUa })
    ).toBe('direct')
  })

  it('an unknown referrer with a desktop UA resolves to other', () => {
    expect(
      detectSourcePlatform({
        path: '/listen/mania',
        referrer: 'https://example.com/',
        userAgent: desktopUa
      })
    ).toBe('other')
  })
})

describe('assertNoSlugCollisions', () => {
  it('throws when a slug shadows a reserved source prefix', () => {
    expect(() => assertNoSlugCollisions(['mania', 'i', 'chorni-ptahy'])).toThrow()
  })

  it('passes when no slug collides', () => {
    expect(() => assertNoSlugCollisions(['mania', 'chorni-ptahy'])).not.toThrow()
  })
})
