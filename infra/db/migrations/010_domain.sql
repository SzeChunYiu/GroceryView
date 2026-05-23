-- Tag catalog and observation rows by supported vertical.
-- Existing rows backfill to grocery through the non-null default.

alter table chains
  add column if not exists domain text not null default 'grocery'
    check (domain in ('grocery', 'fuel', 'pharmacy'));

alter table products
  add column if not exists domain text not null default 'grocery'
    check (domain in ('grocery', 'fuel', 'pharmacy'));

alter table observations
  add column if not exists domain text not null default 'grocery'
    check (domain in ('grocery', 'fuel', 'pharmacy'));

create index if not exists chains_domain_idx on chains (domain, slug);
create index if not exists products_domain_idx on products (domain, slug);
create index if not exists observations_domain_observed_idx on observations (domain, observed_at desc);
