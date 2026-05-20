insert into chains(id, name, country_code) values
  ('ica', 'ICA', 'SE'),
  ('willys', 'Willys', 'SE'),
  ('coop', 'Coop', 'SE'),
  ('hemkop', 'Hemköp', 'SE'),
  ('lidl', 'Lidl', 'SE'),
  ('citygross', 'City Gross', 'SE')
on conflict (id) do update set
  name = excluded.name,
  country_code = excluded.country_code;

insert into stores(id, chain_id, name, address, city, district, latitude, longitude, store_type) values
  ('ica-liljeholmen', 'ica', 'ICA Kvantum Liljeholmen', 'Liljeholmstorget 3', 'Stockholm', 'Liljeholmen', 59.310900, 18.022800, 'supermarket'),
  ('ica-odenplan', 'ica', 'ICA Supermarket Odenplan', 'Karlbergsvägen 10', 'Stockholm', 'Odenplan', 59.343300, 18.049700, 'supermarket'),
  ('willys-odenplan', 'willys', 'Willys Odenplan', 'Odenplan', 'Stockholm', 'Odenplan', 59.343000, 18.049300, 'supermarket'),
  ('willys-arsta', 'willys', 'Willys Årsta', 'Partihandlarvägen 50', 'Stockholm', 'Årsta', 59.298600, 18.036900, 'supermarket'),
  ('coop-odenplan', 'coop', 'Coop Odenplan', 'Odengatan 65', 'Stockholm', 'Odenplan', 59.342500, 18.050600, 'supermarket'),
  ('coop-farsta', 'coop', 'Coop Farsta Centrum', 'Farstaplan 25', 'Stockholm', 'Farsta', 59.242600, 18.091500, 'supermarket'),
  ('hemkop-torsplan', 'hemkop', 'Hemköp Torsplan', 'Solnavägen 1E', 'Stockholm', 'Vasastan', 59.348800, 18.033200, 'supermarket'),
  ('hemkop-sodermalm', 'hemkop', 'Hemköp Skanstull', 'Ringvägen 100', 'Stockholm', 'Södermalm', 59.307200, 18.075100, 'supermarket'),
  ('lidl-sveavagen', 'lidl', 'Lidl Sveavägen', 'Sveavägen 59', 'Stockholm', 'Norrmalm', 59.340100, 18.059500, 'discount'),
  ('lidl-hammarby', 'lidl', 'Lidl Hammarby Sjöstad', 'Lugnets Allé 26', 'Stockholm', 'Hammarby Sjöstad', 59.302600, 18.104700, 'discount'),
  ('citygross-bromma', 'citygross', 'City Gross Bromma', 'Ulvsundavägen 185', 'Stockholm', 'Bromma', 59.356100, 17.955200, 'hypermarket'),
  ('citygross-kungens-kurva', 'citygross', 'City Gross Kungens Kurva', 'Tangentvägen 14', 'Stockholm', 'Kungens Kurva', 59.269500, 17.916800, 'hypermarket')
on conflict (id) do update set
  chain_id = excluded.chain_id,
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  district = excluded.district,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  store_type = excluded.store_type;

insert into categories(id, parent_id, name) values
  ('coffee', null, 'Coffee'),
  ('dairy', null, 'Dairy'),
  ('bakery', null, 'Bakery'),
  ('pantry', null, 'Pantry'),
  ('produce', null, 'Produce'),
  ('frozen', null, 'Frozen'),
  ('protein', null, 'Protein'),
  ('household', null, 'Household')
on conflict (id) do update set
  parent_id = excluded.parent_id,
  name = excluded.name;

