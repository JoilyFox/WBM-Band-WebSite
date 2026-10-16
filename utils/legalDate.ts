/**
 * Format an ISO date (e.g. '2025-07-31') for a legal page "last updated" line,
 * in the visitor's site language instead of always English.
 *
 * Parsed and printed in UTC so the day never shifts with the viewer's timezone
 * (and SSR/hydration agree).
 */
export function formatLegalDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}
