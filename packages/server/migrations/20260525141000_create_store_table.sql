-- Store directory for Nordic grocery/pharmacy/fuel ingestion.
-- Stores are chain-scoped because retailer-provided ids are not globally unique.

create extension if not exists pgcrypto;

create table if not exists store (
  id uuid primary key default gen_random_uuid(),
  chain text not null,
  chain_store_id text not null,
  name text not null,
  country char(2) not null,
  kommun text,
  region text,
  lat numeric,
  lng numeric,
  opening_hours jsonb not null default '{}'::jsonb,
  services text[] not null default '{}'::text[],
  osm_id bigint,
  last_seen_at timestamptz not null default now(),
  unique (chain, chain_store_id),
  check (country ~ '^[A-Z]{2}$'),
  check (lat is null or (lat >= -90 and lat <= 90)),
  check (lng is null or (lng >= -180 and lng <= 180))
);

create index if not exists store_chain_idx on store (chain);
create index if not exists store_country_region_idx on store (country, region);
create index if not exists store_lat_lng_idx on store (lat, lng) where lat is not null and lng is not null;
create index if not exists store_osm_id_idx on store (osm_id) where osm_id is not null;
