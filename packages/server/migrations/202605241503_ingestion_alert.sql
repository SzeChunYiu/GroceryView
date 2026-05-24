create extension if not exists pgcrypto;

create table if not exists ingestion_alert (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('zero_rows', 'price_swing', 'missing_chain', 'dup_ean')),
  connector text not null,
  detected_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz
);

comment on table ingestion_alert is 'One row per detected ingestion anomaly for admin coverage triage.';
comment on column ingestion_alert.kind is 'Detected anomaly kind: zero_rows, price_swing, missing_chain, or dup_ean.';
comment on column ingestion_alert.payload is 'Connector-specific anomaly evidence and sample rows as JSON.';

create index if not exists ingestion_alert_unresolved_idx
  on ingestion_alert (detected_at desc)
  where resolved_at is null;

create index if not exists ingestion_alert_connector_kind_idx
  on ingestion_alert (connector, kind, detected_at desc);
