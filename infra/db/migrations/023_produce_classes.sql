create table if not exists produce_classes (
  id text primary key,
  parent_id text references produce_classes(id) on delete cascade,
  segment text not null,
  label text not null,
  depth integer not null check (depth >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists produce_classes_parent_idx on produce_classes(parent_id, sort_order, id);
create index if not exists produce_classes_segment_depth_idx on produce_classes(segment, depth, sort_order);
