# Grocery Data Sources — Reverse-Engineering Inventory

Updated: 2026-05-25 by operator. Add new sources here as you discover them.

This document is the canonical inventory of every external data source the
GroceryView ingestion layer pulls from (or could pull from). Each entry lists
**status**, **endpoint(s)**, **what it returns**, **per-branch granularity**,
**legal/TOS posture**, and **where the parsed data lands in the repo**.

## Status legend

| Mark | Meaning |
|---|---|
| ✅ shipped | live in production, refreshed regularly |
| 🧪 verified | endpoint confirmed responsive in dev; not yet ingested |
| ⏳ pending | known but not yet probed |
| ❌ blocked | requires login/captcha/auth we don't have |

---

## Current Swedish grocery-chain fetchers

This queue item narrows the canonical list to Swedish grocery, grocery-adjacent, and convenience sources that have an actual fetcher under `packages/ingestion/src/connectors`. Pending ideas without a connector stay in later discovery sections, but they are not counted as data GroceryView reads today.

| Chain/source | Fetcher(s) | Surface read | Confidence source type | Notes |
|---|---|---|---|---|
| Willys (Axfood) | `willys.ts`, `willys-bulk.ts` | public product search, store-scoped product pages, weekly discounts | `retailer_online_page` (0.85) or `flyer_campaign` (0.70) | Axfood-backed online catalog evidence; chain/store scope depends on payload. |
| Hemköp (Axfood) | `hemkop.ts` | public product search, store pages, weekly discounts | `retailer_online_page` (0.85) or `flyer_campaign` (0.70) | Same Axfood family as Willys, with Hemköp URLs and source labels. |
| ICA | `ica.ts`, `ica-bulk.ts`, `ica-reklamblad.ts` | ICA handla/store catalog probes and weekly flyer evidence | `official_api` (0.95) for API/catalog rows; `flyer_campaign` (0.70) for reklamblad | Store account/region IDs make ICA the main per-store grocery-price path. |
| Coop | `coop.ts` | public product/store/flyer surfaces | `retailer_online_page` (0.85) or `flyer_campaign` (0.70) | Regional/store hints are retained when present; no synthetic branch price is inferred. |
| City Gross | `citygross.ts`, `citygross-bulk.ts` | public store and product catalog surfaces | `retailer_online_page` (0.85) | Grocery rows are accepted only with source URL, product name, and numeric SEK price evidence. |
| Lidl Sweden | `lidl.ts`, `lidl-bulk.ts` | store locator and offer/product feeds | `retailer_online_page` (0.85) or `flyer_campaign` (0.70) | Offer rows are campaign evidence, not a standing shelf price unless payload says so. |
| Lidl Plus | `lidl-plus-coupons-se.ts` | public Lidl Plus coupon/offer payloads | `flyer_campaign` (0.70) | Member/coupon mechanics stay separate from ordinary shelf-price rows. |
| Mathem | `mathem.ts` | public online grocery search | `retailer_online_page` (0.85) | Online retailer/postcode surface; not branch-level evidence. |
| Matspar | `matspar.ts` | public price-comparison search pages | `retailer_online_page` (0.85) | Aggregator evidence is kept as Matspar-sourced and never promoted to per-store truth. |
| Matpriskollen | `matpriskollen.ts` | regional campaign/offer surfaces | `flyer_campaign` (0.70) | Useful for offer discovery and schema comparison; rows remain campaign-scoped. |
| Local Food Nodes SE | `localfoodnodes-se.ts` | local producer/store marketplace listings | `retailer_online_page` (0.85) | Swedish grocery-adjacent marketplace; source provenance is required per row. |
| ICA member offers | `ica-stammis-offers-se.ts` | ICA Stammis/member offer payloads | `flyer_campaign` (0.70) | Member-only promotions are kept as member/campaign evidence, not ordinary shelf prices. |
| Willys Plus | `willys-plus-offers-se.ts` | Willys Plus offer payloads | `flyer_campaign` (0.70) | Plus rows preserve member-only mechanics separately from base Willys catalog rows. |
| City Gross Klubben | `citygross-klubben-offers-se.ts` | City Gross member offer payloads | `flyer_campaign` (0.70) | Klubben rows are member-promotion evidence and should not replace the base City Gross product catalog. |
| Swedish convenience | `seven-eleven-se.ts`, `pressbyran-se.ts`, `direkten-se.ts` | public store/product/offer pages depending on connector | `retailer_online_page` (0.85) or `flyer_campaign` (0.70) | Included because fetchers exist and they sell grocery/convenience goods; they should not be mixed into full-supermarket coverage metrics without chain class labels. |
| Swedish specialty grocery | `afroshop-se.ts`, `antep-se.ts`, `halal-center-se.ts`, `hala-se.ts`, `kartamart-se.ts`, `kosher-deli-se.ts`, `polski-sklep-se.ts`, `tian-tian-se.ts`, `goodstore-se.ts` | public store/product/assortment pages depending on connector | `retailer_online_page` (0.85) | Rows represent niche/single-store or specialty-market evidence, so category and chain-class labels matter before comparing them with supermarkets. |
| Swedish surplus/rescue food | `karma-se.ts`, `toogoodtogo-se.ts` | public rescue listing surfaces | `retailer_online_page` (0.85) | These are availability/listing rows for surplus bags or offers, not stable shelf-price observations. |
| Local deal aggregators | `eniro-deals-se.ts` | public deal listings | `flyer_campaign` (0.70) | Aggregator provenance is retained; rows are campaign/deal evidence only. |
| OpenFoodFacts retailer enrichment | `openfoodfacts.ts` | product metadata with retailer candidates for Willys/Hemköp/Coop/ICA/City Gross/Mathem/Matspar | `estimated` (0.25) unless confirmed by a retailer fetcher | Metadata helps matching, but current price confidence comes from the retailer or receipt source, not OFF alone. |

