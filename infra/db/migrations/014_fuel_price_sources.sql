-- Fuel price source model.
--
-- Fuel facts are still stored as immutable observations with domain='fuel'.
-- These tables make the fuel-grade catalog and the two accepted fuel source
-- classes explicit: operator public price pages and trusted crowd station
-- reports. They do not permit synthetic or estimated fuel prices.

create table if not exists fuel_grades (
  id text primary key check (id in ('fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85')),
  grade_code text not null unique check (grade_code in ('95', '98', 'diesel', 'hvo100', 'e85')),
  label text not null,
  comparable_unit text not null default 'l' check (comparable_unit = 'l'),
  match_key text not null default 'fuel_grade' check (match_key = 'fuel_grade'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into fuel_grades(id, grade_code, label)
values
  ('fuel-95-e10', '95', '95 E10 / Blyfri 95'),
  ('fuel-98', '98', '98 / Blyfri 98'),
  ('fuel-diesel', 'diesel', 'Diesel'),
  ('fuel-hvo100', 'hvo100', 'HVO100'),
  ('fuel-e85', 'e85', 'E85')
on conflict (id) do update set
  grade_code = excluded.grade_code,
  label = excluded.label,
  comparable_unit = excluded.comparable_unit,
  match_key = excluded.match_key,
  active = excluded.active,
  updated_at = now();

alter table products add column if not exists fuel_grade_id text references fuel_grades(id) on delete restrict;

create index if not exists products_fuel_grade_idx
  on products (fuel_grade_id)
  where domain = 'fuel';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_fuel_grade_domain_check') then
    alter table products add constraint products_fuel_grade_domain_check
      check (fuel_grade_id is null or (domain = 'fuel' and comparable_unit = 'l'));
  end if;
end $$;

create table if not exists fuel_price_sources (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (source_kind in ('operator_public_price_page', 'crowd_station_report')),
  operator_id text,
  operator_name text,
  station_id uuid references stores(id) on delete restrict,
  reporter_id text references community_reporter_trust(reporter_id) on delete restrict,
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
  source_id uuid not null references fuel_price_sources(id) on delete restrict,
  observation_id uuid not null references observations(id) on delete cascade,
  fuel_grade_id text not null references fuel_grades(id) on delete restrict,
  original_price_text text not null,
  original_effective_date date,
  created_at timestamptz not null default now(),
  primary key (source_id, observation_id),
  unique (observation_id)
);

create index if not exists fuel_price_sources_kind_captured_idx
  on fuel_price_sources (source_kind, captured_at desc nulls last, submitted_at desc nulls last);

create index if not exists fuel_price_source_observations_grade_idx
  on fuel_price_source_observations (fuel_grade_id, created_at desc);

comment on table fuel_grades is 'Supported fuel products for domain=fuel matching; each grade compares only per litre.';
comment on column products.fuel_grade_id is 'Fuel grade key for domain=fuel products; grocery and pharmacy products leave this null.';
comment on table fuel_price_sources is 'Operator public fuel price pages and trusted crowd station reports accepted as fuel observation sources.';
comment on table fuel_price_source_observations is 'Join table from a fuel source row to immutable domain=fuel observations with the original price text.';
