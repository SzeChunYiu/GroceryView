# GroceryView Sweden data sources research

**Research date:** 2026-05-16  
**Scope:** Stockholm/Sweden grocery price intelligence for the proposal in `PROPOSAL.md`: current store prices, promotion observations, product catalog metadata, price history, confidence scoring, and future partnership routes.

> This is product/data research, not legal advice. Before production scraping or reuse of retailer data, get legal review and preferably written permission or a commercial data agreement.

## Executive summary

No major Swedish grocery chain appears to offer a fully public, documented, no-contract price API for third-party consumer apps. The practical path is a hybrid:

1. **Use open data for product metadata, nutrition, barcodes, and macro indices**: Open Food Facts, Open Prices, Livsmedelsverket, SCB, GS1/Validoo partnership.
2. **For MVP price observations, prefer permitted APIs/partnerships and low-volume, cache-heavy collection**. Willys and Hemköp are technically the most accessible because their sites expose JSON product/category endpoints. Coop has a formal API catalog, but product API access should be handled as a signed/approved partner route. ICA is store-specific and harder because product prices depend on selected local ICA store. Lidl is mainly weekly offer/leaflet data, not a full online grocery catalog.
3. **Design every price row with source confidence** as proposed in `PROPOSAL.md`: official/partner feed > retailer online page/API > receipt > shelf photo > flyer > manual report > estimate.
4. **Do not depend on one acquisition method.** The defensible GroceryView data moat should combine partner feeds, retailer online observations, receipts, shelf photos, community verification, and historical normalization.

## Source suitability matrix

| Source | Data available | Public/official API status | Technical feasibility | Production recommendation |
|---|---:|---|---|---|
| ICA | Store locator; store-specific online assortment after choosing local store; examples on `handla.ica.se` | No obvious public product-price API. Public store locator endpoint observed. | Medium for stores, low/medium for product prices because prices are per ICA store and e-commerce redirects require chosen store context. | Use store locator; pursue ICA/individual store partnership; use user receipts/shelf photos for store-level prices. |
| Willys | Current online products, prices, unit prices, labels, promotions, images | No documented public partner API found, but public website JSON endpoints exist. | High technically; legal/robots constraints. | Best technical MVP source if legal approves limited collection; ask Axfood for data access. |
| Hemköp | Current online products, prices, unit prices, labels, promotions, images | No documented public partner API found, but public website JSON endpoints exist. | High technically; legal/robots constraints. | Same as Willys; Axfood partnership can cover both. |
| Coop | Online product search/catalog, prices/promotions likely through ecommerce APIs; public API catalog exists but requires sign-in for products | Formal Coop API Catalog exists; website exposes ecommerce API configuration but not a documented unauthenticated developer contract. | Medium technically; better as partner API. | Approach Coop API/partnership. Avoid embedding public subscription keys or bypassing access controls. |
| Lidl | Weekly offers, Lidl Plus coupons, leaflets, store locations; limited/no full online grocery checkout assortment | No full grocery price API found. Website has store API and offer pages. | Medium for weekly offers; low for full SKU price coverage. | Treat as promo/flyer source + manual/community verification; pursue Lidl Plus/retailer partnership. |
| Open Food Facts | Barcode product data, ingredients, nutrition, images; open product DB | Public API and bulk data under open licenses; rate limits apply. | High. | Use for product bootstrap and barcode scan enrichment; do not expect complete Swedish prices. |
| Open Prices by Open Food Facts | Crowdsourced price observations with proof photos/receipts | Public API docs; global project, coverage depends on contributions. | Medium/high. | Integrate as supplemental price observations and contribute verified GroceryView observations if license/product allows. |
| Livsmedelsverket | Swedish food composition data, nutrients/classifications | Public JSON API, CC BY 4.0. | High. | Use for generic nutrition-per-krona and category enrichment, not retailer-specific products/prices. |
| SCB | CPI/food inflation aggregates | Public API, CC0, rate limits. | High. | Use for macro grocery indices and validation, not SKU/store prices. |
| GS1 Sweden Validoo | Supplier-provided product master data and images | Commercial/industry platform with APIs/integrations. | High after contract. | Strategic partnership for canonical product catalog, GTINs, package sizes, images. |
| Matpriskollen / Matspar | Existing Swedish offer/price-comparison datasets | No public API found; Matpriskollen sells/package data services. | High if commercial agreement. | Partnership/licensing candidate; don't scrape competitors. |

## Retailer findings

### ICA

**What exists**

