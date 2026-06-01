# Testing Strategy — WBM Band Website

> Status: **proposal / not yet implemented.** This is a prioritized map of where to add tests
> across the whole app, plus the recommended tooling + CI wiring. Produced from a full-codebase
> audit (June 2026). Nothing here is wired up yet — the only existing "test" is the bespoke node
> script `scripts/test-source-attribution.ts` (`npm run test:attribution`).

**Legend** — Priority: `P0` critical (money / analytics data integrity / core domain), `P1` important,
`P2` nice-to-have, `P3` low. Effort: `S` <30 min, `M` ~1–2 h, `L` half-day+.

---

## 1. TL;DR

- **108 worthwhile test targets** found across 8 layers (95 from the layer audit + 13 cross-cutting
  gaps). The codebase is **very testable**: most business logic is pure or has a single, easily-mocked
  side effect.
- **Highest value, lowest effort: the pure utils** — `sourceAttribution`, `countdown`,
  `cache` keys/TTL, `isUpcomingRelease`. These drive the **analytics attribution + pre-save conversion
  funnel** (real money/data), are pure, and need almost no mocking. Start here.
- **Recommended stack:** **Vitest 4 + `@nuxt/test-utils` 4 + happy-dom**, `@vue/test-utils` +
  `@pinia/testing` for components/stores, **Playwright via `@nuxt/test-utils/e2e`** against the
  prerendered static output. Coverage via `@vitest/coverage-v8`. (Full version table in §3.)
- **First action:** port the existing `scripts/test-source-attribution.ts` into Vitest 1:1 — it's
  already a complete spec — then delete the bespoke harness.
- The audit also surfaced **9 latent bugs / risks** worth fixing or pinning with a test (§2).

---

## 2. Latent bugs & risks surfaced during the audit

These aren't test tasks — they're real issues found while reading the code. Each should be **fixed**,
or at minimum **pinned with a characterization test** so the current behavior can't silently change.

| #   | Severity | Issue                                                                                                                                                                                                                                                         | Location                                                                                                              |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | **High** | `getResponsiveImageSrcSet()` emits the **same URL for every width descriptor** — `getOptimizedImageUrl()` ignores `width`, so the `srcset` is `url 400w, url 800w, …` all pointing at one file. Responsive images aren't actually responsive.                 | `utils/imageHelpers.ts`                                                                                               |
| 2   | **High** | `getLatestReleases()` / `getAllReleases()` / `getReleasesByType()` call `musicLibrary.sort()` which **mutates the shared module-level array in place**. Interleaved calls corrupt ordering app-wide.                                                          | `data/musicLibrary.ts`                                                                                                |
| 3   | **High** | `public/robots.txt` is **0 bytes (empty)** and there is **no `sitemap.xml`** anywhere — a concrete crawl/SEO defect on a site whose whole point is discoverability.                                                                                           | `public/`                                                                                                             |
| 4   | Med      | **i18n silent fallback masking**: `fallbackLocale:'ua'` + `missingWarn:false` + `fallbackWarn:false` means a key missing in `en.json` renders **Ukrainian text on the English page with zero warning**. The locale-parity test becomes the _only_ safety net. | `i18n/i18n.config.ts`                                                                                                 |
| 5   | Med      | **No modal a11y**: `BaseModal` (and the music/team modals) have **no `role="dialog"`, no `aria-modal`, no focus trap, no focus restore** — only an Escape listener. Keyboard/SR users tab into the page behind the open modal.                                | `components/**/*Modal*.vue`                                                                                           |
| 6   | Med      | `SITE_BASE_URL = 'https://www.wbmband.com'` is **triplicated** (and hardcoded in the source-prefixed canonical pages) with a **www-vs-apex inconsistency** vs the deploy log's apex form. Not `DEPLOY_TARGET`-aware.                                          | `useMasterPage.ts`, `scripts/generate-bio-links.js`, `pages/index.vue`, `pages/{listen,pre-save}/[source]/[slug].vue` |
| 7   | Med      | `scripts/generate-bio-links.js` **hard-copies the 12 `SOURCE_PREFIXES` keys** from `utils/sourceAttribution.ts` with only a "keep in sync" comment. Drift → stale bio links that misattribute paid/social traffic.                                            | `scripts/generate-bio-links.js`                                                                                       |
| 8   | Low      | **Cache invalidation encoding asymmetry**: Cache-API mode matches against `encodeURIComponent`-encoded `request.url`; localStorage mode matches the raw key. A `                                                                                              | `/`/` pattern behaves differently per backend.                                                                        | `utils/api.ts` / `utils/cache.ts` |
| 9   | Low      | `isValidEmail()` accepts `a@b..c` (double dot) — weak regex used by the contact form.                                                                                                                                                                         | `utils/helpers.ts`                                                                                                    |

