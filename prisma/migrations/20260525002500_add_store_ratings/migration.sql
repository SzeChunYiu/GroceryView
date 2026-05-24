create table if not exists store_ratings (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  user_id text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index if not exists store_ratings_store_id_idx on store_ratings(store_id);
