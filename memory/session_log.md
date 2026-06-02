# Session Memory Log

---

## Session: 2026-05-02 → 2026-05-04 — Analytics initiative end-to-end (phases 0–7)

### Accomplished

- ✅ Phase 0 — Fixed wrong GA4 measurement ID in `nuxt.config.ts` (`G-T4G4XTP2QZ` → `G-Z8QRF6TWC2`); GA4 confirmed live, Realtime + DebugView showing real events.
- ✅ Phase 1 — Hybrid source-attribution layer at `utils/sourceAttribution.ts` (path prefix > referrer hostname > UA fingerprint > 'direct'/'other' fallback). Bot heuristic at `utils/isLikelyBot.ts`. Manual test harness at `scripts/test-source-attribution.ts` runnable via `npm run test:attribution` (Node 22 `--experimental-strip-types`). 34/34 tests pass.
- ✅ Phase 2 — Path-prefix routes: `pages/listen/[source]/[slug].vue` + `pages/pre-save/[source]/[slug].vue`. 12 prefixes (`i tt yt fb x sc ln th tg pin qr em`). Shared `composables/useMasterPage.ts` keeps SEO/i18n/keyword logic in one place. Prerender list now derived from `musicLibrary × LOCALES × SOURCE_PREFIXES` — 192 routes built. Middlewares preserve source prefix on listen↔pre-save redirects. `.htaccess` regex widened from `[^/]+$` to `[^/]+(/[^/]+)?$` to rewrite the 2-segment paths. Build-time guard `assertNoSlugCollisions` prevents song slugs shadowing reserved prefixes.
- ✅ Phase 3+4 — `composables/useAnalytics.ts` (single GA4 surface), `plugins/analytics.client.ts` (locks first-touch source as `gtag('set', 'user_properties')`). `PlatformButton.vue` fires `platform_click` (bot-filtered, `transport_type: 'beacon'` to survive nav). `MusicDetailContent.vue` plumbs `releaseSlug` + `pageType` to every button. Master pages call `trackReleaseView` on mount. Pre-save distributor redirect fires `platform_click('distributor')` before `navigateTo`.
- ✅ Phase 5 — Cookie consent: small bottom-left toast (`components/common/CookieConsentToast.vue`) + Google Consent Mode v2 default-deny in `nuxt.config.ts gtag.initCommands` with `wait_for_update: 500`. `composables/useCookieConsent.ts` is the single source of truth; persists Accept/Decline in localStorage, has a session-only `snooze()` for the swipe gesture. Mobile swipe-left/right past 80px snoozes the toast (reappears on full reload, not on SPA nav). `pages/cookies-policy.vue` has a "Reset cookie preferences" card.
- ✅ Phase 6 — In GA4 admin: 4 custom event-scoped dimensions registered (`source_platform`, `release_slug`, `page_type`, `platform_name`); `platform_click` and `release_view` marked as Key Events.
- ✅ Phase 7 — Four Explorations live in GA4: (1) Master Pages: Visitors vs Conversions — line chart with two series; (2) Source Attribution Breakdown — table source × event; (3) Per-platform timeline — line per source filtered to `platform_click`, with a duplicate tab for `release_view`; (4) Pre-save per-song breakdown — table release_slug × event filtered to `page_type = pre-save`.
- ✅ Created `/save-context` slash command at `.claude/commands/save-context.md` (adapted from the user's other repo).
- ✅ Created `docs/analytics-implementation-tasks.md` — multi-phase plan, source of truth.
- ✅ Persistent memory under `~/.claude/projects/-Users-bohdan-Documents--Repositories-WBM-Band-WebSite/memory/` (user profile, project context, references).

### Key decisions

- **Hybrid source attribution beats UTM**: path-prefix gives 100% accuracy where Bohdan controls the link (bio); referrer + UA fingerprint covers organic shares. Compromised on URL "beauty" by keeping prefixes short (`i`/`tt`/`yt`/etc.) — still clean.
- **Single composable, multiple consumers**: `useMasterPage` + `useAnalytics` + `useCookieConsent` each have one job; pages and components are thin. No direct `gtag()` calls outside the composable.
- **Consent Mode v2 default-deny over hard-block**: declined users still ping anonymously, so timeline charts don't go to zero. `wait_for_update: 500` lets the toast race the first event fire so accepters get full data immediately.
- **Per-prefix non-localized aliases handled by recursive `cp`**: `scripts/create-nonlocalized-aliases.js` already does `ua/listen` → `listen` recursively, so prefix subdirs come along for free. No script change needed.
- **Snooze (swipe) ≠ Decline**: swipe is in-memory only; reload resurfaces the toast. Accept/Decline persist via localStorage.

### Technical findings

- GA4's stated "24-48h backfill for custom dimensions" applies to **report inclusion**, not to Explorations dimension availability. Explorations could query `Source platform` within hours.
- `platform_click` appeared in GA4 Admin → Events list within hours of first firing, faster than Google's documented lag.
- Combining a user-scoped metric (`Active users`) with a custom event-scoped dimension (`Source platform`) throws "Incompatible with currently applied dimensions and metrics" in Explorations. Drop `Active users` and use `Event count` only.
- Filter chips in GA4 Explorations are AND'd by default; for OR semantics on the same dimension use the `matches regex` operator with `^(a|b)$`.
- `nuxt-gtag@4.1.0` exposes `useGtag().gtag` typed as `Gtag<keyof GtagCommands>`. Custom event names go through `(string & {})` branch — fully usable.
- Apache `DirectorySlash Off` + a directory existing at the requested path → 404 unless a rewrite rule maps it to the inner `index.html`. Source: investigating `/listen/i/<slug>` 404 on production.
- Setting `transport_type: 'beacon'` on `gtag('event', ...)` keeps the request alive past `pagehide`, which is what makes `platform_click` survive the click-to-external-platform navigation.
- iOS Instagram in-app browser sets `Instagram` in UA; TikTok sets `TikTok` AND `musical_ly` AND `Bytedance`; Facebook IAB sets `FBAN`/`FBAV`/`FB_IAB`. All confirmed by manual testing.

### Credentials & IDs obtained

- GA4 Measurement ID `G-Z8QRF6TWC2` — committed in `nuxt.config.ts` (public by design).
- ⚠️ User briefly had a Google service account JSON open in IDE (`wbm-social-publisher-56d79459a37a.json`, key id `56d79459a37a767c550c8bdeed33e88ea9134244`). Agent flagged for rotation if exposed; user did not confirm whether revoked.

### Blockers & open questions

- Phase 7.6 (pin Explorations to Reports → Library) — partially deferred; GA4's Library is for Reports not Explorations, so the equivalent is sharing/starring. Open: build a Reports → Library Collection with Overview report or use Looker Studio? Resolved next session.
- Phase 6.4 (calculated metric for conversion rate) — not done yet.
- Phase 8.1 (bio-link cheat sheet at build time) — not done yet.
- Phase 8.3 (consolidated `docs/analytics-system.md`) — not done.

### Next session: start here

1. Build Phase 8.1 — `scripts/generate-bio-links.js` emitting `.output/bio-links.md` so Bohdan has a printable list of every prefixed URL × every release.
2. Walk Bohdan through Phase 6.4 (calculated metric in GA4 Admin → Custom definitions → Calculated metrics: `platform_click / release_view * 100`, formatted as percent).
3. Build the unified analytics dashboard (user-requested "main page with all graphics"). Recommendation: Looker Studio connected to GA4 — way more powerful than GA4's built-in custom Reports. Plan a single dashboard with KPI scorecards + the four chart types from the Explorations.

### Important IDs & links discovered this session

- GA4 Measurement ID: `G-Z8QRF6TWC2` (public)
- GA4 property: WBM Band web stream — accessed via https://analytics.google.com
- Reminder agent (one-time, fires Mon 2026-05-04 07:00 UTC) — `trig_0154gW6VTTBswN4Vi7LWwZfc` — disabled after the GA4 events appeared in the admin list ahead of schedule.
- Docs: `docs/analytics-implementation-tasks.md` is the per-phase plan; `memory/session_log.md` (this file) is the chronological log.
- Latest commit: `270e108` — phase 7 complete.

---

## Session: 2026-06-02 11:16 Europe/Kiev — Implemented the whole test suite (Waves 0–5): 1,123 tests + CI + coverage; fixed 5 more latent bugs

### Accomplished

- ✅ Stood up the Vitest harness: `vitest.config.ts` (node `unit` + `nuxt` projects via defineVitestProject; `~`/`@` alias for the node project), `test/setup.nuxt.ts` (stub useGtag, shim Cache API), ported `scripts/test-source-attribution.ts` → `test/unit/` and deleted the bespoke harness.
- ✅ Authored **1,106 unit/nuxt tests across 44 specs** + **17 e2e tests** (2 specs) — all green. Source of truth: `docs/testing-strategy.md` (status banner now says Waves 0–5 done).
- ✅ Waves: 0 harness(18) · 1 P0 pure logic(251) · 2 integration/middleware/analytics(226) · 3a data+locale-parity+drift(103) · 3b components(179) · 5a a11y+composables+stores(329) · 4 e2e(17).
- ✅ E2e: `vitest.e2e.config.ts` + `test:e2e`/`test:e2e:run` scripts; node static-output assertions on `.output/public` (prerender completeness matrix, aliases, robots/sitemap, distributor redirect-screen regression) + a real-browser chromium smoke (hydration, cookie-consent accept/decline persistence, deep-link) served over a self-hosted static server with external nav blocked.
- ✅ Fixed 5 latent bugs (each pinned by a test): `helpers.formatDate` invalid-date guard; `getMusicPlatform` prototype-pollution (`Object.hasOwn`); `useReleaseTheme.hslHex` malformed-hex (normalize s/l + clamp channel); `ErrorPage` UA maintenance keyword → stem `обслуговуванн`; `MusicLibrarySection` TBA-vs-dated reduce guards swapped.
- ✅ CI/infra: `.github/workflows/test.yml` (lint+unit/nuxt → gated e2e); `deploy.yml` build now `needs: test`; husky `.husky/pre-push` runs `test:unit && test:nuxt`; Node 20→22; coverage ratchet thresholds in vitest.config.ts (lines 54/stmts 53/funcs 52/branches 50, baseline ~57%); `coverage/` gitignored.

### Key decisions

- Built tests via multi-agent Workflow fan-out (1 self-verifying agent per target, each runs `npx vitest run` on its own file before returning); verified each wave together afterward to catch cross-file pollution.
- Used Workflow for authoring (parallel) but did harness setup, bug fixes, CI, and coverage myself (need real-output verification / judgment).
- E2e split into robust node static-output assertions (zero flake) + a small chromium smoke; correct MIME static server so the app truly hydrates; blocked non-localhost nav so the distributor hop never hits the network.
- Did NOT commit (awaiting user) and did NOT remove dev pages / placeholder team members from the production build (outward-facing — surfaced for the user's decision).

### Technical findings

- `@nuxt/test-utils@4.0.3` REJECTS `projects` inside `defineVitestConfig`; the supported multi-project shape is plain `defineConfig` (vitest/config) + `defineVitestProject` per nuxt project. The doc's example (c) mock of `getConfig` via mockNuxtImport is WRONG for this codebase — getConfig is an EXPLICIT import (needs `vi.mock`).
  - Source: node_modules/@nuxt/test-utils/dist/config.mjs + middleware import lines.
- Nuxt mocking rule: AUTO-imports (navigateTo/useRoute/useGtag…) → `mockNuxtImport`; EXPLICIT `import {x} from '~/…'`/`#i18n`/`vue-i18n` → `vi.mock` with `vi.hoisted`. Do NOT globally mock `useNuxtApp`/`useRouter` (crashes the test-utils bootstrap — needs `.afterEach()`); flip the global i18n locale via the writable `useNuxtApp().$i18n.locale.value` and reset in beforeEach.
  - Source: this session's agent runs (presave/listen/error-page).
- The bare nuxt vitest runtime resolves vue-i18n to ENGLISH by default (not the configured `ua`); `@nuxtjs/i18n` precompiles locale messages to AST objects (don't dot-path them as strings).
- `npm run generate` prerenders `/test` + `/performance-test` (dev pages) into production output, and ships them. Distributor pre-save HTML correctly contains the `PreSaveRedirect`/`role="status"` redirect screen.
  - Source: `.output/public` inspection.

### Credentials & IDs obtained

- — none this session.

### Blockers & open questions

- Awaiting user: commit/PR the work? Fix any open findings?
- Open findings (not fixed): `data/teamMembers.ts` ships 5 placeholder members (ids 101–105, pravatar.cc, "remove before production"); dev pages `/test`+`/performance-test` shipped to prod output; `AlbumCover` dead per-locale fallback maps; `BaseModal` document-level keydown listener (multi-modal a11y); duplicate `MasterPageType` export (useAnalytics vs useMasterPage — the warning printed every test run).

### Next session: start here

1. If user approves: commit the suite (logical per-wave commits or one squash) + the 5 source bug fixes; optionally open a PR. Untracked: `test/`, `vitest.config.ts`, `vitest.e2e.config.ts`, `.github/workflows/test.yml`, `.husky/pre-push`. Modified: ErrorPage, MusicLibrarySection, useReleaseTheme, helpers, musicPlatforms, deploy.yml, package.json, .gitignore, docs/testing-strategy.md.
2. Optionally address open findings (remove placeholder team members + exclude dev pages from `nitro.prerender.routes` / dedupe `MasterPageType`).
3. Optionally raise coverage by testing the untested perf/scroll composables (usePerformanceOptimization, useScrollAnimation, useImagePerformance, useImagePreloader) and bump the ratchet thresholds toward ~70%.

### Important IDs & links discovered this session

- GA4 Measurement ID: `G-Z8QRF6TWC2` (public, unchanged)
- Test plan source of truth: `docs/testing-strategy.md` (status: Waves 0–5 implemented)
- Suite commands: `npm run test` (unit+nuxt), `npm run test:e2e` (build+e2e), `npm run coverage` (ratchet floor)
