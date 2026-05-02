/**
 * Lightweight bot heuristic. Used to suppress conversion events from
 * synthetic traffic (Lighthouse, headless Chrome, Selenium, crawlers).
 * Belt-and-braces alongside GA4's built-in bot filter.
 */

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|bingpreview|headless|phantom|lighthouse|HeadlessChrome|GoogleOther|AdsBot|GPTBot|ClaudeBot|PerplexityBot|Bytespider/i

export function isLikelyBot(): boolean {
  if (typeof navigator === 'undefined') return false
  if (navigator.webdriver === true) return true
  const ua = navigator.userAgent ?? ''
  if (!ua) return true
  return BOT_UA_PATTERN.test(ua)
}