---

## 3. Recommended stack

Versions verified live against the installed Nuxt 3.17 / Node 22 (June 2026).

| Concern     | Choice                                                                                  | Notes                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Runner      | **Vitest 4** (`^4.1.8`)                                                                 | `@nuxt/test-utils@4` peers `vitest@^4`. Don't pin v3.                                                               |
| Nuxt bridge | **`@nuxt/test-utils` `^4.0.3`**                                                         | `mountSuspended` / `renderSuspended` / `mockNuxtImport` / `registerEndpoint` + the `nuxt` Vitest env + e2e harness. |
| DOM         | **happy-dom** `^20.9`                                                                   | test-utils default; ~2–3× faster than jsdom, sufficient here.                                                       |
| Components  | `@vue/test-utils` `^2.4` (+ optional `@testing-library/vue` `^8` for `renderSuspended`) |                                                                                                                     |
| Stores      | **`@pinia/testing` `^1.0.3`**                                                           | `createTestingPinia()` to stub `globalLoading` / `snackbar`.                                                        |
| E2E         | **Playwright** via `@nuxt/test-utils/e2e` (`setup({ host })` + `$fetch` / `createPage`) | Test the **prerendered `.output/public`**, not a live server — this is an SSG site with no prod runtime.            |
| Coverage    | `@vitest/coverage-v8` `^4`                                                              | Scope to `utils/ composables/ middleware/ config/`; start low, ratchet.                                             |

**Two Vitest "projects", one mental model:**

- **`unit`** (env `node`, no Nuxt) → all `utils/*` and anything with no Nuxt magic. Fastest. Import by **relative path**.
- **`nuxt`** (env `nuxt`) → composables/components/middleware that touch auto-imports, `useNuxtApp`, `#i18n`, `navigateTo`, etc. `~/` and `#imports` resolve here.
- **`e2e`** → a separate config + script (built site + browser). Keep it **out** of the default `vitest run` so the inner loop stays fast.

**Install:**

```bash
npm i -D @nuxt/test-utils@^4.0.3 vitest@^4.1.8 @vitest/coverage-v8@^4.1.8 \
  @vue/test-utils@^2.4.10 happy-dom@^20.9.0 @testing-library/vue@^8.1.0 \
  @pinia/testing@^1.0.3 playwright-core@^1.60.0
npx playwright install chromium
```

> **CI Node floor:** `@nuxt/test-utils@4` requires Node `^20.19 || ^22.12 || >=24`. The deploy workflow
> currently runs **Node 20 (plain)** — bump it to **22** (matches local). This dovetails with the already
> open "bump deploy.yml off Node 20 before 2026-06-16" item.

Config skeletons (`vitest.config.ts` with `defineVitestConfig` + `projects`, `test/setup.nuxt.ts`,
`vitest.e2e.config.ts`), the full `package.json` scripts block, and one example test per layer are in
§8 and §9.

---

## 4. Prioritized roadmap (suggested waves)

Each wave is independently shippable and leaves CI green.

| Wave                     | Goal                      | Contents                                                                                                                                                                                                                                                                   | Rough effort |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **0 — Stand up**         | Harness green             | Add deps + `vitest.config.ts` + `test/setup.nuxt.ts`; **port `test-source-attribution.ts` → `test/unit/`**; `npm run test` green; delete old script.                                                                                                                       | ½ day        |
| **1 — P0 pure logic**    | Lock money/analytics math | `sourceAttribution` (all 6 fns), `countdown` (boundary + UA plurals), `cache` (key/TTL/localStorage fallback), `isUpcomingRelease`, `isLikelyBot`. All `unit`, mostly `S`.                                                                                                 | 1 day        |
| **2 — P0 integration**   | Core domain               | The **release state machine**: `presave-access` + `listen-access` middleware + cross-middleware truth table; `useAnalytics` event payloads; `useCookieConsent` Consent-Mode mapping; `cachedApiRequest` flow.                                                              | 1–1.5 days   |
| **3 — Data & component** | Regression net            | Data-integrity (`musicLibrary` invariants, `coverColors` referential integrity, `teamMembers`), **locale parity** uk↔en, build-script drift guards (§7); component tests for `AlbumCover`, `ProgressiveImage`, `ErrorPage`, `ContactsSection` form, `CookieConsentToast`. | 2 days       |
| **4 — E2E smoke**        | Ship-blockers             | Distributor seamless redirect, pre-save→listen transition, source-prefix attribution, locale routing, **non-localized share-URL aliases**, `/404` contract, consent gate, **prerender completeness** (§6).                                                                 | 1.5 days     |
| **5 — Hardening**        | a11y + ratchet            | Modal focus-trap a11y, `TeamMemberCard` keyboard, `ProgressiveImage` fade contract, remaining P2/P3 unit tests; turn on coverage floor and ratchet.                                                                                                                        | ongoing      |

