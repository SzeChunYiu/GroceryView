-- Observation-level product origin and certification evidence for the legacy schema.

alter table price_observations add column if not exists origin_country char(2) check (origin_country is null or origin_country ~ '^[A-Z]{2}$');
alter table price_observations add column if not exists cert_level text check (
  cert_level is null or cert_level in (
    'krav',
    'eu_eco',
    'free_range',
    'asc',
    'msc',
    'rainforest_alliance',
    'fairtrade',
    'conventional'
  )
);

create index if not exists price_observations_origin_cert_idx on price_observations(origin_country, cert_level);
