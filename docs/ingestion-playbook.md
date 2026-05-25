# Grocery Data Ingestion — Exhaustive Reverse-Engineering Playbook

Updated: 2026-05-21 by operator. Every method known for backward-engineering
grocery store + product + price data from publicly accessible sources.

This is a **methodology** document — not a list of endpoints. For endpoints +
status see [`data-sources.md`](data-sources.md). For active task queue see
[`../codex-tasks/ingestion-targets.txt`](../codex-tasks/ingestion-targets.txt).

**Rule of engagement:** publicly fetchable data = fair game with attribution.
We don't bypass auth, captchas, or rate limits. We do try every public path.

---

## A · The technique stack (try in order, escalating effort)

### A1 · Hit the obvious search/products endpoint
```bash
curl -sA "Mozilla/5.0 ... Chrome/139..." \
     -H "Accept: application/json" \
     "https://<chain>.se/search?q=<query>"
```
Works for: Willys, Hemköp (both Axfood) — confirmed 2026-05-20, no auth.
Try also: `/api/search`, `/api/products`, `/api/v1/products`,
`/api/v2/catalog`, `/ws/v2/<brand>/products/search`, `/rest/products`,
`/storefront/api/search`, `/sok`, `/sök`.

### A2 · Inspect the front-end HTML for embedded data
- `__NEXT_DATA__` blob (Next.js apps): contains pre-fetched server data
- `__NUXT_DATA__` (Nuxt apps)
- `window.__APOLLO_STATE__` (Apollo GraphQL)
- `window.__INITIAL_STATE__` (Redux-rendered)
- `<script type="application/ld+json">` (Schema.org Product blobs — name, price, brand, SKU)
- `<script type="application/json" id="...">` (chunked SSR state)
```bash
curl -sLA "$UA" "$URL" | python3 -c "
import re,sys,json
src=sys.stdin.read()
m=re.search(r'<script id=\"__NEXT_DATA__\"[^>]*>(.*?)</script>', src, re.S)
if m: d=json.loads(m.group(1)); print(json.dumps(d, indent=2)[:5000])"
```

### A3 · Discover the buildId then hit `/_next/data/<buildId>/...`
Next.js apps expose ALL page-data routes as JSON via `/_next/data/<buildId>/<route>.json`.
Steps:
1. `curl -sLA "$UA" https://<chain>.se | grep -oE 'buildId":"[^"]+'`
2. `curl -sLA "$UA" "https://<chain>.se/_next/data/<buildId>/sv-se/sok.json?q=..."`
Confirmed for: Willys (per willys-mcp repo), Mathem (buildId
`483b9ac11c96ee6d17bea0c10bff3cb4b3dbd207` 2026-05-20).

### A4 · Find the XHR endpoint via JS-bundle grep
Front-end JS bundles concatenate every fetch URL. Get the main bundle, grep:
```bash
curl -sA "$UA" https://<chain>.se | grep -oE 'src="[^"]+\.js"' | head -5
# Then pull each bundle and grep for "fetch(" / "axios" calls / "/api/" literals
```
Bundles are obfuscated but URL string-literals survive minification.

### A5 · Public sitemap.xml mining
Every retailer publishes sitemaps for SEO. `https://<chain>.se/sitemap.xml`
or `.../sitemap-index.xml`. Walk it to enumerate every product URL, then
fetch each for product page + Schema.org price.
- Use `sitemap.xml`, `sitemap_products.xml`, `sitemap_categories.xml`
- Often paginated `sitemap-products-1.xml` ... `-N.xml`
- Lawful and indexable — designed for crawlers

### A6 · Mobile-app API capture
Mobile apps usually hit cleaner JSON APIs than web. Tools:
- **mitmproxy** + Android emulator with installed CA cert
- **Charles Proxy** (Mac) → install root cert on iOS
- Open the chain's app, perform a search, capture the URL pattern
- The svendahlstrand/ica-api project documented `handla.api.ica.se` this way
- Mobile apps often skip browser anti-bot and accept raw curl with correct UA

### A7 · GraphQL endpoint enumeration
Try `/graphql`, `/api/graphql`, `/storefront/graphql`. Send introspection query:
```bash
curl -X POST "https://<chain>.se/graphql" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { types { name } } }"}'
```
If introspection is enabled (often is in dev/staging): you get the full
schema. If disabled: try common queries `{ products(query:"mjolk"){...} }`.

### A8 · Affiliate / aggregator APIs
- **Pepesto** (pepesto.com) — unified European grocery API across 27 supermarkets
- **Tic.io** (docs.tic.io/datasets/ica) — paid ICA dataset
- **Edamam**, **Spoonacular** — general food product APIs
- Use these to bootstrap; respect their commercial terms.

### A9 · Open community datasets
- **OpenFoodFacts** (world.openfoodfacts.org) — 25k Swedish products
- **OpenPrices** (prices.openfoodfacts.org) — 2.8k SEK price obs as of 2026-05
- **OpenStreetMap** (overpass-api.de) — Sweden-wide store extract generated from public Overpass area queries
- **Wikidata** — chain metadata, ownership graphs
- **Datakällan SCB** (scb.se) — Swedish consumer-price index per category

### A10 · Wayback Machine historical scrapes
`https://web.archive.org/web/<timestamp>/https://<chain>.se/...` — gives
historical pricing without needing live scrape. Useful for trend analysis
and to verify when a chain's site structure last changed.

### A11 · Weekly flyer PDFs
- `reklamblad.ica.se` (ICA)
- `coop.se/erbjudanden` (Coop)
- `www.willys.se/erbjudanden`, `_next/data/<buildId>/sv/erbjudanden.json`
- `www.hemkop.se/erbjudanden`
- Extract via `pdfminer.six` or render with Playwright + OCR.

