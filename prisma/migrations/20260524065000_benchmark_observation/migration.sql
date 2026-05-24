create table if not exists benchmark_observation (
  source_id text not null,
  country text not null,
  vertical text not null,
  ecoicop_code text not null,
  period text not null check (period ~ '^\d{4}-\d{2}(-\d{2})?$'),
  value numeric not null,
  unit text not null,
  observed_at timestamptz not null,
  primary key (source_id, country, vertical, ecoicop_code, period)
);
