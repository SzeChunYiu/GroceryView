create table if not exists store (
  id uuid primary key,
  chain text not null,
  chain_store_id text not null,
  name text not null,
  country char(2) not null,
  kommun text,
  region text,
  lat numeric,
  lng numeric,
  opening_hours jsonb not null default '{}'::jsonb,
  services text[] not null default array[]::text[],
  osm_id bigint,
  last_seen_at timestamptz not null,
  unique (chain, chain_store_id)
);

create index if not exists store_lat_lng_idx
  on store (lat, lng)
  where lat is not null and lng is not null;
