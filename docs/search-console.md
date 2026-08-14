# Google Search Console — Audit, Fix Plan & Operating Playbook

**Property:** `https://www.wbmband.com/` (URL-prefix) · added **13 July 2026** · owner verified via `public/google103d13ccfac788fe.html`
**Audit date:** 14 August 2026 (GSC data through 13/08/2026, crawl stats through 12/08/2026)
**Related docs:** [AI Search & SEO Strategy](./ai-search-optimization-strategy.md) · [Off-Site Entity Setup](./entity-setup-guide.md) · [Deployment Guide](./deployment-guide.md)
**Related skill:** [`.claude/skills/search-console/`](../.claude/skills/search-console/SKILL.md)

---

## 1. Executive summary

The property is technically clean — verified, no manual actions, no security issues, valid `robots.txt`, 95 % `200` responses, 221 ms average response time, HTTPS everywhere. Nothing is broken at the hosting or trust layer.

The problem is **reach**: after a month in the index, Google knows **exactly 2 URLs** on this site and has indexed **1**. All 4 clicks and 94 impressions in the last 90 days come from the homepage alone. The 24 URLs in `sitemap.xml` — every release page, every lyrics page — are invisible to Google.

Two root causes explain nearly all of it:

1. **The sitemap has never been submitted**, and Google's own discovery crawling has effectively stopped (`Discovery < 1 %` of 531 crawl requests). Google is re-fetching the one page it knows and nothing else.
2. **The root URL serves English to Googlebot.** `/` is a client-side locale-detecting redirect shell. Googlebot crawls with an English `Accept-Language`, so it renders the English home at `/`. Google's stored copy of `https://www.wbmband.com/` literally reads `<html lang="en-US">` with the English title. Because `/en` then renders identically, Google merged it into `/` ("Duplicate, Google chose different canonical than user"). The Ukrainian homepage has **no indexable URL at all** — and 75 % of the audience is in Ukraine.

Fixing these two is the whole game. Everything else in this document is second-order.

---

## 1a. Status — what shipped on 14 Aug 2026

All repo fixes below are **implemented, built and verified locally** (44 test files / 1105 tests green, ESLint 0 errors, `npm run generate` clean). **Not yet deployed** — none of it reaches Google until `npm run deploy:production` runs.

