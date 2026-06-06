---
name: analytics-tracking
description: 'Use when adding/changing GA4 events (release_view, platform_click), conversion tracking, custom dimensions, source attribution, or consent — touching useAnalytics, sourceAttribution, isLikelyBot, SOURCE_PREFIXES, /listen|/pre-save prefixed routes, plugins/analytics.client.ts, or cookie-consent gtag — OR when a GA4 report looks wrong/empty.'
---

## When to use

Adding/changing GA4 events, conversion tracking, custom dimensions, or source attribution on master pages
(`/listen/*`, `/pre-save/*`). Touching `useAnalytics`, `sourceAttribution`, `isLikelyBot`, prefixed routes, the
analytics plugin, or Consent Mode. **Also** when any GA4 number looks wrong — e.g. "visitors show but per-source
attribution is empty."

## The mental model — read this first (it prevents the most common bug)

A GA4 **custom dimension reads exactly ONE carrier, bound to its scope** — they never cross-read:

- **Event-scoped** dimension ⇐ event parameter `ep.*` ⇐ `gtag('event', n, {p})` or `gtag('set', {p})`
- **User-scoped** dimension ⇐ user property `up.*` ⇐ `gtag('set', 'user_properties', {p})`

So: a value sent on the **wrong carrier** is silently `(not set)`. And the **auto `page_view` carries no custom event
params**, so an event-scoped dimension is `(not set)` on every standard report (Traffic acquisition, Pages, Visitors
overview) — attribution only exists on `release_view`/`platform_click` and must be read in a custom **Exploration**.
Our four dims (`source_platform`, `release_slug`, `page_type`, `platform_name`) are **Event-scoped**. To put a value on
every event use `gtag('set', {param})`, not just `user_properties`.

> **"Aggregate works, per-source empty" = scope/carrier mismatch (above) AND/OR consent default-deny (below).** Always
> disambiguate before code-hunting. Full playbook + validation runbook: **`docs/analytics-debugging.md`**.

## Steps

1. Read `docs/analytics-debugging.md` (operating/debugging) and `docs/analytics-implementation-tasks.md` (build plan).
2. Fire events ONLY via `useAnalytics()` — never `gtag()` directly from pages/components. It exposes
   `getSourcePlatform()`, `trackReleaseView()`, `trackPlatformClick()` (all SSR-safe no-ops).
3. New conversion-style event: gate with `isLikelyBot()` like `trackPlatformClick`. If it's a **click-then-same-tab-
   navigate** (distributor pre-save), real beacon transport matters — `transport_type` as an event _param_ does NOT
   switch transport; verify delivery in DebugView (step 8 of the runbook).
4. Always attach `source_platform: getSourcePlatform()`. First-touch source lives in `sessionStorage`
   (`wbm_source_platform`). Dedup keys for views MUST include source (`pageType:slug:source`).
5. Adding a source channel: add the prefix to `SOURCE_PREFIXES` (and referrer/UA maps) in `utils/sourceAttribution.ts`
   — the route generator and detector share that one constant. Prefix-aware pages call `setExplicitSourcePlatform()`
   in `useMasterPage()` setup.
6. New release slug must NOT collide with a prefix key (`i`, `tt`, `qr`, `em`, …); `assertNoSlugCollisions()` guards.
7. New event param → register it as an Event-scoped custom dimension in GA4 Admin **with the matching carrier**
   (event param ⇒ Event scope). Then **validate in GA** (runbook below) — don't assume it works.
8. After code changes: `npx vitest run test/nuxt/use-analytics.nuxt.spec.ts test/unit/source-attribution*.spec.ts`,
   lint, then `npm run generate` (emits `.output/bio-links.md`).

## Validate in GA before claiming it works (the never-skip step)

