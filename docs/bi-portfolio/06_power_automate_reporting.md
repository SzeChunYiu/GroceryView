# Automated Reporting Workflow

This page describes a Power Automate-style workflow for GroceryView.

The goal is to show employers that this project is not only a dashboard, but also an automated reporting process.

---

# Workflow name

**Weekly Grocery Price Intelligence Report**

---

# Business purpose

Automatically send a weekly summary of grocery price movements, basket costs, best deals, and data quality status.

This workflow is relevant to Data Analyst / BI Analyst jobs because many analyst roles require automated reporting, alerts, and stakeholder communication.

---

# Workflow trigger

## Scheduled trigger

```text
Every Monday at 09:00
```

Alternative triggers:

- When new price data is loaded
- When Power BI dataset refresh completes
- When data quality status becomes red
- When basket cost increases by more than a threshold
- When a product on the watchlist drops below target price

---

# Workflow steps

## Step 1: Refresh dataset

Action:

```text
Refresh Power BI dataset or run data update script
```

Purpose:

Ensure the report uses the latest available price data.

---

## Step 2: Run data quality checks

Action:

```text
Check missing prices, stale records, duplicate mappings, and price outliers
```

Purpose:

Avoid sending misleading reports when the data is incomplete or stale.

---

## Step 3: Retrieve KPI values

Action:

```text
Read KPI values from reporting table or Power BI dataset
```

Example KPIs:

- cheapest chain
- average basket cost
- weekly price change
- biggest deal
- number of stale records
- data coverage rate

---

## Step 4: Apply alert conditions

Example conditions:

```text
IF basket_cost_change_pct > 5%
THEN include price increase alert
```

```text
IF data_coverage_rate < 90%
THEN mark report as data quality warning
```

```text
IF discount_pct > 20%
THEN include product in best deals alert
```

---

## Step 5: Send email summary

Example recipients:

- analyst
- project owner
- stakeholder
- hiring portfolio demo recipient

Example subject:

```text
Weekly GroceryView Price Intelligence Report
```

Example email body:

```text
Hi,

Here is this week's GroceryView price intelligence summary.

Key findings:
- Cheapest chain: Willys
- Average basket cost: 542.30 SEK
- Weekly basket cost change: +2.8%
- Biggest deal: Product X, 24.5% below 30-day average
- Data coverage: 94.6%
- Data quality status: Amber

Recommended action:
Review price increases in dairy and pantry categories. Refresh stale product records for Coop before publishing the dashboard externally.

Regards,
GroceryView Reporting Bot
```

---

## Step 6: Post Teams / Slack notification

Example message:

```text
GroceryView weekly report is ready.

Cheapest chain: Willys
Basket cost change: +2.8%
Data quality: Amber
Top deal: Product X, 24.5% below average
```

---

## Step 7: Log report run

Store the report status in a logging table.

Recommended columns:

| Column | Description |
|---|---|
| report_run_id | Unique report run |
| report_date | Date report was generated |
| refresh_status | success, warning, failed |
| data_coverage_rate | Product coverage |
| missing_price_count | Missing prices |
| stale_record_count | Stale records |
| email_sent_flag | Whether email was sent |
| error_message | Error details, if any |

---

# Alert examples

## Basket inflation alert

```text
Condition:
Average basket cost increased by more than 5% week-on-week.

Action:
Send alert email and highlight affected categories.
```

## Best deal alert

```text
Condition:
A tracked product is more than 20% below its 30-day average.

Action:
Send product alert with chain, current price, and discount percentage.
```

## Data quality alert

```text
Condition:
Data coverage falls below 90%.

Action:
Notify analyst and delay external reporting.
```

---

# Power Automate implementation idea

A real Microsoft Power Automate version could use:

| Component | Example |
|---|---|
| Trigger | Recurrence: every Monday 09:00 |
| Data refresh | Power BI connector |
| Data source | SharePoint, Excel, SQL Server, Dataverse, or API |
| Logic | Conditions for price changes and quality status |
| Output | Outlook email |
| Notification | Teams message |
| Log | Excel table or SharePoint list |

---

# Portfolio evidence checklist

Attach real Power BI screenshots or exported dashboard PDFs when available. Until then, include evidence links for:

- Power Automate flow overview
- scheduled trigger
- condition logic
- email action
- Teams notification action
- example report email
- report log table

---

# README summary

You can add this to your main README:

```markdown
### Automated reporting workflow

Designed a Power Automate-style weekly reporting workflow that refreshes GroceryView KPIs, checks data quality, sends an email summary, posts alerts for large price movements, and logs the reporting status.
```

---

# CV bullet

```text
Designed an automated reporting workflow for GroceryView using Power Automate-style logic to refresh KPIs, monitor data quality, send weekly email summaries, and trigger alerts for significant price changes.
```

---

# Interview explanation

Use this explanation in interviews:

> I designed GroceryView as an end-to-end BI process rather than only a dashboard. The automated workflow refreshes the data, checks quality, extracts KPIs, sends a weekly email summary, and triggers alerts when basket costs or product prices change significantly. This is similar to the automated reporting workflows many businesses use with Power BI and Power Automate.
