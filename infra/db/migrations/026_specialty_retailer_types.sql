-- Extend chain retailer_type coverage for ethnic, specialty, and health-food comparison rows.

alter table chains
  drop constraint if exists chains_retailer_type_check;

alter table chains
  add constraint chains_retailer_type_check
  check (retailer_type in (
    'grocery',
    'pharmacy',
    'fuel',
    'convenience',
    'variety',
    'cosmetics',
    'household',
    'online_marketplace',
    'ethnic_asian',
    'ethnic_polish_eastern_european',
    'ethnic_middle_eastern',
    'ethnic_indian_south_asian',
    'ethnic_latin',
    'ethnic_african',
    'health_food',
    'kosher_halal'
  ));
