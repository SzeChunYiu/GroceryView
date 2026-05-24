# GroceryView data architecture

This is the single source of truth for data tickets. Update it whenever the entity model, ingest flow, storage tier, or country-volume assumptions change.

## Entity model

- `product_canonical`: one normalized grocery concept, e.g. "Arla mellanmjölk 1 l". Holds canonical name, brand, normalized package size/unit, category, attributes, and confidence/provenance for the canonicalization decision.
- `product_listing`: one retailer-facing SKU or offer page for a canonical product. Holds chain, country, retailer SKU, raw title, package text, URL, channel, store/region scope, and current listing metadata. Many listings can point to one `product_canonical`.
- `store`: one physical or online/region scope that can price a listing. Holds chain, country, store id, name, address, coordinates, format, and region tag.
- `price_observation`: one observed price for a listing at a source time and scope. Holds listing id, store id or region id, price, currency, unit price, channel, observed_at, validity window, and source_run id.
- `promotion`: one promotion attached to a listing or observation. Holds type (`member`, `coupon`, `multi_buy`, `clearance`, etc.), terms, quantity tiers, member/coupon flags, valid dates, and source_run id.
- `source_run`: one connector execution. Holds source name, country, started/finished timestamps, fetch URLs, response hashes, row counts, failures, and code/config version.

## Why one canonical product has many listings and observations

A canonical product is the shopping concept users compare. Retailers expose that concept through their own chain SKUs, page URLs, package text, loyalty mechanics, and store availability, so `product_canonical` must have many `product_listing` rows. The same listing then changes price over time and can differ by store, region, channel, member state, coupon activation, or promotion period, so each listing also has many `price_observation` rows. Keeping canonical identity separate from retailer listings and observations prevents overwriting history and preserves evidence for every displayed comparison.

## Storage tiers

- **Hot Postgres (< 30 days):** canonical products, active listings, stores, recent observations, active promotions, and recent source runs. This tier powers API reads, alert checks, and admin debugging.
- **Cold Parquet/object store:** immutable historical observations, source payload hashes, and retired source-run snapshots partitioned by country, chain, and observation date. This tier supports audits, backfills, and long-horizon analytics without bloating hot indexes.
- **Materialized views:** precomputed top-query shapes such as latest price by canonical product/store, chain spread by product, active promotions by chain, cheapest current listing, and price-history rollups. Refresh incrementally after source runs and rebuild fully after schema migrations.

## Ingest pipeline stages

1. **Fetch:** retrieve raw bytes/JSON/HTML from the connector's primary source URLs, store response hashes, and record fetch metadata in `source_run`.
2. **Normalize:** parse raw payloads into typed ingest rows with retailer SKU, title, package text, price, currency, validity dates, channel, store/region scope, and promotion flags.
3. **Dedupe:** remove duplicate rows within the run by source key (`chain`, `sku`, `store/region`, `channel`, `valid_from`, `promotion signature`) while preserving source evidence.
4. **Match:** call `match()` to attach `canonical_id` using barcode, retailer SKU mapping, normalized brand/name/package, and confidence rules.
5. **Store:** bulk upsert listings, observations, promotions, and source-run counters in one transaction per chunk so partial connector failures are retryable.

Each stage must be observable with row counts, timings, source URLs, and retry/error status.

## Full-coverage volume projection

Planning assumption for one country at full grocery coverage:

| Country profile | Stores | Active listings/store | Observations/listing/day | Rows/day |
| --- | ---: | ---: | ---: | ---: |
| Small market | 400 | 12,000 | 1 | 4.8M |
| Medium market | 1,500 | 18,000 | 1 | 27.0M |
| Large market | 5,000 | 25,000 | 1 | 125.0M |

Promotions typically add 3-12% extra rows/day depending on flyer cadence, coupons, and multi-buy depth. Source-run metadata is small (<1% of observation volume) but critical for auditability. Storage and materialized-view refresh plans should be sized from the large-market row/day target before adding new countries.
