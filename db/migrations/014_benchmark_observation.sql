create table if not exists benchmark_observation (
  source_id text not null,
  country char(2) not null,
  vertical text not null,
  ecoicop_code text not null,
  period text not null check (period ~ '^\\d{4}-\\d{2}(-\\d{2})?$'),
  value numeric not null,
  unit text not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_id, country, vertical, ecoicop_code, period)
);

create index if not exists benchmark_observation_source_period_idx
  on benchmark_observation(source_id, country, period desc);
