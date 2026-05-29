# Power BI Dashboard Page Design

This document defines the dashboard pages for the BI portfolio version of GroceryView.

The goal is to make the project look like a real **Data Analyst / BI Analyst** deliverable, not just a software app.

## Dashboard structure

Recommended Power BI report pages:

1. Executive Summary
2. Basket Cost Comparison
3. Product Price History
4. Data Quality & Operations

---

# Page 1: Executive Summary

## Purpose

Give a manager or stakeholder a fast overview of the grocery market.

This page should answer:

- Which chain is cheapest overall?
- Are prices rising or falling?
- Where are the biggest savings?
- Which categories changed the most?
- Is the data fresh enough to trust?

## Suggested visuals

| Visual | Description |
|---|---|
| KPI card: Cheapest Chain | Chain with lowest current chain price index |
| KPI card: Average Basket Cost | Current cost of selected basket |
| KPI card: Weekly Price Change | Percentage change compared with previous week |
| KPI card: Biggest Deal | Largest discount versus recent average |
| KPI card: Products Tracked | Count of products with valid current price |
| KPI card: Data Freshness | Latest observation date |
| Line chart | Average basket cost over time |
| Bar chart | Chain price index by chain |
| Table | Top 10 deal opportunities |
| Bar chart | Category price change this week |

## Recommended slicers

- Date range
- Chain
- Category
- Basket type
- Brand tier
- Store / district

## Example insight text

> In the sample report, Willys is the cheapest chain, with a basket cost 8.4% lower than the market average. Dairy and pantry items showed the largest weekly increases, while selected frozen products had the strongest discounts.

## Employer skill signal

This page demonstrates:

- KPI design
- dashboard layout
- executive reporting
- trend analysis
- business communication

---

# Page 2: Basket Cost Comparison

## Purpose

Compare how much the same basket costs across different grocery chains.

This page should answer:

- Where should a shopper buy the same basket?
- How much can they save by switching chain?
- Which basket type is most affected by price differences?
- Which products drive most of the cost difference?

## Suggested basket types

| Basket | Example products |
|---|---|
| Student basket | Pasta, rice, eggs, milk, bread, frozen food, budget protein |
| Family basket | Milk, cereal, meat, vegetables, fruit, snacks, cleaning items |
| Healthy basket | Chicken, fish, oats, vegetables, fruit, yoghurt |
| Budget basket | Store-brand staples and low-cost products |
| Custom basket | User-selected products |

## Suggested visuals

| Visual | Description |
|---|---|
| Bar chart | Basket cost by chain |
| KPI card | Cheapest chain for selected basket |
| KPI card | Potential monthly saving |
| Waterfall chart | Products contributing most to difference |
| Matrix | Product price by chain |
| Line chart | Basket cost trend over time |
| Map, optional | Price by store district |

## Recommended calculations

- Basket cost by chain
- Difference from cheapest chain
- Difference from market average
- Monthly saving estimate
- Product-level contribution to price gap

## Example insight text

> For the selected family basket, Hemköp is currently 12.7% cheaper than Coop in the sample report. The largest cost differences come from meat, dairy, and baby products. A household buying this basket weekly could save approximately SEK 430 per month by switching to the cheapest verified chain.

## Employer skill signal

This page demonstrates:

- comparative analysis
- aggregation logic
- customer-facing insight
- decision support
- business storytelling

---

# Page 3: Product Price History

## Purpose

Analyse product-level price trends and identify whether a current price is high, low, or unusual.

This page should answer:

- Is this product cheaper than usual?
- Is the price trending up or down?
- How volatile is the product price?
- Is the current price close to a historical low?
- Should the shopper buy now or wait?

## Suggested visuals

| Visual | Description |
|---|---|
| Line chart | Product price over time by chain |
| KPI card | Current price |
| KPI card | 30-day average price |
| KPI card | 90-day lowest price |
| KPI card | Price volatility |
| KPI card | Buy / Wait signal |
| Scatter plot | Discount percentage vs price volatility |
| Table | Similar products and substitutes |

## Recommended calculations

- Current price
- Previous observed price
- 7-day / 30-day / 90-day moving average
- Lowest price in selected period
- Highest price in selected period
- Current price versus 30-day average
- Current price versus 90-day low
- Volatility score
- Buy / Wait score

## Example Buy / Wait logic

```text
BUY if:
- current price is at least 10% below 30-day average
- current price is within 5% of 90-day low
- data is fresh

WAIT if:
- current price is above 30-day average
- price has been falling recently
- similar substitute is cheaper
```

## Example insight text

> The selected product is currently 14.2% below its 30-day average and only 3.1% above its 90-day low. Based on the price history, this is a strong buy signal.

## Employer skill signal

This page demonstrates:

- time-series analysis
- product-level drilldown
- conditional logic
- actionable recommendation
- analytical thinking

---

# Page 4: Data Quality & Operations

## Purpose

Show that the dashboard is reliable and that the analyst understands data quality.

This is one of the most important pages for making the project look professional.

This page should answer:

- Is the data fresh?
- Are there missing prices?
- Are there duplicate products?
- Are there suspicious price outliers?
- Which chains or categories have poor coverage?
- Can stakeholders trust the dashboard?

## Suggested visuals

| Visual | Description |
|---|---|
| KPI card | Latest data refresh date |
| KPI card | Products with missing current price |
| KPI card | Stale records |
| KPI card | Duplicate product mappings |
| KPI card | Price outliers detected |
| Bar chart | Missing prices by chain |
| Bar chart | Stale records by category |
| Table | Products needing review |
| Line chart | Data coverage over time |

## Recommended data quality rules

| Rule | Description |
|---|---|
| Missing price | Product has no valid price for selected date |
| Stale record | Product price has not been updated within X days |
| Duplicate mapping | Same product appears with multiple conflicting IDs |
| Outlier price | Price change exceeds expected threshold |
| Invalid unit price | Unit price is zero, negative, or missing |
| Broken category | Product has no category |
| Missing chain | Product observation has no chain/store mapping |

## Example insight text

> Data coverage is currently 94.6%. Most missing prices are concentrated in fresh produce and bakery categories. Three chains have stale observations older than seven days and should be refreshed before weekly reporting.

## Employer skill signal

This page demonstrates:

- data governance awareness
- operational reporting
- QA mindset
- professional dashboard design
- real-world analyst maturity
