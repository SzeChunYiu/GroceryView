alter table chains
  add column if not exists retailer_type text;

update chains
set retailer_type = case
  when lower(coalesce(slug, id::text, name)) in ('apotek-hjartat', 'apotek_hjartat', 'apohem', 'apotea', 'lloydsapotek') then 'pharmacy'
  when lower(coalesce(slug, id::text, name)) in ('circle-k', 'circle_k', 'ingomacken', 'okq8', 'preem') then 'fuel'
  when lower(coalesce(slug, id::text, name)) in ('7-eleven', 'pressbyran', 'pressbyrån') then 'convenience'
  when lower(coalesce(slug, id::text, name)) in ('normal', 'flying-tiger', 'flying_tiger', 'dollarstore', 'lyfsala') then 'variety'
  when lower(coalesce(slug, id::text, name)) in ('kicks', 'sephora') then 'cosmetics'
  when lower(coalesce(slug, id::text, name)) in ('clas-ohlson', 'clas_ohlson', 'jula', 'rusta') then 'household'
  when lower(coalesce(slug, id::text, name)) in ('mathem', 'matsmart', 'foodora-market', 'wolt-market') then 'online_marketplace'
  else 'grocery'
end
where retailer_type is null;

alter table chains
  alter column retailer_type set not null;

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
    'online_marketplace'
  ));

create index if not exists chains_retailer_type_idx on chains(retailer_type);
