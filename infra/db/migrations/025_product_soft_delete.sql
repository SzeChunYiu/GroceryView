alter table products add column if not exists deleted_at timestamptz;

create index if not exists products_deleted_at_idx on products(deleted_at);
create index if not exists products_active_slug_idx on products(slug) where deleted_at is null;