Pharmacy (`apoteket-se`, `apohem`, `apotek-hjartat-se`, `kronans-apotek-se`, `lloyds-apotek-se`), fuel (`st1-fuel`, `okq8-fuel`, `preem-se`, `circle-k-se`, `tanka-se`, `shell-se`), pure household/variety retail (`action-se`, `babyland-se`, `hemmavid-se`, `normal-se`, `naturkraft-se`), Norway/Iceland connectors, and benchmark feeds are intentionally excluded from this Swedish grocery-chain list even though they have fetchers.

### Confidence computation

`packages/ingestion/src/index.ts` owns the base confidence mapping via `confidenceForSource(sourceType)`: official APIs score `0.95`, retailer online pages `0.85`, receipt scans `0.80`, shelf photos `0.75`, flyer campaigns `0.70`, manual user reports `0.50`, and estimates `0.25`. Connectors choose the source type that matches the evidence they fetched; downstream transforms preserve the score on price observations and add confidence reasons when identifiers, hours, special opening times, or product matching are incomplete. A connector must not increase confidence because a value looks plausible: unverified metadata stays `estimated`, campaign/member rows stay `flyer_campaign`, aggregator rows keep their aggregator provenance, and per-branch confidence is only allowed when the fetched payload is explicitly scoped to a store, receipt, or shelf observation.

---

## 1. Stores (where shops physically are)

### 1.1 OpenStreetMap — Overpass API ✅ shipped (PR #528; widened nationwide in this round)
- **Endpoint:** `https://overpass-api.de/api/interpreter` (POST)
- **Query:** `[out:json][timeout:180];area["ISO3166-1"="SE"][admin_level=2]->.searchArea;(node["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);way[...](area.searchArea);relation[...](area.searchArea););out center tags;`
- **Headers:** `User-Agent: <project>/0.1 (contact)` (UA is mandatory — anonymous requests return 406)
- **What it returns:** 5,113 Sweden-wide supermarket, convenience, and grocery locations (retrieved 2026-05-22) with `name`, `brand`, `shop`, `addr:*`, `lat`/`lon`, `opening_hours`, website, and phone where OSM contributors provide them.
- **Per-branch granularity:** ✅ yes — each row is a physical store with coordinates.
- **License:** ODbL (must attribute "© OpenStreetMap contributors").
- **Lands in:** `apps/web/src/lib/osm-stores.ts`; routes `/stores`, `/store-coverage`, and `/map`.
- **Refresh script:** `apps/web/scripts/refresh-osm-stores.mjs` builds `@groceryview/ingestion`, runs the Sweden query with county-level fallback, and refuses to replace the generated module if fewer than 2,000 rows return.

