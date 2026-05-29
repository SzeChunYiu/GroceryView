# Employer Case Study: GroceryView

This page is written as an interview-ready case study.

Use it to explain the project to employers for Data Analyst, BI Analyst, Reporting Analyst, or Business Analyst roles.

---

# Project title

**GroceryView: Retail Price Intelligence BI Dashboard**

---

# One-sentence summary

GroceryView is a BI portfolio project that transforms grocery price data into SQL reporting views, Power BI-style dashboards, data quality monitoring, and automated weekly insights.

---

# Problem

Grocery prices change frequently across chains, categories, and stores. Raw price data alone is difficult to interpret because product names, package sizes, promotions, and availability vary across retailers.

The goal was to build an analytics system that answers practical questions:

- Which chain is cheapest?
- How much does a standard basket cost across chains?
- Which products are currently good deals?
- Which categories are becoming more expensive?
- Is the dashboard data complete and fresh?
- What action should a shopper or stakeholder take?

---

# My role

I designed and built the BI logic for the project, including:

- data model design
- KPI definitions
- SQL reporting views
- dashboard page planning
- data quality monitoring rules
- automated reporting workflow design
- business insight reporting template

---

# Data model

The project uses a reporting-friendly model with the following entities:

- chains
- stores
- products
- categories
- brands
- price observations
- baskets
- basket items
- product mappings
- data quality flags

The key design decision was to separate raw source product names from standardised product records. This makes cross-chain comparison more reliable and keeps dashboard metrics consistent.

---

# KPIs created

Main KPIs include:

- chain price index
- basket cost by chain
- potential monthly saving
- weekly price change
- product discount percentage
- price volatility
- 90-day low comparison
- deal score
- Buy / Wait signal
- data freshness
- product coverage rate
- outlier price count

---

# Dashboard design

The dashboard is designed around four pages:

## 1. Executive Summary

Shows cheapest chain, average basket cost, weekly price movement, biggest discounts, products tracked, and data freshness.

## 2. Basket Cost Comparison

Compares student, family, healthy, and budget baskets across chains.

## 3. Product Price History

Shows product-level price trends, 30-day averages, 90-day lows, volatility, and Buy / Wait signals.

## 4. Data Quality & Operations

Tracks missing prices, stale records, duplicate mappings, outliers, and coverage rates.

---

# SQL logic

The SQL reporting layer includes views for:

- latest product prices
- chain price index
- basket cost by chain
- cheapest chain per basket
- saving opportunity
- product price features
- best deals
- data freshness
- missing current prices
- price outlier candidates
- category weekly price movement

This structure keeps the dashboard maintainable because KPI logic is centralised in SQL views instead of being repeated manually across visuals.

---

# Data quality monitoring

I included a data quality page because BI dashboards need to be trusted.

The monitoring system checks:

- missing current prices
- stale price records
- invalid prices
- suspicious outliers
- duplicate product mappings
- unit inconsistencies
- missing categories

This helps separate real business movement from data issues.

---

# Automation design

I designed a Power Automate-style reporting workflow:

1. Scheduled weekly trigger
2. Refresh dataset
3. Run data quality checks
4. Retrieve KPI values
5. Apply alert conditions
6. Send email summary
7. Post notification
8. Log report status

This shows how the dashboard could operate as a recurring business reporting process.

---

# Business impact

The project helps stakeholders:

- identify the cheapest grocery chain
- estimate savings from switching chains
- detect strong product deals
- monitor grocery inflation
- track product price volatility
- identify unreliable or stale data
- make decisions based on clear KPIs

---

# What I learned

This project improved my skills in:

- translating messy real-world data into business metrics
- designing SQL views for reporting
- building dashboard page logic
- defining KPIs clearly
- thinking about data quality
- explaining insights in plain English
- designing automated reporting workflows

---

# How this relates to Data Analyst / BI Analyst roles

This project is relevant because analyst jobs often require:

| Job requirement | GroceryView evidence |
|---|---|
| SQL | Reporting views and KPI calculations |
| Power BI | Dashboard pages and KPI visuals |
| Data modelling | Product, chain, basket, and price observation model |
| Data cleaning | Product matching and quality checks |
| Reporting | Weekly insight report template |
| Automation | Scheduled reporting workflow |
| Business communication | Executive summary and recommendations |

---

# Interview answer

If asked, “Tell me about a data project you built,” I would say:

> I built GroceryView, a retail price intelligence BI project. The goal was to turn grocery price data into business-ready KPIs and dashboards. I designed a data model for products, chains, stores, baskets, and price observations. Then I created SQL reporting views for chain price index, basket cost comparison, product price history, best deals, and data quality checks. I also designed a Power BI-style dashboard with executive summary, basket comparison, product trends, and data quality pages. The project demonstrates how I can take messy real-world data and turn it into dashboards, automated reports, and business recommendations.

---

# Short CV version

```text
GroceryView — Retail Price Intelligence BI Dashboard
Built a BI portfolio project using SQL, Python, and Power BI-style dashboard design to analyse grocery price trends, chain competitiveness, basket costs, deal opportunities, and data quality. Designed reporting views, KPI definitions, dashboard pages, and automated weekly reporting workflow.
```
