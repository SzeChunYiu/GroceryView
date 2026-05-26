-- User-scoped household and friend deal share signals.
-- Signals are opt-in social proof inputs for suggestFriendSharedDeals and privacy exports.

create table if not exists friend_shared_deal_signals (
  signal_id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  product_id text not null,
  shared_by_user_id text not null,
  shared_by_display_name text not null,
  relationship text not null check (relationship in ('household', 'friend')),
  shared_at timestamptz not null,
  source_confidence numeric(5, 4) not null check (source_confidence between 0 and 1),
  opted_in boolean not null default true,
  deal_score integer check (deal_score between 0 and 100),
  created_at timestamptz not null
);

create index if not exists friend_shared_deal_signals_user_shared_idx on friend_shared_deal_signals (user_id, shared_at desc, signal_id);
create index if not exists friend_shared_deal_signals_product_idx on friend_shared_deal_signals (product_id, opted_in, source_confidence, shared_at desc);
