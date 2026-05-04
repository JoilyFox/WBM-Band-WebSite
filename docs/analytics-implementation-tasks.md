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

- [x] **2.1** — Extracted shared SEO/meta/render logic from `pages/listen/[slug].vue` into `composables/useMasterPage.ts`. Both the existing `[slug].vue` files and the new prefix-aware files use it. The composable handles release lookup, i18n title/description, OG meta image, canonical URL, and SEO keyword list (with Cyrillic transliteration).
- [x] **2.2** — Created `pages/listen/[source]/[slug].vue`. Unknown prefixes redirect (302) to the clean `/listen/[slug]`. Uses `useMasterPage({ sourcePrefix })` which calls `setExplicitSourcePlatform()` on mount.
- [x] **2.3** — Mirror created at `pages/pre-save/[source]/[slug].vue`. When the release date passes, redirects to `/listen/[source]/[slug]` so attribution survives the listen↔pre-save transition.
- [x] **2.4** — Replaced the hardcoded `nitro.prerender.routes` array with a generator that derives routes from `data/musicLibrary.ts × LOCALES × SOURCE_PREFIXES`. Build verified: **192 routes prerendered** (144 master-page HTML files counting the non-localized aliases), no errors.
- [x] **2.5** — `scripts/create-nonlocalized-aliases.js` already does a recursive `ua/listen` → `listen` copy, so prefix paths `/listen/i/<slug>/` are automatically aliased without modifying the script.
- [x] **2.6** — Updated `middleware/listen-access.ts` and `middleware/presave-access.ts` to read the optional `source` route param and preserve it across listen↔pre-save redirects. Otherwise a user landing on `/listen/i/<slug>` whose release was still pre-save would lose their Instagram attribution during the redirect.
- [ ] **2.7** — Optional bio-link list emitter — deferred. Easy to add later as a build hook that writes `.output/public/bio-links.txt`.

---

## Phase 3 — Analytics composable + plugin

- [x] **3.1** — Created `plugins/analytics.client.ts`. Hooks `app:mounted`, calls `getOrPersistSourcePlatform()`, then `gtag('set', 'user_properties', { source_platform })` so all subsequent events inherit the source.
- [x] **3.2** — Created `composables/useAnalytics.ts` with `getSourcePlatform()`, `trackReleaseView()`, and `trackPlatformClick()`. The latter is bot-filtered via `isLikelyBot()` and uses `transport_type: 'beacon'` to survive the page-tear-down that follows external navigation. All methods are SSR-safe no-ops.
- [ ] **3.3** — Verify nuxt-gtag SPA-navigation page-view tracking after deploy: open DevTools → Network → filter `collect`, navigate between pages, confirm `en=page_view` request fires.

---

## Phase 4 — Wire into UI

- [x] **4.1** — Edited `components/music/PlatformButton.vue`: added `releaseSlug` and `pageType` props, replaced the `console.log` with `useAnalytics().trackPlatformClick()`. Default link navigation untouched (beacon survives unload).
- [x] **4.2** — `MusicDetailContent.vue` derives `pageType` from `props.isPreSave` and passes both `release-slug` and `page-type` to every `<MusicPlatformButton>`.
- [x] **4.3** — All four master pages call `trackReleaseView()` in `onMounted`. Path-prefix pages benefit from synchronous source lock-in: `useMasterPage()` calls `setExplicitSourcePlatform()` in setup (not onMounted) so the source is in sessionStorage before any analytics fires.
- [x] **4.4** — Both pre-save pages call `trackPlatformClick({ platformName: 'distributor', ... })` immediately before `navigateTo(distributorUrl)`. The composable adds `transport_type: 'beacon'` so the event survives the redirect.

---

## Phase 5 — Cookie consent (small corner toast + Consent Mode v2)

Approach: tiny ~320×140px card in the bottom-left corner. Three buttons: Accept / Decline / Manage. While undecided **and** when declined, GA4 runs in Consent Mode v2 — collects only modeled, anonymized data so you still get aggregate timeline numbers. When accepted, full data flows.

- [x] **5.1** — `nuxt.config.ts` `gtag.initCommands` now ships a default-deny Consent Mode v2 block (ad_storage, ad_user_data, ad_personalization, analytics_storage all `denied`) with `wait_for_update: 500` so the toast can update consent before the first event fires.
- [x] **5.2** — Built `components/common/CookieConsentToast.vue`. Fixed bottom-left, glass-morphism, slides in 1.2s after mount (post-LCP), three actions: Accept · Decline · Details. SSR-safe (renders nothing until mounted).
- [x] **5.3** — Mounted `<CommonCookieConsentToast />` in both `layouts/default.vue` and `layouts/empty.vue` so the master pages with `layout: 'empty'` show the banner too.
- [x] **5.4** — Added a "Reset cookie preferences" content card on `pages/cookies-policy.vue` that calls `useCookieConsent().reset()` and shows a snackbar confirmation.
- [ ] **5.5** — Smoke test on production: undecided → GA `collect` requests should carry `gcs=G100` (denied) and `gcr=1` (modeled). After Accept → `gcs=G111` (granted). Verify in DevTools after deploy.

---

## Phase 6 — GA4 admin: custom dimensions + key events

- [x] **6.1** — Registered all four custom dimensions as **Event-scoped** in GA4 Admin → Custom definitions: `source_platform`, `release_slug`, `page_type`, `platform_name`. (Done by Bohdan, session 1 2026-05-02.)
- [ ] **6.2** — Wait 24-48h for dimensions to populate (GA4 backfills slowly). Expected.
- [x] **6.3** — Marked `platform_click` (and optionally `release_view`) as Key Events via Admin → Events → star icon. GA4 surfaced the events in the admin list within hours rather than the usual 24h.
- [ ] **6.4** — Optionally create a calculated metric "conversion rate" = `platform_click / page_view` for quick dashboards.

---

## Phase 7 — Dashboards & explorations

- [x] **7.1** — Site Overview is the default Reports → Acquisition / Engagement; no custom build needed.
- [x] **7.2** — **Master Pages: Visitors vs Conversions** Exploration built. Line chart, X-axis = day, two lines (release_view + platform_click) via Event-name breakdown, regex filter `^(release_view|platform_click)$`.
- [x] **7.3** — **Source Attribution Breakdown** Exploration built. Free-form table with rows = `Source platform`, columns = `Event name`, values = `Event count`. Reads as visitors vs conversions per platform; conversion rate is platform_click ÷ release_view.
- [x] **7.4** — **Per-platform timeline** Exploration built. Single line chart with `Source platform` as Breakdowns and an `Event name = platform_click` filter — one line per platform, conversions over time. Duplicate tab covers visitors over time (`Event name = release_view`).
- [x] **7.5** — **Pre-save per-song breakdown** Exploration built. Rows = `Release slug`, columns = `Event name`, filtered to `Page type = pre-save` plus the regex filter on Event name. One row per upcoming song.
- [ ] **7.6** — Pin all four explorations to the Reports library (Reports → Library → Add). Optional finishing touch — they're already accessible from Explore.

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
