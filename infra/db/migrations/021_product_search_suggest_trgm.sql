create extension if not exists pg_trgm;

create index if not exists products_search_suggest_trgm_idx
  on products using gin (canonical_name gin_trgm_ops)
  where domain = 'grocery';

create index if not exists products_search_suggest_name_sv_trgm_idx
  on products using gin (name_sv gin_trgm_ops)
  where domain = 'grocery' and name_sv is not null;

create index if not exists products_search_suggest_name_en_trgm_idx
  on products using gin (name_en gin_trgm_ops)
  where domain = 'grocery' and name_en is not null;

