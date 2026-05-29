# GroceryView BI Portfolio Add-on

This folder integrates the BI/Data Analyst portfolio pack into the GroceryView repository.
It documents how the real GroceryView data model, SQL reporting views, dashboard pages,
quality checks, and automated reporting workflow can be presented to recruiters and
stakeholders.

## Contents

| Page | Purpose |
|---|---|
| [00_overview.md](00_overview.md) | Portfolio positioning and deliverables |
| [01_dashboard_pages.md](01_dashboard_pages.md) | Power BI-style report page specification |
| [02_kpi_definitions.md](02_kpi_definitions.md) | KPI definitions used by dashboards and reports |
| [03_data_model.md](03_data_model.md) | Reporting-friendly model mapped to GroceryView entities |
| [04_sql_reporting_views.md](04_sql_reporting_views.md) | PostgreSQL reporting views aligned with GroceryView tables |
| [05_data_quality_monitoring.md](05_data_quality_monitoring.md) | Data quality checks and severity rules |
| [06_power_automate_reporting.md](06_power_automate_reporting.md) | Weekly automated reporting workflow design |
| [07_business_insight_report_template.md](07_business_insight_report_template.md) | Filled example weekly insight report format |
| [08_employer_case_study.md](08_employer_case_study.md) | Interview-ready case study narrative |
| [09_cv_project_bullets.md](09_cv_project_bullets.md) | CV, LinkedIn, and application bullets |
| [10_main_readme_section.md](10_main_readme_section.md) | README section mirrored into the root README |

## GroceryView integration notes

- SQL examples use the repository schema names: `chains`, `stores`, `products`,
  `latest_prices`, `observations`, `weekly_baskets`, `basket_items`, and `source_runs`.
- Dashboard examples use named GroceryView chains such as Willys, Hemköp, ICA,
  Coop, Mathem, and Lidl instead of anonymous example chains.
- Screenshots are not stubbed in this repository; dashboard pages are documented
  as implementation-ready report specifications until real Power BI exports are added.
- Numeric examples are labelled as sample report values and should be regenerated
  from production reporting views before external publication.
