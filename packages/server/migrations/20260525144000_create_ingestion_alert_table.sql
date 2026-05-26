-- Detected ingestion anomalies for ops/admin coverage review.
-- Each row represents one anomaly event; resolved_at is set when ops closes it.

create extension if not exists pgcrypto;

create table if not exists ingestion_alert (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  connector text not null,
  detected_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  check (kind in ('zero_rows', 'price_swing', 'missing_chain', 'dup_ean')),
  check (connector <> ''),
  check (jsonb_typeof(payload) = 'object'),
  check (resolved_at is null or resolved_at >= detected_at)
);

create index if not exists ingestion_alert_unresolved_kind_idx
  on ingestion_alert (kind, detected_at desc)
  where resolved_at is null;

create index if not exists ingestion_alert_connector_detected_idx
  on ingestion_alert (connector, detected_at desc);

create index if not exists ingestion_alert_detected_idx
  on ingestion_alert (detected_at desc);

comment on table ingestion_alert is 'Ops-visible ingestion anomaly events emitted by connector coverage and quality checks.';
comment on column ingestion_alert.kind is 'Anomaly type: zero_rows, price_swing, missing_chain, or dup_ean.';
comment on column ingestion_alert.payload is 'Structured anomaly details such as counts, source run ids, observed prices, or duplicate EAN evidence.';
