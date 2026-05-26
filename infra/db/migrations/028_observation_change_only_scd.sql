-- Change-only observation writes for daily connector persistence.
--
-- Observations keep SCD-2 style validity intervals. Connectors should append a
-- new row only when the price fact changes for product + chain + store + price
-- type; unchanged daily sightings reuse the open interval instead of creating
-- another immutable row with a later observed_at.

update observations
set valid_from = observed_at
where valid_from is null;

with ordered as (
  select id,
         lead(observed_at) over (
           partition by product_id, chain_id, store_id, domain, price_type
           order by observed_at, created_at, id
         ) as next_observed_at
  from observations
),
intervals as (
  select observations.id,
         case
           when ordered.next_observed_at is not null
            and (
              observations.valid_until is null or
              observations.valid_until > ordered.next_observed_at
            )
           then ordered.next_observed_at
           else observations.valid_until
         end as valid_until
  from observations
  join ordered on ordered.id = observations.id
)
update observations
set valid_until = intervals.valid_until
from intervals
where observations.id = intervals.id
  and observations.valid_until is distinct from intervals.valid_until;

create index if not exists observations_change_only_lookup_idx
  on observations (
    product_id,
    chain_id,
    store_id,
    domain,
    price_type,
    observed_at desc,
    created_at desc
  )
  include (price, regular_price, unit_price, currency, is_available, valid_from, valid_until);

comment on column observations.valid_from is 'Start of the price fact interval for change-only connector writes; defaults to observed_at for new observations.';
comment on column observations.valid_until is 'End of the price fact interval when a later changed price fact supersedes this observation; null means the current open interval.';
comment on index observations_change_only_lookup_idx is 'Lookup for latest prior price fact during change-only ingestion; unchanged daily rows reuse the open observation interval instead of appending duplicates.';
