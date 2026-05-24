create table if not exists benchmark_observation (
  source_id text not null,
  country text not null,
  vertical text not null,
  ecoicop_code text not null,
  period text not null,
  value numeric not null,
  unit text not null,
  observed_at timestamptz not null,
  inserted_at timestamptz not null default now(),
  constraint benchmark_observation_value_nonnegative check (value >= 0)
);

create unique index if not exists benchmark_observation_unique
  on benchmark_observation (source_id, country, vertical, ecoicop_code, period, unit, observed_at);

create index if not exists benchmark_observation_lookup
  on benchmark_observation (source_id, country, vertical, period);
