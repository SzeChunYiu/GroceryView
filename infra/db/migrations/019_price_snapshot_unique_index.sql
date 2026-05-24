-- Ensure scraper price snapshot upserts have a compound uniqueness guard.
--
-- The current PostgreSQL schema stores canonical price facts in immutable
-- observations. The equivalent of the historical Prisma (productId, storeId,
-- date) price uniqueness requirement is the connector idempotency key below:
-- product + chain/store + observed timestamp + source/ref + price fact fields.
-- Changed price, availability, confidence, or provenance still appends a new
-- observation; exact scraper replays cannot create duplicates.

create unique index concurrently if not exists observations_connector_idempotency_idx
  on observations (
    product_id,
    chain_id,
    store_id,
    domain,
    retailer_product_ref,
    price_type,
    observed_at,
    price,
    unit_price,
    currency,
    is_available,
    confidence,
    provenance
  )
  nulls not distinct;

comment on index observations_connector_idempotency_idx is 'Compound unique price snapshot guard for scraper upserts; exact connector replays reuse one immutable observation while changed facts append history.';