DevTools → Network → filter `collect`. On a `/g/collect` hit read: `en` (event), `ep.*` (event params), `up.*` (user
properties), **`gcs`** (`G100` = analytics **denied**/cookieless · `G1x1` = granted). Then Admin → DebugView (granted
traffic only) + Realtime. Confirm `source_platform` is an `ep.*` on `release_view` and `Scope = Event` in Admin →
Custom definitions. Build the attribution Exploration (filter `^(release_view|platform_click)$`). Custom dimensions are
**forward-only (no backfill)** + 24–48 h latency. Full runbook + Admin-API/MCP access recipe: `docs/analytics-debugging.md`.

## Key files

- `composables/useAnalytics.ts` — sole GA4 surface: `{ getSourcePlatform, trackReleaseView, trackPlatformClick }`.
  View dedup key = `pageType:slug:source` (sessionStorage `wbm_release_views_seen`).
- `utils/sourceAttribution.ts` — `SOURCE_PREFIXES`, `SourcePlatform`, `detect*`, `getOrPersistSourcePlatform`,
  `setExplicitSourcePlatform`, `resetSourcePlatform`, `assertNoSlugCollisions`.
- `utils/isLikelyBot.ts` — suppresses conversion events from synthetic/crawler traffic.
- `composables/useMasterPage.ts` — locks source in setup; shared master-page SEO/render.
- `plugins/analytics.client.ts` — `app:mounted`: sets `source_platform` as **both** a default event param
  (`gtag('set', {…})`) AND a user property, so it feeds the dimension regardless of registered scope.
- `components/music/PlatformButton.vue` — calls `trackPlatformClick()` (needs `releaseSlug` + `pageType`).
- `composables/useCookieConsent.ts` — Consent Mode v2 grant/deny + `.reset()` / `.hydrate()`.
- `nuxt.config.ts → gtag` — Measurement ID `G-Z8QRF6TWC2` + default-deny Consent Mode v2.

## Gotchas

- A user property and an event parameter of the **same name are different carriers**; registering one scope does not
  create the other — the mismatched one silently returns `(not set)`.
- The auto `page_view` carries **no** custom event params ⇒ event-scoped dims are `(not set)` on standard
  Acquisition/Pages reports. Analyze attribution in an Exploration on `release_view`/`platform_click`.
- Under `analytics_storage:'denied'` (default until Accept) an empty per-source report is the **expected** structural
  outcome, not a bug — confirm via `gcs=G100`. Small sites never hit modeling thresholds, so no modeled backfill, and
  modeled data never shows in Explorations.
- `transport_type` passed as an event _parameter_ does NOT enable `sendBeacon`; it lands as `ep.transport_type` noise.
  Click-then-external-navigate conversions (distributor pre-save) can be lost on unload — verify in DebugView.
- `trackReleaseView` dedups per session via `sessionStorage`, key `pageType:slug:source` — re-mounts won't
  double-count, but a different source DOES re-fire (multi-bio-link same release).
- Path-prefix ALWAYS overrides stored source (a fresh bio-link click resets mid-session); referrer/UA only set
  first-touch. A non-empty unmatched referrer yields `'other'`; empty everything yields `'direct'` — not bugs.
- `platform_click` is bot-filtered; `release_view` is intentionally NOT.
- Custom dimensions are forward-only + 24–48 h latency; never judge a fresh dimension same-day; scope reports to dates
  on/after registration.
- **No GA4 MCP supports Admin writes** — creating dimensions / marking key events needs a separate
  `@google-analytics/admin` Node script with an Editor-role service account (`docs/analytics-debugging.md` §5).

## Related

- Deep dive: `docs/analytics-debugging.md` (mental model, consent reality, validation runbook, Admin-API/MCP access,
  root-cause table) · `docs/analytics-implementation-tasks.md` (build plan + GA4 admin steps).
- Review agent: `analytics-reviewer`. Sibling agents: `i18n-checker`, `release-coordinator`.
- `npm run generate` prerenders prefix×release×locale routes, runs the slug-collision guard, emits
  `.output/bio-links.md` via `scripts/generate-bio-links.js`.
