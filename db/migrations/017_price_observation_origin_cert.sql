alter table price_observations add column if not exists origin_country char(2);
alter table price_observations add column if not exists cert_level text;

do $$
begin
  alter table price_observations add constraint price_observations_origin_country_check
    check (origin_country is null or origin_country ~ '^[A-Z]{2}$');
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table price_observations add constraint price_observations_cert_level_check
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

create index if not exists price_observations_origin_cert_idx
  on price_observations(origin_country, cert_level);
