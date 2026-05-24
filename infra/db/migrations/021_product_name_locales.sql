alter table products add column if not exists name_sv text;
alter table products add column if not exists name_en text;

create index concurrently if not exists products_name_sv_trgm_idx
  on products using gin (name_sv gin_trgm_ops)
  where name_sv is not null;

create index concurrently if not exists products_name_en_trgm_idx
  on products using gin (name_en gin_trgm_ops)
  where name_en is not null;
