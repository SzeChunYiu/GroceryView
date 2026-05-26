create table if not exists users (
  id text primary key,
  name text,
  email text unique,
  email_verified timestamp(3),
  image text,
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null default current_timestamp
);

create table if not exists accounts (
  user_id text not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create index if not exists accounts_user_id_idx on accounts(user_id);

create table if not exists sessions (
  session_token text primary key,
  user_id text not null references users(id) on delete cascade,
  expires timestamp(3) not null
);

create index if not exists sessions_user_id_idx on sessions(user_id);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null unique,
  expires timestamp(3) not null,
  primary key (identifier, token)
);
