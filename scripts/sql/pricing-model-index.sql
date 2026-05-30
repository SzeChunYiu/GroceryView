-- Pricing-model redefinition. THREE proven regimes need different indexing, NOT one flat per-store table:
--   per_store  (ICA — independently owned, ~90% of products vary by branch): price keyed by (product, store).
--   regional   (Coop — priced per consumer-society/region; same-region stores identical, cross-region differ
--               on a real subset): stored per-store (regional sameness is emergent in the data, not faked).
--   national   (Willys, Hemköp, City Gross — centrally priced, identical across 1100 km): keyed by (product, chain).
-- Forcing national chains into per-store rows would materialize 255x identical rows per product — the exact
-- redundant/misleading shape of the earlier broken ICA load. So: keep ONE sparse fact table (store_id set for
-- per-store/regional, NULL for national), declare the model per chain, and RESOLVE the effective per-store
-- price in a view (per-store/regional rows direct; national expanded to the chain's stores) — no duplication.

-- 1) Declare the pricing model per chain (verified per chain by same-product-different-store comparison).
ALTER TABLE chains ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'national';
ALTER TABLE chains DROP CONSTRAINT IF EXISTS chains_pricing_model_check;
ALTER TABLE chains ADD CONSTRAINT chains_pricing_model_check
  CHECK (pricing_model IN ('per_store', 'regional', 'national'));
UPDATE chains SET pricing_model = 'per_store' WHERE slug = 'ica';
UPDATE chains SET pricing_model = 'regional'  WHERE slug = 'coop';
UPDATE chains SET pricing_model = 'national'  WHERE slug IN ('willys','hemkop','city-gross','lidl','netto');

-- 2) Two access-path indexes for the two regimes (partial, so each stays small).
CREATE INDEX IF NOT EXISTS latest_prices_perstore_idx
  ON latest_prices (store_id, product_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS latest_prices_national_idx
  ON latest_prices (chain_id, product_id) WHERE store_id IS NULL;

-- 3) Effective per-store price resolver: every (store, product) priced, without storing redundant rows.
--    per_store chains contribute their real branch price; national chains contribute the chain price
--    attributed to each of that chain's store locations. Heatmap + comparison read THIS, not raw rows.
CREATE OR REPLACE VIEW vw_effective_store_price AS
-- per_store + regional: store-scoped rows, as-is (regional stores in one society simply share real prices)
SELECT lp.store_id, lp.product_id, lp.chain_id, lp.price, lp.unit_price, lp.currency,
       lp.observed_at, c.pricing_model AS price_basis
FROM latest_prices lp
JOIN chains c ON c.id = lp.chain_id AND c.pricing_model IN ('per_store','regional')
WHERE lp.store_id IS NOT NULL AND lp.domain = 'grocery' AND lp.price > 0
UNION ALL
-- national price expanded to every store of the chain (computed on demand, never materialized)
SELECT s.id AS store_id, lp.product_id, lp.chain_id, lp.price, lp.unit_price, lp.currency,
       lp.observed_at, 'national'::text AS price_basis
FROM latest_prices lp
JOIN chains c ON c.id = lp.chain_id AND c.pricing_model = 'national'
JOIN stores s ON s.chain_id = lp.chain_id AND s.domain = 'grocery'
WHERE lp.store_id IS NULL AND lp.domain = 'grocery' AND lp.price > 0;

-- 4) Rebuild the municipality price index on EFFECTIVE prices + real store geography (lat/lng -> city),
--    so the heatmap reflects both per-store ICA variation and flat national chains, honestly.
CREATE OR REPLACE VIEW vw_municipality_price_index AS
SELECT
  COALESCE(NULLIF(s.city, '—'), 'Okänd') AS municipality,
  count(DISTINCT esp.store_id)            AS stores,
  count(DISTINCT esp.product_id)          AS products,
  round(avg(esp.price)::numeric, 2)       AS avg_price,
  round(percentile_cont(0.5) WITHIN GROUP (ORDER BY esp.price)::numeric, 2) AS median_price,
  round(min(esp.price)::numeric, 2)       AS min_price,
  round(max(esp.price)::numeric, 2)       AS max_price,
  count(*) FILTER (WHERE esp.price_basis = 'per_store') AS per_store_prices
FROM vw_effective_store_price esp
JOIN stores s ON s.id = esp.store_id AND s.position IS NOT NULL
GROUP BY COALESCE(NULLIF(s.city, '—'), 'Okänd');

SELECT slug, pricing_model FROM chains ORDER BY pricing_model, slug;