---

## 5. Detailed plan by layer

### 5.1 Pure / business-logic utils — `unit` (highest value)

| Target                                                                                    | Pri | Eff | What to assert                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceAttribution.detectFromPath()`                                                      | P0  | S   | All 12 `SOURCE_PREFIXES` map correctly; locale stripping (`/ua/`,`/en/`); `<3 segments` → null; unknown prefix → null; non-en/ua first segment treated as pageType → null; trailing/double-slash edges. |
| `sourceAttribution.detectFromReferrer()`                                                  | P0  | S   | Subdomain matching (`m.`,`l.`,`lm.facebook`); multi-host alternations (x/t.co/twitter); search catch-all; pinterest TLD wildcard; **anchor guard** (`instagram.com.evil.com`→null); malformed URL→null. |
| `sourceAttribution.detectFromUserAgent()`                                                 | P0  | S   | Real IG/TikTok(`musical_ly`)/FB(`FBAN`) UAs; TikTok alternates; **FB-before-IG ordering**; whatsapp/telegram; desktop→null.                                                                             |
| `sourceAttribution.detectSourcePlatform()`                                                | P0  | S   | Precedence path>referrer>UA; `other` vs `direct` fallback split; empty referrer never yields `other`.                                                                                                   |
| `sourceAttribution.getOrPersist/setExplicit/reset`                                        | P0  | M   | First-touch sessionStorage flow; **prefix path always overrides stored value**; SSR (`window` undefined)→`direct`.                                                                                      |
| `sourceAttribution.assertNoSlugCollisions()`                                              | P1  | S   | Throws + lists all collisions; passes clean; case-sensitivity documented.                                                                                                                               |
| `countdown.getLocalizedCountdown()` — math                                                | P0  | M   | `Math.ceil` boundaries (1440min→"1 day", 1441→"2 days"); empty/invalid/past→`''`; **needs frozen clock + pinned TZ**.                                                                                   |
| `countdown.getLocalizedCountdown()` — uk plurals                                          | P0  | M   | one/few/many by lastDigit & lastTwoDigits; **11–14 "many" exception**; `normalizeLocale` (ua→uk, en-us→en); prefix fallback.                                                                            |
| `configHelpers.getConfig()`                                                               | P1  | S   | Deep dot-path; fallback on missing name/key; **falsy-but-valid (`false`/`0`/`''`) returned, not replaced**; `errorLogging:false` silences.                                                              |
| `configHelpers` date fns (`isUpcomingRelease`/`getTimeUntilRelease`/`formatReleaseDate*`) | P1  | M   | `undefined`→true (TBA rule); ceil buckets Today/Tomorrow/In N; **TZ hazard**: date-only ISO parses as UTC midnight → cross-TZ cases.                                                                    |
| `configHelpers.shouldShowNextReleasePreview()` / `isPreSaveMode()`                        | P2  | S   | pre-save enabled ⇒ preview false (precedence); missing flags→false.                                                                                                                                     |
| `musicPlatforms.getMusicPlatform()` / `getDefaultPlatform()`                              | P2  | S   | Known key → full shape; unknown/`''`→default ("Listen"); case-sensitivity.                                                                                                                              |
| `isLikelyBot.isLikelyBot()`                                                               | P1  | S   | `navigator` undefined→false; `webdriver`→true; **empty UA→true**; bot UAs (Googlebot/Headless/GPTBot/ClaudeBot…); humans→false.                                                                         |
| `helpers.isValidEmail/truncateText/generateId`                                            | P2  | S   | Valid/invalid emails (**pin `a@b..c`=true defect**); truncate at exact maxLength; id charset/length.                                                                                                    |
| `helpers.debounce()` / `throttle()`                                                       | P2  | M   | Fake timers: debounce fires once w/ last args; throttle leading-edge + drops within limit.                                                                                                              |

### 5.2 Infrastructure utils — `unit` / `integration`

| Target                                                                 | Pri | Eff               | What to assert                                                                                                                                                                  |
| ---------------------------------------------------------------------- | --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache.generateCacheKey()`                                             | P0  | S                 | Deterministic `METHOD\|URL\|params\|body`; method uppercased; empty parts dropped (no dangling `\|`); **param-key-order produces different keys** (document).                   |
| `cache.get/set` TTL (Cache API)                                        | P0  | M                 | Round-trip; expire at `now-ts > ttl` boundary (off-by-one); expiry deletes entry; corrupt JSON→null.                                                                            |
| `cache` localStorage fallback                                          | P0  | M                 | No `caches`→fallback; prefixed keys; `clear()` leaves foreign keys; quota throw swallowed; SSR no-op.                                                                           |
| `api.invalidateCache()`                                                | P1  | M                 | String `includes` vs RegExp `test`; **Cache-API vs localStorage encoding asymmetry** (defect #8); SSR no-op.                                                                    |
| `api.cachedApiRequest()`                                               | P0  | L                 | Query build (null/undefined dropped, `?`vs`&`); cache only when `enabled && GET`; hit short-circuits fetch; non-2xx throws `HTTP <status>`; `apiDelete` forces `enabled:false`. |
| `imageHelpers.getOptimizedImageUrl()`                                  | P1  | S                 | `/images/`→`/images/optimized/` avif/webp/jpg; already-optimized early-return; **width/quality have no effect on URL** (pin).                                                   |
| `imageHelpers.generatePictureSources()` / `getResponsiveImageSrcSet()` | P1  | S                 | type strings; `sizes` default `100vw`; **witness defect #1: all srcset URLs identical**.                                                                                        |
| `imageHelpers.useImageLoading()`                                       | P1  | M (component env) | IntersectionObserver lazy-load state machine; load/error handlers flip flags.                                                                                                   |
| `cache.startAutoCleanup()` / singleton side effects                    | P2  | M                 | setInterval scheduled only when `window && 'caches'`; `cleanup(maxAge)` evicts stale.                                                                                           |

### 5.3 Data/logic composables — `unit` (`nuxt` env where noted)

| Target                                                                     | Pri | Eff | What to assert                                                                                                                  |
| -------------------------------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------- |
| `useReleaseTheme` color helpers (`hexToRgb`/`rgba`/`stringToHue`/`hslHex`) | P1  | S   | 3-digit vs 6-digit hex; deterministic slug→hue; HSL→hex round-trip. _(export the privates)_                                     |
| `useReleaseTheme().theme` 3-tier merge                                     | P0  | M   | Per-field precedence override>generated>fallback; slug-vs-id resolution; `vars`/`atmosphereClass` output.                       |
| `useCookieConsent` consent machine                                         | P0  | M   | accept/decline/snooze/reset persist to localStorage; **Consent-Mode v2 gtag mapping exact**; hydrate from storage.              |
| `useAnalytics.trackReleaseView` / `trackPlatformClick`                     | P0  | M   | View-dedup once per key (sessionStorage); **bot gating** suppresses; `transport_type:'beacon'`; mock `useGtag`+`isLikelyBot`.   |
| `useAssetUrl.resolveUrl()`                                                 | P1  | S   | `baseURL==='/'`→unchanged; `'/WBM-Band-WebSite/'`→prefixes absolute paths once, skips already-prefixed/external.                |
| `useMusicNavigation` routing                                               | P1  | M   | `isReleaseInPreSaveMode` = upcoming && (presave links \|\| distributor URL); `handleMusicClick` branch routing; modal keyboard. |
| `useShareFunctionality`                                                    | P2  | M   | `getCleanUrl` strips `from` param, SSR→`''`; Web Share→clipboard→`execCommand` ladder.                                          |
| `useErrorPage.redirectToError`                                             | P2  | S   | Builds `/404` query with only provided keys (undefined omitted); 4 preset redirects.                                            |
| `useApi.request()` lifecycle                                               | P2  | M   | loading toggle (respects `manageLoading:false`); error reset/set; cache defaults per verb.                                      |

### 5.4 UI/behavior composables — `unit`

| Target                                                                                              | Pri | Eff | What to assert                                                                 |
| --------------------------------------------------------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------ |
| `usePerformanceOptimization` → **extract** `computePerformanceLevel(metrics, prefersReducedMotion)` | P1  | M   | Full mobile-first vs desktop scoring tree → level + ~10 config fields.         |
| `usePerformanceOptimization` → **extract** `detectDeviceModel(ua)`                                  | P1  | M   | UA→{model,isFlagship,gpuTier} regex classification.                            |
| `useMasterPage` → **export** `buildKeywords`/`normalizeImageUrl`/`buildPageUrl`                     | P1  | M   | Cyrillic→Latin translit keywords; OG image normalization; canonical URL build. |
| `useImagePerformance.getPerformanceStats`/`getSlowImages`                                           | P2  | S   | Aggregation + empty-array guard + threshold filter.                            |
| `useHeroSlider` index math                                                                          | P2  | M   | Wraparound next/prev/goToSlide; reset on image-set length change.              |
| `useScrollAnimation` → extract `adaptThrottling`/EWMA                                               | P2  | L   | Throttle-ms decision (reduced-motion/low-perf/adaptive); rolling avg.          |
| `useImagePreloader` bucketing                                                                       | P3  | M   | `allSettled` fulfilled/rejected split; `maxImages` slice; empty early-return.  |
| `useAutoRotationControl` stagger                                                                    | P3  | S   | `index*STAGGER` delays; null-safe forEach; observer enter/leave.               |
| `useScrollTo` offset math                                                                           | P3  | S   | `rect.top+pageYOffset-offset` clamped ≥0; default 64; missing-el warn.         |
| `useGlobalLoading.withLoading`                                                                      | P2  | S   | `hideLoading` in `finally` even on throw; progress simulation clamps.          |
| `store/snackbar.ts` (not the pass-through `useSnackbar`)                                            | P3  | S   | id gen; per-type default timeouts; queue.                                      |

### 5.5 Middleware + release state machine — `integration` (core domain, mostly P0)

| Target                                                                     | Pri | Eff | What to assert                                                                                                      |
| -------------------------------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------------------------------------------- |
| `configHelpers.isUpcomingRelease()`                                        | P0  | S   | The clock-boundary fn driving the whole machine; future/past/undefined; frozen clock.                               |
| `middleware/presave-access.ts` (4-branch tree)                             | P0  | L   | no-slug pass-through; unknown slug; released→redirect `/listen`; presave-disabled/links-missing→`/404` contract.    |
| `middleware/listen-access.ts` (mirror)                                     | P0  | L   | Its **asymmetry** with presave: not-upcoming gating, redirect/404 branches.                                         |
| Cross-middleware truth table                                               | P0  | M   | Parameterized over (date vs now, `enablePreSave`, presave-links, distributor URL) → asserts consistent destination. |
| `musicLibrary.getReleaseBySlug/ById/getFeaturedReleases/getReleasesByType` | P1  | S   | Correct record/undefined; reserved-slug guard.                                                                      |
| `musicLibrary.getNearestUpcomingPreSaveRelease()`                          | P1  | M   | Soonest future release with presave links; drives `/pre-save/index`.                                                |
| `musicLibrary.getLatestReleases/getAllReleases`                            | P1  | S   | **Pin/fix the in-place `.sort()` mutation (defect #2).**                                                            |
| `configHelpers.formatReleaseDate()`                                        | P2  | S   | date-vs-datetime branch (`T`/`:`); locale output.                                                                   |
| `configHelpers.getConfig()` + `shouldShowNextReleasePreview()`             | P2  | S   | Flag reads middleware depends on.                                                                                   |
| `middleware/redirect-share-urls.global.ts`                                 | P1  | S   | **Stays inert** (unconditional early `return`); regression guard so it isn't re-enabled.                            |
| `middleware/i18n-root-redirect.global.ts`                                  | P2  | S   | bare `/`→localized home; non-`/` and SSR short-circuit.                                                             |
| `pages/index.vue` maintenance gate + `latestRelease`                       | P2  | M   | `maintenanceMode`→`createError 503`; `new Date(undefined)` edge.                                                    |
| `pages/pre-save/[slug].vue` + `[source]/[slug].vue` distributor redirect   | P1  | L   | `willAutoRedirect`/`showRedirectScreen` onMounted flow (component-level).                                           |
| `pages/pre-save/index.vue` redirect dispatcher                             | P1  | M   | 3-way: disabled/no-release→home; distributor→external; else nearest presave.                                        |
| `server/middleware/dev-base-redirect.ts`                                   | P3  | S   | Dev-only strip of `/WBM-Band-WebSite` prefix (307); no-op in prod.                                                  |

### 5.6 Stores + data integrity + i18n parity — `unit`

| Target                                                              | Pri | Eff | What to assert                                                                                                               |
| ------------------------------------------------------------------- | --- | --- | ---------------------------------------------------------------------------------------------------------------------------- |
| `store/snackbar.ts` timer lifecycle                                 | P1  | M   | Auto-hide after `timeout`; pause clears + computes `remainingTime`; resume re-arms.                                          |
| `store/snackbar.ts` hide/hideAll + `nextId`                         | P1  | S   | Immediate `show=false`, clears pending timer, splices after 500ms; id monotonic.                                             |
| `store/snackbar.ts` show\* defaults + `visibleSnackbars`            | P2  | S   | Per-type default timeouts (error 6000 / warning 5000 / success-info 4000).                                                   |
| `store/globalLoading.ts`                                            | P2  | S   | show/hide/`setProgress` clamp [0,100]; 300ms reset.                                                                          |
| `useGlobalLoading.withLoading`                                      | P1  | M   | `hideLoading` in `finally` on reject.                                                                                        |
| **Locale parity** uk.json ↔ en.json                                | P1  | M   | Identical key sets (**with the legit `days_remaining` plural-key whitelist**); no empty strings. _(Sole net for defect #4.)_ |
| Release/nav/team i18n keys resolve in **both** locales              | P1  | M   | Every `titleKey`/`nameKey`/nav label key exists in uk **and** en.                                                            |
| `musicLibrary` structural invariants                                | P1  | M   | Non-empty id/slug/title; **unique** slug & id; valid `type` enum; well-formed links.                                         |
| `musicLibrary` helpers + **sort-mutation**                          | P1  | M   | Lookups correct; pin/fix the shared-array mutation (defect #2).                                                              |
| `countdown` uk plural selection (consumer of the parity divergence) | P1  | M   | 11–19 exception + en singular/plural + guard branches.                                                                       |
| `coverColors.generated.ts` referential integrity                    | P2  | S   | Every `release.slug` has a palette; hex validity; `getCoverPalette`.                                                         |
| `config/navigation.ts` composition                                  | P3  | S   | `footerNavigation === [...left, ...right]`; no dup `elementId`; label-key format.                                            |
| `data/teamMembers.ts` integrity                                     | P2  | S   | Unique ids; `nameKey`/`roleKey` present; non-empty image paths; placeholder-leak guard.                                      |

### 5.7 Vue components — `component` (`mountSuspended`)

| Target                                     | Pri | Eff | What to assert                                                                                                                      |
| ------------------------------------------ | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ContactsSection.vue` form submit machine  | P0  | L   | Double-submit guard; `isSubmitting` flips; Web3Forms success/error states; `socialLinks` computed.                                  |
| `AlbumCover.vue`                           | P1  | M   | `badgeVariant` (single/album/ep→variant, else glass); `displayTypeName` i18n + locale fallback; `handleImageError`→fallback render. |
| `ProgressiveImage.vue`                     | P1  | L   | `shouldLoadImage` eager-vs-lazy gate; load/error flips; error+spinner blocks; portraitSources; cached-image onMounted fade.         |
| `ErrorPage.vue`                            | P1  | M   | query>props>i18n precedence per field; `errorCode` derivation (403/404/500/503); button routing.                                    |
| `CookieConsentToast.vue`                   | P1  | L   | `visible = delayed && isUndecided`; accept/decline delegation; swipe-snooze axis-lock + threshold.                                  |
| `MusicCard.vue`                            | P2  | M   | `displayTitle/Description` stable fallback; `formattedDate` Europe/Kyiv; `handleClick` emit.                                        |
| `MusicLibrarySection.vue` gating computeds | P2  | L   | `displayedReleases` filters upcoming + dedupes; `shouldShowPreSaveCard`/`shouldShowComingSoon`/`upcomingRelease`.                   |
| `TeamMemberCard.vue`                       | P2  | L   | `selectRandomImage` exclusion; crossfade; hover debounce; mobile auto-rotate; click/keyboard emit.                                  |
| `Snackbar.vue`                             | P3  | S   | class-mapper helpers per type (default info); store-driven render.                                                                  |
| `AppButton.vue`                            | P3  | S   | `handleClick` suppressed when disabled/loading; `buttonClasses`/`iconClasses`.                                                      |

### 5.8 End-to-end — Playwright vs prerendered `.output/public`

| Scenario                                                   | Pri | Eff | Guards against                                                                                |
| ---------------------------------------------------------- | --- | --- | --------------------------------------------------------------------------------------------- |
| Distributor **seamless redirect** (no empty-page flash)    | P0  | M   | Regression of commit `74dd10a`; prerendered HTML already shows redirect screen.               |
| Pre-save **auto-transition to listen** after `releaseDate` | P0  | M   | Stale pre-save link after release; page guard + middleware 301.                               |
| **Source-prefix attribution** lands + fires analytics      | P0  | M   | All 12 prefixes render the listen/pre-save page and attribute correctly.                      |
| **Cookie-consent gate** blocks GA4 until accepted          | P0  | L   | Consent-Mode default-deny; no analytics cookies pre-accept.                                   |
| `?bypass=true` escape hatch                                | P1  | S   | Cancels distributor nav, reveals full pre-save body.                                          |
| Locale routing + bare `/`→localized home                   | P1  | S   | Default ua; `/en/...` English; localePath links.                                              |
| **Non-localized share-URL aliases** resolve                | P1  | M   | `create-nonlocalized-aliases.js` actually ran; root `/listen/*` + `/pre-save/*` exist.        |
| `/404` contextual contract                                 | P1  | S   | query params render verbatim; `errorCode` derivation.                                         |
| Maintenance mode 503 (home only)                           | P1  | M   | Home throws 503; other pages stay up.                                                         |
| Dev-only pages excluded from output                        | P2  | S   | `test.vue`/`performance-test.vue` absent from `.output/public`.                               |
| Policy pages render + link integrity                       | P2  | S   | cookies/privacy/terms in both locales; cookies-policy reset calls `useCookieConsent().reset`. |

---

## 6. Cross-cutting gaps (caught by the completeness critic — finders missed these)

These are **whole categories with zero entry** above. Several are cheap and high-value.

| Target                                                                                                                                                                         | Pri    | Type        | Why it matters                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Prerender completeness**: `nitro.prerender.routes` ⊇ every release slug × {listen,pre-save} × {prefixed,unprefixed} × {en,ua}; `.htaccess`/alias targets all exist in output | **P0** | e2e         | Single biggest static-output gap. Add a release / a prefix and skip `generate` → shared link 404s with only a warning. Post-generate test asserts each `index.html` exists.                                  |
| **`.htaccess` ↔ `_redirects` contract**                                                                                                                                       | P1     | integration | Two backends encode the same share-URL routing with **different semantics** (Apache internal rewrite vs Netlify 301), both hardcode `/ua/`. Parse + assert both agree and target existing prerendered paths. |
| **`generate-bio-links.js` SOURCE_PREFIXES drift**                                                                                                                              | P1     | unit        | Hard-copies the 12 keys (defect #7). Node test: `Object.keys(canonical)` deep-equals the script's copy + base-URL match.                                                                                     |
| **`create-nonlocalized-aliases.js` actually ran**                                                                                                                              | P1     | e2e         | Silent no-op if source dir missing → root share URLs 404. Assert root `listen/<slug>/index.html` exists and mirrors the ua build.                                                                            |
| **`DEPLOY_TARGET=github` head prefixing**                                                                                                                                      | P1     | integration | ~30 hand-written `(github ? '/WBM-Band-WebSite' : '') + path` concatenations across favicons/manifest/og. Assert every href is prefixed exactly once under github and not at all when unset.                 |
| **i18n silent-fallback masking**                                                                                                                                               | P1     | integration | Defect #4 — mount each EN release page, assert no title/description equals its uk.json value (didn't fall through to UA).                                                                                    |
| **`robots.txt` non-empty + sitemap present**                                                                                                                                   | P1     | e2e         | Defect #3 — currently 0 bytes, no sitemap.                                                                                                                                                                   |
| **Single-source-of-truth host** (`www.wbmband.com`)                                                                                                                            | P2     | unit        | Defect #6 — assert all 4 sources agree; source-prefixed canonicals strip the prefix to `/listen/<slug>` (SEO dedup).                                                                                         |
| **Modal a11y** (focus trap / role=dialog / aria-modal / focus restore)                                                                                                         | P2     | component   | Defect #5 — focus moves into modal on open, is trapped, returns to opener on close.                                                                                                                          |
| **`TeamMemberCard` keyboard activation**                                                                                                                                       | P2     | component   | Enter **and** Space (with `preventDefault` so Space doesn't scroll) emit click; visible focus state.                                                                                                         |
| **`ProgressiveImage` fade contract** (commit `34bd258`)                                                                                                                        | P2     | component   | Cached `img.complete` still double-rAF fades (no pop); `image-class` never introduces a transition that strips opacity.                                                                                      |
| **`extract-cover-colors.js` math + manifest freshness**                                                                                                                        | P2     | unit        | `rgbToHsl`/`hslToRgb` round-trip; re-run extraction on fixtures, diff vs committed `coverColors.generated.ts` to catch a skipped `extract-colors`.                                                           |

> The build-script & config-file checks are **runner-free plain node** — they can ship immediately as
> standalone checks (mirroring `scripts/test-source-attribution.ts`) even before Vitest is stood up.

---

## 7. CI, hooks, coverage

- **`.github/workflows/test.yml`** (new): on push + PR to `main` → `npm ci`, `npm run lint`,
  `npm run test -- --coverage`; separate `e2e` job (`needs: test`) that runs `npx playwright install
--with-deps chromium` then `npm run test:e2e`. **Node 22.**
- **Gate deploy**: add a `test` job to `deploy.yml` and `needs: test` on `build` so a red suite blocks
  the Pages deploy.
- **Husky**: keep **pre-commit** fast (lint-staged only). Add **pre-push** running
  `npm run test:unit && npm run test:nuxt` (the fast suites). **Never** put e2e in a hook (it builds the
  whole site). Don't add tests to `lint-staged` (per-file, would run on every commit).
- **Coverage ratchet**: scope `include` to `utils/ composables/ middleware/ config/`. Start the floor
  just under the first real run (e.g. lines/fn/stmt 35, branches 25), green on day one; bump toward ~70%
  each PR. Never set a threshold you aren't already above.

`package.json` scripts to add:

```jsonc
"test": "vitest run",
"test:watch": "vitest",
"test:unit": "vitest run --project unit",
"test:nuxt": "vitest run --project nuxt",
"coverage": "vitest run --coverage",
"test:e2e": "npm run generate && npm run test:e2e:run",
"test:e2e:run": "vitest run --config vitest.e2e.config.ts"
// keep test:attribution until the port is verified green, then delete
```

---

## 8. Config skeletons

`vitest.config.ts`:

```ts
import { defineVitestConfig, defineVitestProject } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['utils/**', 'composables/**', 'middleware/**', 'config/**'],
      exclude: ['**/*.d.ts', 'scripts/**', '**/types/**'],
      thresholds: { lines: 35, functions: 35, statements: 35, branches: 25 }
    },
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['test/unit/**/*.{test,spec}.ts'] }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environmentOptions: {
            nuxt: { domEnvironment: 'happy-dom', mock: { intersectionObserver: true } }
          },
          setupFiles: ['./test/setup.nuxt.ts']
        }
      })
    ]
  }
})
```

`test/setup.nuxt.ts`:

```ts
import { vi } from 'vitest'
// nuxt-gtag isn't in the test runtime — stub so analytics composables don't explode.
mockNuxtImport('useGtag', () => () => ({
  gtag: vi.fn(),
  initialize: vi.fn(),
  enableAnalytics: vi.fn(),
  disableAnalytics: vi.fn()
}))
// Web Cache API isn't in happy-dom — minimal shim.
if (typeof globalThis.caches === 'undefined') {
  // @ts-expect-error minimal shim
  globalThis.caches = {
    open: async () => ({
      match: async () => undefined,
      put: async () => {},
      delete: async () => {}
    })
  }
}
```

---

## 9. One example per layer

**(a) Pure util — `test/unit/source-attribution.spec.ts`** (port of the existing harness)

```ts
import { describe, it, expect } from 'vitest'
import { detectFromPath, assertNoSlugCollisions } from '../../utils/sourceAttribution'