- `handla.ica.se` is explicitly store-based: it asks the user to choose a store for correct assortment, price and delivery options. The page text says: “Välj butik för rätt sortiment, pris och leveransalternativ”. Source: <https://handla.ica.se/>.
- A store locator endpoint was observed at `https://handla.ica.se/api/store/v1?...` returning ICA store metadata such as store id, name, address, lat/lon, delivery methods and customer types.
- Product price pages are harder because ICA pricing is local-store-specific across Maxi/Kvantum/Supermarket/Nära and often redirects to a selected-store e-commerce context.

**Scraping/API feasibility**

- **Stores:** high feasibility via observed store locator JSON.
- **Prices:** medium/low without cooperation. Store context/cookies/redirects make systematic price collection brittle. ICA franchise/store autonomy means a national ICA price may not exist for many items.
- **Robots:** `handla.ica.se/robots.txt` allows `/` but disallows `/handla/browser`; `ica.se/robots.txt` has specific disallows for deep store/recipe paths for some AI crawlers. Source: <https://handla.ica.se/robots.txt>, <https://www.ica.se/robots.txt>.

**Recommended GroceryView role**

- Use ICA store locator for `stores` seed data.
- For MVP, collect ICA prices through **receipts, shelf photos, weekly offers, and selected manual seed stores** around Stockholm.
- Pursue partnership with ICA Sverige or local ICA merchants for current price exports if ICA coverage becomes critical.

### Willys

**What exists**

- Willys has online grocery category pages and product JSON. A direct website endpoint was observed returning products and current prices, e.g.:
  - `https://www.willys.se/c/mejeri-ost-och-agg/mjolk?size=3&page=0`
- Sample fields observed: `code`, `name`, `manufacturer`, `price`, `priceValue`, `comparePrice`, `comparePriceUnit`, `priceUnit`, `labels`, `potentialPromotions`, and product image URLs under `assets.axfood.se`.
- `https://www.willys.se/api/config` exposes an Axfood backend host name, confirming the site is backed by Axfood e-commerce services.

**Scraping/API feasibility**

- **Technical:** high. JSON category endpoints are simpler than HTML scraping and suitable for current online price observations.
- **Legal/operational:** proceed carefully. Willys robots disallow checkout/cart/account/search areas and request `Crawl-delay: 10` and a `Visit-time` window of 04:00-08:45 UTC. Source: <https://www.willys.se/robots.txt>.
- **Coverage caveat:** online prices may represent e-commerce prices and may differ from every physical store. Preserve `is_online_price` and chain/store context.

**Recommended GroceryView role**

- If approved by legal, use Willys as the primary MVP technical benchmark for structured price ingestion.
- Store each fetch as `source_type=retailer_online_json`, not “official partner API”, unless Axfood grants permission.
- Ask Axfood for a partner feed covering Willys/Hemköp with explicit usage rights and rate limits.

### Hemköp

**What exists**

- Hemköp uses similar Axfood infrastructure. A direct website endpoint was observed returning category products and prices:
  - `https://www.hemkop.se/c/mejeri-ost-och-agg/mjolk?size=3&page=0`
- Sample product fields observed: `code`, `name`, `manufacturer`, `price`, `priceValue`, `comparePrice`, product image, plus `potentialPromotions` including promotion code, text labels, reward/compare price, campaign type, valid-until fields where present, and `lowestHistoricalPrice` where available.

**Scraping/API feasibility**

- **Technical:** high and similar to Willys.
- **Legal/operational:** same caution. Hemköp robots disallow checkout/cart/account/order areas, query sorting/search variants, `/dev-info`, `/beta`, and request `Crawl-delay: 10` plus `Visit-time` 04:00-08:45 UTC. Source: <https://www.hemkop.se/robots.txt>.
- **Coverage caveat:** online prices may not represent every physical store.

**Recommended GroceryView role**

- Same as Willys. Axfood is the obvious partnership target because it can cover Willys + Hemköp and potentially other Axfood banners.

### Coop

**What exists**

- Coop has a public **Coop API Catalog** at <https://portal.api.coop.se/> with sign-in and an Explore Products page. Source: <https://portal.api.coop.se/products>.
- `www.coop.se/handla/varor/` embeds ecommerce settings, default store id, and service access configuration pointing to Coop ecommerce/API hosts. Source page: <https://www.coop.se/handla/varor/>.
- The frontend app references product search paths such as `/search/products`, `/search/products/promotions`, `/search/entities/related`, and store APIs. These should be treated as implementation details unless Coop grants access.

**Scraping/API feasibility**

