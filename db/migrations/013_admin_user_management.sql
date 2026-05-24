alter table app_users
  add column if not exists disabled_at timestamptz,
  add column if not exists verification_sent_at timestamptz;
