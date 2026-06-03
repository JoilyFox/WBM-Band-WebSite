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

---

## Session: 2026-06-02 16:01 Europe/Kiev — Shipped test suite to staging; fixed the recurring "modal collapses to a line" bug (2 root causes); deployed to production

### Accomplished

- ✅ Committed + pushed the whole test suite to `main` → staging (GitHub Pages): commit `f463b05` (5 source bug fixes) + `d79df96` (Vitest+Playwright suite, CI, coverage). Pre-push hook + CI test-gate + deploy all green.
- ✅ Root-caused & fixed the long-standing "modal not showing, just a line of container borders" bug — it was TWO distinct bugs, both only visible on the GitHub Pages sub-path (commit `57fc510`):
  - 404: `BaseModal` pre-decoded `props.preloadImageUrl` via `new Image(); img.src = url` with the RAW `/images/...cover.avif` (no base prefix) → 404 on `/WBM-Band-WebSite/`. Fixed by routing through `useAssetUrl().resolveUrl`. The visible cover was always fine (ProgressiveImage resolves it) — this was a stray pre-decode request.
  - Collapse: `MusicDetailContent` had `content-visibility: auto` (full-page scroll perf) with NO `contain-intrinsic-size`, so the browser skip-rendered the always-visible modal body → 0 height. Fixed by forcing `content-visibility: visible` in `.modal-mode`.
- ✅ Verified BOTH fixes live on staging (cover.avif + cover-640.avif now 200 prefixed, modal body 832px, content-visibility:visible, no console errors).
- ✅ Added regression guards: `test/nuxt/base-modal-preload.nuxt.spec.ts` (pins preload prefixing) + an e2e browser test that opens a release modal and asserts non-zero body height. Suite now 1107 unit/nuxt + 18 e2e.
- ✅ Deployed to PRODUCTION wbmband.com via FTP (`npm run deploy:production`): 770 uploaded, 363 unchanged, 193 orphans removed, 1133 total. Verified live — modal opens 832px, content-visibility:visible, no console errors.

### Key decisions

