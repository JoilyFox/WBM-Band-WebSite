/**
 * Lazy start of the Google tag (gtag.js).
 *
 * nuxt.config sets `gtag.initMode = 'manual'`: the module still creates
 * `window.dataLayer` and queues the Consent Mode v2 default-deny + `config`
 * commands at boot (so consent ordering is unchanged), but it no longer injects
 * the 176 KB gtag.js <script>. That script is added here, once, by whichever
 * comes first:
 *   - the browser going idle after `load` (plugins/analytics.client.ts),
 *   - the visitor's first interaction (same plugin),
 *   - an awaited analytics event (useAnalytics.sendEvent) — the pre-save
 *     redirect must not wait for an idle window before its hit can dispatch.
 *
 * Everything pushed to the dataLayer in the meantime (consent updates, `set`,
 * events) is queued and replayed in order when gtag.js executes.
 */
let started = false

export function ensureGtagLoaded(initialize?: () => void): void {
  if (started || typeof window === 'undefined') return
  started = true
  initialize?.()
}

export function isGtagStarted(): boolean {
  return started
}