- **Technical:** medium. Product search is app/API-driven, but endpoint authentication/versioning and API-management policies make it less straightforward than Axfood.
- **Official route:** strong signal that a formal API program exists, but access likely requires account approval/sign-in and product subscription.
- **Robots:** Coop disallows account, checkout/payment, search/filter/sort paths and several search URLs. Source: <https://www.coop.se/robots.txt>.

**Recommended GroceryView role**

- Approach Coop via the API Catalog/partner route for current price and promotion access.
- Do not use exposed frontend subscription keys in a production backend without written authorization.
- Until partner access exists, collect Coop prices through weekly offers, user receipts/shelf photos, and sparse manual seed checks.

### Lidl Sweden

**What exists**

- Lidl Sweden website exposes weekly offers, Lidl Plus coupons, leaflets/reklamblad, store pages, and broad product/brand pages. The home page lists current and upcoming weekly campaigns with dates. Source: <https://www.lidl.se/>.
- A store search API path was observed in frontend assets (`/odj/stores-api/v2/myapi/stores-frontend/stores`).
- No full online grocery checkout/catalog API for Swedish store-level prices was found in this research pass.

**Scraping/API feasibility**

- **Weekly offers:** medium. Offers are visible and structured enough to ingest carefully, but many campaign/product pages are under numeric URL paths.
- **Full SKU prices:** low. Lidl does not appear to publish a complete Swedish grocery price catalog online like Willys/Hemköp.
- **Robots:** Lidl `robots.txt` disallows `/q/search?id=*`, `cc.js`, and paths beginning with digits `/1*` through `/9*`, which likely cover many numeric campaign/product URLs. Source: <https://www.lidl.se/robots.txt>.

**Recommended GroceryView role**

- Treat Lidl as a **promotion/flyer + community verification** source for MVP.
- Use store locator/opening hours if needed.
- Pursue partnership if full prices or Lidl Plus member offers become important.

## Open and commercial data sources

### Open Food Facts

- Public food product database and API with barcode, product name, ingredients, nutrition, labels and images. Docs state that the database is open data, anyone can reuse it, and API v2 is current; read operations do not require authentication but require a custom User-Agent and rate limits apply. Source: <https://openfoodfacts.github.io/openfoodfacts-server/api/>.
- Good for **canonical product metadata** and barcode scanning, but Swedish retail coverage and data quality are uneven and user-contributed.
- License implications: ODbL/database-content licenses and image CC BY-SA must be respected.

### Open Prices by Open Food Facts

- Open Prices is a crowdsourced food-price dataset/API maintained by Open Food Facts. It asks contributors for proof such as price-tag or receipt photos. Source: <https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/product-prices/> and API docs at <https://prices.openfoodfacts.org/api/docs>.
- Good as an optional supplemental observation feed and a potential community-data publication target.
- Coverage in Sweden should be audited before relying on it.

### Livsmedelsverket Food Composition Database

- Swedish Food Agency open data API provides Swedish food composition data, roughly 2,400 food items, JSON format, >50 nutrients/classifications. License is Creative Commons Attribution 4.0 and Livsmedelsverket should be cited as source. Source: <https://www.livsmedelsverket.se/om-oss/psidata/livsmedelsdatabasen/>.
- Good for nutrition-per-krona, generic food classification and fallback nutrient data.
- Not suitable for SKU-level prices or retailer assortment.

### SCB open data

- SCB open data is free, CC0, and API-limited to max 10 calls per 10 seconds per IP and 100,000 values per table. Source: <https://www.scb.se/vara-tjanster/oppna-data/>.
- Good for category inflation benchmarks (e.g., food CPI) and macro validation of GroceryView indices.
- Not suitable for product/store price observations.

### GS1 Sweden Validoo / ProductSearch

- Validoo is Sweden’s largest platform for structured product information, built on GS1 standards and GDSN; the page states it has 3,250 suppliers/retailers, 300,000 products with trade item information, and 100,000 quality-assured product images. Source: <https://gs1.se/en/standards-and-services/validoo/>.
- Best strategic source for canonical GTIN/product master data, package sizes, product images and supplier-owned product attributes.
- Requires commercial/industry access; not a free open dataset.

### Matpriskollen and Matspar

- Matpriskollen says it writes/structures supermarket flyers across Sweden and publishes around 200,000 new offers per week. Source: <https://matpriskollen.se/om-matpriskollen>.
- A 2025 article says Matpriskollen packages data/SaaS for chains, producers and even Riksbanken. Source: <https://ahouse.se/en/community/the-story-behind-matpriskollen-the-food-price-check/>.
- Matspar is an existing Swedish online grocery price-comparison service; no public developer API was found in this pass.
- Recommendation: treat both as **partnership/licensing** candidates, not scraping targets.

