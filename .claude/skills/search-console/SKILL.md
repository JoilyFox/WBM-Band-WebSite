---
name: search-console
description: 'Use when working with Google Search Console for wbmband.com — auditing/reading GSC reports (Performance, Page indexing, Sitemaps, Crawl stats, Links, Settings), diagnosing indexing problems ("not indexed", "Duplicate, Google chose different canonical than user", soft 404, discovery stalls), submitting sitemaps, requesting indexing after a release, or planning GSC-driven SEO fixes. Also use when the user asks "why is my site not in Google", "why so few clicks/impressions", or wants the console "filled in properly".'
---

## When to use

Any task that starts in — or ends in — Google Search Console for `wbmband.com`: reading reports, diagnosing why a page is not indexed, post-release indexing checks, or configuring the property. Pairs with `seo-entity` (on-page signals, JSON-LD, hreflang) and `new-release` (the release-day flip that must include a GSC pass).

**Read [`docs/search-console.md`](../../../docs/search-console.md) first.** It is the source of truth: the dated audit, the ranked findings, the action plan and the operating playbook. This skill is the procedure and the traps.

## Access

Browser only — there is no GSC MCP server wired up. Use the Chrome tools (`mcp__claude-in-chrome__*`), which reuse the user's logged-in session. The account index is `/u/1`.

Deep links (substitute `RID` = `https%3A%2F%2Fwww.wbmband.com%2F`):

```
https://search.google.com/u/1/search-console?resource_id=RID                       # Overview
https://search.google.com/u/1/search-console/performance/search-analytics?resource_id=RID&num_of_days=90
https://search.google.com/u/1/search-console/index?resource_id=RID                 # Page indexing
https://search.google.com/u/1/search-console/sitemaps?resource_id=RID
https://search.google.com/u/1/search-console/links?resource_id=RID
https://search.google.com/u/1/search-console/settings?resource_id=RID
https://search.google.com/u/1/search-console/settings/crawl-stats?resource_id=RID
https://search.google.com/u/1/search-console/manual-actions?resource_id=RID
https://search.google.com/u/1/search-console/security-issues?resource_id=RID
https://search.google.com/u/1/search-console/insights?resource_id=RID
https://search.google.com/u/1/search-console/achievements?resource_id=RID
```

URL Inspection has no stable deep link — click the top search bar, type the URL, press Return.

### Browser gotchas

- **Batch aggressively** with `browser_batch`; each report is a navigate + `wait 5` + `screenshot`.
- GSC is a slow SPA. Screenshot right after a tab click and the table header often still shows the _previous_ tab's data — always `wait 3-4` between click and screenshot, and re-click if the header and the underlined tab disagree.
- Performance breakdown tabs (Queries / Pages / Countries / Devices / Search Appearance) sit at **y ≈ 597** when the page is scrolled to top and **y ≈ 426** when scrolled down. Re-screenshot to get current coordinates instead of reusing them.
- Table rows in Page indexing are not `<a>` elements — a coordinate click often misses. Use `find` to get a `ref_*` and click by ref.
- `javascript_tool` is **blocked** on `search.google.com` (cookie/query-string guard). To read the crawled HTML panel, scroll the page horizontally and use `computer` → `zoom` on the region.
- Guessed settings sub-URLs 404. Navigate to `/settings` and click through.

## Read-only vs. write

Reading reports is free. **These are account changes and need explicit user confirmation before doing them:** submitting or deleting a sitemap, adding/removing a property, adding users, changing the Search generative AI control, enabling Bulk data export, requesting indexing, starting a Validate Fix, or anything under Removals. Propose, then wait for a yes.

## Diagnostic procedure

Work outside-in — most "we're not ranking" questions are actually indexing questions.

1. **Page indexing → All known pages.** If the count is far below the sitemap URL count, it is a _discovery_ problem, not a ranking problem. Stop optimizing content.
2. **Crawl stats → By purpose.** `Discovery < 1 %` while new pages are shipping = new content is not reaching the crawler. On a static site with no new pages, the same number is benign. Always read it against what has actually been published.
3. **Crawl stats → By file type.** HTML at single-digit percent with JS/CSS dominating means every page costs Google a full render.
4. **Sitemaps.** Submitted at all? "Discovered pages" moving? A `Sitemap:` line in `robots.txt` is a weaker channel than an explicit submission.
5. **URL Inspection** on the specific failing URL. The two fields that matter: _User-declared canonical_ vs _Google-selected canonical_. If they differ, Google overruled you.
6. **View crawled page → HTML.** This shows what Google actually stored, after rendering. Check `<html lang>`, `<title>` and whether the JSON-LD survived. This is the highest-signal check on this site and it has already caught one major bug.
7. Only then look at Performance / queries / CTR.

