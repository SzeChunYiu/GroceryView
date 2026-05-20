-- Allow public official API ingestion runs such as Open Food Facts Open Prices.

alter table source_runs
  drop constraint if exists source_runs_source_type_check;

alter table source_runs
  add constraint source_runs_source_type_check
  check (source_type in ('official_api', 'retailer_api', 'retailer_page', 'weekly_leaflet', 'receipt_ocr', 'community_report', 'manual_seed'));
