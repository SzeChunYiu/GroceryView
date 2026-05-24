alter table user_preferences
  add column if not exists hidden_product_ids text[] not null default array[]::text[],
  add column if not exists hidden_store_ids text[] not null default array[]::text[];
