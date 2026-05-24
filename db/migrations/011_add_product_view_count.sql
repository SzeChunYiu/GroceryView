alter table products add column if not exists view_count integer not null default 0;

create index if not exists products_view_count_idx on products(view_count desc, updated_at desc);
