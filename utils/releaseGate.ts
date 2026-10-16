/**
 * Shared helpers for the "this release isn't available yet" gates
 * (middleware/listen-access.ts, middleware/presave-access.ts) and the contextual
 * error page that renders them (components/common/ErrorPage.vue).
 *
 * The middleware no longer ships English prose in the URL. It passes a machine
 * readable `reason` code (+ the ISO release date) and ErrorPage looks the copy up
 * in the active locale (`errors.<reason>.title|message`).
 */

/** Reason codes understood by ErrorPage. Each has `errors.<code>.title|message`. */
export const RELEASE_GATE_REASONS = {
  release_locked: true,
  presave_disabled: true,
  presave_not_ready: true
} as const

export type ReleaseGateReason = keyof typeof RELEASE_GATE_REASONS

/** Same-origin absolute path only: `/x` yes; `//host`, `/\host`, `https:` no. */
export const isSafeInternalPath = (value: unknown): value is string =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value)

/**
 * Route location for the localized contextual error page. `localePath` is the
 * result of `useLocalePath()` so English visitors land on `/en/404` and the
 * default "home" button points at the localized home.
 */
export const releaseGateLocation = (
  localePath: (path: string) => string,
  reason: ReleaseGateReason,
  date?: string
) => ({
  path: localePath('/404'),
  query: { reason, ...(date ? { date } : {}) }
})
