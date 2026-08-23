# GA4 Analytics — Operations, Debugging & Why Reports Go Empty

> Companion to [`analytics-implementation-tasks.md`](analytics-implementation-tasks.md) (the build plan) and the
> `analytics-tracking` skill. This doc is the **source of truth** for _operating_ GA4 on this site: the mental
> model, why attribution reports go empty, the end-to-end validation runbook, and the GA4 Admin API / MCP access
> recipe. Read it whenever a GA4 number looks wrong before touching code.

**There are TWO GA4 properties — use the right one:**

| Property ID   | Name          | Measurement ID     | Use it?                                                                                                                                             |
| ------------- | ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **523582426** | "WBM Website" | **`G-Z8QRF6TWC2`** | ✅ **YES** — the live `wbmband.com` stream; all event data is here                                                                                  |
| 523561138     | "WBM Band"    | `G-T4G4XTP2QZ`     | ❌ stale/duplicate — the old wrong Measurement ID once hardcoded; essentially empty. Looking here = "nothing works". Archive it to avoid confusion. |

So the canonical property is **`properties/523582426`** (`G-Z8QRF6TWC2`). The Data/Admin API resource format is
`properties/523582426`.

---

## 1. The one mental model that explains most "empty report" bugs: **scope ⇄ carrier**

A GA4 **custom dimension** reads **exactly one carrier**, bound to its **scope**. The two never cross-read:

| Custom dimension scope | Reads only this carrier | Set in code via                                                          |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------ |
| **Event**              | event parameter `ep.*`  | `gtag('event', name, { my_param: v })` or `gtag('set', { my_param: v })` |
| **User**               | user property `up.*`    | `gtag('set', 'user_properties', { my_param: v })`                        |

Consequences you must internalise:

- A value sent as a **user property** (`up.*`) is **invisible** to an **event-scoped** dimension, and vice-versa.
  Same name, wrong carrier ⇒ the dimension reads **`(not set)`** on every row. This is silent — nothing errors.
- The **auto-fired `page_view`** (emitted by `nuxt-gtag` on `config`) carries **no custom event parameters**. So an
  **event-scoped** dimension is `(not set)` on every `page_view` row — and therefore in **every standard report**
  (Acquisition → Traffic acquisition, Engagement → Pages and screens, the Reports "Visitors" overview), because those
  are built on `page_view`/session scope. The value only exists on the events that explicitly carry it.
