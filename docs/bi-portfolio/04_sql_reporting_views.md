# SQL Reporting Views

This document contains PostgreSQL reporting views for the BI portfolio version of GroceryView.
They are aligned with the repository schema used by the production data layer:
`chains`, `stores`, `products`, `latest_prices`, `observations`, `weekly_baskets`,
`basket_items`, and `source_runs`.

The views are written for portfolio/reporting documentation. If they are promoted into
migrations, create them in dependency order and run them against a migrated database.

---

# 1. Current product prices

## Purpose

Return the latest available grocery price for each product, chain, store, and price type.

```sql
CREATE OR REPLACE VIEW vw_bi_current_product_prices AS
SELECT
    lp.product_id,
    p.slug AS product_slug,
    p.canonical_name AS product_name,
    p.brand,
    p.category_path,
    p.comparable_unit,
    lp.chain_id,
    c.slug AS chain_slug,
    c.name AS chain_name,
    lp.store_id,
    s.name AS store_name,
    s.city,
    lp.market_code,
    lp.price_type,
    lp.price,
    lp.regular_price,
    lp.unit_price,
    lp.currency,
    lp.observed_at,
    lp.confidence,
    COALESCE(lp.is_available, TRUE) AS is_available
FROM latest_prices lp
JOIN products p ON p.id = lp.product_id
JOIN chains c ON c.id = lp.chain_id
LEFT JOIN stores s ON s.id = lp.store_id
WHERE lp.domain = grocery
  AND COALESCE(lp.is_available, TRUE) = TRUE
  AND lp.price > 0
  AND lp.unit_price > 0
  AND COALESCE(p.deleted_at, infinity::timestamptz) > now();
```

## Business use

- Executive dashboard
- Product detail page
- Latest price comparison

---

# 2. Chain price index

## Purpose

Compare each chain against the market average for products with cross-chain comparable unit prices.

```sql
CREATE OR REPLACE VIEW vw_bi_chain_price_index AS
WITH product_market_avg AS (
    SELECT
        product_id,
        market_code,
        AVG(unit_price) AS market_avg_unit_price,
        COUNT(DISTINCT chain_id) AS chains_with_price
    FROM vw_bi_current_product_prices
    GROUP BY product_id, market_code
    HAVING COUNT(DISTINCT chain_id) >= 2
),
chain_relative_prices AS (
    SELECT
        cpp.market_code,
        cpp.chain_id,
        cpp.chain_name,
        cpp.product_id,
        cpp.unit_price,
        pma.market_avg_unit_price,
        cpp.unit_price / NULLIF(pma.market_avg_unit_price, 0) AS relative_price
    FROM vw_bi_current_product_prices cpp
    JOIN product_market_avg pma
      ON pma.product_id = cpp.product_id
     AND pma.market_code = cpp.market_code
    WHERE pma.market_avg_unit_price > 0
)
SELECT
    market_code,
    chain_id,
    chain_name,
    ROUND(100 * AVG(relative_price), 2) AS chain_price_index,
    COUNT(DISTINCT product_id) AS products_compared,
    MIN(unit_price) AS lowest_unit_price_seen,
    MAX(unit_price) AS highest_unit_price_seen
FROM chain_relative_prices
GROUP BY market_code, chain_id, chain_name;
```

## Business use

- Identify cheapest chain
- Benchmark chain competitiveness
- Executive summary KPI

---

# 3. Basket cost by chain

## Purpose

Calculate the cost of each saved weekly basket against each chain with current prices.

```sql
CREATE OR REPLACE VIEW vw_bi_basket_cost_by_chain AS
SELECT
    wb.id AS basket_id,
    wb.user_id,
    wb.week_start,
    cpp.market_code,
    cpp.chain_id,
    cpp.chain_name,
    SUM(bi.quantity * cpp.price) AS basket_cost,
    COUNT(DISTINCT bi.product_id) AS basket_products_expected,
    COUNT(DISTINCT cpp.product_id) AS basket_products_priced,
    ROUND(
        100.0 * COUNT(DISTINCT cpp.product_id)
        / NULLIF(COUNT(DISTINCT bi.product_id), 0),
        2
    ) AS basket_coverage_pct,
    MAX(cpp.observed_at) AS latest_price_observed_at
FROM weekly_baskets wb
JOIN basket_items bi ON bi.basket_id = wb.id
JOIN vw_bi_current_product_prices cpp ON cpp.product_id::text = bi.product_id
GROUP BY wb.id, wb.user_id, wb.week_start, cpp.market_code, cpp.chain_id, cpp.chain_name;
```

## Business use

- Compare basket affordability
- Estimate customer savings
- Build shopper recommendations

---

# 4. Cheapest chain per basket

## Purpose

Find the cheapest chain for each basket while excluding low-coverage comparisons.

```sql
CREATE OR REPLACE VIEW vw_bi_cheapest_chain_per_basket AS
WITH ranked_baskets AS (
    SELECT
        basket_id,
        user_id,
        week_start,
        market_code,
        chain_id,
        chain_name,
        basket_cost,
        basket_coverage_pct,
        ROW_NUMBER() OVER (
            PARTITION BY basket_id
            ORDER BY basket_cost ASC, basket_coverage_pct DESC, chain_name ASC
        ) AS rank_in_basket
    FROM vw_bi_basket_cost_by_chain
    WHERE basket_coverage_pct >= 80
)
SELECT
    basket_id,
    user_id,
    week_start,
    market_code,
    chain_id,
    chain_name,
    basket_cost,
    basket_coverage_pct
FROM ranked_baskets
WHERE rank_in_basket = 1;
```

## Business use

- Executive KPI: cheapest chain
- Basket dashboard
- Monthly savings calculation

---

# 5. Basket saving opportunity

## Purpose

Calculate shopper savings if they switch from each priced chain to the cheapest priced chain.

```sql
CREATE OR REPLACE VIEW vw_bi_basket_saving_opportunity AS
SELECT
    bcc.basket_id,
    bcc.user_id,
    bcc.week_start,
    bcc.market_code,
    bcc.chain_id,
    bcc.chain_name,
    bcc.basket_cost,
    cheapest.chain_name AS cheapest_chain_name,
    cheapest.basket_cost AS cheapest_basket_cost,
    bcc.basket_cost - cheapest.basket_cost AS saving_if_switch,
    ROUND(
        100.0 * (bcc.basket_cost - cheapest.basket_cost)
        / NULLIF(bcc.basket_cost, 0),
        2
    ) AS saving_pct,
    ROUND(4.33 * (bcc.basket_cost - cheapest.basket_cost), 2) AS estimated_monthly_saving
FROM vw_bi_basket_cost_by_chain bcc
JOIN vw_bi_cheapest_chain_per_basket cheapest
  ON cheapest.basket_id = bcc.basket_id;
```

## Business use

- Estimate monthly savings
- Create recommendation text
- Rank chains by affordability

---

# 6. Product price features

## Purpose

Create time-series features for product-level analysis using immutable `observations`.

```sql
CREATE OR REPLACE VIEW vw_bi_product_price_features AS
WITH price_stats AS (
    SELECT
        o.product_id,
        o.chain_id,
        MAX(o.observed_at) AS latest_observed_at,
        AVG(o.price) FILTER (WHERE o.observed_at >= now() - INTERVAL 30