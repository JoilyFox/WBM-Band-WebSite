# Analytics Implementation — Task Plan

> **Goal**: Wire up Google Analytics 4 for the WBM Band site with special focus on master music pages (`/listen/*`, `/pre-save/*`), tracking visitors **and** "fully-converted listeners" (users who clicked any platform button) per traffic source — without using UTM parameters in the public-facing URLs.
>
> **Source attribution strategy** = **HYBRID**:
>
> 1. **Path-prefix** (`/listen/i/<slug>` for Instagram, `/listen/tt/<slug>` for TikTok, etc.) — primary, 100% accurate. Used in social-media bio links you control.
> 2. **Referrer + User-Agent fingerprinting** — fallback for any URL that doesn't carry a path prefix (organic shares, screenshots-then-typed-URL, untagged links).
>
> **Status legend**: `[ ]` = todo · `[~]` = in progress · `[x]` = done
>
> **Resume in a new session**: read `memory/session_log.md` (latest entry has "Next session: start here") then come back here and pick up at the next unchecked task.

---

## Source-prefix scheme (final)

| Source      | Prefix | Example                               |
| ----------- | ------ | ------------------------------------- |
| Instagram   | `i`    | `/listen/i/chorni-ptahy`              |
| TikTok      | `tt`   | `/listen/tt/chorni-ptahy`             |
| YouTube     | `yt`   | `/listen/yt/chorni-ptahy`             |
| Facebook    | `fb`   | `/listen/fb/chorni-ptahy`             |
| Twitter / X | `x`    | `/listen/x/chorni-ptahy`              |
| Snapchat    | `sc`   | `/listen/sc/chorni-ptahy`             |
| LinkedIn    | `ln`   | `/listen/ln/chorni-ptahy`             |
| Threads     | `th`   | `/listen/th/chorni-ptahy`             |
| Telegram    | `tg`   | `/listen/tg/chorni-ptahy`             |
| Pinterest   | `pin`  | `/listen/pin/chorni-ptahy`            |
| QR code     | `qr`   | `/listen/qr/chorni-ptahy`             |
| Email       | `em`   | `/listen/em/chorni-ptahy`             |
| (no prefix) | —      | falls back to referrer + UA detection |

**Reserved**: these prefixes must NEVER be used as song slugs in `data/musicLibrary.ts`. Add a guard in Phase 1 that throws at build time if a slug collides.

The full list of source codes lives in a single constant `utils/sourceAttribution.ts → SOURCE_PREFIXES` so the prerender route generator and the detector share one source of truth.

---

## Phase 0 — GA4 account setup (user-driven, agent assists)

