---
name: analytics-tracking
description: 'Use when adding GA4 events (release_view, platform_click), conversion tracking, or path-prefix source attribution — touching useAnalytics, sourceAttribution, isLikelyBot, SOURCE_PREFIXES, /listen|/pre-save prefixed routes, or cookie-consent gtag.'
---

## When to use

Adding/changing GA4 events, conversion tracking, or source attribution on master pages (`/listen/*`, `/pre-save/*`). Touching `useAnalytics`, `sourceAttribution`, `isLikelyBot`, prefixed routes, or Consent Mode.

## Steps

1. Read `docs/analytics-implementation-tasks.md` first — it's the canonical plan + status; pick up at the next unchecked task.
2. Fire events ONLY via `useAnalytics()` — never call `gtag()` directly from pages/components. It exposes `getSourcePlatform()`, `trackReleaseView()`, `trackPlatformClick()` (all SSR-safe no-ops).
3. New conversion-style event: gate it with `isLikelyBot()` like `trackPlatformClick` does, and set `transport_type: 'beacon'` if external navigation follows immediately.
4. Always attach `source_platform: getSourcePlatform()` so events are attributable. First-touch source lives in `sessionStorage` (`wbm_source_platform`).
5. Adding a source channel: add the prefix to `SOURCE_PREFIXES` (and referrer/UA maps) in `utils/sourceAttribution.ts` — the route generator and detector share that one constant. Prefix-aware pages call `setExplicitSourcePlatform()` in `useMasterPage()` setup.
6. New release slug must NOT collide with a prefix key (`i`, `tt`, `qr`, `em`, …); `assertNoSlugCollisions()` is the build-time guard.
7. Register any new event param as an Event-scoped custom dimension in GA4 Admin (out of code), and run `npm run generate` (emits `.output/bio-links.md`).

## Source of truth

- `docs/analytics-implementation-tasks.md` — full GA4 plan, prefix scheme, GA4 admin steps, Consent Mode, dashboards; read on demand.

## Key files

- `composables/useAnalytics.ts` — `useAnalytics()`; sole GA4 surface, returns `{ getSourcePlatform, trackReleaseView, trackPlatformClick }`.
- `utils/sourceAttribution.ts` — `SOURCE_PREFIXES`, `SourcePlatform`, `detectFromPath/Referrer/UserAgent`, `detectSourcePlatform`, `getOrPersistSourcePlatform`, `setExplicitSourcePlatform`, `resetSourcePlatform`, `assertNoSlugCollisions`.
- `utils/isLikelyBot.ts` — `isLikelyBot()`; suppresses conversion events from synthetic/crawler traffic.
- `composables/useMasterPage.ts` — `useMasterPage({ sourcePrefix })`; locks source in setup, shared master-page SEO/render.
- `plugins/analytics.client.ts` — `app:mounted` hook persists source, sets `user_properties.source_platform`.
- `components/music/PlatformButton.vue` — calls `trackPlatformClick()`; needs `releaseSlug` + `pageType` props.
- `composables/useCookieConsent.ts` — `useCookieConsent()`; Consent Mode v2 grant/deny + `.reset()`.

## Gotchas

- `gtag` only via the composable — direct calls bypass bot-filter, source attribution, and dedup.
- `trackReleaseView` dedups per session via `sessionStorage` (`wbm_release_views_seen`, key `pageType:slug`) — re-mounts won't double-count.
- Path-prefix ALWAYS overrides stored source (a fresh bio-link click resets mid-session); referrer/UA only set first-touch.
- A non-empty unmatched referrer yields `'other'`, empty everything yields `'direct'` — don't treat `'other'` as a bug.
- `platform_click` is bot-filtered; `release_view` is intentionally NOT (page-view noise tolerated, inflated conversions are not).
- nuxt-gtag boots with default-deny Consent Mode v2 (`wait_for_update: 500`) — events before consent are modeled, not raw.

## Related

- Review agent: `analytics-reviewer` (checks against the tasks doc + attribution scheme).
- Commands: `npm run generate` (prerenders prefix×release×locale routes, runs slug-collision guard, emits `.output/bio-links.md` via `scripts/generate-bio-links.js`).
- Sibling agents: `i18n-checker`, `release-coordinator`.
