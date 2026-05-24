# Grocery Data Ingestion — Target Queue (workers consume this top-down)

Updated: 2026-05-21. See [`ingestion-playbook.md`](ingestion-playbook.md) for the 14 reverse-engineering techniques to apply.

Pick the highest unblocked P0/P1. Apply A1→A12 from the playbook. As soon as a working endpoint lands real rows, write the connector, the ingest script, and the route surface in the SAME PR. Then flip the row in [`data-sources.md`](data-sources.md) from ⏳/🟡 to ✅.

| P | Target | Status | Per-branch? | Next action |
|---|---|---|---|---|
| **P0** | ICA Handla per-branch | 🟡 partial | **YES** — franchise stores, store-specific catalogs | Mobile-app mitmproxy capture (§A6) OR re-RE `handla.api.ica.se` schema (svendahlstrand/ica-api docs stale since Apr 2024). Yields ~75k per-branch obs (150 stores × 500 SKUs). |
| **P0** | OSM nationwide stores | ✅ shipped | yes (location) | Sweden-wide Overpass query and `apps/web/scripts/refresh-osm-stores.mjs` now regenerate the OSM store universe; keep monitoring row counts before production refreshes. |
| **P0** | Coop product-search | 🟡 partial | partial (regional) | Inspect coop.se/handla DevTools; trace `api.coop.se/digital/<path>` (found in HTML). |
| **P1** | Mathem catalog | 🟡 partial | per-postcode | buildId=`483b9ac11c96ee6d17bea0c10bff3cb4b3dbd207` (2026-05-20). Enumerate `/_next/data/<buildId>/sv-se/<route>.json` — try `kategori`, `varor`, `sortiment`, `produkt/<slug>`. |
| **P1** | Matspar public search aggregator | ✅ shipped | no — aggregate public search prices, not branch-specific | `packages/ingestion/src/connectors/matspar.ts` now fetches public `__PAGEDATA__` rows and the daily native endpoint `groceryview://daily/matspar/products/public-search` upserts at least 100 chain-level observations with `requireStoreScopedPrices:false`. |
| **P1** | MatPiraten | ⏳ pending | unknown | matpiraten.se HTML scrape; small but real per-product prices. |
| **P1** | Hemglass | ⏳ pending | per-postcode (delivery) | hemglass.se Next.js? Full frozen-food catalog probable. |
| **P1** | Apohem / Apotek Hjärtat / Apotek 1 NO pharmacy lane | 🟡 partial | online-only | Swedish pharmacy connector exists for Apohem/Apotek Hjärtat; Apotek 1 NO public search evidence is documented after PR #2429. Next: keep prescription/account flows excluded and promote Apotek 1 to daily pharmacy ingestion only when public OTC rows, NOK prices, source URLs, and robots posture are covered by fixtures. |
| **P1** | City Gross | 🟡 partial | unknown | citygross.se/sok HTML __NEXT_DATA__ inspection. |
| **P1** | Lidl Sverige | ⏳ pending | chain-wide | Weekly flyer PDF at lidl.se/c/erbjudanden; web anti-bot — try mobile app. |
| **P2** | Tempo | ❌ blocked | n/a | Static Sitevision site, no API; rely on weekly flyer PDFs. |
| **P2** | Matdax | ❌ blocked | n/a | WordPress site, no product endpoint; receipt scans only (future). |
| **P2** | 7-Eleven Sweden | ⏳ pending | per-store unlikely | reitanonline.se for delivery. |
| **P2** | Direkten / Pressbyrån | ❌ blocked | n/a | No online catalog known. |
| **P3** | OpenFoodFacts widen | 🟡 partial | n/a | Metadata-only product surface now ships a 1,214-row OpenPrices/OpenFoodFacts-backed slice via `apps/web/scripts/refresh-openfoodfacts-catalog.mjs`; live API reports ~25,090 Swedish products but repeated 503/page-cap behavior still blocks a durable all-products refresh. Next: switch to export/filter or other resilient bulk path before marking complete. |
| **P3** | Konsumentverket reports | ⏳ pending | category-level | scb.se grocery price index; macro trend data. |
| **P3** | Wayback Machine historical | ⏳ pending | per-snapshot | Walk web.archive.org snapshots of chain sites; build historical price series. |
| **P3** | Pepesto unified API | ⏳ review | yes (commercial) | pepesto.com — paid; useful for cross-validation; review TOS first. |

## Special: maximize price-data granularity

Operator directive 2026-05-21: **finer data = better site.** Beyond
"product + chain + price" we want, in priority order:

1. **store_id × ean × price × observedAt** (per-branch, per-product, time-series)
2. **postcode × ean × price** (Mathem/Hemglass delivery zones)
3. **chain × ean × price × promoFlag** (regular vs member-promo vs weekly-deal)
4. **chain × category × priceIndex × week** (macro tracking from KPI reports + flyer snapshots)
5. **unit-price normalization** (kr/kg, kr/l, kr/st) consistently across chains
6. **brand × organic-flag × labels** (`from_sweden`, `eco`, `nyckelhål`, allergens from OFF)
7. **out-of-stock signal** (when chain catalogs return `inStock:false` — proxy for popularity)

Each of these is its own column / route. Add them as you uncover signals.

## Nordic pharmacy source notes

- **Apotek 1 NO**: public search/detail evidence is tracked in [`data-sources.md`](data-sources.md). Treat `https://www.apotek1.no/search?query={query}` and public `/produkter/...` pages as online pharmacy catalog evidence, not store-level grocery evidence. Robots allow these public catalog paths but disallow login/legacy private areas; connectors must avoid prescription, account, and checkout flows.
- **Connector status**: PR #2429 is the code-side Apotek 1 pharmacy ingestion landing point; this target queue now records the docs-only follow-up so future workers know the endpoint evidence, legal posture, and fixture requirements before widening Nordic pharmacy coverage.
