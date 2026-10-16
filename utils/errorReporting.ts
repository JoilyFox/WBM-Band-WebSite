/**
 * Client error reporting helpers (O-01): turn an arbitrary thrown value into a
 * short, PII-free description and throttle how many reach GA4.
 *
 * Only the error's class name and a scrubbed, truncated message are ever sent —
 * never a stack, a URL, an e-mail, or long free text. The page the error happened
 * on is already carried by GA4's own `page_location`.
 */

/** Hard cap on what leaves the browser per exception (GA4 param values max 100). */
export const MAX_DESCRIPTION_LENGTH = 100

/** At most this many exception events per page load, however noisy the page is. */
export const MAX_EXCEPTIONS_PER_PAGE = 5

/** Scrub a free-text message of anything that could identify a visitor. */
export function scrubMessage(message: string): string {
  return message
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\s+/g, ' ')
    .trim()
}

/** `Name: scrubbed message`, capped. Never throws, whatever it is given. */
export function describeError(error: unknown, source: string): string {
  let name = 'Error'
  let message = ''
  try {
    if (error instanceof Error) {
      name = error.name || 'Error'
      message = error.message || ''
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object') {
      const e = error as { name?: unknown; message?: unknown }
      if (typeof e.name === 'string') name = e.name
      if (typeof e.message === 'string') message = e.message
    }
  } catch {
    // exotic proxies / throwing getters - fall through with the defaults
  }
  const text = `${source}:${name}${message ? `: ${scrubMessage(message)}` : ''}`
  return text.slice(0, MAX_DESCRIPTION_LENGTH)
}

/**
 * A reporter that forwards a description to `send` at most once per distinct
 * description and at most MAX_EXCEPTIONS_PER_PAGE times in total.
 */
export function createErrorReporter(send: (description: string) => void) {
  const seen = new Set<string>()
  return (error: unknown, source: string): boolean => {
    if (seen.size >= MAX_EXCEPTIONS_PER_PAGE) return false
    const description = describeError(error, source)
    if (seen.has(description)) return false
    seen.add(description)
    try {
      send(description)
    } catch {
      // reporting must never become the next error
    }
    return true
  }
}
