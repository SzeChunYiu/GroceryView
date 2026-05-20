create table if not exists receipt_uploads (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  store_id text,
  image_uri text not null,
  purchased_at timestamptz not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  ocr_confidence numeric(5, 4) not null check (ocr_confidence between 0 and 1),
  status text not null check (status in ('uploaded', 'parsed', 'needs_review', 'processed', 'failed')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists receipt_items (
  id text primary key,
  receipt_id text not null references receipt_uploads(id) on delete cascade,
  raw_name text not null,
  product_id text,
  canonical_name text,
  quantity numeric(12, 3) not null check (quantity > 0),
  item_total numeric(12, 2) not null check (item_total >= 0),
  match_confidence numeric(5, 4) check (match_confidence is null or match_confidence between 0 and 1)
);

create index if not exists receipt_uploads_user_purchased_idx on receipt_uploads (user_id, purchased_at desc, id);
create index if not exists receipt_uploads_status_idx on receipt_uploads (status, updated_at desc, id);
create index if not exists receipt_items_receipt_idx on receipt_items (receipt_id, id);
