create table if not exists categories (
  id text primary key,
  parent_id text references categories(id) on delete restrict,
  name text not null
);

create index if not exists categories_parent_id_idx on categories(parent_id);
