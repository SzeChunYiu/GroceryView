# 71 — Metric Dictionary Starter

## Price metrics

### current_best_price

```text
Definition:
Lowest source-backed current known price for a product within selected filters.

Grain:
product × domain × selected scope

Do not claim:
guaranteed cheapest everywhere
```

### unit_price

```text
Definition:
Price normalized to comparable unit, such as SEK/kg, SEK/litre, SEK/item.

Required:
valid package/unit parsing
```

### price_index

```text
Definition:
Indexed relative price measure, base 100, calculated from verified observations.

Required:
sufficient comparable observations
```

## Deal metrics

### deal_score

```text
Definition:
Composite score from historic discount, nearby comparison, freshness, confidence, and availability.

Public label:
Real Deal / Fair Discount / Not Really a Deal
```

### price_spread_pct

```text
Definition:
Percent gap between lowest and highest comparable source-backed prices for same product or exact EAN.

Claim boundary:
Exact same product only.
```

## Data quality metrics

### freshness_rate

```text
Definition:
Share of rows within freshness SLA.

Dimensions:
domain, source, category, chain, region
```

### coverage_rate

```text
Definition:
Share of target product/store/category universe with source-backed data.
```

### confidence_score

```text
Definition:
Evidence-weighted score based on freshness, observation count, source reliability, and match quality.
```

## Search metrics

### search_zero_result_rate

```text
Definition:
Searches with zero result cards / all searches.
```

### search_to_product_click_rate

```text
Definition:
Search sessions with product click / search sessions with non-empty results.
```

## Alert metrics

### watchlist_alert_trigger_rate

```text
Definition:
Triggered target-price alerts / active alert rules.
```
