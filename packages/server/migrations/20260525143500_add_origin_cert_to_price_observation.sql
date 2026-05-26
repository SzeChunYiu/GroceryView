-- Observation-level country-of-origin and certification metadata for fresh products.
-- The sale country remains price_observation.country; origin_country is where
-- the observed item was grown or raised when the source exposes it.

alter table price_observation
  add column if not exists origin_country char(2),
  add column if not exists cert_level text;

do $$
begin
  alter table price_observation add constraint price_observation_origin_country_check
    check (origin_country is null or origin_country ~ '^[A-Z]{2}$');
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table price_observation add constraint price_observation_cert_level_check
    check (
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
exception when duplicate_object then null;
end $$;

create index if not exists price_observation_origin_cert_idx
  on price_observation(origin_country, cert_level);

comment on column price_observation.origin_country is 'ISO-3166 alpha-2 country where the observed fresh product was grown or raised, when exposed by the chain/source.';
comment on column price_observation.cert_level is 'Source-provided certification level for the observed fresh product: krav, eu_eco, free_range, asc, msc, rainforest_alliance, fairtrade, or conventional.';
