# PageSpeed / Lighthouse regression testing

Automated guard against performance, accessibility, best-practices and SEO
regressions — the "PageSpeed as a test" the site lacked when ~6MB of hero images
silently shipped on first load.

## Why local Lighthouse, not the PSI API

`pagespeed.web.dev` runs Lighthouse on Google's servers and layers CrUX field
data on top. Its public API (`pagespeedonline/v5`) **now has a keyless per-day
quota of 0** — unauthenticated calls return `429 RESOURCE_EXHAUSTED`. So polling
it in CI is no longer viable.

Running **Lighthouse locally** uses the exact same engine and lab profile
(mobile, simulated Slow-4G + 4× CPU) with no key and no quota. That's the
regression gate. Google's field data is a separate, opt-in health check.

## Commands

```bash
npm run test:perf                                   # audit the live prod site
LH_BASE_URL=http://localhost:3000 npm run test:perf # audit a local preview build
node scripts/perf/lighthouse-check.mjs --json       # also dump raw LHR JSON
```

Local preview flow:

```bash
npm run generate && npm run preview &   # serve the static build on :3000
LH_BASE_URL=http://localhost:3000 npm run test:perf
```

Field data (real users, needs a free key — see script header):

```bash
PAGESPEED_API_KEY=xxx node scripts/perf/psi-check.mjs
```

## What it checks

`scripts/perf/lighthouse-check.mjs` audits `/`, `/ua`, `/en` and **exits 1** if:

- **Category scores** fall below threshold. Perf is per-route (`/` is lower
  because the bare root client-redirects to a locale — an unavoidable hop;
  `/ua` and `/en` carry the strict bar). A11y / Best-Practices / SEO apply to all.
- **Resource budgets** are exceeded — `imageKB`, `scriptKB`, `totalKB` transferred
  on initial load. The `imageKB` budget is the one that would have caught the
  all-hero-slides-load-eagerly regression.

Tune thresholds/budgets in the `ROUTES`, `CATEGORY_MINS`, and `BUDGETS` constants
at the top of the script. Keep them a little below current scores so the gate
catches regressions without flapping on throttling noise.

## Where it runs (and doesn't)

**Not** in the husky `pre-commit` / `pre-push` hooks: a run is ~30–60s per URL
and simulated throttling is mildly noisy, so gating every commit would be
painful. Run it manually before a deploy, or as a dedicated CI job (e.g. a
GitHub Actions workflow on a schedule or on PRs, separate from the unit `Tests`
job).

## Gotchas

- Headless Chrome defaults to **English locale**, so auditing `/` redirects to
  `/en` (not `/ua`). That's expected — `/` is a redirect shell.
- Simulated-throttling scores vary ±a few points run to run; thresholds account
  for this. Don't set them to the exact observed score.
- Needs a Chrome/Chromium on the machine (`chrome-launcher` finds the system
  install). CI images must provide one.
