#!/usr/bin/env bash
# Monthly services check for wbmband.com (.github/workflows/services-check.yml).
#
# The uptime monitor catches a site that is down. This catches the wiring that breaks
# silently while the site stays up: a build that drops the GA4 tag or the Clarity id,
# a removed Ahrefs meta tag (un-verifies the project), a missing IndexNow key file, a
# shrinking sitemap, a disabled uptime schedule. It then sends one Telegram digest with
# the results and the manual checklist from docs/site-services.md.
#
# Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional; prints otherwise),
#      GH_TOKEN + GITHUB_REPOSITORY (optional; for the uptime-schedule check).
# Locally: bash scripts/services-check.sh

set -uo pipefail

SITE="https://www.wbmband.com"
GA4_ID="G-Z8QRF6TWC2"
CLARITY_ID="z5zghuvo3i"
INDEXNOW_KEY="71141a0999f8cf6d51894c1f5317f855"
MIN_SITEMAP_URLS=20

ok=()
bad=()
pass() { ok+=("✅ $1"); }
fail() { bad+=("❌ $1"); }

home=$(curl -sSL --max-time 20 "$SITE/" 2>/dev/null || true)
[[ "$home" == *"$GA4_ID"* ]] && pass "GA4 tag $GA4_ID" || fail "GA4 tag $GA4_ID missing from the home page"
[[ "$home" == *"clarityProjectId:\"$CLARITY_ID\""* ]] && pass "Clarity id $CLARITY_ID" ||
  fail "Clarity id $CLARITY_ID missing (nuxt.config.ts CLARITY_PROJECT_ID)"
[[ "$home" == *'name="ahrefs-site-verification"'* ]] && pass "Ahrefs verification meta" ||
  fail "Ahrefs verification meta missing: the Ahrefs project will un-verify"

key=$(curl -sS --max-time 20 "$SITE/$INDEXNOW_KEY.txt" 2>/dev/null || true)
[[ "$key" == "$INDEXNOW_KEY" ]] && pass "IndexNow key file" || fail "IndexNow key file missing or wrong"

urls=$(curl -sS --max-time 20 "$SITE/sitemap.xml" 2>/dev/null | grep -c '<loc>' || true)
((urls >= MIN_SITEMAP_URLS)) && pass "Sitemap: $urls URLs" || fail "Sitemap has only ${urls:-0} URLs (expected ≥ $MIN_SITEMAP_URLS)"

curl -sS --max-time 20 "$SITE/robots.txt" 2>/dev/null | grep -qi '^Sitemap: ' &&
  pass "robots.txt points to the sitemap" || fail "robots.txt has no Sitemap line"

end=$(echo | openssl s_client -servername www.wbmband.com -connect www.wbmband.com:443 2>/dev/null |
  openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [[ -n "$end" ]]; then
  days=$((($(date -d "$end" +%s 2>/dev/null || date -j -f '%b %d %T %Y %Z' "$end" +%s) - $(date +%s)) / 86400))
  ((days >= 14)) && pass "TLS certificate: $days days left" || fail "TLS certificate expires in $days days"
else
  fail "TLS certificate could not be read"
fi

# GitHub disables schedules in public repos after 60 days without commits; a disabled
# uptime workflow would make the down alerts silently stop.
if [[ -n "${GH_TOKEN:-}" && -n "${GITHUB_REPOSITORY:-}" ]]; then
  state=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/uptime.yml" -q .state 2>/dev/null || echo unknown)
  last=$(gh run list -R "$GITHUB_REPOSITORY" --workflow uptime.yml --event schedule --limit 1 \
    --json createdAt -q '.[0].createdAt' 2>/dev/null || true)
  if [[ "$state" == active && -n "$last" ]]; then
    pass "Uptime monitor active, last scheduled run $last"
  else
    fail "Uptime monitor state: $state, last scheduled run: ${last:-none}. Re-enable it in GitHub → Actions"
  fi
fi

report="🩺 <b>wbmband.com: щомісячна перевірка сервісів</b>

$(printf '%s\n' "${bad[@]}" "${ok[@]}")

<b>Ручна перевірка (~10 хв):</b>
1. <a href=\"https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.wbmband.com%2F\">Search Console</a>: Pages, Sitemaps
2. <a href=\"https://www.bing.com/webmasters/home?siteUrl=https://www.wbmband.com/\">Bing Webmaster</a>: Sitemaps, IndexNow, AI Performance
3. <a href=\"https://clarity.microsoft.com/projects/view/${CLARITY_ID}/dashboard\">Clarity</a>: dead/rage clicks, 3–5 записів /listen
4. <a href=\"https://app.ahrefs.com/dashboard\">Ahrefs</a>: Site Audit health score
5. <a href=\"https://analytics.google.com/\">GA4</a>: platform_click за source_platform

Чекліст: docs/site-services.md"

echo "$report"

if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
  response=$(curl -sS --max-time 20 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${report}" \
    --data-urlencode "parse_mode=HTML" \
    --data-urlencode "disable_web_page_preview=true" 2>&1)
  [[ "$response" == *'"ok":true'* ]] && echo "Telegram: sent" ||
    echo "::warning::Telegram send failed: $(echo "$response" | grep -o '"description":"[^"]*"')"
fi

# Fail the run when something is broken, so it also shows red in the Actions tab.
((${#bad[@]} == 0))
