# Local DB-first data pipeline

Developer tooling to populate a local Postgres from the committed ingested data and
process it into the site catalog. Mirrors the production flow (DB is the source of truth;
a processing step transforms it; the website renders the processed output) for local work
without live scraping.

```
ingested/*.ts  ──►  DATABASE (source of truth)  ──►  processed catalog  ──►  website
                 (1) load                       (2) process
```

## 1. Load committed ingested files into the DB
```bash
DATABASE_URL=postgresql://… node scripts/ingestion/load-ingested-files-to-db.mjs
```
Loads Willys, Hemköp, Coop, and City Gross from `apps/web/src/lib/ingested/*.ts` into
`products` / `observations` / `latest_prices`. Products are **EAN-keyed** (`ean-<gtin>`,
GTIN taken from the explicit `ean`/`gtin` field or the Axfood image URL) so the same
product across chains becomes one entity with per-chain prices — enabling real comparison.
Transactional (rolls back on any error); satisfies the schema's check + idempotency
constraints (web-catalog rows use `price_type = 'online'` with a null `store_id`).

## 2. Process the DB into the site catalog
```bash
DATABASE_URL=postgresql://… node scripts/ingestion/generate-local-db-catalog.mjs
```
Reads one row per (product, chain) from the DB, groups by product, and writes
`apps/web/src/lib/generated/db-site-products.ts`. Prefers multi-chain (comparable)
products with plausible spreads (extreme spreads are usually a promo price compared
against a regular price). The generated catalog is a **local artifact** — do not commit
it; production regenerates it from the production DB at deploy time.

`generate-multichain-catalog.mjs` is a file-only alternative (skips the DB) for quick local
previews; the DB-first path above is canonical.

The processor groups by `ean-<barcode>` when a product has a barcode (else by slug), so the
same product across chains collapses into one entry with per-chain prices.

## (Optional) ICA cross-chain matching
ICA's source carries no EAN, so ICA products don't match the EAN-keyed Axfood chains by
identity. `scripts/sql/match-ica-products-by-name.sql` backfills an EAN onto ICA products by
matching within the same brand on normalized package size + name similarity, with a 1:1 guard.
It is **heuristic** (a minority of close-variant matches may be imperfect); run it before the
processing step if you want ICA included in cross-chain comparison.
```bash
DATABASE_URL=postgresql://… psql "$DATABASE_URL" -f scripts/sql/match-ica-products-by-name.sql
```

## Product-organization views
`scripts/sql/product-organization-views.sql` creates reporting views over the schema:
- `vw_bi_brand_dimension` — normalized brand dimension from the denormalized `products.brand`.
- `vw_bi_product_family` — collapses package-size variants of the same product into one family.
- `vw_bi_product_hierarchy` — department → category → brand → product → package size with price.
