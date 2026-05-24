create table if not exists friend_share_signals (
  signal_id text not null,
  user_id text not null references app_users(id) on delete cascade,
  shared_by_user_id text not null,
  source text not null check (source in ('friend', 'household')),
  product_id text not null,
  store_id text,
  deal_score integer check (deal_score between 0 and 100),
  shared_at timestamptz not null,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, signal_id),
  check (expires_at is null or expires_at > shared_at)
);

create index if not exists friend_share_signals_user_shared_idx
  on friend_share_signals (user_id, shared_at desc);

create index if not exists friend_share_signals_product_idx
  on friend_share_signals (product_id, shared_at desc);

create index if not exists friend_share_signals_store_idx
  on friend_share_signals (store_id, shared_at desc)
  where store_id is not null;