- To put a value on **every** event (incl. `page_view`), use **`gtag('set', { param: v })`** — it registers a default
  event parameter inherited by all subsequent events. (Caveat: the cold-load **first** `page_view` fires before our
  `app:mounted` plugin runs, so that one hit alone won't carry it. SPA navigations and our custom events do.)

**On this site:** `plugins/analytics.client.ts` sets `source_platform` via **both** `gtag('set', { source_platform })`
(event-param carrier — feeds the event-scoped dimension on standard reports) **and** `gtag('set', 'user_properties', …)`
(user-property carrier — feeds a user-scoped dimension if one is registered). Belt-and-suspenders, robust to however the
dimension is registered in Admin. Our four dimensions — `source_platform`, `release_slug`, `page_type`,
`platform_name` — were registered **Event-scoped**; the `release_view` and `platform_click` events carry all of them
as `ep.*`.

> ### The textbook "aggregate works, per-source empty" signature
>
> Visitor counts work but the per-source/platform breakdown is empty (`(not set)`). This has **two** independent
> structural causes — diagnose which (often both):
>
> 1. **Scope/carrier mismatch** (§1) — source rides the wrong carrier, or the report is built on `page_view` rows that
>    don't carry it. Confirm in an Exploration filtered to `release_view`/`platform_click` (populates) vs Traffic
>    acquisition (empty).
> 2. **Consent default-deny** (§2) — un-consented traffic is cookieless/modeled and carries no queryable source.
>    Confirm via `gcs=G100` in the Network tab.

---

## 2. Consent Mode v2 default-deny: most traffic is cookieless, and that limits attribution

`nuxt.config.ts → gtag.initCommands` ships **default-deny** Consent Mode v2 (`analytics_storage: 'denied'` until the
cookie toast's Accept). Until a visitor accepts:

- GA4 still sends **cookieless pings** (you'll see `204` responses to `/g/collect`), but with **no `_ga` cookie**, no
  persistent `client_id`, **no session/source stitching**. These feed the **aggregate/modeled** Visitors timeline.
- Built-in **Session source / medium / channel** collapses to `(not set)` for that traffic, and event-scoped custom
  dimensions are not reliably attributable on denied hits.
- **Behavioral modeling** (the thing that backfills denied data) needs **~1,000 denied events/day AND ~1,000 granted
  events/day for 7+ days** with Google signals on — a small artist site **never** reaches this, so there is **no
  modeled backfill**. Modeled data also **never appears in Explorations or BigQuery**.

**Net:** with blanket default-deny, real per-source attribution exists only for the **slice of visitors who click
Accept**. In-app social browsers (Instagram/TikTok) — the exact audience here — rarely do.

**Lever (owner's call — legal/privacy posture, not a pure bug):** keep `ad_*` denied everywhere, but set
`analytics_storage` **default `granted` for non-EEA/UK regions** via region-scoped Consent Mode defaults, so the
mostly UA/US audience produces real `client_id` + source attribution; keep full default-deny for EEA/UK. Decide
deliberately; don't flip silently.

---

## 3. The validation runbook — prove events + params + attribution end-to-end

Run this **before** concluding the wiring is broken, and again after any change. (Phase 0.2 / 3.3 / 5.5 of the task
plan were never executed — this is them.)

**Decode a `/g/collect` request** (DevTools → Network → filter `collect`):

| Param         | Meaning                                                                                 |
| ------------- | --------------------------------------------------------------------------------------- |
| `tid`         | Measurement ID — must be `G-Z8QRF6TWC2` (not a stray/duplicate stream)                  |
| `en`          | event name (`page_view`, `release_view`, `platform_click`)                              |
| `ep.<name>`   | **event parameter** (feeds **event-scoped** dimensions)                                 |
| `up.<name>`   | **user property** (feeds **user-scoped** dimensions)                                    |
| `gcs`         | consent state: `G100` = analytics **denied** (cookieless) · `G101`/`G111` = **granted** |
| `gcd`         | consent default config signature                                                        |
| `cid` / `sid` | client / session id (ephemeral, not cookie-persisted, under denied consent)             |

**Steps:**

1. Clean Chrome profile / incognito, ad-blockers **off**. Open DevTools → Network (filter `collect`), GA Admin →
   **DebugView**, and Reports → **Realtime**.
2. Load a prefixed URL, e.g. `https://wbmband.com/listen/i/<slug>`. On the **first** `g/collect`, read **`gcs`**:
   `G100` confirms denied/cookieless (consent issue, §2); `G1x1` is granted.
3. **Without accepting**, confirm whether `release_view` / `platform_click` even reach `/g/collect`, and whether the
   request completes (`204`) or shows `(canceled)`.
4. Click **Accept** on the toast; confirm the next hit's `gcs` analytics digit flips to `1`. (DebugView only shows
   **granted** traffic, so accept before relying on it.)
5. In **Realtime → Event count by event name**, click `release_view`; confirm `source_platform` appears as a parameter
   with a real value (`instagram` for the `/i/` URL). If it's a param on the event but `(not set)` on `page_view`, §1
   scope mismatch is confirmed.
6. In **Admin → Custom definitions**, confirm all four dimensions exist, **Scope = Event**, parameter names match
   exactly (case-sensitive `snake_case`), and the event-scoped count is under the **50** cap.
7. Build the **attribution Exploration** (§4). If it populates while Traffic acquisition is empty → you were looking at
   the wrong surface (§1), not losing data.
8. **Pre-save distributor click:** watch the `platform_click` (`ep.platform_name=distributor`) request — if it shows
   `(canceled)` on the `navigateTo` unload or never reaches DebugView, the beacon transport is not actually in effect
   (see Gotchas). Listen-page buttons are `target="_blank"` (new tab, no unload) so they're safe.
9. **Admin → Data Settings → Data Filters:** confirm no active **Internal Traffic / Developer** filter is silently
   excluding your own test traffic.
10. After any **custom-dimension** change: dimensions are **forward-only (no backfill)** and take **24–48 h** to
    process; Explorations run on a **daily batch**. Never judge a fresh dimension same-day, and always scope
    attribution reports to dates **on/after** the registration date.

---

## 4. The canonical attribution Exploration (the only place source actually shows)

Because `source_platform` is event-scoped and only carried by our custom events, **don't** look in Traffic acquisition.
Build (Explore → Free-form):

- **Dimensions:** `source_platform`, `page_type`, `release_slug`
- **Metric:** Event count (and Total users)
- **Filter:** `Event name` matches regex `^(release_view|platform_click)$`
- **Date range:** starting **on/after** the dimension registration date.

Read it as visitors (`release_view`) vs conversions (`platform_click`) per platform; conversion rate =
`platform_click ÷ release_view`. For a "Key event rate" that isn't a misleading 100 %, keep `session_start` (or
`release_view`) in the filter alongside `platform_click` — filtering to the key event alone makes every session look
converted.

---

## 5. GA4 Admin/Data API access — service account (no `gcloud` needed)

Used to (a) **verify** config + query data programmatically and via the MCP, and (b) **write** config
(custom dimensions, key events) — writes need **Editor**.

> **Current wiring (as built 2026-06-06):** GA4 **refused to add the service account** in Property access management
> ("This email doesn't match a Google Account" — a known GA quirk, unfixable from our side). So instead we authenticate
> as the **owner's own Google account** (`wbmbandofficial@gmail.com`, which is GA Administrator) via **user ADC**:
>
> 1. A self-owned OAuth **Desktop** client was created in GCP project `wbm-social-publisher` (consent screen in
>    _Testing_ mode, owner added as a test user) — needed because gcloud's built-in client is blocked from requesting
>    the (sensitive) Analytics scopes. It is named **"WBM GA Desktop"** in APIs & Services → Credentials, and the
>    client file now lives at **`~/.config/gcloud/oauth-clients/wbm-ga-desktop.json`** (mode `600`, outside the repo).
> 2. `gcloud auth application-default login --client-id-file=~/.config/gcloud/oauth-clients/wbm-ga-desktop.json --scopes=openid,…/userinfo.email,…/cloud-platform,…/analytics.readonly,…/analytics.edit`
>    → ADC saved to `~/.config/gcloud/application_default_credentials.json`.
>
>    **The ADC expires** (`invalid_grant: Bad Request` from every GA call, including the `ga4` MCP) — just re-run that
>    command. A plain `gcloud auth application-default login` **is not enough**: it succeeds but yields
>    `PERMISSION_DENIED: Request had insufficient authentication scopes`, because gcloud's own client cannot ask for
>    the Analytics scopes. Always pass `--client-id-file` **and** `--scopes`.
>
>    **Since ~Aug 2026 Google no longer lets you download an existing client's secret** ("Viewing and downloading
>    client secrets is no longer available"). If the JSON is lost, open the client → **+ Add secret** → download the
>    new one from its ⬇ icon (max two secrets per client; disable/delete the stale one once the new one works). The
>    client ID itself is unchanged, so the consent screen and test users stay as they were.
>
> 3. The Node client libs and `scripts/ga-admin.mjs` auto-discover that ADC. Because they're **user** creds, set the
>    quota project via env: **`GOOGLE_CLOUD_QUOTA_PROJECT=wbm-social-publisher`** (Cloud Resource Manager API is
>    disabled in the project, so `set-quota-project` fails — the env var sidesteps it). Run:
>    `GOOGLE_CLOUD_QUOTA_PROJECT=wbm-social-publisher node scripts/ga-admin.mjs [--apply]`.
> 4. **MCP**: the official `analytics-mcp` (0.6.0) is installed in a native venv at `~/.ga-mcp-venv` (Python 3.12;
>    Docker daemon was off, and system Python is 3.9) and registered as the `ga4` MCP server with
>    `GOOGLE_CLOUD_QUOTA_PROJECT`/`GOOGLE_PROJECT_ID=wbm-social-publisher`, auto-discovering the same ADC. Re-add with:
>    `claude mcp add ga4 -e GOOGLE_CLOUD_QUOTA_PROJECT=wbm-social-publisher -e GOOGLE_PROJECT_ID=wbm-social-publisher -- ~/.ga-mcp-venv/bin/google-analytics-mcp`
>
> The service-account JSON keys created during setup are unused/dead and can be deleted.

The service-account recipe below is the **general** approach (works when GA accepts the SA); we fell back to user ADC.

**One-time owner setup:**

1. [console.cloud.google.com](https://console.cloud.google.com) → create/select a project; note the **project ID**.
2. APIs & Services → Library → enable **Google Analytics Admin API** _and_ **Google Analytics Data API**.
3. IAM & Admin → Service Accounts → Create (`ga4-bot`); skip project IAM roles (GA access is granted inside GA); Done.
4. Open it → Keys → Add key → **JSON** → download. Keep secret; **never commit** (it's `.gitignore`-worthy). Note the
   absolute path → that's `GOOGLE_APPLICATION_CREDENTIALS`.
5. Copy the service-account email (`ga4-bot@<project>.iam.gserviceaccount.com`).
6. GA → Admin → Property → **Property access management** → `+` → add that email. Role: **Viewer/Analyst** for
   read-only; **Editor** to create custom dimensions / mark key events (Viewer/Analyst/Marketer **cannot**).
7. GA → Admin → Property → Property details → copy the numeric **Property ID** (`properties/NNNNNNNNN`).

**MCP (read/diagnose) — official `analytics-mcp` via Docker** (system Python is 3.9; the package needs ≥3.10, so we
containerise; no `gcloud` required — `google-auth` reads the mounted key):

```bash
claude mcp add ga4 -- docker run -i --rm \
  -v /ABS/PATH/key.json:/key.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/key.json \
  -e GOOGLE_PROJECT_ID=YOUR_GCP_PROJECT_ID \
  python:3.11-slim sh -c "pip install --quiet analytics-mcp && exec analytics-mcp"
```

Exposes Data API (`run_report`, `run_realtime_report`, `run_funnel_report`) + Admin **read**
(`get_account_summaries`, `get_property_details`, `get_custom_dimensions_and_metrics`). **No GA4 MCP supports config
writes.**

**Writes (create user-scoped dim / mark key event)** — standalone Node script with an **Editor** service account:

```bash
npm i -D @google-analytics/admin @google-analytics/data
export GOOGLE_APPLICATION_CREDENTIALS=/abs/path/key.json
export GA4_PROPERTY_ID=NNNNNNNNN
node scripts/ga-admin.mjs   # idempotent: list-then-create custom dimensions + key events
```

Admin API methods: `customDimensions.list` / `customDimensions.create`
(`{ parameterName, displayName, scope: 'EVENT' | 'USER' }`), `keyEvents.list` / `keyEvents.create`
(`{ eventName, countingMethod: 'ONCE_PER_EVENT' }`). Parent = `properties/${GA4_PROPERTY_ID}`. Always list-then-create
so reruns are safe.

---

## 6. Root-cause quick reference (from the 2026-06 production audit)

Verified against live `/g/collect` payloads on `wbmband.com` (consent undecided → `gcs=G100`; `page_view` carried
**no** `source_platform`; `release_view` carried both `ep.` and `up.source_platform=instagram`).

| #   | Issue                                                                                                                                                                                                                                                    | Sev      | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `source_platform` was set **only** as a user property in the plugin; event-scoped dim ⇒ `(not set)` on `page_view`/standard reports                                                                                                                      | critical | **FIXED + deployed** — plugin now also `gtag('set', { source_platform })`; verified live                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 8   | **TWO GA4 properties**: data is in **523582426 "WBM Website" (`G-Z8QRF6TWC2`)**; **523561138 "WBM Band" (`G-T4G4XTP2QZ`)** is the stale old-ID duplicate. Looking at the wrong one ⇒ "nothing works"                                                     | high     | **identified** — use 523582426; archive the stale one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 9   | **~90 % of `source_platform` = `direct`** (128 direct vs 1 instagram / 2 youtube in 30 d) — the prefixed bio links aren't being posted, so there's no path signal and in-app referrers are stripped                                                      | high     | **action: owner** — post `/listen/<prefix>/<slug>` links from `.output/bio-links.md` in social bios                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2   | Consent default-deny ⇒ cookieless (`gcs=G100`)                                                                                                                                                                                                           | high→med | **refined** — live data shows custom-event `ep.*` attribution **survives** denied consent; only session-source/stitching degrades. Region-scoping is optional, not urgent (§2)                                                                                                                                                                                                                                                                                                                                                                                  |
| 3   | Looking at standard reports instead of the custom-event Exploration                                                                                                                                                                                      | high     | **fixed by #1** + use §4 Exploration (rebuild Explorations **in property 523582426**)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | Custom-dimension registration unverified; forward-only + 24–48 h latency                                                                                                                                                                                 | medium   | **VERIFIED** — all 4 dims registered **EVENT-scoped**, names correct; user-scoped `source_platform` twin added 2026-06-06                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 5   | Pre-save distributor redirect fired events then `navigateTo(external)` in the same tick (no real beacon) ⇒ `release_view` + `platform_click` cancelled on unload. Live: **0** `distributor` clicks, **4** pre-save views/30d                             | high     | **FIXED + deployed + verified** — `trackReleaseView`/`trackPlatformClick` now return a Promise resolved on gtag `event_callback` (≤1s timeout); the redirect **awaits** delivery first. Verified live: `release_view` (`source=tiktok`) sent `204` before the `id.ffm.to` hop. NB `alina` has `skipDistributorConversionEvent` → no synthetic `platform_click`; feature.fm counts the actual save, GA records the per-source visit.                                                                                                                             |
| 6   | `release_view` dedup key omitted source ⇒ multi-source same-session views dropped                                                                                                                                                                        | medium   | **FIXED + deployed** — key is now `pageType:slug:source`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 7   | `reset()` doesn't push `denied`; `hydrate()` coupled to the toast                                                                                                                                                                                        | low      | **recommended** — deliberate current design; change only if desired                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| —   | `platform_click` key event                                                                                                                                                                                                                               | —        | **VERIFIED** — already a key event in 523582426                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 10  | **Dev/staging traffic pollution**: ~86 % of 30-day events came from `localhost` (881) + `0.0.0.0` (374) + `joilyfox.github.io` staging (905) vs only ~340 from `wbmband.com`/`www.` — the "all direct" look was mostly the owner's own dev/test sessions | critical | **FIXED 2026-06-12** — `gtag.enabled` in `nuxt.config.ts` is now `false` for dev builds and `DEPLOY_TARGET=github`; `plugins/analytics.client.ts` tags any other non-production hostname `traffic_type: 'internal'`; `scripts/ga-report.mjs` filters to production hostnames (escape hatch `GA_ALL_HOSTS=1`). **Owner actions:** activate Admin → Data filters → "Internal Traffic" (can't be done via API), and add a `Hostname` ∈ {wbmband.com, www.wbmband.com} filter to Explorations — historical pollution can't be deleted, only filtered out of reports |
