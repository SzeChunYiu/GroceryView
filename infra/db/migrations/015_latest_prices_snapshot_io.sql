-- Keep the DB-backed static-site snapshot export off broad latest_prices scans.
-- The exporter filters public grocery rows by confidence, orders by latest
-- observation time, and joins product/chain/store/observation metadata.

create index concurrently if not exists latest_prices_grocery_snapshot_idx
  on latest_prices (domain, observed_at desc, product_id, chain_id, store_id, price_type)
  include (observation_id, price, regular_price, unit_price, currency, confidence, provenance)
  where domain = 'grocery';
