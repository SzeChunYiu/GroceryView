-- Idempotency for connector replays: exact repeated price facts keep one immutable observation.
-- New observed_at values or changed price facts still append new time-series rows.

create unique index if not exists observations_connector_idempotency_idx
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
    confidence,
    provenance
  )
  nulls not distinct;
