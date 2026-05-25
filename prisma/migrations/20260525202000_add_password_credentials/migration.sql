create table if not exists password_credentials (
  user_id text primary key references users(id) on delete cascade,
  password_hash text not null,
  algorithm text not null default 'scrypt',
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null default current_timestamp,
  changed_at timestamp(3) not null default current_timestamp
);

create table if not exists password_changes (
  id uuid primary key,
  user_id text not null references users(id) on delete cascade,
  changed_at timestamp(3) not null default current_timestamp
);

create index if not exists password_changes_user_id_changed_at_idx
  on password_changes(user_id, changed_at);
