-- Classify chains by retail format so coverage can separate source types.

alter table chains
  add column if not exists retailer_type text not null default 'grocery'
  check (retailer_type in ('grocery', 'pharmacy', 'fuel', 'convenience', 'variety', 'cosmetics', 'household', 'online_marketplace'));

update chains
set retailer_type = 'grocery'
where retailer_type is null
   or retailer_type = '';

create index if not exists chains_retailer_type_idx
  on chains (retailer_type, country_code, slug);
