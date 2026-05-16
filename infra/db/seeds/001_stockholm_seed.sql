-- Stockholm MVP seed data: city, launch chains, and proposal hero products.
INSERT INTO cities (name, country_code, currency_code, timezone, locale)
VALUES ('Stockholm', 'SE', 'SEK', 'Europe/Stockholm', 'sv-SE')
ON CONFLICT (name, country_code) DO NOTHING;

INSERT INTO chains (name, slug, country_code) VALUES
  ('ICA', 'ica', 'SE'),
  ('Willys', 'willys', 'SE'),
  ('Coop', 'coop', 'SE'),
  ('Hemköp', 'hemkop', 'SE'),
  ('Lidl', 'lidl', 'SE'),
  ('City Gross', 'city-gross', 'SE')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, slug, brand, category, unit, unit_size, unit_quantity_text, package_size) VALUES
  ('Milk 1L', 'milk-1l', NULL, 'dairy', 'l', 1.000, '1 l', '1 l'),
  ('Eggs 12-pack', 'eggs-12-pack', NULL, 'dairy', 'pcs', 12.000, '12 st', '12-pack'),
  ('Butter 500g', 'butter-500g', NULL, 'dairy', 'g', 500.000, '500 g', '500 g'),
  ('Ground coffee 450g', 'ground-coffee-450g', NULL, 'pantry', 'g', 450.000, '450 g', '450 g'),
  ('Chicken fillet 1kg', 'chicken-fillet-1kg', NULL, 'meat', 'kg', 1.000, '1 kg', '1 kg'),
  ('Minced beef 500g', 'minced-beef-500g', NULL, 'meat', 'g', 500.000, '500 g', '500 g'),
  ('Pasta 500g', 'pasta-500g', NULL, 'pantry', 'g', 500.000, '500 g', '500 g'),
  ('Rice 1kg', 'rice-1kg', NULL, 'pantry', 'kg', 1.000, '1 kg', '1 kg'),
  ('Bread loaf', 'bread-loaf', NULL, 'bakery', 'pcs', 1.000, '1 st', 'loaf'),
  ('Cheese 500g', 'cheese-500g', NULL, 'dairy', 'g', 500.000, '500 g', '500 g'),
  ('Bananas 1kg', 'bananas-1kg', NULL, 'produce', 'kg', 1.000, '1 kg', 'loose'),
  ('Tomatoes 500g', 'tomatoes-500g', NULL, 'produce', 'g', 500.000, '500 g', '500 g'),
  ('Potatoes 2kg', 'potatoes-2kg', NULL, 'produce', 'kg', 2.000, '2 kg', '2 kg'),
  ('Toilet paper 8-pack', 'toilet-paper-8-pack', NULL, 'household', 'pcs', 8.000, '8 st', '8-pack'),
  ('Laundry detergent', 'laundry-detergent', NULL, 'household', 'ml', 1000.000, '1 l', '1 l'),
  ('Diapers pack', 'diapers-pack', NULL, 'baby', 'pcs', 40.000, '40 st', 'pack'),
  ('Oat milk 1L', 'oat-milk-1l', NULL, 'dairy alternatives', 'l', 1.000, '1 l', '1 l'),
  ('Yogurt 1kg', 'yogurt-1kg', NULL, 'dairy', 'kg', 1.000, '1 kg', '1 kg'),
  ('Olive oil 500ml', 'olive-oil-500ml', NULL, 'pantry', 'ml', 500.000, '500 ml', '500 ml'),
  ('Frozen pizza', 'frozen-pizza', NULL, 'frozen', 'pcs', 1.000, '1 st', 'single')
ON CONFLICT (slug) DO NOTHING;
