create table if not exists user_product_searches (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  product_id text not null,
  query text,
  searched_at timestamptz not null default now()
);

create index if not exists user_product_searches_user_recent_idx
  on user_product_searches (user_id, searched_at desc);

create index if not exists user_product_searches_product_recent_idx
  on user_product_searches (product_id, searched_at desc);
