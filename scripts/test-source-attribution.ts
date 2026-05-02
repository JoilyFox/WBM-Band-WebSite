/**
 * Manual test harness for utils/sourceAttribution.ts.
 *
 * Run with: npm run test:attribution
 * (Uses Node 22's --experimental-strip-types to execute TypeScript directly.)
 */

import {
  detectFromPath,
  detectFromReferrer,
  detectFromUserAgent,
  detectSourcePlatform,
  assertNoSlugCollisions
} from '../utils/sourceAttribution.ts'

let pass = 0
let fail = 0

function expect<T>(label: string, actual: T, expected: T): void {
  if (actual === expected) {
    pass++
    console.log(`  ok  ${label}`)
  } else {
    fail++
    console.error(
      `  FAIL  ${label}\n        expected: ${String(expected)}\n        actual:   ${String(actual)}`
    )
  }
}

console.log('\n--- detectFromPath ---')
expect('/listen/i/mania → instagram', detectFromPath('/listen/i/mania'), 'instagram')
expect('/ua/listen/tt/mania → tiktok', detectFromPath('/ua/listen/tt/mania'), 'tiktok')
expect('/en/pre-save/yt/mania → youtube', detectFromPath('/en/pre-save/yt/mania'), 'youtube')
expect('/listen/qr/mania → qr', detectFromPath('/listen/qr/mania'), 'qr')
expect('/listen/em/mania → email', detectFromPath('/listen/em/mania'), 'email')
expect('/listen/mania (no prefix) → null', detectFromPath('/listen/mania'), null)
expect('/ua/listen/mania (no prefix) → null', detectFromPath('/ua/listen/mania'), null)
expect('/listen/badprefix/mania → null', detectFromPath('/listen/badprefix/mania'), null)
expect('/unrelated → null', detectFromPath('/unrelated'), null)
expect('/ → null', detectFromPath('/'), null)

console.log('\n--- detectFromReferrer ---')
expect('instagram.com → instagram', detectFromReferrer('https://www.instagram.com/'), 'instagram')
expect('tiktok.com → tiktok', detectFromReferrer('https://www.tiktok.com/@user'), 'tiktok')
expect('t.co → twitter', detectFromReferrer('https://t.co/abc'), 'twitter')
expect('x.com → twitter', detectFromReferrer('https://x.com/'), 'twitter')
expect('m.facebook.com → facebook', detectFromReferrer('https://m.facebook.com/'), 'facebook')
expect('youtu.be → youtube', detectFromReferrer('https://youtu.be/abc'), 'youtube')
expect('threads.net → threads', detectFromReferrer('https://www.threads.net/'), 'threads')
expect('t.me → telegram', detectFromReferrer('https://t.me/wbm'), 'telegram')
expect('google.com → search', detectFromReferrer('https://www.google.com/search?q=wbm'), 'search')
expect('yandex.ru → search', detectFromReferrer('https://yandex.ru/search/?text=wbm'), 'search')
expect('empty → null', detectFromReferrer(''), null)
expect('unknown host → null', detectFromReferrer('https://example.com/'), null)
expect('malformed URL → null', detectFromReferrer('not-a-url'), null)

console.log('\n--- detectFromUserAgent ---')
const igUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21A329 Instagram 308.0.0.31.110 (iPhone15,2; iOS 17_0; en_US; en-US; scale=3.00; 1179x2556; 528466069)'
expect('Instagram in-app → instagram', detectFromUserAgent(igUa), 'instagram')

const tiktokUa =
  'Mozilla/5.0 (Linux; U; Android 11; en-us) AppleWebKit/537.36 (KHTML, like Gecko) TikTok 23.5.0 musical_ly_2018'
expect('TikTok in-app → tiktok', detectFromUserAgent(tiktokUa), 'tiktok')

const fbUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/410.0.0.46.117;FBBV/525463459]'
expect('Facebook FBAN → facebook', detectFromUserAgent(fbUa), 'facebook')

const desktopUa =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
expect('desktop Safari → null', detectFromUserAgent(desktopUa), null)

console.log('\n--- detectSourcePlatform (composite) ---')
expect(
  'path wins over referrer',
  detectSourcePlatform({
    path: '/listen/yt/mania',
    referrer: 'https://www.instagram.com/',
    userAgent: igUa
  }),
  'youtube'
)
expect(
  'referrer wins over UA',
  detectSourcePlatform({
    path: '/listen/mania',
    referrer: 'https://www.tiktok.com/',
    userAgent: igUa
  }),
  'tiktok'
)
expect(
  'UA when no path or referrer',
  detectSourcePlatform({ path: '/listen/mania', referrer: '', userAgent: igUa }),
  'instagram'
)
expect(
  'empty everything → direct',
  detectSourcePlatform({ path: '/listen/mania', referrer: '', userAgent: desktopUa }),
  'direct'
)
expect(
  'unknown referrer + desktop UA → other',
  detectSourcePlatform({
    path: '/listen/mania',
    referrer: 'https://example.com/',
    userAgent: desktopUa
  }),
  'other'
)

console.log('\n--- assertNoSlugCollisions ---')
let threw = false
try {
  assertNoSlugCollisions(['mania', 'i', 'chorni-ptahy'])
} catch {
  threw = true
}
expect('throws on collision', threw, true)

let didNotThrow = true
try {
  assertNoSlugCollisions(['mania', 'chorni-ptahy'])
} catch {
  didNotThrow = false
}
expect('passes when no collision', didNotThrow, true)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
