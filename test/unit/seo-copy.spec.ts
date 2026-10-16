import { describe, it, expect } from 'vitest'
import uk from '../../locales/uk.json'
import en from '../../locales/en.json'
import { fitDescription, META_DESCRIPTION_MAX } from '../../utils/seoCopy'

// SEO-05 / SEO-06: meta-description composition + the home description copy.

const render = (d: string) => [`${d} Full suffix goes here for sure.`, `${d} Short.`]

describe('fitDescription', () => {
  it('uses the richest variant that fits', () => {
    expect(fitDescription('Short blurb.', render, 155)).toBe(
      'Short blurb. Full suffix goes here for sure.'
    )
  })

  it('falls back to the compact variant when the rich one is too long', () => {
    const blurb = 'a'.repeat(120)
    const out = fitDescription(blurb, render, 130)
    expect(out).toBe(`${blurb} Short.`)
  })

  it('shortens the blurb (word boundary + ellipsis) but always keeps the suffix', () => {
    const blurb = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron'
    const out = fitDescription(blurb, render, 60)
    expect(out.length).toBeLessThanOrEqual(60)
    expect(out.endsWith('… Short.')).toBe(true)
    // cut on a word boundary: the text before the ellipsis is a whole-word prefix
    const head = out.slice(0, out.indexOf('…'))
    expect(blurb.startsWith(head)).toBe(true)
    expect(blurb[head.length]).toBe(' ')
  })

  it('defaults to the 155-character ceiling', () => {
    expect(META_DESCRIPTION_MAX).toBe(155)
    const out = fitDescription('x '.repeat(200), render)
    expect(out.length).toBeLessThanOrEqual(155)
  })
})

describe('home description (app.meta_description)', () => {
  for (const [name, dict] of [
    ['uk', uk],
    ['en', en]
  ] as const) {
    it(`${name}: is release-neutral and 120-155 chars`, () => {
      const d = dict.app.meta_description
      expect(d).not.toContain('{release}')
      expect(d.length).toBeGreaterThanOrEqual(120)
      expect(d.length).toBeLessThanOrEqual(155)
      expect(d).toContain('WBM')
    })
  }
})
