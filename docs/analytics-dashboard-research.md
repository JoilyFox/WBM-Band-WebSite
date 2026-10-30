# Unified analytics dashboard — research (2026-10-30)

Research for a private "command center" that pulls every WBM data source into one
place, readable by the owner (phone + desktop) and by Claude. Seven research passes:
site-data APIs, music/social APIs, dashboard best practices, architecture, local
inventory, then a live fact-check and a small-data statistics pass. Facts are as of
2026-10-30; anything marked _unverified_ had no primary source.

Decision status: **proposal, awaiting the owner's choices** (see the end).

## 1. What each source can give us

| Source                           | API                                                                                              | Auth (unattended?)                                                                              | History                 | Must snapshot daily?                   | Notes                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GA4 (property `523582426`)       | Data API v1 (`runReport`, realtime, funnel)                                                      | service account, Viewer ✔                                                                      | aggregates unlimited    | no                                     | 200k tokens/day quota, never an issue. Consent Mode default-deny → counts are a **floor**; thresholding hides tiny rows. Official MCP `googleanalytics/google-analytics-mcp` (already installed as `ga4`). |
| Search Console                   | Search Analytics, URL Inspection (2k/day), Sitemaps                                              | service account added as property user ✔                                                       | **16 months**           | yes, to keep >16 mo                    | Data ~2–3 days behind; anonymized queries missing from query rows; position must be impression-weighted. No official MCP; best community one `AminForou/mcp-gsc` (~2.1k★).                                 |
| Bing Webmaster Tools             | JSON API: `GetQueryStats`, `GetPageStats`, `GetRankAndTrafficStats`, crawl, URL submission       | API key (Settings → API Access) ✔                                                              | ~6 months _unverified_  | yes                                    | **AI Performance (Copilot citations) has no API**, CSV export only.                                                                                                                                        |
| Microsoft Clarity (`z5zghuvo3i`) | Data Export API: one endpoint, **10 requests/day, last 1–3 days only**, ≤3 dimensions, 1000 rows | static JWT (Settings → Data Export) ✔                                                          | **none**                | **yes — a missed day is lost forever** | Official MCP `microsoft/clarity-mcp-server` (dashboard NL queries, recordings list). Counts only consented visitors.                                                                                       |
| Ahrefs Webmaster Tools           | **no API on the free plan** (API v3 / MCP from paid Lite)                                        | —                                                                                               | —                       | —                                      | Manual: link to the weekly Site Audit.                                                                                                                                                                     |
| CrUX / PageSpeed                 | CrUX API + History (weekly, ~25–40 periods); PSI runs Lighthouse                                 | API key ✔                                                                                      | CrUX ~6–9 months        | PSI yes                                | A site this small may get **no CrUX data** (404). PSI is noisy: store the median of 3 runs.                                                                                                                |
| Uptime                           | GitHub Actions run history / our own check log                                                   | `gh` token ✔                                                                                   | 90 days of runs         | yes                                    | Better: write each check result into the store.                                                                                                                                                            |
| YouTube                          | Data API v3 + Analytics API (views, watch time, retention, traffic, subs; Shorts too)            | OAuth refresh token ✔ **if the OAuth app is "In production"** (Testing = token dies in 7 days) | full                    | no                                     | MCP `wbm-youtube` already written in _Social Media Analytics Manager_; OAuth never generated.                                                                                                              |
| Instagram                        | Instagram API with Instagram Login: reach, views, saves, shares, interactions                    | long-lived token (60 days, refreshable) ✔                                                      | account metrics 90 days | yes                                    | Needs @wbmband as **Professional (Creator/Business)**; **no Facebook Page required**. Some metrics hidden under 100 followers. MCP `wbm-instagram` exists.                                                 |
| TikTok                           | Display API: own videos' public counts only                                                      | OAuth + app audit                                                                               | —                       | yes                                    | No retention/traffic; Studio export by hand.                                                                                                                                                               |
| Spotify                          | Web API **lost `followers`/`popularity` on artists in Feb 2026**                                 | —                                                                                               | —                       | —                                      | Only Spotify for Artists **CSV exports** (streams, listeners, audience).                                                                                                                                   |
| Apple Music / Amazon / Tidal     | no artist-analytics API                                                                          | —                                                                                               | —                       | —                                      | Manual numbers.                                                                                                                                                                                            |
| Deezer                           | public API, no key: `nb_fan`, track `rank`                                                       | none ✔                                                                                         | —                       | yes                                    | Free daily snapshot.                                                                                                                                                                                       |
| Linkfire (kontrabass.lnk.to)     | partner API; account owned by the label                                                          | —                                                                                               | —                       | —                                      | Ask kontrabass for a CSV/read access. Our own `platform_click` covers site traffic.                                                                                                                        |
| Paid aggregators                 | Songstats (enterprise), Chartmetric (~$350/mo), Soundcharts (~$250/mo), Viberate (€300/mo)       | —                                                                                               | —                       | —                                      | **Not worth it now**: they resell public counts, not first-party streams.                                                                                                                                  |

