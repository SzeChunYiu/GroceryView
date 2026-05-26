-- Classify chains by retail format so coverage can separate source types.

alter table chains
  add column if not exists retailer_type text not null default 'grocery'
  check (retailer_type in ('grocery', 'pharmacy', 'fuel', 'convenience', 'variety', 'cosmetics', 'household', 'online_marketplace', 'ethnic_asian', 'ethnic_polish_eastern_european', 'ethnic_middle_eastern', 'ethnic_indian_south_asian', 'ethnic_latin', 'ethnic_african', 'health_food', 'kosher_halal'));

update chains
set retailer_type = 'grocery'
where retailer_type is null
   or retailer_type = '';

create index if not exists chains_retailer_type_idx
  on chains (retailer_type, country_code, slug);
