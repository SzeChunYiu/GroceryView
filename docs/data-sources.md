# Grocery Data Sources — Reverse-Engineering Inventory

Updated: 2026-05-21 by operator. Add new sources here as you discover them.

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

### 2.3 OpenFoodFacts product metadata ✅ used as enrichment
- **Endpoint:** `https://world.openfoodfacts.org/api/v2/search?countries_tags=sweden&fields=...&page_size=100&page={n}`
- 25,059 Swedish products total. We currently pull only those that have a price observation; widen later for catalog completeness.

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

### 2.8 Matspar / Matpriskollen ⏳ pending (competitor aggregators)
- Match competitor sites to understand their schema; do NOT redistribute their proprietary aggregation. They proved the model works.

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
2. **OpenFoodFacts catalog widen** — pull all 25,059 Swedish products into a slim metadata module (no prices) so the catalog dimension is complete.
3. **Refresh scripts** — `refresh-axfood-prices.mjs`, `refresh-openprices.mjs` so cron can rerun; OSM refresh now exists at `apps/web/scripts/refresh-osm-stores.mjs`.
4. **Coop discovery** — find the real `coop.se/handla` JSON endpoint via headless browser inspection.
5. **Mathem** — try `mathem.se/sv-se/api/products/search/` (with trailing slash) and inspect their `_next/data/` payload for catalog + postcode prices.
6. **Receipt scanner ground-truth** — finish the `packages/scanning` connector so user-submitted receipts populate per-branch price rows.
