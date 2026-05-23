create table if not exists fuel_grades (
  id text primary key check (id in ('fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85', 'fuel-adblue')),
  grade_code text not null unique check (grade_code in ('95', '98', 'diesel', 'hvo100', 'e85', 'adblue')),
  label text not null,
  comparable_unit text not null default 'l' check (comparable_unit = 'l'),
  match_key text not null default 'fuel_grade' check (match_key = 'fuel_grade'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into fuel_grades(id, grade_code, label)
values
  ('fuel-95-e10', '95', '95 E10 / Blyfri 95'),
  ('fuel-98', '98', '98 / Blyfri 98'),
  ('fuel-diesel', 'diesel', 'Diesel'),
  ('fuel-hvo100', 'hvo100', 'HVO100'),
  ('fuel-e85', 'e85', 'E85'),
  ('fuel-adblue', 'adblue', 'AdBlue')
on conflict (id) do update set
  grade_code = excluded.grade_code,
  label = excluded.label,
  comparable_unit = excluded.comparable_unit,
  match_key = excluded.match_key,
  active = excluded.active;

alter table chains add column if not exists domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy'));
alter table stores add column if not exists domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy'));
alter table products add column if not exists domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy'));
alter table products add column if not exists fuel_grade_id text references fuel_grades(id) on delete restrict;
alter table price_observations add column if not exists domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy'));

create table if not exists fuel_price_sources (
  id bigserial primary key,
  source_kind text not null check (source_kind in ('operator_public_price_page', 'crowd_station_report')),
  operator_id text,
  operator_name text,
  station_id text references stores(id),
  reporter_id text references community_reporter_trust(reporter_id),
  reporter_trust_tier text check (reporter_trust_tier in ('new', 'trusted', 'operator_verified')),
  evidence_type text check (evidence_type in ('receipt', 'pump_photo', 'manual_entry')),
  source_url text,
  parser_version text,
  captured_at timestamptz,
  submitted_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (source_kind = 'operator_public_price_page'
      and operator_id is not null
      and operator_name is not null
      and source_url is not null
      and parser_version is not null
      and captured_at is not null
      and station_id is null
      and reporter_id is null
      and evidence_type is null)
    or
    (source_kind = 'crowd_station_report'
      and station_id is not null
      and reporter_id is not null
      and reporter_trust_tier is not null
      and evidence_type is not null
      and submitted_at is not null)
  )
);

create table if not exists fuel_price_source_observations (
  source_id bigint not null references fuel_price_sources(id) on delete restrict,
  price_observation_id bigint not null references price_observations(id) on delete cascade,
  fuel_grade_id text not null references fuel_grades(id) on delete restrict,
  original_price_text text not null,
  original_effective_date date,
  created_at timestamptz not null default now(),
  primary key (source_id, price_observation_id),
  unique (price_observation_id)
);

create index if not exists products_fuel_grade_idx on products(fuel_grade_id) where domain = 'fuel';
create index if not exists price_observations_domain_time_idx on price_observations(domain, observed_at desc);
create index if not exists fuel_price_sources_kind_captured_idx on fuel_price_sources(source_kind, captured_at desc nulls last, submitted_at desc nulls last);
create index if not exists fuel_price_source_observations_grade_idx on fuel_price_source_observations(fuel_grade_id, created_at desc);