## Known traps on this site

- **`curl` and Google can disagree about the same URL.** The highest-signal check on this site is _URL Inspection → View crawled page → HTML_: `curl` shows the static file, Google shows the RENDERED result. That is how the Aug-2026 root bug was caught — `curl` returned a Ukrainian `<title>`, Google had stored `<html lang="en-US">` with the English one. Always check the rendered copy before concluding a page is fine.
- **Never reintroduce a browser-language redirect on `/`.** That was the bug: `detectBrowserLanguage` with `redirectOn: 'root'` sent Googlebot (English `Accept-Language`) to the English home at the Ukrainian canonical URL, so `/en` got deduped into `/` and the Ukrainian home had no indexable URL. `/` now serves the built `ua/index.html`; language choice is the visible switcher, which is what Google's localized-versions guidance recommends.
- **`/ua` self-canonicalizes to the bare root** by design (see the `seo-entity` skill). That design only works if the root actually serves Ukrainian — it does now, via the alias in `scripts/create-nonlocalized-aliases.js`. Do not "fix" the canonical without checking what the root actually serves.
- **Ukrainian is the UNPREFIXED default locale** (`strategy: 'prefix_except_default'`, Aug 2026). The clean URLs — `/`, `/listen/x`, `/lyrics/x`, `/privacy-policy` — are the real routes AND the declared canonicals; `/ua/...` no longer exists and `301`s to the clean form. If you ever see a clean URL redirect anywhere but stay canonical, that conflict is back: it is what caused the original duplicate-canonical bug.
- **Pre-release `/listen/<slug>` URLs are soft 404s** — HTTP 200 plus a `meta refresh` to `/404`. Since Aug 2026 the generator omits future-dated `/listen/*` from `sitemap.xml` and the `prerender:generate` hook stamps `noindex` on the stub, so this is handled — but re-check the built `sitemap.xml` after any change to release dates or the gate.
- **The apex `wbmband.com`** now `301`s to `www` via `public/.htaccess` (Aug 2026). The URL-prefix property still cannot see the apex — add a Domain property to monitor both.
- **`Search Appearance: No data` is expected.** Google publishes no rich result for music or lyrics schema; `BreadcrumbList` on `/lyrics/*` is the only earnable card. Do not report this as a defect.
- **The Indexing API does not apply.** It supports only `JobPosting` and `BroadcastEvent`. Never suggest it as a way to push release pages into the index.
- **Check the trailing-slash twin before blaming the canonical tag.** `DirectorySlash Off` + the directory rewrites in `.htaccess` once let `/en` AND `/en/` both answer `200` with identical bytes, so every URL existed twice. A `301` from the slashed form now collapses them (`test/unit/routing-contract.spec.ts` guards it, including that the rule can't swallow `/`). `curl -o /dev/null -w '%{http_code} %{redirect_url}'` on both forms is the 5-second check.
- **The Page-indexing report lags by days.** "Last update" on the report is the data date, not today. Before treating a reason as live, URL-Inspect one of its example URLs — on 23/08 both flagged `/en` and the two `noindex` pages were already fine.
- **`Duplicate, Google chose different canonical than user` is not a canonical-tag bug.** Google read the tag and overruled it. Change what the page renders, or add a redirect — redirects are the strongest canonical signal, `rel=canonical` is a hint, sitemap inclusion is weak.

## Post-release checklist

Run this as part of the `new-release` release-day flip:

1. Confirm `/listen/<slug>` and `/lyrics/<slug>` return real content (not the 296-byte gate stub) on the live host.
2. Confirm `sitemap.xml` lists both, with a sane `lastmod`, and contains **no** future-dated `/listen/*`.
3. GSC → Sitemaps → re-submit `sitemap.xml` (or confirm "Last read" is recent).
4. URL Inspection → both URLs → **Request indexing** (needs user confirmation).
5. Log the date. Re-check Page indexing in ~2 weeks; if the URLs are still "Discovered — currently not indexed", the problem is internal linking or thin content, not crawling.

## Cadence

Weekly 5 min (indexed count, new queries — watch for the first Cyrillic ones) · Monthly 20 min (full Performance, crawl-stats trend, links, sitemap) · Per release (checklist above) · Quarterly (canonicals, hreflang reciprocity, soft 404s, Rich Results Test).

Google's own advice is monthly plus reliance on the automatic email alerts. Act on those alerts immediately.

## Keeping this current

When GSC state changes materially — a fix validated, a new property added, a finding closed — update the audit section of `docs/search-console.md` with a new dated entry rather than editing history, and update this skill only if a _procedure_ or _trap_ changed.
