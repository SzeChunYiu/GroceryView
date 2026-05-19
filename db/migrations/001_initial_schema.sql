-- Initial GroceryView schema. Source of truth is db/schema.sql.
create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

-- Migration runners should execute db/schema.sql after bootstrapping schema_migrations.