- [x] **0.1** — Bohdan logged in to https://analytics.google.com — confirmed GA4 property exists with Measurement ID `G-Z8QRF6TWC2`. (Session 1, 2026-05-02.)
- [x] **0.2** — Wrong measurement ID was hardcoded (`G-T4G4XTP2QZ`). Fixed `nuxt.config.ts` to use `G-Z8QRF6TWC2`. After redeploy, verify Realtime view in GA4 shows live visits within ~30 minutes.
- [ ] **0.3** — Confirm `Admin → Data Streams → Web stream` is set up for `wbmband.com` (it should be, since the Measurement ID is auto-generated when you create a stream).
- [ ] **0.4** — Enable **Enhanced Measurement** on the web stream (Page views, Scrolls, Outbound clicks, File downloads). Note: we'll override outbound-click tracking with our own `platform_click` event for the master pages, but Enhanced Measurement is still useful elsewhere on the site.
- [ ] **0.5** — `Admin → Data settings → Data retention` → set to **14 months** (max free tier).
- [ ] **0.6** — `Admin → Reporting Identity` → "Blended" (or "Device-based" if you don't care about cross-device).
- [ ] **0.7** — Document the GA4 property ID (the numeric one, not the `G-...` measurement ID) in `memory/session_log.md` for reference.

---

## Phase 1 — Source attribution utility

Goal: ship a pure, test-friendly module that decides where a visitor came from, combining path-prefix, referrer, and UA fingerprint signals.

- [x] **1.1** — Create `utils/sourceAttribution.ts`:
  - Export `SOURCE_PREFIXES` constant — the table above as a JS object: `{ i: 'instagram', tt: 'tiktok', yt: 'youtube', fb: 'facebook', x: 'twitter', sc: 'snapchat', ln: 'linkedin', th: 'threads', tg: 'telegram', pin: 'pinterest', qr: 'qr', em: 'email' }`.
  - Export `SourcePlatform` type (union of all values + `'search' | 'direct' | 'other'`).
  - Export `detectFromPath(path: string): SourcePlatform | null` — checks if first segment after `/listen/` or `/pre-save/` matches a known prefix.
  - Export `detectFromReferrer(referrer: string): SourcePlatform | null` — hostname → platform map (instagram.com, tiktok.com, youtube.com, facebook.com, fb.me, t.co, twitter.com, x.com, linkedin.com, threads.net, t.me, pinterest.com, snapchat.com, google.\* → search, bing.com → search).
  - Export `detectFromUserAgent(ua: string): SourcePlatform | null` — UA fingerprint table: `Instagram` → instagram, `FBAN`/`FBAV`/`FB_IAB` → facebook, `TikTok`/`musical_ly`/`Bytedance` → tiktok, `Snapchat` → snapchat, `Twitter`/`TwitterAndroid` → twitter, `Pinterest` → pinterest, `LinkedInApp` → linkedin, `Threads` → threads, `WhatsApp` → whatsapp, `Telegram` → telegram.
  - Export `detectSourcePlatform({ path, referrer, userAgent })`: composes all three with priority **path > referrer > UA > 'direct'**. Returns `'other'` only if there's a non-empty referrer that didn't match anything (so we can spot patterns).
- [x] **1.2** — Add `getOrPersistSourcePlatform()`: read from `sessionStorage` first; if absent, run detection and save. Guarantees first-touch attribution survives internal navigation.
- [x] **1.3** — Add a build-time guard: in `nuxt.config.ts` or a tiny build hook, assert that no release slug in `data/musicLibrary.ts` collides with a `SOURCE_PREFIXES` key.
- [x] **1.4** — Add `utils/isLikelyBot.ts` (light heuristic):
  - `navigator.webdriver === true` → bot
  - UA matches `/bot|crawl|spider|headless|phantom|lighthouse|HeadlessChrome/i` → bot
  - empty UA → bot
  - Used to suppress `platform_click` events from synthetic traffic.
- [x] **1.5** — Add a manual test harness `scripts/test-source-attribution.ts` covering: IG in-app, TikTok in-app, FB external link, X with `t.co` referrer, Google search, direct, path-prefix match, path-prefix + referrer (path wins).

---

## Phase 2 — Routing changes for path-prefix attribution

Goal: serve `/listen/<prefix>/<slug>` and `/pre-save/<prefix>/<slug>` for every release × every prefix × every locale, without duplicating the page logic.

- [ ] **2.1** — Extract the shared SEO/meta/render logic from `pages/listen/[slug].vue` into `composables/useMasterPage.ts`. Returns `{ release, pageMeta, pageTitle, ... }` given a slug + page type. Both the existing `[slug].vue` files and the new prefix-aware files use it.
- [ ] **2.2** — Create `pages/listen/[source]/[slug].vue`:
  - Reads `route.params.source` (one of `SOURCE_PREFIXES` keys); if not a known prefix, redirect to clean `/listen/[slug]` (404 fallback if slug also bad).
  - Calls `useSourceAttribution().setExplicit(SOURCE_PREFIXES[source])` before render so the source is locked in for any subsequent click events.
  - Renders the same `<MusicDetailContent>` + footer as `[slug].vue` via the shared composable.
- [ ] **2.3** — Mirror for `pages/pre-save/[source]/[slug].vue`.
- [ ] **2.4** — Generate the prerender list dynamically. Replace the hardcoded array in `nuxt.config.ts` `nitro.prerender.routes` with a function that reads `data/musicLibrary.ts` and emits, for each release: `/{locale}/listen/{slug}`, `/{locale}/pre-save/{slug}`, plus `/{locale}/listen/{prefix}/{slug}` and `/{locale}/pre-save/{prefix}/{slug}` for each prefix in `SOURCE_PREFIXES`. For 2 releases × 2 locales × 12 prefixes = 96 prerender entries (still totally fine for SSG).
- [ ] **2.5** — Update `scripts/create-nonlocalized-aliases.js` to also copy `ua/listen/<prefix>/` and `ua/pre-save/<prefix>/` directories into root, so `wbmband.com/listen/i/chorni-ptahy` works without locale prefix (matching the current behavior for plain `/listen/<slug>`).
- [ ] **2.6** — Update `middleware/listen-access.ts` and `middleware/presave-access.ts` to handle the new `/listen/[source]/[slug]` path shape (most likely just a path-pattern adjustment).
- [ ] **2.7** — Optional: emit a tidy bio-link list at build time → `dist/bio-links.txt` (just for your reference) listing every prefixed URL for every release. Saves you copy-pasting them into IG/TikTok bios.

---

## Phase 3 — Analytics composable + plugin

- [ ] **3.1** — Create `plugins/analytics.client.ts`:
  - Runs once on app mount.
  - Calls `getOrPersistSourcePlatform()` and pushes it via `gtag('set', 'user_properties', { source_platform })`.
  - Also enriches the very first `page_view`.
- [ ] **3.2** — Create `composables/useAnalytics.ts`:
  - `useSourceAttribution()` → `{ getCurrent(), setExplicit(platform), reset() }` for path-aware pages to lock in the prefix-derived source.
  - `trackReleaseView({ releaseSlug, pageType })` — fires `release_view` with `source_platform`. Dedupes per session per slug+type.
  - `trackPlatformClick({ platformName, releaseSlug, pageType })` — fires `platform_click` with `source_platform`. Skips if `isLikelyBot()`.
  - All methods are SSR-safe no-ops on the server.
- [ ] **3.3** — Verify the `nuxt-gtag` SPA navigation page-view tracking is on (DevTools → Network → check `collect?...&en=page_view` fires on route change).

---

## Phase 4 — Wire into UI

- [ ] **4.1** — Edit `components/music/PlatformButton.vue`:
  - Add props: `releaseSlug: string`, `pageType: 'listen' | 'pre-save'`.
  - Replace the `console.log` in `handleClick` with `useAnalytics().trackPlatformClick({ platformName: props.platform, releaseSlug: props.releaseSlug, pageType: props.pageType })`.
  - Don't preventDefault — the `gtag('event', ...)` call uses `sendBeacon` and survives navigation.
- [ ] **4.2** — Plumb `releaseSlug` + `pageType` from `MusicDetailContent.vue` down to each `<PlatformButton>`. Read `pageType` from a new prop or detect from `useRoute().path`.
- [ ] **4.3** — Call `trackReleaseView()` in `onMounted` from `pages/listen/[slug].vue`, `pages/listen/[source]/[slug].vue`, `pages/pre-save/[slug].vue`, `pages/pre-save/[source]/[slug].vue` (or once from `useMasterPage()` so it's centralized).
- [ ] **4.4** — For pre-save pages that auto-redirect to a distributor URL (`useDistributorPreSave === true`, see `pages/pre-save/[slug].vue:50`), fire `platform_click` with `platformName: 'distributor'` _before_ `navigateTo`, using `transport_type: 'beacon'`.

---

## Phase 5 — Cookie consent (small corner toast + Consent Mode v2)

Approach: tiny ~320×140px card in the bottom-left corner. Three buttons: Accept / Decline / Manage. While undecided **and** when declined, GA4 runs in Consent Mode v2 — collects only modeled, anonymized data so you still get aggregate timeline numbers. When accepted, full data flows.

- [ ] **5.1** — Configure `nuxt-gtag` for default-deny + Consent Mode v2 in `nuxt.config.ts`. The module has `initialConsent: false` plus `config.consent_mode` options. Reference: https://nuxt.com/modules/gtag (check version 4.x docs).
- [ ] **5.2** — Build `components/common/CookieConsentToast.vue`:
  - Fixed bottom-left, ~320px wide, max ~140px tall, dark glass-morphism background matching site aesthetic.
  - Slides in 1-2s after first paint to avoid LCP penalty.
  - Localized text via `locales/en.json` + `locales/uk.json` (short — one sentence).
  - Three buttons: **Accept** · **Decline** · **Details** (links to `/cookies-policy`).
  - Persists choice in `localStorage` under key `wbm_cookie_consent` = `'accepted' | 'declined'`.
  - On Accept → `gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted' })`.
  - On Decline → `gtag('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied' })`.
  - Small × in the corner = treat as decline (or as "remind me later" if you prefer; we'll go with "decline" for simplicity).
- [ ] **5.3** — Mount `<CookieConsentToast />` in `layouts/default.vue` (and `layouts/empty.vue` if it's used by master pages — check, since `pages/listen/[slug].vue` uses `layout: 'empty'`).
- [ ] **5.4** — Add a "Reset cookie preferences" link/button to the `pages/cookies-policy.vue` so users can change their mind.
- [ ] **5.5** — Smoke test: with the toast undecided, verify in DevTools that GA `collect` requests have `gcs=G100` (denied) or modeled-data flag; after accept, `gcs=G111` (granted).

---

## Phase 6 — GA4 admin: custom dimensions + key events

- [ ] **6.1** — `Admin → Custom definitions → Create custom dimension`. Register all four as **Event-scoped**:
  - `source_platform` (event param `source_platform`)
  - `release_slug` (event param `release_slug`)
  - `page_type` (event param `page_type`)
  - `platform_name` (event param `platform_name`)
- [ ] **6.2** — Wait 24-48h for dimensions to populate (GA4 backfills slowly). Expected.
- [ ] **6.3** — `Admin → Events → Mark as key event` for `platform_click` (and optionally `release_view`).
- [ ] **6.4** — Optionally create a calculated metric "conversion rate" = `platform_click / page_view` for quick dashboards.

---

## Phase 7 — Dashboards & explorations

- [ ] **7.1** — Site Overview: use the default Reports → Acquisition / Engagement; nothing custom needed.
- [ ] **7.2** — **Master Pages: Visitors vs Conversions** Exploration:
  - Free form. Rows = date. Values = `page_view` count + `platform_click` count. Filter `page_type IN (listen, pre-save)`. Line chart, two series.
- [ ] **7.3** — **Source Attribution Breakdown** Exploration:
  - Free form. Rows = date · `source_platform`. Values = `page_view`, `platform_click`, conversion rate. Filter `page_type IN (listen, pre-save)`.
- [ ] **7.4** — **Per-platform timeline** Explorations: clone for each major source (Instagram, TikTok, YouTube).
- [ ] **7.5** — **Per-song pre-save analytics** Exploration (requested feature): rows = date · `release_slug`. Values = `page_view`, `platform_click`. Filter `page_type = pre-save`. One row per release, individually filterable.
- [ ] **7.6** — Pin all to the Reports library.

---

## Phase 8 — Polish (optional, can defer)

- [ ] **8.1** — Generate a printable bio-link cheat sheet at build time (a markdown file listing every prefixed URL for each release).
- [ ] **8.2** — Add `engagement_time_msec` enrichment on `platform_click` (how long was the user on the page before clicking?).
- [ ] **8.3** — Document everything in `docs/analytics-system.md` and link it from `docs/README.md`.

---

## Resolved decisions (session 1, 2026-05-02)

- ✅ GA4 measurement ID: `G-Z8QRF6TWC2` (was wrongly `G-T4G4XTP2QZ` in code).
- ✅ Source attribution: hybrid (path-prefix primary + referrer/UA fallback).
- ✅ Cookie consent: small bottom-left toast + Google Consent Mode v2 (default-deny).
- ✅ Bot filter: include in Phase 1 as `utils/isLikelyBot.ts`.
- ✅ Cross-source clicks count as conversion (any platform_click = converted).
- ✅ Pre-save analytics: per-release breakdown via `release_slug` dimension (Phase 7.5).
- ✅ Path prefixes finalized; QR (`qr`) and email (`em`) included.
