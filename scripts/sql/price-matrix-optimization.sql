-- Data-structure optimization for the multivariate price model: price = f(chain, store, product, time).
-- The base model is already a star schema (observations fact + product/chain/store dimensions,
-- monthly-partitioned observations, latest_prices serving table). This adds:
--   1) indexes for the per-store / per-product access patterns the heatmap + comparison need,
--   2) a denormalized per-store price matrix view (joined to store geography),
--   3) a per-municipality price-index aggregate (now that prices actually vary across stores).

-- 1) Access-pattern indexes (idempotent)
CREATE INDEX IF NOT EXISTS latest_prices_store_idx ON latest_prices (store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS latest_prices_product_store_idx ON latest_prices (product_id, store_id);
CREATE INDEX IF NOT EXISTS latest_prices_domain_price_idx ON latest_prices (domain, price);

-- 2) Per-store price matrix: one row per (product, store) with price + store location.
--    Skips branches that don't carry a product (it's just absent — sparse by design).
CREATE OR REPLACE VIEW vw_store_product_price AS
SELECT
  lp.product_id,
  p.canonical_name AS product,
  p.brand,
  p.category_path[1] AS category,
  c.slug  AS chain,
  c.name  AS chain_name,
  lp.store_id,
  s.name  AS store_name,
  NULLIF(s.city, '—') AS city,
  ST_Y(s.position::geometry) AS lat,
  ST_X(s.position::geometry) AS lng,
  lp.price,
  lp.unit_price,
  lp.currency,
  lp.observed_at
FROM latest_prices lp
JOIN products p ON p.id = lp.product_id
JOIN chains   c ON c.id = lp.chain_id
LEFT JOIN stores s ON s.id = lp.store_id
WHERE lp.domain = 'grocery' AND lp.price > 0;

-- 3) Per-municipality price index: for products that vary across stores, aggregate by store city.
--    Real geographic price signal (now that per-store prices vary via Matpriskollen).
CREATE OR REPLACE VIEW vw_municipality_price_index AS
SELECT
  COALESCE(NULLIF(s.city, '—'), 'Unknown') AS municipality,
  count(DISTINCT lp.store_id)              AS stores,
  count(DISTINCT lp.product_id)            AS products,
  round(avg(lp.price)::numeric, 2)         AS avg_price,
  round(min(lp.price)::numeric, 2)         AS min_price,
  round(max(lp.price)::numeric, 2)         AS max_price
FROM latest_prices lp
JOIN stores s ON s.id = lp.store_id
WHERE lp.domain = 'grocery' AND lp.store_id IS NOT NULL AND lp.price > 0
GROUP BY COALESCE(NULLIF(s.city, '—'), 'Unknown');