### 1.2 Nationwide OSM ✅ shipped
- The store locator is now generated from `SWEDEN_GROCERY_OVERPASS_QUERY`, replacing the old Stockholm-only extract.

### 1.3 Chain official store-locators ⏳ pending
- ICA: `https://handlaprivatkund.ica.se/api/store/v1/stores?lat=&lon=&distance=` returns 302 to login; needs initial GET to set cookie.
- Coop: `https://www.coop.se/butiker/` HTML scrape.
- Willys: `https://www.willys.se/butiker` HTML scrape.

---

## 2. Products + chain-level prices

### 2.1 Axfood Search (Willys, Hemköp) ✅ shipped (PR #531)
- **Connector detail:** [Hemköp connector notes](connectors/hemkop.md) document the Hemköp sources, fields, quirks, edge cases, and last checked-in verification date.
- **Endpoint:** `https://www.willys.se/search?q={query}&page={n}&size={n}` and identical pattern at `https://www.hemkop.se/search`.
- **Method:** GET. **Headers:** browser-y `User-Agent`, `Accept: application/json`. No auth, no cookies needed for read-only search.
- **Returns:** `{ results: [...] }` JSON with `code` (EAN), `name`, `manufacturer`/`brand`, `productLine2` (subline), `price`/`priceNoUnit`/`priceUnit`, `image.url`, `labels` (`swedish_flag`, `from_sweden`, `organic`, …), `googleAnalyticsCategory` (hierarchy string).
- **Per-branch granularity:** ❌ no — chain-wide price (both chains share Axfood backend and serve one online catalog price across all branches).
- **Captured today:** 1,997 rows (997 Willys + 1,000 Hemköp), 1,440 distinct EAN codes, **525 cross-chain matches**, mean Hemköp-over-Willys spread ~11.5%.
- **Lands in:** `apps/web/src/lib/axfood-products.ts`; route `/compare`.
- **Refresh:** rerun the scrape script (~3 min for ~65 queries × 2 chains).

### 2.2 OpenPrices (Open Food Facts community) ✅ shipped (PR #529)
- **Endpoint:** `https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=100&page={n}`
- **What it returns:** 2,821 SEK observations across 1,585 EAN codes, with date, price, embedded `product` (name/brand/categories_tags from OFF).
- **Per-branch granularity:** Partial — fields `location_osm_id`/`location_osm_name` exist but are mostly NULL in current Swedish submissions.
- **License:** ODbL + AGPL.
- **Lands in:** `apps/web/src/lib/openprices-products.ts`; routes `/products`, `/categories`, `/categories/[slug]`.

### 2.3 OpenFoodFacts product metadata 🟡 partial product surface
- **Endpoint:** `https://world.openfoodfacts.org/api/v2/search?countries_tags=sweden&fields=...&page_size=100&page={n}`
- **Observed live scope:** the public API reported ~25,090 Swedish products on 2026-05-22, but larger/page-deep refresh attempts repeatedly hit 503 responses and page-size caps.
- **Lands in:** `apps/web/src/lib/openfoodfacts-catalog.ts`; generated by `apps/web/scripts/refresh-openfoodfacts-catalog.mjs`; route `/products` now surfaces a metadata-only catalog card with no synthetic prices.
- **Current generated slice:** 1,214 products from the existing OpenPrices/OpenFoodFacts-backed module when the live API cannot return a stable >=900-row tranche.
- **Guardrail:** metadata only — names, brands, quantities, category tags, labels/images/URLs where available. It does not claim current prices, store availability, retailer assortment, or nutrition completeness.

