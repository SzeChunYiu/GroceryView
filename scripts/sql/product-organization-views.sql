-- 1. Normalized brand dimension (from the denormalized products.brand text)
CREATE OR REPLACE VIEW vw_bi_brand_dimension AS
SELECT
    lower(btrim(p.brand)) AS brand_key,
    min(p.brand)          AS brand_name,
    count(*)              AS product_count,
    count(DISTINCT p.category_path[1]) AS department_count
FROM products p
WHERE p.brand IS NOT NULL AND btrim(p.brand) <> ''
  AND COALESCE(p.deleted_at, 'infinity'::timestamptz) > now()
GROUP BY lower(btrim(p.brand));

-- 2. Variant grouping: collapse package-size variants of the same product into one group.
--    A "product family" key = brand + the canonical name with trailing size tokens stripped.
CREATE OR REPLACE VIEW vw_bi_product_family AS
WITH base AS (
    SELECT
        p.id,
        p.slug,
        p.canonical_name,
        p.brand,
        p.category_path,
        p.package_size,
        p.package_unit,
        p.comparable_unit,
        btrim(regexp_replace(
            p.canonical_name,
            '\s*[0-9]+([.,][0-9]+)?\s*(kg|g|l|ml|cl|dl|st|pcs|pack|x[0-9]+)\b.*$',
            '',
            'i'
        )) AS family_name
    FROM products p
    WHERE COALESCE(p.deleted_at, 'infinity'::timestamptz) > now()
)
SELECT
    lower(COALESCE(btrim(brand), '') || '|' || lower(family_name)) AS family_key,
    min(family_name) AS family_name,
    brand,
    category_path[1] AS department,
    category_path[2] AS category,
    count(*) AS variant_count,
    array_agg(DISTINCT (package_size || ' ' || package_unit) ORDER BY (package_size || ' ' || package_unit)) AS pack_sizes,
    array_agg(DISTINCT slug) AS product_slugs
FROM base
GROUP BY lower(COALESCE(btrim(brand), '') || '|' || lower(family_name)), brand, category_path[1], category_path[2];

-- 3. Full hierarchy: department -> category -> brand -> product -> package size, with current price.
CREATE OR REPLACE VIEW vw_bi_product_hierarchy AS
SELECT
    p.category_path[1] AS department,
    p.category_path[2] AS category,
    COALESCE(NULLIF(btrim(p.brand), ''), '(unbranded)') AS brand,
    p.canonical_name AS product,
    p.package_size,
    p.package_unit,
    p.comparable_unit,
    c.name AS chain_name,
    lp.price,
    lp.unit_price,
    lp.currency,
    lp.observed_at
FROM products p
JOIN latest_prices lp ON lp.product_id = p.id
JOIN chains c ON c.id = lp.chain_id
WHERE lp.domain = 'grocery'
  AND lp.price > 0
  AND COALESCE(p.deleted_at, 'infinity'::timestamptz) > now();
