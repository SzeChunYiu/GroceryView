-- Database optimization for managing/ingesting many products at scale (multi-million price rows).
-- The fact table `observations` is already monthly-partitioned (observations_v2). This adds the SERVING
-- layer so the heavy live joins (cross-chain comparison, per-store heatmap, store baskets) become cheap
-- materialized reads, plus scale indexes, an ingest registry, and a one-call refresh.

-- ============ 1) Scale indexes on the serving table ============
CREATE INDEX IF NOT EXISTS latest_prices_domain_chain_idx   ON latest_prices (domain, chain_id);
CREATE INDEX IF NOT EXISTS latest_prices_domain_price_idx2  ON latest_prices (domain, price) WHERE price > 0;
CREATE INDEX IF NOT EXISTS products_domain_barcode_idx      ON products (domain, barcode) WHERE barcode IS NOT NULL AND barcode <> '';
CREATE INDEX IF NOT EXISTS product_matches_ean_idx          ON product_matches (ean_product_id);

-- ============ 2) Cross-chain comparison (per EAN-keyed product: every chain that sells it) ============
-- One compact row per product with a jsonb {chain: price} map + cheapest/dearest, incl. ICA folded in by match.
DROP MATERIALIZED VIEW IF EXISTS mv_product_compare CASCADE;
CREATE MATERIALIZED VIEW mv_product_compare AS
WITH px AS (
  SELECT p.id product_id, p.domain, p.canonical_name, p.brand, p.barcode, p.category_path[1] category,
         c.slug chain, min(lp.price) price
  FROM products p
  JOIN latest_prices lp ON lp.product_id = p.id AND lp.price > 0
  JOIN chains c ON c.id = lp.chain_id
  GROUP BY p.id, p.domain, p.canonical_name, p.brand, p.barcode, p.category_path[1], c.slug
  UNION ALL
  -- ICA (no EAN) folded into its matched EAN product for grocery comparison
  SELECT pm.ean_product_id, 'grocery', NULL, NULL, NULL, NULL, 'ica', min(lp.price)
  FROM product_matches pm
  JOIN latest_prices lp ON lp.product_id = pm.ica_product_id AND lp.store_id IS NOT NULL
  GROUP BY pm.ean_product_id
)
SELECT product_id,
       max(domain) domain, max(canonical_name) name, max(brand) brand, max(barcode) barcode, max(category) category,
       jsonb_object_agg(chain, price) chains,
       count(*) n_chains,
       min(price) cheapest_price,
       max(price) dearest_price,
       (array_agg(chain ORDER BY price))[1] cheapest_chain
FROM px
GROUP BY product_id;
CREATE UNIQUE INDEX mv_product_compare_pk ON mv_product_compare (product_id);
CREATE INDEX mv_product_compare_domain_idx ON mv_product_compare (domain, n_chains DESC);
CREATE INDEX mv_product_compare_barcode_idx ON mv_product_compare (barcode);

-- ============ 3) Per-store basket (for the map) — avoids recomputing vw_effective_store_price live ============
DROP MATERIALIZED VIEW IF EXISTS mv_store_basket CASCADE;
CREATE MATERIALIZED VIEW mv_store_basket AS
SELECT esp.store_id,
       s.chain_id, c.slug chain, NULLIF(s.city,'—') city,
       ST_Y(s.position::geometry) lat, ST_X(s.position::geometry) lng,
       count(*) n_priced,
       round(avg(esp.price)::numeric, 2) avg_price,
       round((avg(esp.price)*40)::numeric, 0) basket_est,
       max(esp.price_basis) price_basis
FROM vw_effective_store_price esp
JOIN stores s ON s.id = esp.store_id
JOIN chains c ON c.id = s.chain_id
WHERE s.position IS NOT NULL
GROUP BY esp.store_id, s.chain_id, c.slug, NULLIF(s.city,'—'), ST_Y(s.position::geometry), ST_X(s.position::geometry);
CREATE UNIQUE INDEX mv_store_basket_pk ON mv_store_basket (store_id);
CREATE INDEX mv_store_basket_city_idx ON mv_store_basket (city);

-- ============ 4) Municipality heatmap (materialized; resolves lat/lng -> kommun via nearest municipality) ============
DROP MATERIALIZED VIEW IF EXISTS mv_municipality_index CASCADE;
CREATE MATERIALIZED VIEW mv_municipality_index AS
SELECT COALESCE(NULLIF(city,'—'),'Okänd') municipality,
       count(*) stores,
       sum(n_priced) price_points,
       round(avg(avg_price)::numeric, 2) avg_price,
       round(percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price)::numeric, 2) median_price,
       round(min(basket_est)::numeric,0) cheapest_basket,
       round(max(basket_est)::numeric,0) dearest_basket
FROM mv_store_basket
GROUP BY COALESCE(NULLIF(city,'—'),'Okänd');
CREATE UNIQUE INDEX mv_municipality_index_pk ON mv_municipality_index (municipality);

-- ============ 5) Ingest registry (observability for the ingestion pipeline) ============
CREATE TABLE IF NOT EXISTS ingest_log (
  id bigserial PRIMARY KEY,
  source text NOT NULL,         -- e.g. 'ica-store-crawl', 'coop-crawl', 'pharmacy-crawl'
  domain text NOT NULL,
  rows_loaded bigint,
  products bigint,
  stores bigint,
  notes text,
  ingested_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ingest_log_source_idx ON ingest_log (source, ingested_at DESC);

-- ============ 6) One-call refresh of the serving layer (run after every ingest) ============
CREATE OR REPLACE FUNCTION refresh_serving_layer() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_product_compare;
  REFRESH MATERIALIZED VIEW mv_store_basket;
  REFRESH MATERIALIZED VIEW mv_municipality_index;
END $$;

ANALYZE latest_prices;
ANALYZE products;
ANALYZE stores;