### 2.4 ICA Handla 🧪 verified (next on the queue)
- **Endpoint pattern:** `https://handla.api.ica.se/api/...` (per `svendahlstrand/ica-api` reverse-engineering project). Public until Apr 2024 schema change — needs re-probing.
- **Auth:** `AuthenticationTicket` cookie obtained from `/api/login/...` (anonymous ticket may work for read).
- **Per-branch granularity:** ✅ YES — ICA stores are franchise-owned; each store has its own catalog with store-specific prices. The handla flow asks you to pick a store first.
- **Strategy:** iterate over store IDs (from §1.3 ICA store-locator) → fetch each store's catalog → write per-branch price rows keyed by `osm_id` × `ean`.

### 2.5 Coop online 🧪 verified-as-different
- `coop.se/handla` rendered via Hybris commerce platform (`/ws/v2/coop/...` pattern; first probe returned 404, needs more discovery).
- Coop pricing is **regional**, not always per-store. Konsum (consumer-owned coops) sub-chain has independent prices.

### 2.6 Mathem ⏳ pending
- `mathem.se/sv-se/api/products/search` (returned 308 to trailing-slash variant). Online-only retailer, postcode-dependent prices.

### 2.7 Weekly flyer PDFs ⏳ pending
- `reklamblad.ica.se` — ICA per-region weekly deals.
- `coop.se/erbjudanden` — Coop offers.
- `willys.se/erbjudanden`, `hemkop.se/erbjudanden` — already exposed as JSON at `/_next/data/{buildId}/sv/erbjudanden.json` per willys-mcp repo.

### 2.8 Matspar ✅ shipped / Matpriskollen ⏳ pending (competitor aggregators)
- **Matspar endpoint:** public search pages at `https://www.matspar.se/kategori?q={query}` with embedded `window.__PAGEDATA__` product rows.
- **What Matspar returns:** Matspar product id, product name, brand, package text, current aggregate SEK price, median price, warehouse price coverage count, search URL, and product URL.
- **Per-branch granularity:** ❌ no — this is an aggregate public search price, not a specific store or branch price.
- **Guardrail:** the daily native connector enforces at least 100 real rows before persisting; rows keep Matspar product/source provenance and do not pretend to be per-store evidence.
- **Lands in:** `packages/ingestion/src/connectors/matspar.ts`, daily DB observations through `groceryview://daily/matspar/products/public-search`, and the generated web artifact `apps/web/src/lib/ingested/matspar.ts`.
- **Matpriskollen:** still useful for schema comparison, but not yet part of the daily DB connector set.

### 2.9 Apoteket.se public pharmacy catalog ✅ shipped foundation
- **Connector detail:** [Apoteket.se connector notes](connectors/apoteket-se.md) document the public pharmacy source pages, extracted fields, quirks, edge cases, and last checked-in verification date.
- **Endpoint patterns:** `https://www.apoteket.se/sok/?q={query}` and `https://www.apoteket.se/kategori/{categoryPath}/`.
- **What it returns:** public non-prescription product names, SEK prices, package/unit text, and product URLs from embedded page payloads.
- **Per-branch granularity:** ❌ no by default — online catalog evidence unless a payload supplies explicit `store_id`.
- **Guardrail:** prescription-only rows, non-SEK prices, and rows without a product name or numeric price are dropped.
- **Lands in:** `packages/ingestion/src/connectors/apoteket-se.ts` and daily `domain=pharmacy` observations through the pharmacy public-products dispatcher.

---

## 2F. Fuel prices

