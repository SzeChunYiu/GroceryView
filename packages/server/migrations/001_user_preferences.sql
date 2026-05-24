create table if not exists user_preferences (
  id bigserial primary key,
  user_id text not null,
  country text not null default 'SE' check (country ~ '^[A-Z]{2}$'),
  favorite_stores text[] not null default '{}'::text[],
  home_lat double precision check (home_lat is null or (home_lat >= -90 and home_lat <= 90)),
  home_lng double precision check (home_lng is null or (home_lng >= -180 and home_lng <= 180)),
  household_size integer not null default 1 check (household_size >= 1 and household_size <= 20),
  diet_filters text[] not null default '{}'::text[],
  algorithm_choice text not null default 'balanced' check (algorithm_choice in ('balanced', 'savings', 'watchlist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table user_preferences is 'Per-user MyFlyer ranking preferences. Anonymous users store their cookie session_id in user_id.';
comment on column user_preferences.user_id is 'Authenticated app user id, or cookie session_id for anonymous users.';
comment on column user_preferences.favorite_stores is 'Store ids preferred for personalized flyer ranking.';
comment on column user_preferences.diet_filters is 'Dietary filters used by MyFlyer and related personalization flows.';

create unique index if not exists user_preferences_user_country_idx on user_preferences (user_id, country);
create index if not exists user_preferences_country_algorithm_idx on user_preferences (country, algorithm_choice, updated_at desc);
create index if not exists user_preferences_favorite_stores_gin_idx on user_preferences using gin (favorite_stores);
create index if not exists user_preferences_diet_filters_gin_idx on user_preferences using gin (diet_filters);

create or replace function set_user_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_preferences_set_updated_at on user_preferences;
create trigger user_preferences_set_updated_at
before update on user_preferences
for each row
execute function set_user_preferences_updated_at();