| Change                                                                           | File                                                                     | Verified by                                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` now serves the Ukrainian home instead of the empty shell                     | `scripts/create-nonlocalized-aliases.js`                                 | built `index.html` is byte-identical to `ua/index.html`: `<html lang="uk-UA">`, UA title, `canonical` → origin, full reciprocal hreflang, `MusicGroup`+`WebSite` JSON-LD, 1689 chars of body text (was 52) |
| Browser-language auto-redirect disabled; root middleware deleted                 | `nuxt.config.ts`, `middleware/i18n-root-redirect.global.ts` (removed)    | `detectBrowserLanguage: false`; language choice is the existing `<CommonLanguageSwitcher>`                                                                                                                 |
| SPA fallback repointed at the real shell                                         | `public/.htaccess`                                                       | `RewriteRule ^ 200.html` — `index.html` is now a real document, so falling back to it would flash the homepage                                                                                             |
| Unreleased `/listen/*` dropped from the sitemap + `noindex` on the redirect stub | `scripts/generate-sitemap.js`, `nuxt.config.ts` (`prerender:generate`)   | build logs `↳ skipping /listen/khvyli`; the stub now starts `<meta name="robots" content="noindex">`                                                                                                       |
| `301` apex → `www`                                                               | `public/.htaccess`                                                       | rule added ahead of all rewrites, with localhost/127.0.0.1 exclusions                                                                                                                                      |
| Crawlable internal links                                                         | `components/ui/MusicCard.vue`, `components/music/MusicDetailContent.vue` | `/` → `/listen/{alina,chorni-ptahy,mania}`; `/listen/<slug>` ⇄ `/lyrics/<slug>`; `/en` → `/en/listen/*` → `/en/lyrics/*`                                                                                   |

The internal-link work needed two different techniques, both of which keep the existing UX exactly as it was:

- **Home cards** can't become anchors — they contain the streaming links, and `<a>` inside `<a>` is invalid HTML. The release _title_ is the link instead; a plain left click is prevented so the card's own handler still opens the modal, and modified clicks open the real URL.
- **The lyrics pill** on release pages renders as a native `<a>` via `MusicHeroPill`'s existing `as="a"` API (already used by the Music Video pill), with the plain click prevented so the History-API cross-slide morph is untouched. Verified in the browser: clicking swaps the panes, updates the URL, never navigates or remounts.

Test note: switching the browser-language detection off changed the _test_ runtime's default locale from English to `ua` — the suite had been silently inheriting the very bug this fixes. 24 tests were updated to state the locale they assert instead of inheriting one; `test/nuxt/helpers/i18n.ts` loads a locale's lazy bundle before switching to it.

### Resolved the same day — the clean UA URLs no longer redirect

Verifying the fix surfaced a **pre-existing** conflict: `@nuxtjs/i18n`'s `strategy: 'prefix'` made `/ua/...` the real routes, and the clean URLs every page declares as canonical (`/`, `/listen/x`, `/lyrics/x`) existed only as post-build file copies — so each one client-redirected to its `/ua/...` twin while claiming to be canonical. Same class of canonical-vs-rendered conflict that caused the home-page bug.

Switched to **`strategy: 'prefix_except_default'`**: Ukrainian is served natively at the clean URLs, English at `/en/...`, and `/ua/...` no longer exists. Knock-on changes:

- `scripts/create-nonlocalized-aliases.js` **deleted** — the copies it faked are now real prerendered routes. Removed from `generate` and `deploy:github`.
- `public/.htaccess` — `301` from `/ua` and `/ua/*` to the clean form so old shared links and anything Google already knows keep working; the `/ua/*` internal rewrites replaced by in-place directory serving for `/listen|/pre-save|/lyrics` and their `/en` twins.
- `public/_redirects` — same contract for a hypothetical Netlify/Vercel host.
- Policy pages canonical/hreflang: `/privacy-policy` (was `/ua/privacy-policy`), likewise terms and cookies.
- `scripts/generate-sitemap.js` — UA policy URLs unprefixed.
- `test/unit/routing-contract.spec.ts` — the drift-guard rewritten to pin the NEW contract: `prefix_except_default`, no `/ua` in `STATIC_ROUTES`, no alias script, `/ua/*` must 301.

**Verified in the browser on the built output:** `/`, `/listen/alina` and `/lyrics/alina` all stay on their own URL with no redirect, each matching its declared canonical exactly; the language switcher round-trips `/` ⇄ `/en`; and the lyrics pill still morphs in place (URL `/listen/alina` → `/lyrics/alina` via the History API, no navigation, no remount).

---

## 2. What the console actually shows

### 2.1 Performance — last 3 months

| Metric            | Value  |
| ----------------- | ------ |
| Total clicks      | **4**  |
| Total impressions | **94** |
| Average CTR       | 4.3 %  |
| Average position  | 7.4    |

Last 28 days: 4 clicks (previously 0), 81 impressions (**+523 %**). The trend is real, just tiny.

**Queries — all 8 of them:**

| Query                         | Clicks | Impressions |
| ----------------------------- | ------ | ----------- |
| woman based mechanics         | 1      | 18          |
| wbm                           | 0      | 8           |
| w.b.m. music official website | 0      | 3           |
| based woman                   | 0      | 2           |
| wbm music                     | 0      | 2           |
| .wbm                          | 0      | 1           |
| wbm stand for                 | 0      | 1           |
| based women                   | 0      | 1           |

Every query is Latin-script, brand/navigational, and generic. **There is not one Ukrainian query** — no `вбм`, no `хвилі wbm`, no `аліна слова`, no song title in Cyrillic. There are also zero song-level queries, because no song page is indexed.

Note `wbm`, `based woman`, `based women`, `wbm stand for`, `.wbm` — these are the **acronym-collision** impressions the `disambiguatingDescription` in the JSON-LD is meant to fight. They convert at 0 %.

**Pages:** one row — `https://www.wbmband.com/` (4 clicks / 94 impressions).
**Countries:** Ukraine 3/49 · Germany 1/4 · UK 0/7 · Poland 0/6 · Russia 0/4.
**Devices:** Mobile 4/53 · Desktop 0/40 · Tablet 0/1.
**Search Appearance:** _No data_ — zero rich results of any kind.

### 2.2 Page indexing

|                 |                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| All known pages | **2**                                                                                                                     |
| Indexed         | **1** — `https://www.wbmband.com/`, last crawled 5 Aug 2026                                                               |
| Not indexed     | **1** — `https://www.wbmband.com/en`, _Duplicate, Google chose different canonical than user_, first detected 25 Jul 2026 |

URL Inspection on `/en`:

- User-declared canonical: `https://www.wbmband.com/en`
- **Google-selected canonical: `https://www.wbmband.com/`**
- Discovery → Sitemaps: _Temporary processing error_ · Referring page: `https://www.wbmband.com/`
- Crawl allowed: Yes · Page fetch: Successful · Indexing allowed: Yes

Nothing is blocking Google. Google simply decided the two URLs are the same page — and it is right, because they render the same page.

### 2.3 Sitemaps

**Submitted sitemaps: 0.**

`https://www.wbmband.com/sitemap.xml` exists, returns `200`, contains 24 URLs, and is declared in `robots.txt`. Google has never been told to process it, and the `robots.txt` reference alone has not been enough — the URL Inspection "Discovery → Sitemaps" field reports a processing error rather than a sitemap name.

### 2.4 Crawl stats — last 90 days

531 requests · 6.42 MB · 221 ms average response · host status clean for 90 days.

| By response             |      | By file type |          | By purpose |           | By Googlebot type  |      |
| ----------------------- | ---- | ------------ | -------- | ---------- | --------- | ------------------ | ---- |
| OK (200)                | 95 % | JavaScript   | **62 %** | Refresh    | **100 %** | Page resource load | 87 % |
| Not modified (304)      | 4 %  | CSS          | 21 %     | Discovery  | **< 1 %** | Smartphone         | 7 %  |
| Moved permanently (301) | 1 %  | Image        | 7 %      |            |           | Image              | 5 %  |
|                         |      | Other        | 5 %      |            |           | Desktop            | 1 %  |
|                         |      | **HTML**     | **3 %**  |            |           |                    |      |

This table is the diagnosis in numbers. Google spends 87 % of its budget loading page resources for the SPA and only 3 % on HTML documents, and it is discovering essentially nothing new. Per Google's documentation, `Discovery` means "the URL was never crawled before" — under 1 % on a site with 24 sitemap URLs and 4 releases means new content is not reaching the crawler.

### 2.5 Experience, enhancements, security

- **Core Web Vitals:** _Not enough usage data_ for mobile and desktop. CrUX needs real-user volume; the site does not have it yet. Lab performance is tracked separately via `npm run test:perf`.
- **HTTPS:** 1 HTTPS page, 0 non-HTTPS. Clean.
- **Enhancements:** _No enhancements yet._ Expected — the one indexed page (the root shell) carries no JSON-LD, and Google publishes no rich result for music/lyrics schema. `BreadcrumbList` on the lyrics pages is the only earnable card here, and those pages are not indexed.
- **Manual actions:** none. **Security issues:** none.

### 2.6 Links

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| External links | **1** — from `setlist.fm`, anchor text "official homepage", to `/` |
| Internal links | **0**                                                              |

Internal links reads 0 because Google has an internal link graph of one page. It is a symptom, not an independent problem.

### 2.7 Settings

| Setting                | State                                                 |
| ---------------------- | ----------------------------------------------------- |
| Ownership verification | ✅ Verified owner                                     |
| Users and permissions  | Woman Based Mechanics                                 |
| **Associations**       | ❌ **Empty** — no GA4, no YouTube                     |
| Change of address      | Not applicable                                        |
| **Bulk data export**   | ❌ **Not configured**                                 |
| Search generative AI   | ✅ Inherit from `wbmband.com` → **Include** (correct) |
| robots.txt             | ✅ Valid                                              |
| Crawl stats            | 531 requests / 90 days                                |

**Other properties in the account:** Instagram `@wbmband`, TikTok `@womanbasedmechani`, YouTube `@wbmbandofficial` (the social-channel property type), plus this URL-prefix property. **There is no Domain property.**

### 2.8 Achievements

_4 / 5 Google Search impact_ — five clicks in 28 days unlocks it. One click away.

---

## 3. Findings, ranked

### 🔴 P0 — The root URL serves English to Googlebot, collapsing both languages into one page

**Evidence.** Google's stored copy of `https://www.wbmband.com/` begins:

```html
<!DOCTYPE html>
<html data-svh-ready="1" lang="en-US" …>
  <title>Woman Based Mechanics (WBM) — Kyiv Alternative Rock Band</title>
</html>
```

The static HTML served at `/` has the _Ukrainian_ title. Google indexed the _English_ one — proof that Googlebot executed the client-side redirect and rendered the English home.

**Mechanism.** `nuxt.config.ts` configures `@nuxtjs/i18n` with:

```ts
detectBrowserLanguage: {
  redirectOn: 'root',
  alwaysRedirect: true,
  fallbackLocale: 'ua'
}
```

plus `middleware/i18n-root-redirect.global.ts`, which sends `/` to `localePath('/')` on the client. Googlebot requests with an English `Accept-Language`, so `localePath('/')` resolves to `/en`.

Meanwhile the deployment copies `200.html` (the empty SPA fallback shell — 52 characters of body text, no canonical, no hreflang, no JSON-LD) to `index.html`. So `/` is a content-free shell whose rendered output depends on the visitor's language.

**Consequences, all of them observed:**

- `/ua` self-canonicalizes to `https://www.wbmband.com` (by design — see the `seo-entity` skill), but that URL serves English. **The Ukrainian homepage has no indexable representation.**
- `/en` and `/` render identically, so Google deduplicated them and kept `/`. That is the "Duplicate, Google chose different canonical than user" row.
- Google's guidance is explicit that it may reject a declared canonical when pages are effectively identical, and that redirects are the strongest canonical signal while a `rel=canonical` is only a hint.
- Google's localized-versions documentation never endorses `Accept-Language`-based auto-redirects; it recommends explicit `hreflang` plus a user-facing language selector.
- Ukraine is 75 % of clicks and 52 % of impressions, and the page Google shows them is titled in English.

**Recommended fix (smallest blast radius, keeps the already-indexed root):**

1. In `scripts/deploy-production.js`, create `index.html` from **`ua/index.html`**, not from `200.html`. The root then serves the real Ukrainian home — with its UA title, meta, `MusicGroup`/`WebSite` JSON-LD, self-canonical and full reciprocal hreflang — exactly what the current canonical design already assumes. (This is the same alias trick `scripts/create-nonlocalized-aliases.js` already uses for `/listen/*` and `/lyrics/*`.)
2. Disable the automatic locale redirect on `/` — set `detectBrowserLanguage: false` (or `alwaysRedirect: false`) and drop `middleware/i18n-root-redirect.global.ts`. Language choice moves to the existing visible switcher, which is what Google recommends.
3. Keep the `200.html` SPA fallback for deep-link routing; just stop letting it be the homepage.
4. Re-inspect `/` and `/en` in GSC, then **Validate Fix** on the duplicate-canonical issue.

The alternative — `301` from `/` to `/ua` and moving the UA canonical to `/ua` — also works and is more conventional, but it changes the canonical of the only page that currently holds any equity and contradicts the canonical model documented in the `seo-entity` skill. Prefer option 1 unless the band wants `/ua` as the public Ukrainian URL.

> This fix needs sign-off before implementation — it changes what the homepage URL serves.

### 🔴 P0 — The sitemap has never been submitted, and discovery has stalled

`Discovery < 1 %` with 24 live sitemap URLs is the clearest signal in the whole console. Google's `robots.txt` `Sitemap:` directive is a weaker channel than an explicit submission, and URL Inspection is reporting a sitemap processing error rather than a resolved sitemap name.

**Fix:** Sitemaps → submit `sitemap.xml`. Then watch "Discovered pages" and the Page-indexing "All known pages" count over the following 1–2 weeks.

John Mueller's repeated caveat applies: a sitemap is a discovery and priority _signal_, not an indexing command. Submission is necessary here, not sufficient — it must land together with the P0 language fix and real internal links, or Google will discover pages and then decline to index near-duplicates.

### 🟠 P1 — Pre-release URLs in the sitemap serve soft 404s

`https://www.wbmband.com/listen/khvyli` and `/en/listen/khvyli` currently return **HTTP 200** with a 296-byte body:

```html
<meta http-equiv="refresh" content="0; url=/404?title=Release+Not+Available&…" />
```

Both are listed in `sitemap.xml` with `lastmod 2026-08-20`. «Хвилі» releases 21 August 2026, so this is the release gate working as designed — but from Google's side it is a `200`-status page with no content that meta-refreshes to an error page. Google's JavaScript SEO documentation calls this out specifically as the SPA soft-404 pattern and asks for a real status code or a `noindex`.

Submitting the sitemap today would hand Google two soft 404s on the first read.

**Fix (either or both):**

- Add `<meta name="robots" content="noindex">` to the release-gate stub — one line, immediate, no build-pipeline change.
- Exclude `/listen/<slug>` from the sitemap while `releaseDate` is in the future (the generator already knows the date — it writes it as `lastmod`).

Fold the sitemap check into the release-day flip in the `new-release` skill.

### 🟠 P1 — No Domain property; the apex host is a live duplicate

`https://wbmband.com/` returns **200** and serves the full site — there is no redirect to `www`. Its pages do self-canonicalize to `https://www.wbmband.com`, which limits the damage, but two hosts serving identical content is an avoidable split.

The current URL-prefix property is blind to it: a URL-prefix property matches only that exact protocol + host, so anything Google crawls on `wbmband.com` or `http://` never appears in these reports.

**Fix:**

- Add a **Domain property** for `wbmband.com` (DNS TXT verification). It covers apex, `www`, `http` and `https` in one place, and is the property type to use as the primary view.
- Keep the existing URL-prefix property — it is the one with history, and it is useful for isolating the canonical host.
- Optionally add a server-side `301` from apex → `www` in `public/.htaccess` to make the consolidation explicit rather than canonical-only.

### 🟡 P2 — Crawl budget goes to JavaScript, not documents

JS 62 % + CSS 21 % vs HTML 3 %; `Page resource load` is 87 % of all Googlebot requests. For a 24-URL site this is not urgent, but it means every new page costs Google a full render before it sees content. The site is already statically generated, so the content is in the HTML — the render tax is hydration overhead. Worth revisiting only if discovery stays slow after P0 is fixed. See [autoresearch-perf-loop.md](./autoresearch-perf-loop.md) for the JS-reduction work already staged.

### 🟡 P2 — No crawlable internal path to release and lyrics pages

Internal links: 0. Once the homepage is a real Ukrainian document, it must carry server-rendered `<a href>` links to every `/listen/<slug>` and `/lyrics/<slug>`. Sitemaps are a discovery hint; internal links are what make Google treat a page as worth indexing. This is the difference between "discovered — currently not indexed" and actually ranking.

### 🟢 P3 — Console features left unconfigured

- **Associations** — empty. Link the GA4 property (`G-Z8QRF6TWC2`) so Search Console data appears inside GA4 and organic queries can be joined to on-site engagement.
- **Bulk data export to BigQuery** — not configured. The UI keeps 16 months; the export keeps everything, unsampled and unfiltered, with no row limits. At this traffic the cost is negligible and the historical baseline is worth starting now, before there is history worth losing.
- **Backup owner** — a single verified owner is a single point of failure. Add a second owner or at least a full user.

---

## 4. What is already right

Worth stating plainly, because the fixes above are all upside on a healthy base:

- Ownership verified; `robots.txt` valid; host status clean for 90 straight days.
- No manual actions, no security issues, 95 % `200` responses, 221 ms average response, HTTPS on 100 % of pages.
- **Average position 7.4** and 4.3 % CTR — for the pages Google _can_ see, it ranks them well.
- Impressions **+523 %** over 28 days; the brand query `woman based mechanics` already converts.
- Rich, correct JSON-LD on `/ua`, `/en` and `/lyrics/*`: a single `MusicGroup` entity with a stable `@id`, `alternateName` covering `WBM` / `WBM Band` / `ВБМ`, a `disambiguatingDescription` fighting the acronym collision, and `sameAs` reaching MusicBrainz (`62589d1f…`) and Wikidata (`Q140043384`). The lyrics pages carry `MusicRecording → MusicComposition → lyrics` plus `BreadcrumbList`. This is better structured data than most independent artists ship — it is simply not being crawled.
- Instagram, TikTok and YouTube already added as social-channel properties.
- **Search generative AI = Include** — correct. Google states there are no special optimizations for AI Overviews or AI Mode beyond being indexed and snippet-eligible, which makes the P0 indexing fix the AI-visibility fix too.

---

## 5. Action plan

### 5.1 Do inside Search Console

All of this was executed on **14 Aug 2026**, right after the fixes were deployed to production.

| #   | Action                                                            | Status                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Submit `sitemap.xml`                                              | ✅ **Success — 22 pages discovered**, read the same day (Google previously knew 2 URLs)                                                                                                         |
| 2   | Associate the GA4 property                                        | ✅ linked to **WBM Website `523582426`** (`G-Z8QRF6TWC2`). NOT `WBM Band 523561138` — that is the stale duplicate, see [analytics-debugging.md](./analytics-debugging.md)                       |
| 3   | **Validate Fix** on the duplicate canonical                       | ✅ validation started 14/08/2026                                                                                                                                                                |
| 4   | Request indexing for `/`, `/en`, `/listen/alina`, `/lyrics/alina` | ✅ all four queued. The two release URLs reported _"URL is unknown to Google"_ beforehand — confirming they had never been crawled                                                              |
| 5   | Add a **Domain property** for `wbmband.com`                       | ⏳ created, **awaiting DNS** — listed under _Not verified_. Needs one TXT record on `wbmband.com`; reopen the property in GSC to copy the `google-site-verification=…` value, then press Verify |
| 6   | Search generative AI on **Include**                               | ✅ already correct                                                                                                                                                                              |
| 7   | Bulk data export to BigQuery                                      | ⏳ blocked on one IAM grant — see below                                                                                                                                                         |
| 8   | Add a second owner                                                | ⏳ needs an email address                                                                                                                                                                       |

Nothing else in the console needs filling in. There is no preferred-domain setting, no geotargeting control (the International Targeting report was retired), and Change of Address does not apply.

#### BigQuery bulk export — where it stands

Groundwork done in Google Cloud (14 Aug 2026):

- Billing account **`My Billing Account` (`01B96C-D461BF-828D21`)** is active, but already at its **cap of 5 billing-enabled projects** — so a fresh project cannot be linked without a quota increase. A project `wbm-search-console` was created before that limit surfaced and is left **unlinked and unused**; either request a billing-quota increase and move the export there, or delete it.
- The export therefore targets the existing **`WBM Bot Free` → project ID `focused-poet-503715-d4`**, which already has billing _and_ the **BigQuery API already enabled**.

Two steps remain, both needing a human:

1. **Grant the Search Console service account access** on `focused-poet-503715-d4` — principal `search-console-data-export@system.gserviceaccount.com`, roles **BigQuery Job User** + **BigQuery Data Editor**:

   ```bash
   gcloud auth login   # gcloud is installed (SDK 570) but has no active account
   gcloud projects add-iam-policy-binding focused-poet-503715-d4 \
     --member="serviceAccount:search-console-data-export@system.gserviceaccount.com" \
     --role="roles/bigquery.jobUser"
   gcloud projects add-iam-policy-binding focused-poet-503715-d4 \
     --member="serviceAccount:search-console-data-export@system.gserviceaccount.com" \
     --role="roles/bigquery.dataEditor"
   ```

2. **Search Console → Settings → Bulk data export → Continue** — project ID `focused-poet-503715-d4`, dataset location **EU** (the audience is Ukraine/Europe). The export then writes a `searchconsole` dataset daily.

At this traffic the daily export is kilobytes — comfortably inside BigQuery's 10 GB storage / 1 TB query monthly free tier.

#### Domain property — the DNS is not in Google Cloud

`wbmband.com` uses **Hosting Ukraine** nameservers (`a.ns.express`, `b.ns.works`, `c.ns.gold`; registrar Hosting Ukraine LLC, panel `adm.tools`), not Cloud DNS — so the verification TXT record must be added there. The apex already carries a TikTok verification TXT and an SPF record; the Google one is an **additional** TXT, not a replacement.

Steps: adm.tools → DNS for `wbmband.com` → add a TXT on the root (`@`) with the `google-site-verification=…` value copied from the pending property in Search Console → wait for propagation → press **Verify** in GSC.

Note that now the apex `301`s to `www`, the Domain property is a **nice-to-have** rather than a fix. Its remaining value is covering `http://`, any future subdomain, and seeing apex-host crawl data in one place.

**What to watch over the next 1–2 weeks:** Page indexing "All known pages" should climb from 2 toward ~22; Crawl stats `By purpose → Discovery` should stop reading `<1%`; and the first Cyrillic queries should appear in Performance. If URLs land in _Discovered — currently not indexed_ and stay there, the remaining lever is content depth and external links, not crawling.

### 5.2 Do in the repo

| #   | Change                                                                     | File                                                                                                            | Status              |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Build `index.html` from `ua/index.html`                                    | `scripts/create-nonlocalized-aliases.js`                                                                        | ✅ done 14 Aug 2026 |
| 2   | Disable `detectBrowserLanguage`; remove the root redirect middleware       | `nuxt.config.ts`                                                                                                | ✅ done             |
| 3   | `noindex` on the release-gate stub + drop future releases from the sitemap | `nuxt.config.ts`, `scripts/generate-sitemap.js`                                                                 | ✅ done             |
| 4   | `301` apex → `www`                                                         | `public/.htaccess`                                                                                              | ✅ done             |
| 5   | Crawlable links to every `/listen/*` and `/lyrics/*`                       | `components/ui/MusicCard.vue`, `components/music/MusicDetailContent.vue`                                        | ✅ done             |
| 6   | `strategy: 'prefix_except_default'` so the clean URLs stop redirecting     | `nuxt.config.ts`, `.htaccess`, `_redirects`, policy pages, sitemap, routing-contract test; alias script deleted | ✅ done (see §1a)   |

See §1a for how each was verified. **All of it is still local — deploy to production before touching the console.**

### 5.3 Expected outcome

If P0 lands and the sitemap is submitted, the realistic target over 4–8 weeks is **10–20 indexed pages instead of 1**, the first **Cyrillic queries** appearing in the Performance report, and the first non-brand song queries (`хвилі wbm`, `аліна слова`). Do not expect Core Web Vitals data — that needs far more real-user traffic than the site has.

---

## 6. Operating playbook

### Cadence

Google's own recommendation is to check "around once every month, or when you make changes to the site's content," and to rely on the automatic email alerts in between. For a release-driven site that maps to:

| When                 | What to check                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Weekly (5 min)**   | Page indexing: indexed count and any new "not indexed" reason. Performance: new queries — especially Cyrillic ones.                                                                                                                                           |
| **Monthly (20 min)** | Full Performance review (queries / pages / countries / devices, 3-month window). Crawl stats: `By purpose` and `By file type` trend. Links. Sitemap "Discovered pages".                                                                                       |
| **Per release**      | Before: sitemap must not contain the not-yet-live `/listen/<slug>`. After the release-day flip: re-submit or re-read the sitemap, URL-Inspect and request indexing for the new `/listen/*` and `/lyrics/*`, confirm they leave "not indexed" within ~2 weeks. |
| **Quarterly**        | Full technical pass: canonicals, hreflang reciprocity, soft 404s, structured data in the Rich Results Test, apex/www consolidation.                                                                                                                           |
| **On alert**         | Act on GSC email alerts immediately — they fire on new indexing-reason spikes, manual actions and security issues.                                                                                                                                            |

### Reading the reports correctly

- **`Discovery` vs `Refresh` in Crawl stats** is the single best early-warning metric on this site. `Discovery < 1 %` while new pages are shipping means new content is not reaching the crawler. On a genuinely mature site the same number is benign — read it against whether you have published anything.
- **"Duplicate, Google chose different canonical than user"** is never fixed by editing the `rel=canonical` alone. Google already saw it and overruled it. Change what the pages _render_, or use a redirect — the strongest canonical signal.
- **`Search Appearance: No data`** on this site is expected, not a defect. Google publishes no rich result for music or lyrics schema; only `BreadcrumbList` is earnable here.
- **Position 7.4 on 94 impressions** is a small-sample number. Do not chase CTR optimizations until impressions are in the thousands.
- **A sitemap is a hint.** Submission gets URLs discovered; content quality and internal linking get them indexed.

### Automation options

- **Search Analytics API** — 25 000 rows/request, 50 000/day. Query one day at a time and store finalized partitions; long ranges re-requested repeatedly get throttled.
- **URL Inspection API** — 2 000 queries/day per property. Useful for a scheduled "are my release pages still indexed?" check.
- **Sitemaps API** — submit/list/get/delete. Could be wired into `deploy:production` to re-submit after every release.
- **Indexing API** — **not usable here.** It only supports `JobPosting` and `BroadcastEvent`; it is not a general "index my page" endpoint despite widespread claims otherwise.
- **Bulk data export → BigQuery** — the only way to keep data past 16 months, unsampled.

---

## 7. Sources

Google official documentation:

- [Get started with Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start)
- [Domain vs URL-prefix properties](https://support.google.com/webmasters/answer/34592)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Consolidate duplicate URLs (canonicalization)](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Tell Google about localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Crawl Stats report](https://support.google.com/webmasters/answer/9679690)
- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Bulk data export](https://developers.google.com/search/blog/2023/02/bulk-data-export)

Practitioner sources:

- [Ahrefs — Duplicate, Google Chose Different Canonical Than User](https://ahrefs.com/blog/duplicate-google-chose-different-canonical-than-user/)
- [Conductor — fixing the duplicate-canonical status](https://www.conductor.com/academy/index-coverage/faq/duplicate-different-canonical/)
- [Search Engine Roundtable — Google won't use your sitemap if it isn't convinced of new/important content](https://www.seroundtable.com/google-index-sitemap-content-40973.html)
- [John Mueller on sitemaps](https://johnmu.com/categories/sitemaps/)
- [Bandzoogle — optimizing band schema](https://bandzoogle.com/blog/how-to-optimize-your-band-schema) · [getting a band knowledge panel](https://bandzoogle.com/blog/how-to-get-a-band-knowledge-panel)
- [SearchConsole.ai — GSC UI vs API vs BigQuery](https://searchconsole.ai/knowledge-base/gsc-ui-api-bigquery)