### 2F.1 St1 Business listpris ✅ shipped
- **Endpoint:** `https://st1.se/foretag/listpris`
- **Method:** GET. **Headers:** browser-style `User-Agent`, `Accept: text/html`. Confirmed HTTP 200 on 2026-05-23 without login, captcha, or 403.
- **What it returns:** Official St1 station list prices per litre for `Bensin 98`, `Bensin 95`, `E85`, `Diesel`, and `HVO100`; the page states the prices are valid from 23 May 2026.
- **Per-branch granularity:** ❌ no — operator list price, not station-specific pump evidence.
- **Source posture:** Operator source. Legal review status in this PR is `approved` for read-only public page capture; crowd fuel reports are modeled separately and require reporter provenance.
- **Lands in:** `packages/ingestion/src/connectors/st1-fuel.ts`, `infra/db/migrations/010_fuel_price_observations.sql`, and public route `/api/fuel` (also `/fuel` alias).
- **Evidence:** `docs/ingestion/st1-fuel-evidence.md`.

---

## 3. Per-branch granularity — what's actually possible

| Source | Per-branch? | How |
|---|---|---|
| OSM | yes (location only, no price) | already in `/stores` |
| Axfood (Willys + Hemköp) | no | chain-wide catalog |
| ICA Handla | **yes** | store-picker is part of the API; each store has its own price catalog |
| Coop | partial | regional clusters + independent Konsum coops |
| Mathem | no (only postcode delivery zones) | online-only retailer |
| Weekly flyers | yes (per region) | regional, not per-branch |
| Receipt scans (scanner module) | **yes** | ground truth from real shoppers |

The cleanest per-branch shot is **ICA via handla.api.ica.se**. Plus: **user receipt scans** for whatever the scraping doesn't cover. Other Axfood chains share online catalogs; you'd need shopper receipts to expose any branch-level variance there.

---

## 4. Legal / TOS posture

- All sources used here are **publicly fetchable without authentication** for read access. We send a real User-Agent and respect rate limits.
- We **store snapshots**, we don't proxy live requests, and we **don't republish proprietary aggregations**.
- Swedish copyright law (§49 sui-generis database right) protects substantial-investment databases. Our position: we extract individual data points (price + EAN + chain) and rebuild a new aggregation; we cite each source explicitly with its license.
- Each generated module starts with a header citing source URL + retrievedDate + license.

---

## 5. Outstanding work (next worker iterations)

1. **ICA Handla per-branch scrape** — proves the per-branch model works at scale. Estimated yield: ~150 stores × ~500 SKUs = ~75,000 price observations keyed by (osm_id, ean).
2. **OpenFoodFacts catalog widen** — current route/module exposes a 1,214-row metadata-only slice; completing the full ~25,090-product Swedish catalog still needs a resilient export/filter path because the public search API 503s during full pagination.
3. **Refresh scripts** — `refresh-axfood-prices.mjs`, `refresh-openprices.mjs` so cron can rerun; OSM refresh now exists at `apps/web/scripts/refresh-osm-stores.mjs`.
4. **Coop discovery** — find the real `coop.se/handla` JSON endpoint via headless browser inspection.
5. **Mathem** — try `mathem.se/sv-se/api/products/search/` (with trailing slash) and inspect their `_next/data/` payload for catalog + postcode prices.
6. **Receipt scanner ground-truth** — finish the `packages/scanning` connector so user-submitted receipts populate per-branch price rows.

### 2.10 Apotek 1 Norway public search 🧪 verified (pharmacy connector candidate)
- **Endpoint evidence:** `https://www.apotek1.no/sok?searchTerm={query}` exposes public product search pages for Apotek 1 Norway without a signed-in account. Product cards include pharmacy assortment names, package text, price labels where public, and product detail links suitable for a pharmacy-domain connector proof.
- **Robots posture:** treat as read-only public search evidence; keep crawl rate conservative, send a GroceryView User-Agent, and stop if robots or response headers disallow automated collection.
- **Per-branch granularity:** ❌ no from public search. Store availability and pharmacy-specific fulfilment remain out of scope until an explicitly permitted endpoint is found.
- **Connector status:** 🧪 documented / not ingested. Pharmacy rows should land under the pharmacy domain with `requireStoreScopedPrices:false` and must not be mixed into grocery basket totals.
