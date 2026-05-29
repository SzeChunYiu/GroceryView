-- Heuristic ICA cross-chain matching.
--
-- ICA's promotions source carries NO EAN/GTIN (its image URLs are ICA-CDN UUIDs), so ICA
-- products cannot be matched to the EAN-keyed Axfood chains by exact identity. This backfills
-- an EAN onto ICA products by matching, within the SAME brand, on NORMALIZED PACKAGE SIZE plus
-- product-name similarity (pg_trgm). A 1:1 guard ensures each EAN maps to only the single best
-- ICA product, preventing flavour-collapse (e.g. three yoghurt flavours grabbing one EAN).
--
-- This is heuristic, not exact: a minority of close-variant matches may be imperfect, and ICA
-- products with no same-brand/size twin stay unmatched (correct — better than a wrong match).
-- The precise fix remains a GTIN-bearing ICA product feed; this is the best name-based effort.
--
-- Idempotent: re-running re-derives matches. Requires pg_trgm.

CREATE OR REPLACE FUNCTION pg_temp.gv_basesize(sz numeric, un text) RETURNS numeric AS $$
  SELECT CASE lower(un)
    WHEN 'kg' THEN sz*1000 WHEN 'g' THEN sz
    WHEN 'l' THEN sz*1000 WHEN 'dl' THEN sz*100 WHEN 'cl' THEN sz*10 WHEN 'ml' THEN sz
    ELSE NULL END;
$$ LANGUAGE sql IMMUTABLE;

WITH ica AS (
  SELECT id, canonical_name nm, lower(brand) br, pg_temp.gv_basesize(package_size, package_unit) base
  FROM products
  WHERE brand IS NOT NULL
    AND id IN (SELECT lp.product_id FROM latest_prices lp JOIN chains c ON c.id=lp.chain_id WHERE c.slug='ica')
),
m AS (
  SELECT DISTINCT ON (ica.id) ica.id AS ica_id, op.barcode AS ean, similarity(op.canonical_name, ica.nm) AS sim
  FROM ica
  JOIN products op ON lower(op.brand)=ica.br AND op.barcode IS NOT NULL AND op.barcode <> ''
  WHERE op.id IN (SELECT lp.product_id FROM latest_prices lp JOIN chains c ON c.id=lp.chain_id WHERE c.slug<>'ica')
    AND (
      (ica.base IS NOT NULL AND abs(pg_temp.gv_basesize(op.package_size, op.package_unit) - ica.base) <= 1)  -- same size
      OR (ica.base IS NULL AND similarity(op.canonical_name, ica.nm) > 0.5)                                  -- count-products
    )
    AND similarity(op.canonical_name, ica.nm) > 0.4
  ORDER BY ica.id, similarity(op.canonical_name, ica.nm) DESC
),
ranked AS (  -- 1:1 guard: keep only the best ICA per EAN
  SELECT ica_id, ean, row_number() OVER (PARTITION BY ean ORDER BY sim DESC, ica_id) AS rn FROM m
)
UPDATE products SET barcode = r.ean, updated_at = now()
FROM ranked r
WHERE products.id = r.ica_id AND r.rn = 1 AND (products.barcode IS NULL OR products.barcode = '');