## 2. Metric tree

North Star: **listen-intent visitors per release** — unique visitors with ≥1
`platform_click`, per release, 28 days. The site cannot see streams; the funnel has a
"dark gap" after the click, filled only by platform exports.

1. **Reach:** GSC/Bing impressions, clicks, indexed pages; social referrals by source
   prefix and `?c=` campaign; direct/unknown share (always visible); followers.
2. **Site conversion:** visits → `release_view` → `platform_click` (count, rate, Wilson
   CI per step), platform mix, by source and campaign.
3. **Release lifecycle:** pre-save → day 0 → d7/d14/d28, curves aligned on day 0,
   decay half-life, platform-side streams/saves (imports).
4. **Content/SEO:** lyrics pages, query classes (brand / song / lyrics / generic),
   coverage, Ahrefs health, backlinks.
5. **Experience:** Clarity rage/dead clicks, quick-backs, JS errors, scroll depth; CWV.
6. **Reliability & data quality:** uptime, incidents, tracking silence, consented
   share, bot share, per-source freshness.

## 3. Statistics for low traffic (non-negotiable rules)

- **Proportions:** Wilson score interval, z = 1.96 (Brown, Cai & DasGupta 2001,
  https://projecteuclid.org/euclid.ss/1009213286). Show "12 з 80 (15 %, 9–24 %)".
- **Two periods' rates:** Newcombe hybrid-score difference CI, or Beta(x+½, n−x+½)
  Monte-Carlo P(B > A). "No detectable change" if the CI contains 0 or P ∈ [0.1, 0.9].
- **Counts:** conditional binomial test / rate-ratio CI (scipy `poisson_means_test`
  documents the C- and E-tests); exact Garwood CI for a single count. Show a % change
  only when both counts ≥ 10 and the CI excludes 1; otherwise absolute deltas.
- **Low n:** grey the tile when n < 30 or conversions < 5 ("замало даних").
- **Anomalies:** same-weekday baseline over 6–8 weeks + negative-binomial 99 %
  prediction interval, absolute floor ≥ 10 events, 2 of 3 days; Poisson CUSUM on
  weekday residuals. STL needs ≥ 8 weeks. Prophet / S-H-ESD not below ~50 events/day.
- **Search Console:** impression-weighted position; hide position under 30
  impressions; show query rows as % of total (anonymized queries).
- **Releases:** align on day 0, normalise by exposure, Poisson log-linear fit with
  offset, half-life = ln2 / b; skip the fit under 30 events; compare cumulative d7/14/30.
- **Attribution:** first-touch and last-touch side by side, direct/unknown separate,
  no data-driven attribution at this scale.
- **Verbal labels:** Замало даних / Шум / Ймовірно ↑↓ / Явно ↑↓. Last 2–3 days marked
  "попередні". Uncertainty display: Kale et al. (HOPs, https://idl.uw.edu/papers/hops-trends),
  Hullman (https://arxiv.org/pdf/2011.07586).
- **Compute every number in code**, never let the LLM do arithmetic.

## 4. Dashboard design

- One question per screen, verdict first (inverted pyramid), "5-second rule" (Few,
  _Information Dashboard Design_; Tufte, small multiples, sparklines).
- KPI tile = value + delta vs previous equal period + 28-day sparkline + data-quality
  dot; the delta reads "n/a (мало даних)" below the minimum base.
- **Annotations** (releases, campaigns, deploys, Google updates) on every time series,
  from one `events` table — the single most useful feature for honest reading.
- Small multiples per release (same axes, day 0) instead of 8-line legends.
- Tables for < 30 points. Colour-blind-safe palette (Okabe-Ito / Paul Tol), redundant
  encoding, 3:1 contrast for marks (WCAG 1.4.1, 1.4.11), "view as table" toggle.
- Phone: 2-up KPI grid, tap tooltips with a fixed readout, ≥ 44 px targets.
- M3 has no official data-viz spec (only the old Material 2 "Data visualization" page);
  M3 covers tokens/shape/motion of the containers.

**Screens:** Огляд · Реліз (lifecycle, small multiples) · Воронка й джерела · Пошук і
контент · Соцмережі й платформи · Досвід (Clarity, CWV) · Надійність і якість даних ·
День релізу (live, GA4 realtime) · Архів дайджестів.

## 5. Architecture

**Data layer first** — it is the hard part and the part that preserves history.

- **Store:** SQLite on the VPS (one writer, trivial backups). Layers: `raw_*` (every API
  response, immutable — protects against short retention), `fact_*` (daily grain per
  source, idempotent upserts), `dim_release` (generated from `data/musicLibrary.ts`),
  `dim_campaign` (`data/campaigns.json`), `dim_source_map`, `events` (annotations),
  `runs` (ingest log).
- **Ingest:** TypeScript CLI (`ingest <source> --from --to`), systemd timers on the
  VPS with `Persistent=true`, retries, `OnFailure` → Telegram, plus a daily freshness
  check. GitHub Actions only as a backup trigger for the Clarity snapshot. (dlt has a
  GA4 source but none for GSC; not worth a Python stack.)
- **Semantic layer:** `metrics.yaml` — name, definition, source, unit, grain, min-n,
  caveats. UI, digest and MCP all read the same definitions.
- **API:** Nitro server routes over SQLite (read-only), the only thing the UI calls.
- **AI access:** a small read-only MCP server (`get_kpis`, `get_release_report`,
  `get_source_breakdown`, `get_search_queries`, `get_data_freshness`, `list_metrics`,
  guarded `query_sql`) + a Claude skill with the schema and caveats. Pre-computed weekly
  narratives stored next to the data. Treat third-party text (queries, referrers) as
  untrusted.
- **UI:** a Nuxt app extending the **studio-ui M3 Expressive layer**
  (`~/Documents/@Repositories/Motion Editor/studio-ui/layer`, Nuxt 4): it already has
  AppShell, PageHeader, Grid, Tabs, FilterBar, DatePicker, DataTable, **KpiTile,
  BarChart, Sparkline** (token-native SVG with a hidden accessible table). Missing:
  line/area chart with CI band + annotations, small multiples, funnel, calendar heatmap,
  date-range picker. Keep the SVG approach: measured gzip sizes — ECharts minimal
  ~185 KB and it cannot read CSS variables; Chart.js ~58 KB; Unovis ~65 KB. For our
  data volumes hand-built SVG components on M3 tokens are lighter and consistent.
- **Hosting/auth:** `stats.wbmband.com` on the existing nginx, certbot TLS,
  `auth_request` → oauth2-proxy (v7.15.5, Google login, email allow-list),
  `X-Robots-Tag: noindex`. Cloudflare Access is out: it needs the DNS zone on Cloudflare
  (ours is at Hosting Ukraine).
- **Digest:** weekly Telegram (Monday): verdict line, North Star with CI, top movers,
  best source, release status, SEO, reliability, 1–2 actions, link.
- **Code:** a separate **private** repo (the site repo is public — no data, no keys).

Rejected for v1: Looker Studio (we don't own history, weak for Clarity/Bing/manual),
Grafana/Metabase/Superset (weak marketing UX, extra JVM/containers), Evidence Core
(good, MIT, SQL+Markdown static — but a second UI system next to studio-ui; kept as a
fallback if the custom UI stalls), PostHog self-host (needs 8+ GB RAM).

## 6. Do now, whatever we decide (data that is being lost)

1. **Clarity daily snapshot** — needs a Data Export token (Clarity → Settings → Data Export).
2. **GSC + GA4 backfill** into the store (GSC keeps only 16 months).
3. Bing API key (Settings → API Access).
4. Instagram → Professional (Creator) account; YouTube OAuth app → "In production".
5. Ask kontrabass for Linkfire CSV / read access; monthly Spotify for Artists CSV.

## 7. Open decisions (owner)

1. Custom Nuxt + studio-ui UI (recommended) vs Evidence Core for v1.
2. Who gets access (emails for the allow-list) — owner only or the band.
3. Private repo name/location.
4. Weekly digest to the owner's DM or the band chat.

## Sources (primary unless noted)

GA4 quotas https://developers.google.com/analytics/devguides/reporting/data/v1/quotas ·
GA4 MCP https://github.com/googleanalytics/google-analytics-mcp ·
GSC limits https://developers.google.com/webmaster-tools/limits ·
GSC data deep dive https://developers.google.com/search/blog/2022/10/performance-data-deep-dive ·
Bing API https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi ,
https://learn.microsoft.com/en-us/bingwebmaster/getting-access ·
Clarity export https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api ·
Clarity MCP https://github.com/microsoft/clarity-mcp-server ·
Ahrefs plans https://help.ahrefs.com/en/articles/6117209-what-s-the-difference-between-all-ahrefs-subscription-plans ·
CrUX https://developer.chrome.com/docs/crux/api , https://developer.chrome.com/docs/crux/history-api ·
Spotify Feb 2026 https://developer.spotify.com/documentation/web-api/references/changes/february-2026 ·
Spotify for Artists export https://support.spotify.com/us/artists/article/exporting-data/ ·
Instagram Login https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login ,
insights https://developers.facebook.com/docs/instagram-platform/insights ·
Google OAuth expiry https://developers.google.com/identity/protocols/oauth2#expiration ·
GitHub schedule https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows ·
oauth2-proxy https://github.com/oauth2-proxy/oauth2-proxy ·
Cloudflare Tunnel zones https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/ ·
Evidence https://github.com/evidence-dev/evidence ·
ECharts CSS vars https://github.com/apache/echarts/issues/19743 ·
Material 2 data viz https://material.io/design/communication/data-visualization.html ·
Linkfire insights https://help.linkfire.com/hc/en-us/articles/360022754533 ·
Viberate API pricing https://www.viberate.com/music-data-api/pricing ·
Brown/Cai/DasGupta https://projecteuclid.org/euclid.ss/1009213286 ·
Poisson tests https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.poisson_means_test.html ·
GA4 modeling https://support.google.com/analytics/answer/11161109
