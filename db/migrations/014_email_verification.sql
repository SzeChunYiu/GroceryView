alter table app_users
  add column if not exists password_hash text,
  add column if not exists email_verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_tokens_user_unused_idx on email_verification_tokens(user_id, used_at);
create index if not exists email_verification_tokens_expires_idx on email_verification_tokens(expires_at);
