alter table user_preferences
  alter column weekly_budget set default 0,
  alter column monthly_budget set default 0,
  add column if not exists preferred_currency text not null default 'SEK',
  add column if not exists notification_channels text[] not null default array[]::text[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_preferred_currency_check'
  ) then
    alter table user_preferences
      add constraint user_preferences_preferred_currency_check
      check (preferred_currency in ('SEK', 'EUR', 'NOK', 'DKK'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_notification_channels_check'
  ) then
    alter table user_preferences
      add constraint user_preferences_notification_channels_check
      check (notification_channels <@ array['push', 'email', 'telegram']::text[]);
  end if;
end
$$;
