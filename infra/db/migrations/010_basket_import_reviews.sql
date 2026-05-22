-- Account-bound retailer basket import review rows.
-- Unmatched retailer rows stay auditable and user-scoped until a shopper resolves them.

create table if not exists basket_import_review_items (
  user_id text not null references app_users(id) on delete cascade,
  review_item_id text not null,
  raw_name text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  reason text not null,
  retailer_id text not null,
  source_kind text not null check (source_kind in ('bookmarklet', 'browser_extension', 'copy_paste')),
  captured_at timestamptz not null,
  status text not null check (status in ('open', 'accepted', 'dismissed')),
  created_at timestamptz not null,
  resolved_at timestamptz,
  resolved_product_id text,
  primary key (user_id, review_item_id)
);

create index if not exists basket_import_review_items_open_idx on basket_import_review_items (user_id, status, created_at, review_item_id);
create index if not exists basket_import_review_items_retailer_idx on basket_import_review_items (retailer_id, captured_at desc);