insert into products(id, barcode, canonical_name, brand, brand_owner, private_label_owner, category_id, package_size, package_unit, comparable_unit, organic, lactose_free, gluten_free, vegan) values
  ('zoegas-coffee-450g', '7310731101028', 'Zoégas Skånerost Coffee 450g', 'Zoégas', 'Nestlé', null, 'coffee', 0.450, 'kg', 'kg', false, true, true, true),
  ('garant-bryggkaffe-450g', '7340083451120', 'Garant Bryggkaffe 450g', 'Garant', 'Axfood', 'Axfood', 'coffee', 0.450, 'kg', 'kg', false, true, true, true),
  ('arvid-nordquist-classic-500g', '7310760012500', 'Arvid Nordquist Classic Coffee 500g', 'Arvid Nordquist', 'Arvid Nordquist', null, 'coffee', 0.500, 'kg', 'kg', false, true, true, true),
  ('arla-milk-1l', '7310865001058', 'Arla Mellanmjölk 1L', 'Arla', 'Arla Foods', null, 'dairy', 1.000, 'l', 'l', false, false, true, false),
  ('arla-lactose-free-milk-1l', '7310865088455', 'Arla Lactose-free Milk 1L', 'Arla', 'Arla Foods', null, 'dairy', 1.000, 'l', 'l', false, true, true, false),
  ('ica-milk-1l', '7318690101017', 'ICA Mellanmjölk 1L', 'ICA', 'ICA', 'ICA', 'dairy', 1.000, 'l', 'l', false, false, true, false),
  ('bregott-600g', '7310865083207', 'Bregott Normalsaltat 600g', 'Bregott', 'Arla Foods', null, 'dairy', 0.600, 'kg', 'kg', false, false, true, false),
  ('latt-och-lagom-600g', '7310865004707', 'Lätt & Lagom 600g', 'Lätt & Lagom', 'Arla Foods', null, 'dairy', 0.600, 'kg', 'kg', false, false, true, false),
  ('pagen-lingongrova-500g', '7311070003240', 'Pågen Lingongrova 500g', 'Pågen', 'Pågen', null, 'bakery', 0.500, 'kg', 'kg', false, true, false, false),
  ('polarbrod-jubileumskaka-400g', '7311130008017', 'Polarbröd Jubileumskaka 400g', 'Polarbröd', 'Polarbröd', null, 'bakery', 0.400, 'kg', 'kg', false, true, false, false),
  ('kungsornen-spaghetti-1kg', '7310130004289', 'Kungsörnen Spaghetti 1kg', 'Kungsörnen', 'Lantmännen', null, 'pantry', 1.000, 'kg', 'kg', false, true, false, true),
  ('garant-jasmine-rice-1kg', '7340083455784', 'Garant Jasmine Rice 1kg', 'Garant', 'Axfood', 'Axfood', 'pantry', 1.000, 'kg', 'kg', false, true, true, true),
  ('felix-ketchup-1kg', '7310240034015', 'Felix Tomatketchup 1kg', 'Felix', 'Orkla', null, 'pantry', 1.000, 'kg', 'kg', false, true, true, true),
  ('eldorado-crushed-tomatoes-400g', '7340083462911', 'Eldorado Crushed Tomatoes 400g', 'Eldorado', 'Axfood', 'Axfood', 'pantry', 0.400, 'kg', 'kg', false, true, true, true),
  ('bananas-1kg', null, 'Bananas 1kg', null, null, null, 'produce', 1.000, 'kg', 'kg', false, true, true, true),
  ('swedish-potatoes-2kg', null, 'Swedish Potatoes 2kg', null, null, null, 'produce', 2.000, 'kg', 'kg', false, true, true, true),
  ('tomatoes-500g', null, 'Tomatoes 500g', null, null, null, 'produce', 0.500, 'kg', 'kg', false, true, true, true),
  ('findus-peas-600g', '7310500176014', 'Findus Green Peas 600g', 'Findus', 'Nomad Foods', null, 'frozen', 0.600, 'kg', 'kg', false, true, true, true),
  ('kronfagel-chicken-1kg', '7310620010014', 'Kronfågel Chicken Fillet 1kg', 'Kronfågel', 'Scandi Standard', null, 'protein', 1.000, 'kg', 'kg', false, true, true, false),
  ('lambi-toilet-paper-8p', '6414301018747', 'Lambi Toilet Paper 8-pack', 'Lambi', 'Metsä Tissue', null, 'household', 8.000, 'pc', 'pc', false, true, true, true)
on conflict (id) do update set
  barcode = excluded.barcode,
  canonical_name = excluded.canonical_name,
  brand = excluded.brand,
  brand_owner = excluded.brand_owner,
  private_label_owner = excluded.private_label_owner,
  category_id = excluded.category_id,
  package_size = excluded.package_size,
  package_unit = excluded.package_unit,
  comparable_unit = excluded.comparable_unit,
  organic = excluded.organic,
  lactose_free = excluded.lactose_free,
  gluten_free = excluded.gluten_free,
  vegan = excluded.vegan;
