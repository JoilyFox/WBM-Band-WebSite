import { describe, it, expect, afterEach, vi } from 'vitest'
import { isLikelyBot } from '~/utils/isLikelyBot'

// isLikelyBot() reads the ambient `navigator` global. We control it per-test via
// vi.stubGlobal and tear everything down in afterEach. Note the precedence in the
// source: navigator-undefined → webdriver → empty-UA → regex. We exercise each gate.

const HUMAN_DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const HUMAN_MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

describe('isLikelyBot', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('environment guard', () => {
    it('returns false when navigator is undefined (SSR / Node)', () => {
      vi.stubGlobal('navigator', undefined)
      expect(isLikelyBot()).toBe(false)
    })
  })

  describe('webdriver flag', () => {
    it('returns true when navigator.webdriver === true (even with a human UA)', () => {
      vi.stubGlobal('navigator', { webdriver: true, userAgent: HUMAN_DESKTOP_UA })
      expect(isLikelyBot()).toBe(true)
    })

    it('does not trip on a truthy-but-non-true webdriver value (strict ===)', () => {
      // webdriver: 'true' (string) is truthy but not === true, so it must NOT short-circuit;
      // with a clean human UA the result falls through to false.
      vi.stubGlobal('navigator', { webdriver: 'true', userAgent: HUMAN_DESKTOP_UA })
      expect(isLikelyBot()).toBe(false)
    })

    it('ignores webdriver === false and defers to UA', () => {
      vi.stubGlobal('navigator', { webdriver: false, userAgent: HUMAN_DESKTOP_UA })
      expect(isLikelyBot()).toBe(false)
    })
  })

  describe('empty / missing user agent', () => {
    it('returns true for an empty UA string', () => {
      vi.stubGlobal('navigator', { userAgent: '' })
      expect(isLikelyBot()).toBe(true)
    })

    it('returns true when userAgent is missing (nullish → "" → falsy)', () => {
      vi.stubGlobal('navigator', {})
      expect(isLikelyBot()).toBe(true)
    })

    it('returns true when userAgent is explicitly undefined', () => {
      vi.stubGlobal('navigator', { userAgent: undefined })
      expect(isLikelyBot()).toBe(true)
    })

    it('returns true when userAgent is null', () => {
      vi.stubGlobal('navigator', { userAgent: null })
      expect(isLikelyBot()).toBe(true)
    })
  })

  describe('known bot user agents (matched by BOT_UA_PATTERN)', () => {
    const botUas: Array<[string, string]> = [
      ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
      ['bingbot', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'],
      [
        'HeadlessChrome',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'HeadlessChrome/124.0.0.0 Safari/537.36'
      ],
      ['GPTBot', 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'],
      ['ClaudeBot', 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'],
      ['PerplexityBot', 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)'],
      [
        'Bytespider',
        'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)'
      ],
      ['AdsBot', 'Mozilla/5.0 (compatible; AdsBot-Google; +http://www.google.com/adsbot.html)'],
      ['GoogleOther', 'Mozilla/5.0 (compatible; GoogleOther)'],
      [
        'Yahoo Slurp',
        'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)'
      ],
      ['Mediapartners', 'Mediapartners-Google'],
      ['bingpreview', 'Mozilla/5.0 (Windows NT 6.3; WOW64) BingPreview/1.0b'],
      ['Lighthouse', 'Mozilla/5.0 Chrome-Lighthouse'],
      ['PhantomJS', 'Mozilla/5.0 (Unknown; Linux x86_64) PhantomJS/2.1.1 Safari/538.1'],
      ['generic spider', 'SomeRandomSpider/3.0 (+http://example.com)'],
      ['generic crawler', 'webcrawler/1.0']
    ]

    it.each(botUas)('flags %s as a bot', (_label, ua) => {
      vi.stubGlobal('navigator', { userAgent: ua })
      expect(isLikelyBot()).toBe(true)
    })

    it('is case-insensitive (lowercased "googlebot" still matches)', () => {
      vi.stubGlobal('navigator', { userAgent: 'mozilla/5.0 (compatible; googlebot/2.1)' })
      expect(isLikelyBot()).toBe(true)
    })
  })

  describe('human user agents', () => {
    it('returns false for a normal desktop Chrome UA', () => {
      vi.stubGlobal('navigator', { userAgent: HUMAN_DESKTOP_UA })
      expect(isLikelyBot()).toBe(false)
    })

    it('returns false for a normal mobile Safari UA', () => {
      vi.stubGlobal('navigator', { userAgent: HUMAN_MOBILE_UA })
      expect(isLikelyBot()).toBe(false)
    })

    it('returns false for a Firefox desktop UA', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
      })
      expect(isLikelyBot()).toBe(false)
    })

    it('returns false when webdriver is absent and the UA is human', () => {
      vi.stubGlobal('navigator', { userAgent: HUMAN_MOBILE_UA, webdriver: undefined })
      expect(isLikelyBot()).toBe(false)
    })
  })
})
