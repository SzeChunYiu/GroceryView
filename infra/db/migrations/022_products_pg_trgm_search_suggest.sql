create extension if not exists pg_trgm;

create index if not exists products_name_trgm_idx
  on products using gin (name gin_trgm_ops);