describe('detectFromPath', () => {
  it('maps source prefixes to platforms', () => {
    expect(detectFromPath('/listen/i/mania')).toBe('instagram')
    expect(detectFromPath('/ua/listen/tt/mania')).toBe('tiktok')
    expect(detectFromPath('/listen/mania')).toBeNull()
  })
})
describe('assertNoSlugCollisions', () => {
  it('throws when a slug shadows a reserved prefix', () =>
    expect(() => assertNoSlugCollisions(['mania', 'i'])).toThrow())
})
```

**(b) Component — `test/nuxt/album-cover.nuxt.spec.ts`**

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AlbumCover from '~/components/ui/AlbumCover.vue'

it('renders the single badge variant', async () => {
  const w = await mountSuspended(AlbumCover, {
    props: { imageUrl: '/images/x.png', alt: 'x', releaseType: 'single' }
  })
  expect(w.html()).toContain('single')
})
```

**(c) Middleware — `test/nuxt/presave-access.nuxt.spec.ts`**

```ts
// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
const navigateTo = vi.fn()
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport(
  'getConfig',
  () => (p: string, o: any) => (p === 'general.enablePreSave' ? false : o?.fallback)
)

describe('presave-access', () => {
  beforeEach(() => navigateTo.mockClear())
  it('redirects to /404 when pre-save is disabled', async () => {
    const mw = (await import('~/middleware/presave-access')).default as any
    await mw({ params: { slug: 'mania' } } as any, {} as any)
    expect(navigateTo).toHaveBeenCalledWith(expect.objectContaining({ path: '/404' }), {
      replace: true
    })
  })
})
```

**(d) E2E — `test/e2e/static.e2e.spec.ts`** (run `npm run generate` + serve `.output/public` first)

```ts
import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

describe('prerendered static site', async () => {
  await setup({ host: 'http://localhost:3000' })
  it('serves the ua home before hydration', async () => {
    expect(await $fetch('/ua')).toContain('<html')
  })
  it('exposes the non-localized listen alias', async () => {
    const page = await createPage('/listen/mania')
    await expect(page.locator('body')).toBeVisible()
  })
})
```

---

## 10. Sources

- [Nuxt 3 Testing](https://nuxt.com/docs/3.x/getting-started/testing) · [@nuxt/test-utils](https://github.com/nuxt/test-utils)
- [Vitest Projects](https://vitest.dev/guide/projects) · [Vitest 3.2 (workspace→projects)](https://vitest.dev/blog/vitest-3-2.html)
- Versions/peers verified via `npm view` (June 2026): `@nuxt/test-utils@4.0.3`, `vitest@4.1.8`, `@vue/test-utils@2.4.10`, `happy-dom@20.9.0`, `@pinia/testing@1.0.3`, `@vitest/coverage-v8@4.1.8`, `playwright-core@1.60.0`.
