-- Stockholm starter seed for GroceryView.
-- Store address references checked during authoring:
-- ICA Nara Baronen Odenplan, Odengatan 40: https://qualitycaviar.se/location/ica-nara-baronen-odenplan/
-- Willys Hemma Torsplan, Norra Stationsgatan 90: https://whiteguidegreen.se/butiker/willys-hemma-torsplan/
-- Coop Odenplan, Odengatan 65: https://www.hitta.se/coop%2Bodenplan/stockholm/ilcqvejc
-- Hemkop Stockholm Torsplan, Norra Stationsgatan 80c: https://www.hemkop.se/butik/4190
-- Lidl Sveavagen 59: https://www.lidl.se/s/sv-SE/butiker/stockholm/sveavaegen-59/
-- City Gross Bromma, Ulvsundavagen 189D: https://www.eniro.se/city%2Bgross%2Bbromma/7817119/firma

begin;

insert into chains (slug, name, country_code, website_url) values
  ('ica', 'ICA', 'SE', 'https://www.ica.se/'),
  ('willys', 'Willys', 'SE', 'https://www.willys.se/'),
  ('coop', 'Coop', 'SE', 'https://www.coop.se/'),
  ('hemkop', 'Hemkop', 'SE', 'https://www.hemkop.se/'),
  ('lidl', 'Lidl', 'SE', 'https://www.lidl.se/'),
  ('city-gross', 'City Gross', 'SE', 'https://www.citygross.se/')
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  website_url = excluded.website_url,
  updated_at = now();

with store_seed (
  chain_slug,
  slug,
  external_ref,
  name,
  address_line1,
  postal_code,
  city,
  region,
  longitude,
  latitude,
  store_type
) as (
  values
    ('ica', 'ica-nara-baronen-odenplan', 'seed:ica:baronen-odenplan', 'ICA Nara Baronen Odenplan', 'Odengatan 40', '113 51', 'Stockholm', 'Stockholm', 18.0470, 59.3429, 'supermarket'),
    ('willys', 'willys-hemma-stockholm-torsplan', 'seed:willys:torsplan', 'Willys Hemma Stockholm Torsplan', 'Norra Stationsgatan 90', '113 64', 'Stockholm', 'Stockholm', 18.0346, 59.3495, 'supermarket'),
    ('coop', 'coop-odenplan', 'seed:coop:odenplan', 'Coop Odenplan', 'Odengatan 65', '113 22', 'Stockholm', 'Stockholm', 18.0494, 59.3429, 'supermarket'),
    ('hemkop', 'hemkop-stockholm-torsplan', 'seed:hemkop:torsplan', 'Hemkop Stockholm Torsplan', 'Norra Stationsgatan 80c', '113 65', 'Stockholm', 'Stockholm', 18.0359, 59.3490, 'supermarket'),
    ('lidl', 'lidl-stockholm-sveavagen', 'seed:lidl:sveavagen-59', 'Lidl Stockholm Sveavagen', 'Sveavagen 59', '113 59', 'Stockholm', 'Stockholm', 18.0567, 59.3398, 'discount'),
    ('city-gross', 'city-gross-bromma', 'seed:city-gross:bromma', 'City Gross Bromma', 'Ulvsundavagen 189D', '168 67', 'Bromma', 'Stockholm', 17.9574, 59.3564, 'hypermarket')
)
insert into stores (
  chain_id,
  slug,
  external_ref,
  name,
  address_line1,
  postal_code,
  city,
  region,
  country_code,
  position,
  store_type
)
select
  chains.id,
  store_seed.slug,
  store_seed.external_ref,
  store_seed.name,
  store_seed.address_line1,
  store_seed.postal_code,
  store_seed.city,
  store_seed.region,
  'SE',
  ST_SetSRID(ST_MakePoint(store_seed.longitude, store_seed.latitude), 4326)::geography,
  store_seed.store_type
from store_seed
join chains on chains.slug = store_seed.chain_slug
on conflict (slug) do update set
  external_ref = excluded.external_ref,
  name = excluded.name,
  address_line1 = excluded.address_line1,
  postal_code = excluded.postal_code,
  city = excluded.city,
  region = excluded.region,
  position = excluded.position,
  store_type = excluded.store_type,
  updated_at = now();

insert into products (
  slug,
  canonical_name,
  brand,
  category_path,
  package_size,
  package_unit,
  comparable_unit
) values
  ('standardmjolk-1l', 'Standardmjolk 3% 1 l', null, array['Dairy', 'Milk'], 1, 'l', 'l'),
  ('agg-12-pack', 'Agg friggaende 12-pack', null, array['Dairy', 'Eggs'], 12, 'pcs', 'pcs'),
  ('smor-500g', 'Smor 500 g', null, array['Dairy', 'Butter'], 500, 'g', 'kg'),
  ('bryggkaffe-450g', 'Bryggkaffe mellanrost 450 g', null, array['Pantry', 'Coffee'], 450, 'g', 'kg'),
  ('kycklingfile-1kg', 'Kycklingfile 1 kg', null, array['Meat', 'Chicken'], 1, 'kg', 'kg'),
  ('notfars-500g', 'Notfars 500 g', null, array['Meat', 'Beef'], 500, 'g', 'kg'),
  ('pasta-500g', 'Pasta penne 500 g', null, array['Pantry', 'Pasta'], 500, 'g', 'kg'),
  ('basmatiris-1kg', 'Basmatiris 1 kg', null, array['Pantry', 'Rice'], 1, 'kg', 'kg'),
  ('formbrod-rost-700g', 'Rostbrod 700 g', null, array['Bakery', 'Bread'], 700, 'g', 'kg'),
  ('hushallsost-1kg', 'Hushallsost 1 kg', null, array['Dairy', 'Cheese'], 1, 'kg', 'kg'),
  ('bananer-1kg', 'Bananer lose vikt 1 kg', null, array['Fruit', 'Bananas'], 1, 'kg', 'kg'),
  ('tomater-500g', 'Tomater 500 g', null, array['Vegetables', 'Tomatoes'], 500, 'g', 'kg'),
  ('potatis-2kg', 'Potatis fast 2 kg', null, array['Vegetables', 'Potatoes'], 2, 'kg', 'kg'),
  ('toalettpapper-8-pack', 'Toalettpapper 8-pack', null, array['Household', 'Paper'], 8, 'rolls', 'roll'),
  ('tvattmedel-color-1l', 'Tvattmedel color 1 l', null, array['Household', 'Laundry'], 1, 'l', 'l'),
  ('blojor-storlek-4', 'Blojor storlek 4', null, array['Baby', 'Diapers'], 1, 'pack', 'pack'),
  ('havredryck-1l', 'Havredryck 1 l', null, array['Dairy alternatives', 'Oat milk'], 1, 'l', 'l'),
  ('naturell-yoghurt-1kg', 'Naturell yoghurt 1 kg', null, array['Dairy', 'Yogurt'], 1, 'kg', 'kg'),
  ('olivolja-500ml', 'Olivolja extra virgin 500 ml', null, array['Pantry', 'Oil'], 500, 'ml', 'l'),
  ('fryst-pizza-350g', 'Fryst pizza 350 g', null, array['Frozen', 'Pizza'], 350, 'g', 'kg')
on conflict (slug) do update set
  canonical_name = excluded.canonical_name,
  brand = excluded.brand,
  category_path = excluded.category_path,
  package_size = excluded.package_size,
  package_unit = excluded.package_unit,
  comparable_unit = excluded.comparable_unit,
  updated_at = now();

commit;
