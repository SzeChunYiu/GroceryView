#!/usr/bin/env bash
# Download chain logos into apps/web/public/logos/ (consumed by components/chain-logo.tsx).
# Sources the retailers' own apple-touch-icon where reachable, with favicon-service fallbacks.
# Re-run to refresh. Committed logos are small and stable; this documents their provenance.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
DEST=apps/web/public/logos
mkdir -p "$DEST"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

fetch() { # slug url
  local slug="$1" url="$2" tmp="/tmp/logo-$1"
  local code; code=$(curl -sS -m20 -L -A "$UA" -H "Referer: ${url%/*}/" -o "$tmp" -w "%{http_code}" "$url" 2>/dev/null)
  local sz; sz=$(wc -c < "$tmp" 2>/dev/null || echo 0)
  if [ "$code" = "200" ] && [ "${sz:-0}" -gt 500 ] && file -b "$tmp" | grep -qiE 'image|icon'; then
    cp "$tmp" "$DEST/$slug.png"; echo "$slug: ok ($sz b)"; return 0
  fi
  return 1
}

fetch ica        "https://www.ica.se/apple-touch-icon.png"
fetch willys     "https://www.willys.se/apple-touch-icon.png"
fetch city-gross "https://www.citygross.se/apple-touch-icon.png"
fetch coop       "https://www.coop.se/Assets/Icons/favicons/apple-touch-icon.png"
# Hemköp blocks direct icon access (403); fall back to a favicon service.
fetch hemkop     "https://www.google.com/s2/favicons?sz=64&domain=hemkop.se" \
  || fetch hemkop "https://icons.duckduckgo.com/ip3/hemkop.se.ico"

echo "Logos in $DEST:"; ls -1 "$DEST"/*.png 2>/dev/null
