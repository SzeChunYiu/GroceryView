# 57 — Frontstage / Backstage Separation

## Why this matters

Not everything belongs on the user website.

GroceryView has many powerful technical details, but showing all of them makes the product feel ugly, confusing, and less trustworthy.

## Frontstage: user-facing website

Show:

```text
Product name
Current best known price
Deal label
Where to buy
Price history summary
Freshness
Confidence
Observation count
Simple limitation
Next action
```

Do not show as primary content:

```text
server-side cursor pagination
raw_records
source_run_id
buildPriceChartSeries
parser version
COPY staging
dead-letter rows
schema version
pipeline internals
```

## Backstage: admin/debug/ops

Show:

```text
source runs
raw records
parser logs
connector health
dead letters
schema changes
quality checks
publish gates
DB query latency
index bloat
storage size
search analytics
ad policy checks
```

## Evidence layer: bridge between frontstage and backstage

The Evidence panel should translate technical truth into human trust:

```text
Frontstage text:
Source: OpenPrices + chain rows
Last observed: 2026-05-20
Confidence: Medium
Rows: 24
Limitation: No branch-level shelf price yet

Backstage link:
View source run details
```

## Rule by page

### Home

Frontstage only. No debug.

### Search

Show result quality and filters.
Move performance/pagination internals backstage.

### Product

Show price evidence, not raw source internals.
Allow "View source details" if needed.

### Market

Show dashboard and data quality summaries.
Move source-run diagnostics backstage.

### Map

Show layer meaning and selected details.
Move coordinate source/debug logs backstage.

### Pharmacy

Show safety boundary and exact EAN evidence.
Move connector details backstage.

### Fuel

Show operator/station claim boundary.
Move pipeline details backstage.

### Admin

Show everything technical.
