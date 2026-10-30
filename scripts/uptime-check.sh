#!/usr/bin/env bash
# External uptime check for wbmband.com, run every 5 min by .github/workflows/uptime.yml.
#
# It runs on GitHub's runners, not on the VPS: if the whole server goes down, a monitor
# living on it would go down too and stay silent.
#
# State (up/down) lives in $STATE_FILE, which the workflow carries between runs with
# actions/cache. Telegram gets one message when the site goes down and one when it
# recovers, never one every 5 min. A failing check is retried once after 45 s, so a
# single slow response does not page anyone.
#
# The daily run (MODE=daily) also warns when the TLS certificate expires in < 14 days,
# i.e. the Let's Encrypt renewal on the VPS has stopped working.
#
# Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (repo secrets), STATE_FILE, MODE.
# Locally: TELEGRAM_BOT_TOKEN= bash scripts/uptime-check.sh   (prints instead of sending)

set -uo pipefail

STATE_FILE="${STATE_FILE:-.uptime/state}"
MODE="${MODE:-check}"
SITE="${UPTIME_SITE:-https://www.wbmband.com}"
CERT_WARN_DAYS=14

# url|text the body must contain ('' = status only). Final status after redirects must be 200.
CHECKS=(
  "$SITE/|Woman Based Mechanics"
  "$SITE/en/|Woman Based Mechanics"
  "https://wbmband.com/|Woman Based Mechanics"
  "$SITE/sitemap.xml|<urlset"
)

send() {
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    echo "[telegram disabled] $1"
    return
  fi
  curl -sS --max-time 20 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=$1" \
    --data-urlencode "parse_mode=HTML" \
    --data-urlencode "disable_web_page_preview=true" >/dev/null ||
    echo "::warning::Telegram send failed"
}

# Prints a reason for every failing check; prints nothing when all pass.
run_checks() {
  local entry url needle body code
  for entry in "${CHECKS[@]}"; do
    url="${entry%%|*}"
    needle="${entry#*|}"
    body=$(mktemp)
    code=$(curl -sSL --max-time 20 -A 'wbm-uptime/1 (+github-actions)' \
      -o "$body" -w '%{http_code}' "$url" 2>/dev/null) || code="${code:-000}"
    if [[ "$code" != 200 ]]; then
      echo "$url → HTTP $code"
    elif [[ -n "$needle" ]] && ! grep -qF "$needle" "$body"; then
      echo "$url → 200, but the page has no «$needle»"
    fi
    rm -f "$body"
  done
}

check_cert() {
  local end end_s days
  end=$(echo | openssl s_client -servername www.wbmband.com -connect www.wbmband.com:443 2>/dev/null |
    openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  [[ -z "$end" ]] && return # the site check already reports an unreachable host
  end_s=$(date -d "$end" +%s)
  days=$(((end_s - $(date +%s)) / 86400))
  echo "TLS certificate: $days days left"
  if ((days < CERT_WARN_DAYS)); then
    send "⚠️ <b>wbmband.com: SSL-сертифікат спливає через ${days} дн.</b>
Автопродовження Let's Encrypt на VPS, схоже, не працює.
Перевір: <code>certbot renew --dry-run</code>"
  fi
}

mkdir -p "$(dirname "$STATE_FILE")"
previous=$(cat "$STATE_FILE" 2>/dev/null || echo up)

failures=$(run_checks)
if [[ -n "$failures" ]]; then
  echo "First attempt failed, retrying in 45 s:"
  echo "$failures"
  sleep 45
  failures=$(run_checks)
fi

if [[ -n "$failures" ]]; then
  echo "DOWN:"
  echo "$failures"
  if [[ "$previous" != down ]]; then
    send "🚨 <b>wbmband.com не працює</b>
$failures

Наступне повідомлення прийде, коли сайт відновиться."
  fi
  echo down >"$STATE_FILE"
else
  echo "UP: all ${#CHECKS[@]} checks passed"
  if [[ "$previous" == down ]]; then
    send "✅ <b>wbmband.com знову працює</b>"
  fi
  echo up >"$STATE_FILE"
fi

# The workflow saves the state cache only when it changed (no new cache entry every 5 min).
current=$(cat "$STATE_FILE")
[[ -n "${GITHUB_OUTPUT:-}" && "$current" != "$previous" ]] && echo "changed=true" >>"$GITHUB_OUTPUT"

[[ "$MODE" == daily ]] && check_cert
exit 0
