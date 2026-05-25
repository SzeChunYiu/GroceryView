create sequence if not exists user_preferences_id_seq;

alter table user_preferences
  add column if not exists id bigint,
  add column if not exists session_id text,
  add column if not exists country text not null default 'SE',
  add column if not exists favorite_stores text[] not null default array[]::text[],
  add column if not exists home_lat numeric(9, 6),
  add column if not exists home_lng numeric(9, 6),
  add column if not exists household_size integer,
  add column if not exists diet_filters text[] not null default array[]::text[],
  add column if not exists algorithm_choice text not null default 'balanced',
  add column if not exists created_at timestamptz not null default now();

update user_preferences
set id = nextval('user_preferences_id_seq')
where id is null;

select setval(
  'user_preferences_id_seq',
  greatest(coalesce((select max(id) from user_preferences), 0) + 1, 1),
  false
);

alter table user_preferences
  alter column id set default nextval('user_preferences_id_seq'),
  alter column id set not null;

alter sequence user_preferences_id_seq
  owned by user_preferences.id;

alter table user_preferences
  drop constraint if exists user_preferences_pkey;

alter table user_preferences
  alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_pkey'
  ) then
    alter table user_preferences
      add constraint user_preferences_pkey primary key (id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_owner_check'
  ) then
    alter table user_preferences
      add constraint user_preferences_owner_check
      check (user_id is not null or session_id is not null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_home_lat_check'
  ) then
    alter table user_preferences
      add constraint user_preferences_home_lat_check
      check (home_lat is null or home_lat between -90 and 90);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_home_lng_check'
  ) then
    alter table user_preferences
      add constraint user_preferences_home_lng_check
      check (home_lng is null or home_lng between -180 and 180);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_household_size_check'
  ) then
    alter table user_preferences
      add constraint user_preferences_household_size_check
      check (household_size is null or household_size > 0);
  end if;
end
$$;

create unique index if not exists user_preferences_user_id_key
  on user_preferences (user_id);

create unique index if not exists user_preferences_session_id_key
  on user_preferences (session_id)
  where session_id is not null;
