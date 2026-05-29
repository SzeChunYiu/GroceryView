# Data Model

This document describes a reporting-friendly data model for GroceryView and maps it to the repository's PostgreSQL schema.

The purpose is to demonstrate data modelling skills relevant to Data Analyst and BI Analyst roles while staying aligned with the real application tables.

---

# Entity relationship overview

Core GroceryView entities:

```text
chains
  └── stores
        └── latest_prices
              ├── products
              └── observations

source_runs
  └── raw_records
        └── observations

products
  ├── brands
  ├── category_path
  └── aliases

weekly_baskets
  └── basket_items
        └── products
```

---

# Table: chains

Stores high-level retailer information.

| Column | Type | Reporting use |
|---|---|---|
| id | uuid | Chain key |
| slug | text | Stable URL/report key |
| name | text | Chain label |
| retailer_type | text | Grocery, pharmacy, fuel, convenience, etc. |
| domain | text | Price-intelligence vertical |
| country_code | char(2) | Country scope |
| market_code | char(2) | BI market filter |
| website_url | text | Source reference |

Example GroceryView chains include Willys, Hemköp, ICA, Coop, Mathem, City Gross, and Lidl.

---

# Table: stores

Stores individual store or location information.

| Column | Type | Reporting use |
|---|---|---|
| id | uuid | Store key |
| chain_id | uuid | Foreign key to `chains` |
| name | text | Store label |
| city | text | Geography filter |
| region / district | text | Local area grouping where available |
| country_code | char(2) | Country scope |
| market_code | char(2) | Market filter |
| position / latitude / longitude | geography or decimal | Map visuals |
| store_type | text | Store segmentation |

---

# Table: products

Stores cleaned, standardised product records.

| Column | Type | Reporting use |
|---|---|---|
| id | uuid | Product key |
| slug | text | Stable URL/report key |
| canonical_name | text | Product label |
| brand / brand_id | text / uuid | Brand slicing |
| category_path | text[] | Category hierarchy |
| comparable_unit | text | Unit-price comparison |
| package_size / package_unit | numeric / text | Pack-size normalization |
| market_code | char(2) | Market filter |
| domain | text | Grocery/fuel/pharmacy scope |
| deleted_at | timestamptz | Active-product filter |

## Notes

`products` contains the cleaned entity used for reporting. Raw retailer names and other source labels are traced through `aliases`, `raw_records`, and `observations.provenance`.

---

# Table: aliases

Maps raw or alternate product names to standardised product IDs.

| Column | Type | Reporting use |
|---|---|---|
| id | uuid | Mapping key |
| product_id | uuid | Standard product |
| alias | text | Raw or alternate label |
| normalized_alias | text | Matching key |
| source_type | text | Retailer, receipt, community, import, manual |
| source_ref | text | Source identifier |
| match_confidence | numeric | Matching confidence |
| reviewed_at | timestamptz | Human-review evidence |

Product matching is one of the hardest parts of grocery analytics. Showing this table demonstrates real-world data cleaning and data modelling skill.

---

# Table: observations

Stores immutable historical price facts.

| Column | Type | Reporting use |
|---|---|---|
| id | uuid | Observation key |
| product_id | uuid | Product key |
| chain_id | uuid | Chain key |
| store_id | uuid | Optional store key |
| source_run_id | uuid | Connector run trace |
| raw_record_id | uuid | Raw payload trace |
| price_type | text | Shelf, online, member, promotion, receipt, community, estimated |
| price | numeric | Current observed price |
| regular_price | numeric | Baseline price where available |
| unit_price | numeric | Comparable unit price |
| currency | char(3) | Currency |
| observed_at | timestamptz | Observation timestamp |
| valid_from / valid_until | timestamptz | Change-only history interval |
| confidence | numeric | Source confidence |
| is_available | boolean | Availability signal |
| market_code | char(2) | Market filter |
| domain | text | Vertical filter |
| provenance | jsonb | Traceability metadata |

---

# Table: latest_prices

Stores the current rollup used by product cards, maps, and dashboards.

| Column | Type | Reporting use |
|---|---|---|
| id | uuid | Rollup key |
| product_id | uuid | Product key |
| chain_id | uuid | Chain key |
| store_id | uuid | Store key |
| price_type | text | Price channel |
| observation_id | uuid | Winning observation trace |
| price | numeric | Current price |
| regular_price | numeric | Regular price |
| unit_price | numeric | Comparable unit price |
| observed_at | timestamptz | Freshness metric |
| confidence | numeric | Trust signal |
| is_available | boolean | Availability metric |
| market_code | char(2) | Market filter |
| domain | text | Vertical filter |

`latest_prices` is the preferred source for current dashboard KPIs; `observations` is the preferred source for time-series features.

---

# Tables: weekly_baskets and basket_items

`weekly_baskets` stores account-owned baskets and `basket_items` stores product quantities inside each basket.

| Table | Key columns | Reporting use |
|---|---|---|
| weekly_baskets | id, user_id, week_start | Basket container and weekly history |
| basket_items | basket_id, product_id, quantity | Basket composition and cost weighting |

These tables support basket cost comparison, saving opportunity, and household shopping recommendations.

---

# Tables: source_runs and raw_records

These tables provide auditability for data ingestion.

| Table | Key columns | Reporting use |
|---|---|---|
| source_runs | source_name, source_type, started_at, finished_at, status | Connector freshness and run status |
| raw_records | source_run_id, record_type, payload_hash, observed_at | Raw source trace and duplicate detection |

---

# Star schema for Power BI

For Power BI, simplify the operational model into fact and dimension tables.

## Fact tables

| Table | Source | Purpose |
|---|---|---|
| fact_current_prices | `latest_prices` + product/chain/store joins | Current price dashboard |
| fact_price_observations | `observations` | Historical price trends |
| fact_basket_costs | `weekly_baskets`, `basket_items`, `latest_prices` | Basket cost by chain |
| fact_data_quality | reporting views over latest/observations/source runs | Missing, stale, duplicate, outlier checks |

## Dimension tables

| Table | Source | Purpose |
|---|---|---|
| dim_date | generated calendar | Date attributes |
| dim_product | `products` | Product details |
| dim_chain | `chains` | Chain details |
| dim_store | `stores` | Store details |
| dim_category | `products.category_path` | Category hierarchy |
| dim_brand | `brands` / `products.brand` | Brand details |
| dim_basket | `weekly_baskets` | Basket definitions |

## Recommended Power BI relationships

```text
dim_date[date]             1 -> many fact_price_observations[observed_date]
dim_product[product_id]    1 -> many fact_current_prices[product_id]
dim_chain[chain_id]        1 -> many fact_current_prices[chain_id]
dim_store[store_id]        1 -> many fact_current_prices[store_id]
dim_product[product_id]    1 -> many fact_basket_costs[product_id]
dim_basket[basket_id]      1 -> many fact_basket_costs[basket_id]
```

---

# Why this data model helps your portfolio

This model shows that you understand:

- relational data design
- fact and dimension modelling
- immutable facts plus current rollups
- product matching challenges
- data quality tracking
- dashboard-friendly reporting tables

For job interviews, explain it like this:

> I modelled GroceryView with cleaned products, chain/store dimensions, immutable price observations, current price rollups, basket facts, and ingestion audit tables. This separates source traceability from dashboard-ready entities so business metrics are repeatable and trustworthy.