- Diagnosed with a parallel approach: a 2-agent Workflow traced the code (confirmed BaseModal preload is the SOLE unprefixed emitter + the content-visibility collapse) while I reproduced live via chrome-devtools-mcp (network log showed only the BaseModal preload 404'd; everything else prefixed/200).
- The collapse is intermittent because `content-visibility:auto` is viewport/timing-dependent — explains why the user hit it and fresh loads usually didn't.
- Fixed at the source (BaseModal, the generic component doing the raw `new Image()`), not the call site, so any future caller is safe.

### Technical findings

- A bare `new Image().src = '/path'` resolves against the ORIGIN ROOT, not the app baseURL — so any JS-driven image preload on a sub-path deploy must go through `resolveUrl` (the established pattern in `useImagePreloader.ts`).
  - Source: live network log on joilyfox.github.io + composables/useAssetUrl.ts.
- `content-visibility: auto` without `contain-intrinsic-size` reports 0 intrinsic height while "skipped"; harmful for always-visible modal bodies. `.music-detail-content` min-height is 0 in modal mode by design (so it fits content + scrolls), so it depends entirely on content height.
  - Source: components/music/MusicDetailContent.vue:1128-1143 + live computed styles.

### Credentials & IDs obtained

- — none new. FTP creds already in `.env.production` (6 keys, untouched, not read).

### Blockers & open questions

- Open findings still un-actioned (maintainer's call): placeholder team members (ids 101–105, pravatar.cc); dev pages `/test`+`/performance-test` shipped to prod output (confirmed again: `ua/test/index.html` uploaded in this prod deploy); duplicate `MasterPageType` export; AlbumCover dead fallback maps.
- GitHub Actions still on Node 20 action RUNTIME (checkout@v4 etc.) — force-migrates to Node 24 on 2026-06-16; action major-version bump still pending (offered, not done).

### Next session: start here

1. If desired, action the open findings (remove placeholders, exclude dev pages from `nitro.prerender.routes`, dedupe `MasterPageType` export, bump GH Action majors before 2026-06-16).
2. Optionally grow coverage on the untested perf/scroll composables and raise the ratchet thresholds.

### Important IDs & links discovered this session

- Commits on `main`: `f463b05` (5 fixes), `d79df96` (test suite), `57fc510` (modal 404 + content-visibility)
- Staging: https://joilyfox.github.io/WBM-Band-WebSite/ua · Production: https://wbmband.com (FTP, `/wbmband.com/www`)
- GA4 Measurement ID: `G-Z8QRF6TWC2` (public, unchanged)

---

## Session: 2026-06-02 18:44 Europe/Kiev — Built the mobile/tablet hero "Music Video / Lyrics" quick-action buttons (feature + full UI/UX iteration); pushed to staging

### Accomplished

- ✅ New feature on `/listen/*` release pages: mobile/tablet-only (`md:hidden`) quick-action pills INSIDE `section.music-hero` (on the cover's Ambient-Bloom bg) — **Music Video** (optional; only when `musicPlatformLinks.musicVideo` is set; `<a>` opens YouTube + fires the same `platform_click` GA4 event as the grid via `useAnalytics().trackPlatformClick`) and **Lyrics** (placeholder, no behaviour yet). Music Video is removed from the platform grid on `<md` (`max-md:!hidden`) but kept on desktop.
- ✅ Created reusable `components/ui/ResponsiveText.vue` (`<UiResponsiveText>`): CSS-only narrow↔wide label swap, SSR-safe / no hydration flash; the breakpoint is a `:breakpoint` prop (default 440) implemented by injecting a per-instance `@media` rule into `<head>` via `useHead`, keyed by a `useId()` class.
- ✅ i18n (both locales): `music.buttons.music_video` (Music Video / Дивитись Кліп), `music.buttons.lyrics` (Lyrics / Текст), `music.buttons.song_lyrics` (Song Lyrics / Текст Пісні).
- ✅ Layout: row full-width capped 500px; BOTH pills grow to equal halves (`flex-1`), a LONE pill is content-width (video left / lyrics right via `ml-auto`); Lyrics label shortens at 440 in all cases; row only renders when an action exists (no empty margin).
- ✅ UI/UX pass (after a multi-agent design review): pills dimmed to read as secondary — text/icon **55% alpha** (`text-primary-200/55`), `font-medium`, no shadow (kept fill/border for legibility; avoided blanket opacity). `py-1`, `mt-3`, `gap-3`. Active press = `scale(0.98)` + glass brighten, smooth symmetric **0.1s ease-in-out**.
- ✅ Reduced expanded-hero bottom padding `py-16` → `pt-16 pb-8`.
- ✅ Saved two persistent memories: `feedback_touch_hover_safe.md` (hover desktop/fine-pointer only) and `reference_responsive_text_component.md` (use `<UiResponsiveText>` for width label swaps).

### Key decisions

- Kept the buttons in the hero (user preference) rather than redesign; ran a 9-agent UI/UX critique + 5 alternative directions (segmented capsule / card footer / Watch&Read grid cards / tab switcher / quiet links) — documented, not adopted.
- Responsive label stays CSS / flash-free even with a runtime breakpoint via `useHead`-injected media rule (CSS `@media` can't read a CSS var; Tailwind JIT can't build dynamic `min-[..]:` classes).

### Technical findings

- In this theme `primary-200` ≈ `rgb(253,253,253)` (near-white) — secondary-text dimness elsewhere comes from `opacity-70`, not the colour. Dimming the pills required an alpha colour (`text-primary-200/55`), not a darker token. Source: live computed style.
- `active:duration-100` alone felt "rough": press snapped at 100ms but release used the 300ms base (asymmetric). Fixed with a symmetric `duration-100 ease-in-out`.
- Vue 3.5.18 → `useId()` available (SSR-stable) for per-instance style scoping. unhead 1.11.20; `useHead({ style: [{ innerHTML }] })` works.

### Credentials & IDs obtained

- — none this session.

### Blockers & open questions

- **Lyrics** is still a no-op placeholder (awaiting the user's decision on what it opens) — a11y lens flags it as a dead control; left as-is per user.
- `pt-16 pb-8` also shrinks DESKTOP hero bottom padding — confirm acceptable or split to mobile-only.
- Prior open findings still un-actioned: placeholder team members, dev pages in `nitro.prerender.routes`, GH Action Node-20→24 migration before 2026-06-16.

### Next session: start here

1. Wire up the Lyrics button once its behaviour is defined.
2. Deploy to PRODUCTION (wbmband.com via `npm run deploy:production`) when ready — this session pushed to STAGING only.

### Important IDs & links discovered this session

- Staging: https://joilyfox.github.io/WBM-Band-WebSite/ua (push to `main` → GitHub Pages)
- New reusable component: `components/ui/ResponsiveText.vue` (`<UiResponsiveText>`)
- GA4 Measurement ID: `G-Z8QRF6TWC2` (public, unchanged)

---

## Session: 2026-06-03 16:10 Europe/Kiev — AI-search/SEO Phases 1–2 + off-site entity graph (MusicBrainz + Wikidata)

### Accomplished

- ✅ Researched Google's AI-optimization guide + multi-source deep research → `docs/ai-search-optimization-strategy.md` (verdict: AI optimization = SEO + entity-building; ignore llms.txt/AI-schema hype).
- ✅ Phase 1 (`9f4c464`): removed auto-generated keyword-meta everywhere; per-locale `<html lang>` (uk-UA/en-US); self-canonicals; i18n `baseUrl=SITE_URL`; real global meta description + 1200×630 social card.
- ✅ Phase 2 (`12a01fa`): new `composables/useStructuredData.ts` — MusicGroup+WebSite (home) + MusicRecording+BreadcrumbList (per release); reciprocal hreflang on home + policy pages only.
- ✅ Released-state CTA (`7314f71`): new optional `releaseSmartLink` field → "Listen on all platforms" button on `/listen/{slug}` when `musicPlatformLinks` empty (NO redirect; alina = id.ffm.to/alina). See release-states-system.md §4.
- ✅ Wired real artist URLs into `config/general.ts` (`7fe4e3e`, `972e183`) → JSON-LD `sameAs` = 8; footer "Listen on" section activated.
- ✅ Built off-site entity graph (browser automation): MusicBrainz artist enriched + Wikidata item Q140043384 created (full statements + 6 external IDs, P434↔MBID).
- ✅ Song stories + bio + per-song genre added, then visible parts REVERTED per user (`4ce8b2f`, `05aa326`): story now ONLY in MusicRecording JSON-LD `description`; About bio restored to original; genre is schema-only.
- ✅ MusicBrainz fully enriched: ISRCs, Wikidata reciprocal link, TikTok, genres, catalog#s, Чорні Птахи barcode, Spotify track links, Mania MV. (label + full credits skipped per user.)
- ✅ Added `docs/entity-setup-guide.md` (+ recurring "new release" runbook); saved band profile + track metadata to auto-memory. All pushed to STAGING; production untouched.

### Key decisions

- "Hide for bots" = JSON-LD (`MusicRecording.description`), NOT CSS-hidden body text (Google treats hidden text as spam) — per user's bot-only-not-visible request.
- USER PREFERENCE (firm): keep visible site changes MINIMAL; ASK before any visible change. Footer "Listen on" → user chose KEEP.
- Release-page canonical kept NON-localized (`/listen/{slug}`) to match sitemap + attribution variants; hreflang only where both locales are independently indexed (home + policies).
- Built the Wikidata item via authenticated `wbeditentity` API call from `evaluate_script` (far more reliable than clicking MB/Wikidata autocompletes).
- Did NOT store account passwords in repo/env (repo is PUBLIC); ephemeral in-session browser login only.

### Technical findings

- AI search crawlers (GPTBot/ClaudeBot/PerplexityBot/OAI-SearchBot) run ZERO JS → all meta/JSON-LD must stay setup-level (SSG-baked), never onMounted. Site is compliant; treat as a release gate.
  - Source: deep-research workflow (getpassionfruit.com, OpenAI/Anthropic bot docs)
- slug hyphen vs i18n underscore: `chorni-ptahy` slug ≠ `chorni_ptahy` i18n key → derive keys from `descriptionKey`, not slug (silently hid the story until fixed).
- MB external-links input is `type=url` (placeholder "Add link" then "Add another link"); YouTube Music `@handle` is rejected for that link type.

### Credentials & IDs obtained

- MusicBrainz + Wikidata accounts created (usernames in `reference_band_profile.md`); passwords were shared in chat — NOT written here; user advised to rotate + keep in a password manager.
- Distributor track metadata (ISRCs/UPCs/cat#s/composers) — saved to `reference_band_profile.md` (auto-memory).

### Blockers & open questions

- MB label: confirm "Darkwood Records" (exists in MB) vs "Darkwood Music Group" (band metadata) — same entity, or create new? (label currently `[no label]`.)
- Full MB credits (composers/lyricists/producer) skipped per user — would need ~5 Person entities + 2 Works.

### Next session: start here

1. When `Аліна` drops (~2026-06-12): add it to MusicBrainz (existing artist, same Add-Release flow); paste the real per-platform links into `data/musicLibrary.ts` `alina.musicPlatformLinks` (the CTA auto-swaps to the grid). Confirm the distributor primary-artist string is byte-identical "Woman Based Mechanics".
2. Optional: resolve the MB label + add full credits once the user decides.
3. Entity recognition builds over weeks — periodically probe ChatGPT/Gemini/Perplexity with "who is Woman Based Mechanics?" to track progress.

### Important IDs & links discovered this session

- MusicBrainz artist MBID: 62589d1f-dcf9-4e94-b5fc-a5e48c2e2368
- Wikidata item: Q140043384
- MB recordings: Манія `d36e69ee-4721-4a32-a343-10cfb7e22e85`, Чорні Птахи `5c1638aa-4c42-4c4b-ad77-c4c36bbbc339`
- YouTube channel ID: UCEa33Jt-s0wCajzG2enYPmA · Spotify artist 0HAHqBJrbpBocXeVJ90NoO · Apple artist 1849021570
- Strategy: `docs/ai-search-optimization-strategy.md` · Off-site guide: `docs/entity-setup-guide.md`
