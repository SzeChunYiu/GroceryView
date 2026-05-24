create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  preferred_store_ids text[] not null default array[]::text[],
  currency text not null default 'SEK',
  locale text not null default 'sv-SE',
  display_density text not null default 'comfortable',
  dark_mode boolean not null default false,
  hidden_product_ids text[] not null default array[]::text[],
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null default current_timestamp
);

create unique index if not exists user_preferences_user_id_key on user_preferences(user_id);
