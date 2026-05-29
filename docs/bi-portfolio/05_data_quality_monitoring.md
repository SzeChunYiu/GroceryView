# Data Quality Monitoring

This page describes the data quality checks used in GroceryView.

A strong BI portfolio should show not only dashboards, but also how the analyst checks whether the data can be trusted.

---

# Why data quality matters

Grocery price data can be messy because:

- product names differ across chains
- product sizes and units may be inconsistent
- prices change frequently
- promotion prices may be temporary
- products may disappear or become unavailable
- data ingestion can fail
- duplicate product mappings can occur
- some price changes may be scraping or parsing errors

A BI analyst needs to detect these issues before presenting results to stakeholders.

---

# Data quality dimensions

| Dimension | Question |
|---|---|
| Completeness | Are expected prices present? |
| Freshness | Is the data recent? |
| Validity | Are prices positive and realistic? |
| Uniqueness | Are there duplicate products or mappings? |
| Consistency | Are units and categories consistent? |
| Accuracy | Do prices look plausible compared with history? |
| Traceability | Can each dashboard value be traced to a source? |

---

# Quality rule 1: Missing current price

## Definition

A product is expected to have a price for a chain, but no current price exists.

## Rule

```text
Product is active
AND Chain is active
AND No valid current price observation exists
```

## Severity

| Condition | Severity |
|---|---|
| Missing product is optional | Low |
| Missing product is in dashboard basket | Medium |
| Missing product affects executive KPI | High |

## Suggested dashboard visual

- KPI card: missing current prices
- Bar chart: missing prices by chain
- Table: products missing price

---

# Quality rule 2: Stale price record

## Definition

The latest price observation is too old.

## Rule

```text
CURRENT_DATE - latest_observation_date > freshness_threshold
```

## Suggested thresholds

| Data age | Status |
|---:|---|
| 0–1 days | Fresh |
| 2–3 days | Acceptable |
| 4–7 days | Needs attention |
| > 7 days | Stale |

## Suggested dashboard visual

- KPI card: stale records
- Bar chart: stale records by chain
- Table: stale products needing refresh

---

# Quality rule 3: Invalid price

## Definition

A price value is impossible or invalid.

## Rule

```text
price IS NULL
OR price <= 0
OR unit_price <= 0
OR currency IS NULL
```

## Severity

Usually high, because invalid prices can break KPI calculations.

## Suggested dashboard visual

- Table: invalid prices
- KPI card: invalid observations

---

# Quality rule 4: Price outlier

## Definition

A price observation is suspicious compared with product history.

## Example rules

```text
ABS(current_price - historical_average) > 3 * historical_standard_deviation
```

or:

```text
ABS(current_price - previous_price) / previous_price > 0.50
```

## Example interpretation

A 50% price increase in one day may be real, but it should be reviewed.

## Suggested dashboard visual

- Table: outlier candidates
- Scatter plot: price change percentage by product
- KPI card: outliers detected

---

# Quality rule 5: Duplicate product mapping

## Definition

The same source product is mapped to multiple standard product IDs, or multiple source products are incorrectly mapped to the same product.

## Example rules

```text
same source_product_id maps to more than one product_id
```

or:

```text
same chain + source_product_name appears multiple times with conflicting product_id
```

## Suggested dashboard visual

- Table: duplicate mappings
- KPI card: duplicate mapping count

---

# Quality rule 6: Unit inconsistency

## Definition

The product package unit is not suitable for comparison.

## Examples

- one product listed in grams, another in kilograms
- missing package size
- invalid unit conversion
- multipack not standardised

## Suggested dashboard visual

- Table: products with missing package size
- Bar chart: invalid units by category

---

# Quality rule 7: Category mismatch

## Definition

A product has no category or has an obviously wrong category.

## Examples

- milk classified as household
- detergent classified as dairy
- product has no category

## Suggested dashboard visual

- Table: uncategorised products
- Bar chart: missing categories by chain

---

# Data quality dashboard KPIs

Recommended KPI cards:

| KPI | Definition |
|---|---|
| Data coverage rate | Percent of expected product-chain prices available |
| Latest refresh date | Most recent ingestion timestamp |
| Missing price count | Number of missing current prices |
| Stale record count | Records older than threshold |
| Outlier count | Suspicious price observations |
| Duplicate mapping count | Product mapping conflicts |
| Invalid unit count | Products with missing or invalid unit info |

---

# Example quality status logic

```text
GREEN:
- coverage >= 95%
- stale records < 3%
- outliers reviewed
- no high-severity invalid prices

AMBER:
- coverage between 85% and 95%
- some stale records
- moderate outlier count

RED:
- coverage < 85%
- major chain missing
- executive KPI affected
- many invalid or stale records
```

---

# Example business explanation

> Data coverage is currently 94.6%. Most missing prices are concentrated in fresh produce and bakery categories. Three chains have stale observations older than seven days and should be refreshed before weekly reporting. No high-severity invalid prices were found in the basket comparison dataset.

---

# Analyst workflow

Recommended data quality workflow:

1. Ingest latest prices
2. Validate required fields
3. Standardise product names and units
4. Match products to standard product table
5. Run data quality checks
6. Flag missing, stale, duplicate, and outlier records
7. Review high-severity issues
8. Refresh dashboard
9. Send weekly report

---

# Interview explanation

Use this explanation in interviews:

> I added a data quality monitoring page because dashboards are only useful if stakeholders can trust the data. I track missing prices, stale observations, duplicate product mappings, invalid units, and price outliers. This helps identify whether changes in KPIs reflect real price movements or data issues.
