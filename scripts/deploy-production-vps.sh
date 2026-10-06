#!/usr/bin/env bash
# Production deploy of the static site to the OVH VPS (nginx serves /var/www/wbmband).
# Replaces the old FTP deploy (scripts/deploy-production.js, kept as `deploy:production:ftp`), because
# wbmband.com now points at the VPS — the old shared hosting copy is no longer served.
#
# Usage:  npm run deploy:production            (build + upload)
#         DRY_RUN=1 bash scripts/deploy-production-vps.sh   (show what would change, upload nothing)
# Config (env or .env.production): DEPLOY_SSH_HOST (default 151.80.140.64), DEPLOY_SSH_USER (root),
#         DEPLOY_SSH_KEY (~/.ssh/wbm_deploy), DEPLOY_PATH (/var/www/wbmband).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env.production ] && { set -a; . ./.env.production; set +a; }
HOST="${DEPLOY_SSH_HOST:-151.80.140.64}"; USER_="${DEPLOY_SSH_USER:-root}"
KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/wbm_deploy}"; DEST="${DEPLOY_PATH:-/var/www/wbmband}"
SRC=".output/public/"
[ -f "$SRC/index.html" ] || { echo "✗ $SRC/index.html missing — run the build first (npm run build:production)"; exit 1; }
SSH="ssh -i $KEY -o IdentitiesOnly=yes -o BatchMode=yes"
FLAGS=(-az --delete --human-readable --stats --exclude '.well-known')
[ "${DRY_RUN:-}" = 1 ] && FLAGS+=(-n -i)
echo "▶ $SRC → $USER_@$HOST:$DEST ${DRY_RUN:+(dry run)}"
rsync "${FLAGS[@]}" -e "$SSH" "$SRC" "$USER_@$HOST:$DEST/"
if [ "${DRY_RUN:-}" != 1 ]; then
  $SSH "$USER_@$HOST" "chmod -R a+rX '$DEST'"
  code=$(curl -s -o /dev/null -w '%{http_code}' https://www.wbmband.com/ || true)
  echo "✓ deployed; https://www.wbmband.com/ → $code"
fi
