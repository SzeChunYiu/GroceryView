insert into chains(id, name, country_code) values
  ('willys', 'Willys', 'SE'),
  ('lidl', 'Lidl', 'SE'),
  ('coop', 'Coop', 'SE')
on conflict (id) do nothing;

insert into stores(id, chain_id, name, address, city, district, store_type) values
  ('willys-odenplan', 'willys', 'Willys Odenplan', 'Odenplan, Stockholm', 'Stockholm', 'Odenplan', 'supermarket'),
  ('lidl-sveavagen', 'lidl', 'Lidl Sveavägen', 'Sveavägen, Stockholm', 'Stockholm', 'Norrmalm', 'discount'),
  ('coop-odenplan', 'coop', 'Coop Odenplan', 'Odenplan, Stockholm', 'Stockholm', 'Odenplan', 'supermarket')
on conflict (id) do nothing;