### User receipts, shelf photos and community verification

- Receipts and shelf labels can fill the largest gap: actual in-store prices for ICA/Lidl/Coop and store-level deviations from online prices.
- Suggested confidence scores aligned to `PROPOSAL.md`:
  - Receipt OCR with parsed date/store/payment total: `0.80` before human review.
  - Shelf photo with visible product + price tag + geotag/time: `0.75`.
  - User manual report: `0.50`.
  - Multiple independent reports within 48h can raise confidence.
- Privacy: receipts may contain personal data, payment card fragments, membership numbers, time/location patterns, and household purchase history. Redact and minimize before storage.

## Recommended MVP ingestion plan

### Phase 0 — product catalog bootstrap

1. Seed canonical products from Open Food Facts by barcode, popular Swedish category searches, and manual top-500 Stockholm basket items.
2. Add Livsmedelsverket generic nutrient/category mappings for nutrition-per-krona where OFF is missing.
3. Prepare GS1/Validoo outreach for master data and image licensing.

### Phase 1 — current online price observations

1. Start with Willys + Hemköp if legal approves, using the observed JSON category endpoints with strict crawl limits, custom User-Agent, caching, and respect for robots windows.
2. Store all online observations with:
   - `source_type=retailer_online_json`
   - `is_online_price=true`
   - `is_instore_price=false` unless verified
   - `confidence_score=0.80-0.85` before partner agreement; `0.95` if official partner API.
3. For ICA, Coop and Lidl, seed only weekly offers/manual observations until partner access or a robust user-contribution loop exists.

### Phase 2 — partner/data agreements

Priority outreach:

1. **Axfood**: one relationship can cover Willys + Hemköp; ask for product, store, price, promotion and stock availability feeds.
2. **Coop API Catalog**: apply for product/ecommerce API access.
3. **ICA Sweden/local ICA stores**: ask for a store-level price export for pilot Stockholm stores.
4. **Lidl Sweden**: ask for weekly offers, Lidl Plus offers and store-level price file access.
5. **GS1 Sweden Validoo**: canonical product metadata/images.
6. **Matpriskollen/Matspar**: data licensing to accelerate coverage.

### Phase 3 — community verification moat

1. Build receipt scan and shelf-photo upload early.
2. Use community reports to verify online/flyer prices and capture store-only prices.
3. Show confidence labels and a “last verified” timestamp in every chart and deal score.

## Operational and compliance guardrails

- Respect `robots.txt`, crawl delays and visit-time rules; do not crawl checkout, account, cart or private user endpoints.
- Use a clear User-Agent with contact email.
- Rate-limit and cache aggressively; snapshot categories daily/weekly, not continuously.
- Never store or publish retailer frontend API keys; if a key appears in public JS, treat it as a browser implementation detail, not permission for backend harvesting.
- Keep raw source URLs and timestamps for auditability.
- Distinguish **online price**, **in-store observed price**, **member price**, **promo price**, **multi-buy price** and **estimated price**.
- Avoid claiming an “official partnership” unless there is a contract. SCB explicitly disallows presenting an official partnership just because open data is used.

## Concrete probes performed on 2026-05-16

| Probe | Result |
|---|---|
| `https://handla.ica.se/` | Store-specific model; example products; prompts to choose store for correct assortment/price/delivery. |
| `https://handla.ica.se/api/store/v1?zipCode=11322&customerType=private` | Returned ICA store JSON metadata. |
| `https://www.willys.se/api/config` | Returned public config including Axfood backend host. |
| `https://www.willys.se/c/mejeri-ost-och-agg/mjolk?size=3&page=0` | Returned product JSON with current prices/unit prices/promotions/images. |
| `https://www.hemkop.se/api/config` | Returned public config and feature flags. |
| `https://www.hemkop.se/c/mejeri-ost-och-agg/mjolk?size=3&page=0` | Returned product JSON with current prices/unit prices/promotions/images. |
| `https://www.coop.se/handla/varor/` | Embedded ecommerce/API configuration and product app setup. |
| `https://portal.api.coop.se/` | Public API catalog landing page, sign-in/products area. |
| `https://www.lidl.se/` | Weekly and upcoming offers visible; no full grocery price catalog found. |
| Retailer `robots.txt` files | ICA/Handla ICA, Willys, Coop, Hemköp and Lidl rules reviewed and summarized above. |
