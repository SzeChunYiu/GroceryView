#!/usr/bin/env bash
# Download real vector chain logos from Wikimedia Commons into apps/web/public/logos/
# (consumed by components/chain-logo.tsx). Commons hosts clean SVG brand logos — far better
# than favicons. Re-run to refresh. Logos are small/stable and committed.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
DEST=apps/web/public/logos
mkdir -p "$DEST"
UA="Mozilla/5.0 GroceryView-logo-fetch"
API="https://commons.wikimedia.org/w/api.php"

fetch() { # slug  "File:Title.svg"
  local slug="$1" title="$2"
  local enc; enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$title")
  local url; url=$(curl -sS -m25 -A "$UA" "$API?action=query&prop=imageinfo&iiprop=url&format=json&titles=$enc" 2>/dev/null \
    | python3 -c "import json,sys
try: print(list(json.load(sys.stdin)['query']['pages'].values())[0]['imageinfo'][0]['url'])
except Exception: print('')")
  [ -z "$url" ] && { echo "$slug: no URL"; return 1; }
  curl -sS -m25 -A "$UA" -o "/tmp/logo-$slug.svg" "$url" 2>/dev/null
  if file -b "/tmp/logo-$slug.svg" | grep -qiE 'svg|xml|text'; then
    cp "/tmp/logo-$slug.svg" "$DEST/$slug.svg"; echo "$slug: ok"
  else echo "$slug: bad file"; fi
  sleep 1
}

fetch ica        "File:ICA logo.svg"
fetch willys     "File:Willys logo.svg"
fetch coop       "File:Coop logo.svg"
fetch hemkop     "File:Hemkop logo.svg"
fetch city-gross "File:Citygross logo.svg"
echo "Logos:"; ls -1 "$DEST"/*.svg 2>/dev/null
