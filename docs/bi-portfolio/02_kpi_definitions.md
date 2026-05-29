# KPI Definitions

This document defines the main KPIs used in the GroceryView BI dashboard.

Clear KPI definitions are important because BI analysts must make metrics understandable, repeatable, and trustworthy.

---

# 1. Chain Price Index

## Purpose

Compare the overall price level of each grocery chain.

## Business question

Which chain is cheapest overall?

## Definition

A normalized index where the market average is set to 100.

- Index below 100 = cheaper than market average
- Index above 100 = more expensive than market average

## Example interpretation

| Chain | Index | Interpretation |
|---|---:|---|
| Willys | 92 | 8% cheaper than market average |
| Hemköp | 100 | Market average |
| Coop | 109 | 9% more expensive than market average |

## Suggested formula

```sql
chain_price_index =
    100 * AVG(chain_product_price / market_average_product_price)
```

## Dashboard usage

- Executive summary
- Chain comparison
- Trend over time

---

# 2. Basket Cost

## Purpose

Calculate the cost of a predefined shopping basket at each chain.

## Business question

Where is the selected basket cheapest?

## Definition

Total cost of all items in a selected basket for a selected chain and date.

## Suggested formula

```sql
basket_cost = SUM(product_price * basket_quantity)
```

## Dashboard usage

- Basket comparison
- Monthly saving estimate
- Household cost tracking

---

# 3. Potential Saving

## Purpose

Estimate how much a shopper can save by switching from a selected chain to the cheapest chain.

## Business question

How much money could the shopper save?

## Suggested formula

```sql
potential_saving = selected_chain_basket_cost - cheapest_chain_basket_cost
```

## Monthly estimate

```sql
monthly_saving = weekly_saving * 4.33
```

## Dashboard usage

- Executive summary
- Basket comparison
- Recommendation text

---

# 4. Weekly Price Change

## Purpose

Track whether prices are rising or falling.

## Business question

Are grocery prices increasing this week?

## Suggested formula

```sql
weekly_price_change_pct =
    (current_week_avg_price - previous_week_avg_price)
    / previous_week_avg_price * 100
```

## Dashboard usage

- Executive summary
- Category price movement
- Inflation monitoring

---

# 5. Product Discount Percentage

## Purpose

Measure how much cheaper the current price is compared with recent average price.

## Business question

Is this product currently a good deal?

## Suggested formula

```sql
discount_pct =
    (avg_30d_price - current_price) / avg_30d_price * 100
```

## Interpretation

| Discount | Meaning |
|---:|---|
| < 5% | Weak deal |
| 5–10% | Moderate deal |
| 10–20% | Strong deal |
| > 20% | Very strong deal |

## Dashboard usage

- Best deals table
- Product detail page
- Buy / Wait signal

---

# 6. Price Volatility

## Purpose

Measure how unstable a product price is over time.

## Business question

Does this product change price often?

## Suggested formula

```sql
price_volatility = STDDEV(price) / AVG(price)
```

## Dashboard usage

- Product price history
- Deal reliability
- Buy / Wait recommendation

---

# 7. 90-Day Lowest Price Gap

## Purpose

Compare the current price with the lowest observed price in the last 90 days.

## Business question

Is the current price close to a historical low?

## Suggested formula

```sql
gap_to_90d_low_pct =
    (current_price - lowest_90d_price) / lowest_90d_price * 100
```

## Dashboard usage

- Product detail page
- Buy / Wait indicator

---

# 8. Data Freshness

## Purpose

Show whether dashboard data is up to date.

## Business question

Can stakeholders trust this report today?

## Suggested formula

```sql
data_age_days = CURRENT_DATE - MAX(observation_date)
```

## Suggested thresholds

| Data age | Status |
|---:|---|
| 0–1 days | Fresh |
| 2–3 days | Acceptable |
| 4–7 days | Needs attention |
| > 7 days | Stale |

## Dashboard usage

- Executive summary
- Data quality page

---

# 9. Product Coverage Rate

## Purpose

Measure the percentage of expected products with valid prices.

## Business question

How complete is the dataset?

## Suggested formula

```sql
coverage_rate =
    COUNT(products_with_valid_price) / COUNT(expected_products) * 100
```

## Dashboard usage

- Data quality monitoring
- Chain/category reliability checks

---

# 10. Outlier Price Count

## Purpose

Identify suspicious price movements.

## Business question

Which prices may be incorrect or need review?

## Suggested rule

A price observation is flagged as an outlier if:

```text
absolute price change > 50%
OR
current price > 3 standard deviations from product average
OR
unit price is zero or negative
```

## Dashboard usage

- Data quality page
- Analyst review queue

---

# 11. Deal Score

## Purpose

Rank deals using multiple price signals.

## Business question

Which products are the best deals today?

## Example formula

```text
deal_score =
    0.50 * discount_vs_30d_average
  + 0.30 * closeness_to_90d_low
  + 0.20 * data_freshness_score
```

## Dashboard usage

- Best deals table
- Product recommendation
- Alert system

---

# 12. Buy / Wait Signal

## Purpose

Convert price analysis into a simple action.

## Business question

Should the shopper buy now or wait?

## Example logic

```text
BUY:
- current price is below 30-day average
- current price is close to 90-day low
- data is fresh

WAIT:
- current price is above 30-day average
- price trend is falling
- similar substitute is cheaper
```

## Dashboard usage

- Product detail page
- Deal alert
- Consumer-facing recommendation
