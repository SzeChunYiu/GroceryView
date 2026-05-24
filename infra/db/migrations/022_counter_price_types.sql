alter table observations drop constraint if exists observations_price_type_check;
alter table observations
  add constraint observations_price_type_check
  check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated'));

alter table latest_prices drop constraint if exists latest_prices_price_type_check;
alter table latest_prices
  add constraint latest_prices_price_type_check
  check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated'));

alter table price_daily drop constraint if exists price_daily_price_type_check;
alter table price_daily
  add constraint price_daily_price_type_check
  check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated'));

alter table price_weekly drop constraint if exists price_weekly_price_type_check;
alter table price_weekly
  add constraint price_weekly_price_type_check
  check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated'));

alter table observations_v2 drop constraint if exists observations_v2_price_type_check;
alter table observations_v2
  add constraint observations_v2_price_type_check
  check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated'));

comment on constraint observations_price_type_check on observations is 'Separates packaged shelf prices from in-store counter meat, deli, and fish prices.';
comment on constraint latest_prices_price_type_check on latest_prices is 'Keeps counter meat, deli, and fish prices as separate latest price channels for side-by-side UI.';

alter table watchlists drop constraint if exists watchlists_allowed_price_types_check;
alter table watchlists
  add constraint watchlists_allowed_price_types_check
  check (
    cardinality(allowed_price_types) > 0
    and allowed_price_types <@ array['shelf', 'member', 'promotion', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated']::text[]
  );

alter table watchlist_items drop constraint if exists watchlist_items_allowed_price_types_check;
alter table watchlist_items
  add constraint watchlist_items_allowed_price_types_check
  check (
    cardinality(allowed_price_types) > 0
    and allowed_price_types <@ array['shelf', 'member', 'promotion', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated']::text[]
  );
