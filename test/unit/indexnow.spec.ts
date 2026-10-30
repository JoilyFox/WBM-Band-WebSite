import { describe, it, expect } from 'vitest'
// @ts-expect-error plain ESM build script without types
import { parseSitemap, changedUrls } from '../../scripts/indexnow.mjs'

const sitemap = (entries: [string, string?][]) =>
  `<urlset>${entries
    .map(
      ([loc, lastmod]) =>
        `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
    )
    .join('')}</urlset>`

describe('IndexNow change detection', () => {
  it('parses loc and lastmod', () => {
    const map = parseSitemap(sitemap([['https://x/a', '2026-10-30'], ['https://x/b']]))
    expect([...map]).toEqual([
      ['https://x/a', '2026-10-30'],
      ['https://x/b', '']
    ])
  })

  it('sends only new URLs and URLs whose lastmod moved', () => {
    const before = parseSitemap(
      sitemap([
        ['https://x/a', '2026-10-16'],
        ['https://x/b', '2026-10-16']
      ])
    )
    const after = parseSitemap(
      sitemap([
        ['https://x/a', '2026-10-16'],
        ['https://x/b', '2026-10-30'],
        ['https://x/c', '2026-10-30']
      ])
    )
    expect(changedUrls(before, after)).toEqual(['https://x/b', 'https://x/c'])
  })
})