### A12 · Schema.org / Microdata on product pages
Almost every e-commerce product page embeds:
```html
<script type="application/ld+json">
  {"@type":"Product","name":"...","sku":"...",
   "offers":{"price":"16.70","priceCurrency":"SEK"}}
</script>
```
Walk product URLs (from §A5 sitemap or §A1 search), extract Schema.org —
this is the most portable + chain-independent technique.

### A13 · Search-engine harvesting (last resort)
`site:<chain>.se "kr" "EAN"` via SerpAPI / Bing API — when no direct endpoint
exists. Slow + indirect, but works for any indexed page.

### A14 · Receipt OCR (long-term, future feature)
User-uploaded receipt photos → OCR → product-line extraction → price+store
ground truth. The `packages/scanning` module is the host for this; **leave
for a future iteration per operator directive 2026-05-21**.

### A15 · Investor / KPI documents
- ICA Gruppen, Axfood, Coop Sverige investor reports include category-level
  price indices ("kvartalsbarometer"), promotional uplift %, gross-margin.
  Not per-product but useful for trend validation.
- Konsumentverket (Swedish Consumer Agency) publishes annual grocery
  price analyses.

---

## B · Per-chain intel (what we know works as of 2026-05-21)

### B1 · Willys (Axfood) ✅
- `GET https://www.willys.se/search?q=<query>&page=0&size=20` → JSON `{results:[...]}`
- `GET https://www.willys.se/_next/data/<buildId>/sv/erbjudanden.json` → weekly offers
- No per-branch pricing (chain-wide catalog)

### B2 · Hemköp (Axfood) ✅
- `GET https://www.hemkop.se/search?q=<query>&page=0&size=20` → same shape as Willys
- No per-branch pricing
- Connector details: [`docs/connectors/hemkop.md`](connectors/hemkop.md) covers source URLs, extracted fields, known quirks, edge cases, and last verification evidence.

### B3 · Tempo (Axfood?) ❌ no e-commerce backend
- Static site (Sitevision); no JSON product API; only PDF flyers

### B4 · Matdax 🔴 WordPress, no product API
- WordPress + REST exposes only CMS posts; no products

### B5 · ICA Gruppen 🟡 partial
- `https://handlaprivatkund.ica.se/stores/<id>` → per-store HTML (200 OK)
- `handla.api.ica.se` historically documented (svendahlstrand/ica-api, Apr 2024 schema change pending)
- Best route: mobile app via mitmproxy (§A6)
- **Per-store pricing exists** — top priority target

### B6 · Coop 🟡 partial
- `api.coop.se/digital/...` is the back-end domain (found in HTML of `coop.se/handla`)
- Specific product-search endpoint not yet identified
- Pricing varies regionally + per-Konsum-coop

### B7 · Mathem 🟡 partial
- Next.js app, buildId discoverable in HTML
- `/_next/data/<buildId>/sv-se/<route>.json` should work — route name needs discovery (sok.json returned 404)
- Per-postcode delivery zones

### B8 · MatPiraten ⏳ pending
- matpiraten.se — discount online grocery, likely small catalog
- Probe: front-page HTML for endpoints

### B9 · City Gross 🟡 partial
- `citygross.se/sok?q=<q>` → 200 HTML, need to find embedded data or hidden API
- 33 KB HTML page (decent chance of __NEXT_DATA__)

### B10 · Lidl Sverige ⏳ pending
- Akamai-fronted, anti-bot is real. Mobile app or weekly flyer PDF more tractable
- `https://www.lidl.se/c/erbjudanden/s10005673` returns 404 on guess

### B11 · 7-Eleven ⏳ pending
- Convenience-store SKUs, owned by Reitan
- Limited online catalog

### B12 · Direkten / Pressbyrån ⏳ pending
- Convenience, no online catalog known

### B13 · Hemglass ⏳ pending
- Online frozen-food specialist; probably full e-commerce backend

### B14 · Apohem ⏳ pending
- Online pharmacy with some grocery (kosttillskott, baby); has clear product API

---

## C · Methodology workflow (one iteration per worker)

1. Pick the highest-priority target in `codex-tasks/ingestion-targets.txt`
2. Apply techniques §A1 → §A12 in order
3. As soon as a working endpoint is found, write a connector:
   `packages/ingestion/src/connectors/<target>.ts` exporting an async iterator
4. Run the connector against a small set (10 queries) to verify >=20 real rows
5. Write the ingest script `apps/web/scripts/ingest-<target>.mjs` that
   emits `apps/web/src/lib/ingested/<target>.ts`
6. In the same PR, update `apps/web/src/app/<route>` to surface the new rows
7. In `docs/data-sources.md` flip the row from ⏳/🟡 to ✅ and link the PR
8. If §A1-A12 all fail: log `<target>: <reason>` to
   `codex-tasks/ingestion-blockers.txt` with HTTP code and move to the next

---

## D · Sources cited (the open codebases proving this works)

- [`jimmystridh/willys-mcp`](https://github.com/jimmystridh/willys-mcp) — Willys API mapping
- [`svendahlstrand/ica-api`](https://github.com/svendahlstrand/ica-api) — ICA reverse engineering
- [Pepesto unified grocery API](https://www.pepesto.com/supermarkets/)
- [OpenPrices](https://prices.openfoodfacts.org/)
- [OpenFoodFacts](https://world.openfoodfacts.org/)
- [Overpass API](https://overpass-api.de/)

---

## E · Don't repeat this discovery

Every endpoint, every blocker, every authentication finding goes into
`docs/data-sources.md` (the inventory). Next worker iteration starts from
the inventory, not from scratch.
