# Metric dictionary

## Purpose

Canonical definitions for GroceryView metrics. **Do not redefine these inline on pages.** Import shared computation (`classifyDeal`, index engines, `buildVerifiedEvidence`) and reference this dictionary in page/feature specs.

## Definition template (each metric)

Every entry includes: **grain**, **formula summary**, **public claim boundary**, **freshness SLA**, **required tests**.

---

## Price metrics

### `current_best_price`

| Field | Value |
|-------|-------|
| Grain | product × domain × selected scope (chain/region filters) |
| Definition | Lowest source-backed current known price within filters |
| Do not claim | Guaranteed cheapest everywhere; branch shelf price without evidence |
| SLA | Same as source freshness (typically 24–48h) |
| Tests | Product page, search card, deals board show same value for same product+filters |

### `unit_price`

| Field | Value |
|-------|-------|
| Grain | product × unit (SEK/kg, SEK/litre, SEK/item) |
| Definition | Price normalized to comparable unit via package parsing |
| Required | Valid package/unit parsing; show “—” when not comparable |
| Tests | `unit-price-formatting.test.mjs`, unit normalization QA |

### `price_index` / `chain_price_index` / `category_price_index`

| Field | Value |
|-------|-------|
| Grain | chain or category × region × day |
| Definition | Indexed relative price, base 100, from verified observations |
| Do not claim | Interpolated points where history missing |
| Tests | Index methodology page matches engine constants; market page uses same series |

### `weekly_change_pct` / `three_month_change_pct` / `one_year_change_pct`

| Field | Value |
|-------|-------|
| Grain | product, category, or chain × window |
| Definition | Percent change vs start of window from dated index/observation series |
| Required columns | Market category table must expose all three when `CategoryIndexRow` provides them |
| Tests | Route test checks table headers; values match index API for sample slug |

---

## Deal metrics

### `deal_score`

| Field | Value |
|-------|-------|
| Grain | product × day |
| Definition | Composite: historic discount, nearby comparison, freshness, confidence, availability |
| Public label | Maps to `deal_label` via `classifyDeal()` |
| Tests | Consistent label across deals page, product page, home rail |

### `deal_label`

| Field | Value |
|-------|-------|
| Values | `Real Deal` · `Fair Discount` · `Not Really a Deal` |
| Definition | Thresholds on discount %, confidence, freshness from shared classifier |
| Do not claim | Savings guarantee; always show evidence strip |

### `price_spread_pct`

| Field | Value |
|-------|-------|
| Grain | product (exact match / EAN for pharmacy) |
| Definition | (max − min) / min × 100 among comparable source-backed prices |
| Claim boundary | Exact same product only |

---

## Data quality metrics

### `freshness_rate`

Share of rows within freshness SLA. Dimensions: domain, source, category, chain, region.

### `coverage_rate`

Share of target universe with source-backed data.

### `confidence_score`

Evidence-weighted score from freshness, observation count, source reliability, match quality. Maps to `confidence_label`: high / medium / low / unknown.

### `observation_count`

Count of dated price observations in scope. Shown on evidence strips; never zero with “High confidence”.

---

## Search & alert metrics

### `search_zero_result_rate`

Searches with zero result cards / all searches. Event: `search_zero_result`.

### `search_to_product_click_rate`

Sessions with product click / sessions with non-empty results. Events: `search_submitted`, `search_result_clicked`.

### `watchlist_alert_trigger_rate`

Triggered target-price alerts / active alert rules.

---

## Examples

**Good:** Market “Weekly” column uses `weekly_change_pct`; when 3M/1Y columns added, they use `three_month_change_pct` and `one_year_change_pct` from the same snapshot — not recomputed in the page.

## Anti-patterns

- Page-local “savings percent” that ignores confidence/freshness gates.
- Showing index change without labeling the window (W / 3M / 1Y).
- Pharmacy comparison without EAN grain.

## Required tests

- Schema test: dictionary file exists; core metric IDs listed.
- Cross-surface consistency tests for `current_best_price`, `deal_label`.
- Market table header test for change columns (see gap registry).

## PR update checklist

- [ ] Any visible number → verify dictionary entry exists or add one
- [ ] Formula change → update this file + semantic layer spec + tests
