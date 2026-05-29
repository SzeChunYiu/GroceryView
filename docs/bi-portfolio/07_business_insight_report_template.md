# Business Insight Report Template

Use this page as a weekly business insight report format for GroceryView. The values below are **sample report values** that show the writing style and table shape; regenerate them from `vw_bi_*` reporting views before publishing an external report.

---

# GroceryView Weekly Price Intelligence Report

## Reporting period

**Week:** 2026-05-25 to 2026-05-31

**Generated on:** 2026-05-29

**Prepared by:** GroceryView BI reporting workflow

---

# 1. Executive summary

## Key findings

- Willys is the sample cheapest chain in this report extract, with a chain price index below the market average.
- The family basket has the largest absolute saving opportunity because it contains more high-variance categories.
- Dairy, frozen food, and pantry products are the categories most likely to drive weekly movement.
- Member and promotion prices create the strongest short-term deal opportunities.
- Data quality status must be checked before distribution: stale observations and missing current prices can change the recommendation.

## Recommended action

Use the chain price index and basket comparison together: the cheapest chain overall is not always the cheapest chain for a specific household basket. Refresh stale chain rows before sending stakeholder reports, then publish the best-deal table only for products with current observations and confidence above the dashboard threshold.

---

# 2. Market overview

## Chain price comparison

| Rank | Chain | Chain price index | Interpretation |
|---:|---|---:|---|
| 1 | Willys | 92.4 | Cheapest sample chain |
| 2 | Hemköp | 98.1 | Below average |
| 3 | ICA | 103.5 | Above average |
| 4 | Coop | 108.2 | Highest sample index |

## Insight

Willys has the lowest sample chain price index at 92.4, meaning its comparable products are approximately 7.6% below the market-average index in this illustrative report. Coop has the highest sample index and should be monitored for category-level outliers before making a final shopper recommendation.

---

# 3. Basket cost analysis

## Basket cost by chain

| Basket | Cheapest chain | Cheapest cost | Highest-cost chain | Highest cost | Saving opportunity |
|---|---|---:|---|---:|---:|
| Student basket | Willys | SEK 320 | Coop | SEK 375 | SEK 55 |
| Family basket | Hemköp | SEK 890 | Coop | SEK 1,020 | SEK 130 |
| Healthy basket | Willys | SEK 610 | ICA | SEK 690 | SEK 80 |

## Insight

The family basket has the largest absolute saving opportunity in this sample. A household buying this basket weekly could save approximately SEK 563 per month by choosing the cheapest chain instead of the highest-cost chain, assuming the basket contents and current prices remain stable.

---

# 4. Product deal opportunities

## Top deal candidates

| Rank | Product | Chain | Current price | 30-day average | Discount vs 30-day average |
|---:|---|---|---:|---:|---:|
| 1 | Milk 1L | Hemköp | SEK 22.90 | SEK 31.20 | 26.6% |
| 2 | Oats 1kg | Willys | SEK 15.50 | SEK 19.80 | 21.7% |
| 3 | Frozen berries 500g | Coop | SEK 42.00 | SEK 50.00 | 16.0% |

## Insight

The strongest deal candidates are products priced materially below their recent average. Before sending an alert, confirm that the product is available, the promotion period has not expired, and the latest observation is within the freshness SLA.

---

# 5. Data quality status

| Quality check | Sample status | Action |
|---|---|---|
| Latest refresh | Fresh | Use in dashboard |
| Missing current prices | Needs review | Prioritise products in executive baskets |
| Stale observations | Watch | Re-run connectors for affected chains |
| Outlier candidates | Review | Confirm parsing and unit normalisation |
| Product coverage | Acceptable | Publish with coverage note |

## Insight

A BI report should not be distributed from KPI values alone. Data quality checks explain whether the numbers are trustworthy and which chains, categories, or products require analyst review.

---

# 6. Recommended stakeholder message

This week's sample report shows a meaningful saving opportunity for households that compare baskets across chains. The best action is to refresh stale observations, verify outlier products, and then publish a concise recommendation: buy staple basket items from the cheapest verified chain and monitor high-discount products for short-term savings.

---

# 7. Follow-up actions

1. Refresh the Power BI dataset or SQL reporting extracts.
2. Run `vw_bi_data_freshness_by_chain`, `vw_bi_missing_current_prices`, and `vw_bi_price_outlier_candidates`.
3. Recalculate the chain price index and basket cost views.
4. Export dashboard visuals for the stakeholder report.
5. Send the weekly summary only if quality status is acceptable.

---

# Portfolio use

This template demonstrates that the project can translate data into business communication. It should be shown together with the dashboard pages, KPI definitions, SQL views, and data quality monitoring documentation.
