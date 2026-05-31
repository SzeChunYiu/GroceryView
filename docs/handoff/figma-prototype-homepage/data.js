/* GroceryView v2 — friendly data layer.
   Three sectors (groceries, fuel, pharmacy) × three countries (SE, NO, IS) */

// =========== COUNTRIES ===========
const COUNTRIES = {
  SE: { code: 'SE', name: 'Sverige', city: 'Stockholm', flag: '🇸🇪', currency: 'kr', currencyCode: 'SEK', locale: 'sv-SE', dec: ',' },
  NO: { code: 'NO', name: 'Norge',   city: 'Oslo',      flag: '🇳🇴', currency: 'kr', currencyCode: 'NOK', locale: 'nb-NO', dec: ',' },
  IS: { code: 'IS', name: 'Ísland',  city: 'Reykjavík', flag: '🇮🇸', currency: 'kr.', currencyCode: 'ISK', locale: 'is-IS', dec: ',' },
};

// =========== MUNICIPALITIES (per country) ===========
// index = local cost level vs the country baseline (1.00). Stores = tracked stores nearby.
const MUNICIPALITIES = {
  SE: [
    { name: 'Stockholm',   region: 'Stockholms län',     index: 1.00, stores: 43 },
    { name: 'Göteborg',    region: 'Västra Götaland',    index: 0.97, stores: 31 },
    { name: 'Malmö',       region: 'Skåne',              index: 0.95, stores: 26 },
    { name: 'Uppsala',     region: 'Uppsala län',        index: 0.98, stores: 18 },
    { name: 'Västerås',    region: 'Västmanland',        index: 0.94, stores: 12 },
    { name: 'Örebro',      region: 'Örebro län',         index: 0.93, stores: 11 },
    { name: 'Linköping',   region: 'Östergötland',       index: 0.95, stores: 13 },
    { name: 'Helsingborg', region: 'Skåne',              index: 0.96, stores: 14 },
    { name: 'Umeå',        region: 'Västerbotten',       index: 0.99, stores: 9 },
  ],
  NO: [
    { name: 'Oslo',        region: 'Oslo',               index: 1.00, stores: 28 },
    { name: 'Bergen',      region: 'Vestland',           index: 0.98, stores: 17 },
    { name: 'Trondheim',   region: 'Trøndelag',          index: 0.97, stores: 14 },
    { name: 'Stavanger',   region: 'Rogaland',           index: 1.01, stores: 12 },
    { name: 'Drammen',     region: 'Buskerud',           index: 0.96, stores: 8 },
  ],
  IS: [
    { name: 'Reykjavík',     region: 'Höfuðborgarsvæðið', index: 1.00, stores: 15 },
    { name: 'Kópavogur',     region: 'Höfuðborgarsvæðið', index: 0.99, stores: 7 },
    { name: 'Hafnarfjörður', region: 'Höfuðborgarsvæðið', index: 0.98, stores: 6 },
    { name: 'Akureyri',      region: 'Norðurland eystra', index: 1.03, stores: 4 },
  ],
};
function municipalitiesFor(code) { return MUNICIPALITIES[code] || MUNICIPALITIES.SE; }
function municipalityInfo(code, name) { return municipalitiesFor(code).find(m => m.name === name) || municipalitiesFor(code)[0]; }

// =========== SECTORS ===========
const SECTORS = {
  groceries: { id: 'groceries', name: 'Groceries',   nameLocal: { SE: 'Mat',         NO: 'Dagligvarer', IS: 'Matvörur'      }, emoji: '🛒', items: 3420 },
  fuel:      { id: 'fuel',      name: 'Fuel',        nameLocal: { SE: 'Drivmedel',   NO: 'Drivstoff',   IS: 'Eldsneyti'     }, emoji: '⛽', items: 4 },
  pharmacy:  { id: 'pharmacy',  name: 'Pharmacy',    nameLocal: { SE: 'Apotek',      NO: 'Apotek',      IS: 'Apótek'        }, emoji: '💊', items: 820 },
  beauty:    { id: 'beauty',    name: 'Beauty',      nameLocal: { SE: 'Skönhet',     NO: 'Skjønnhet',   IS: 'Snyrtivörur'   }, emoji: '💄', items: 1260 },
};

// Per-domain visual identity (drives the [data-sector] CSS theme + small UI labels).
// All stay inside the Bloomberg × Scandinavian system — only accent + paper warmth shift.
const SECTOR_THEME = {
  groceries: { accent: 'oklch(48% 0.16 38)',   label: 'Terracotta',  tag: 'Mat'       },
  fuel:      { accent: 'oklch(44% 0.095 245)',  label: 'Petrol blue', tag: 'Drivmedel' },
  pharmacy:  { accent: 'oklch(44% 0.10 162)',   label: 'Forest',      tag: 'Apotek'    },
  beauty:    { accent: 'oklch(46% 0.105 350)',  label: 'Plum',        tag: 'Skönhet'   },
};

// =========== CHAINS (per sector) ===========
const CHAINS = {
  // Groceries SE
  willys:  { id: 'willys',  name: 'Willys',  short: 'W', country: 'SE', sector: 'groceries', color: 'oklch(56% 0.20 25)',   tier: 'discount' },
  ica:     { id: 'ica',     name: 'ICA',     short: 'I', country: 'SE', sector: 'groceries', color: 'oklch(50% 0.20 25)',   tier: 'standard' },
  coop:    { id: 'coop',    name: 'Coop',    short: 'C', country: 'SE', sector: 'groceries', color: 'oklch(48% 0.18 250)',  tier: 'standard' },
  lidl:    { id: 'lidl',    name: 'Lidl',    short: 'L', country: 'SE', sector: 'groceries', color: 'oklch(50% 0.16 250)',  tier: 'discount' },
  hemkop:  { id: 'hemkop',  name: 'Hemköp',  short: 'H', country: 'SE', sector: 'groceries', color: 'oklch(54% 0.18 35)',   tier: 'standard' },
  city:    { id: 'city',    name: 'City Gross', short: 'CG', country: 'SE', sector: 'groceries', color: 'oklch(52% 0.16 145)', tier: 'big-box' },
  matmiss: { id: 'matmiss', name: 'Matmissionen', short: 'M',  country: 'SE', sector: 'groceries', color: 'oklch(50% 0.14 60)', tier: 'social' },
  tempo:   { id: 'tempo',   name: 'Tempo',   short: 'T', country: 'SE', sector: 'groceries', color: 'oklch(58% 0.14 80)',   tier: 'convenience' },

  // Groceries NO
  remate:   { id: 'remate',   name: 'REMA 1000', short: 'R',  country: 'NO', sector: 'groceries', color: 'oklch(52% 0.20 25)',  tier: 'discount' },
  kiwi:     { id: 'kiwi',     name: 'Kiwi',      short: 'K',  country: 'NO', sector: 'groceries', color: 'oklch(58% 0.20 145)', tier: 'discount' },
  meny:     { id: 'meny',     name: 'Meny',      short: 'M',  country: 'NO', sector: 'groceries', color: 'oklch(50% 0.18 25)',  tier: 'standard' },
  bunnpris: { id: 'bunnpris', name: 'Bunnpris',  short: 'B',  country: 'NO', sector: 'groceries', color: 'oklch(54% 0.18 80)',  tier: 'discount' },
  joker:    { id: 'joker',    name: 'Joker',     short: 'J',  country: 'NO', sector: 'groceries', color: 'oklch(56% 0.16 60)',  tier: 'convenience' },

  // Groceries IS
  bonus:    { id: 'bonus',    name: 'Bónus',     short: 'B',  country: 'IS', sector: 'groceries', color: 'oklch(70% 0.17 80)',  tier: 'discount' },
  kronan:   { id: 'kronan',   name: 'Krónan',    short: 'K',  country: 'IS', sector: 'groceries', color: 'oklch(52% 0.20 25)',  tier: 'standard' },
  netto:    { id: 'netto',    name: 'Netto',     short: 'N',  country: 'IS', sector: 'groceries', color: 'oklch(54% 0.18 60)',  tier: 'discount' },
  hagkaup:  { id: 'hagkaup',  name: 'Hagkaup',   short: 'H',  country: 'IS', sector: 'groceries', color: 'oklch(50% 0.16 240)', tier: 'big-box' },

  // Fuel SE
  circle_k: { id: 'circle_k', name: 'Circle K',     short: 'CK', country: 'SE', sector: 'fuel', color: 'oklch(54% 0.20 25)',  tier: 'major' },
  preem:    { id: 'preem',    name: 'Preem',        short: 'P',  country: 'SE', sector: 'fuel', color: 'oklch(50% 0.18 145)', tier: 'major' },
  okq8:     { id: 'okq8',     name: 'OKQ8',         short: 'OK', country: 'SE', sector: 'fuel', color: 'oklch(48% 0.16 240)', tier: 'major' },
  ingo:     { id: 'ingo',     name: 'Ingo',         short: 'IN', country: 'SE', sector: 'fuel', color: 'oklch(54% 0.18 80)',  tier: 'discount' },
  shell:    { id: 'shell',    name: 'Shell',        short: 'SH', country: 'SE', sector: 'fuel', color: 'oklch(58% 0.20 60)',  tier: 'major' },
  st1:      { id: 'st1',      name: 'St1',          short: '1',  country: 'SE', sector: 'fuel', color: 'oklch(52% 0.18 25)',  tier: 'major' },
  // Fuel NO
  esso:     { id: 'esso',     name: 'Esso',         short: 'E',  country: 'NO', sector: 'fuel', color: 'oklch(54% 0.20 25)',  tier: 'major' },
  yx:       { id: 'yx',       name: 'YX',           short: 'YX', country: 'NO', sector: 'fuel', color: 'oklch(58% 0.18 60)',  tier: 'major' },
  uno_x:    { id: 'uno_x',    name: 'Uno-X',        short: 'UX', country: 'NO', sector: 'fuel', color: 'oklch(50% 0.18 240)', tier: 'discount' },
  // Fuel IS
  n1:       { id: 'n1',       name: 'N1',           short: 'N1', country: 'IS', sector: 'fuel', color: 'oklch(54% 0.20 25)',  tier: 'major' },
  olis:     { id: 'olis',     name: 'Olís',         short: 'O',  country: 'IS', sector: 'fuel', color: 'oklch(58% 0.18 60)',  tier: 'major' },
  orkan:    { id: 'orkan',    name: 'Orkan',        short: 'OR', country: 'IS', sector: 'fuel', color: 'oklch(52% 0.18 145)', tier: 'discount' },

  // Pharmacy SE
  apoteket: { id: 'apoteket',     name: 'Apoteket',     short: 'AP', country: 'SE', sector: 'pharmacy', color: 'oklch(50% 0.18 240)', tier: 'national' },
  ap_hjart: { id: 'ap_hjart',     name: 'Apotek Hjärtat', short: 'AH', country: 'SE', sector: 'pharmacy', color: 'oklch(54% 0.20 25)', tier: 'chain' },
  kron_apo: { id: 'kron_apo',     name: 'Kronans Apotek', short: 'KR', country: 'SE', sector: 'pharmacy', color: 'oklch(52% 0.18 145)', tier: 'chain' },
  lloyds:   { id: 'lloyds',       name: 'Apotea (online)', short: 'AO', country: 'SE', sector: 'pharmacy', color: 'oklch(58% 0.20 60)', tier: 'online' },
  // Pharmacy NO
  vitusapo: { id: 'vitusapo',     name: 'Vitusapotek',  short: 'V',  country: 'NO', sector: 'pharmacy', color: 'oklch(52% 0.18 240)', tier: 'chain' },
  boots:    { id: 'boots',        name: 'Boots apotek', short: 'BO', country: 'NO', sector: 'pharmacy', color: 'oklch(56% 0.20 25)',  tier: 'chain' },
  apo1:     { id: 'apo1',         name: 'Apotek 1',     short: 'A1', country: 'NO', sector: 'pharmacy', color: 'oklch(54% 0.18 145)', tier: 'chain' },
  // Pharmacy IS
  lyfja:    { id: 'lyfja',        name: 'Lyfja',        short: 'L',  country: 'IS', sector: 'pharmacy', color: 'oklch(54% 0.18 240)', tier: 'chain' },
  apotekarinn:{ id: 'apotekarinn', name: 'Apótekarinn', short: 'A',  country: 'IS', sector: 'pharmacy', color: 'oklch(52% 0.20 25)',  tier: 'chain' },

  // Beauty SE
  lyko:     { id: 'lyko',     name: 'Lyko',          short: 'LY', country: 'SE', sector: 'beauty', color: 'oklch(46% 0.13 350)', tier: 'online' },
  kicks:    { id: 'kicks',    name: 'Kicks',         short: 'KK', country: 'SE', sector: 'beauty', color: 'oklch(40% 0.06 350)', tier: 'chain' },
  ahlens:   { id: 'ahlens',   name: 'Åhléns Beauty', short: 'Å',  country: 'SE', sector: 'beauty', color: 'oklch(50% 0.14 25)',  tier: 'department' },
  sephora:  { id: 'sephora',  name: 'Sephora',       short: 'SE', country: 'SE', sector: 'beauty', color: 'oklch(30% 0.04 350)', tier: 'premium' },
  // Beauty NO
  vita:     { id: 'vita',     name: 'Vita',          short: 'VI', country: 'NO', sector: 'beauty', color: 'oklch(48% 0.15 350)', tier: 'chain' },
  kicks_no: { id: 'kicks_no', name: 'Kicks',         short: 'KK', country: 'NO', sector: 'beauty', color: 'oklch(40% 0.06 350)', tier: 'chain' },
  // Beauty IS
  snyrti:   { id: 'snyrti',   name: 'Snyrtivöruverslun', short: 'S', country: 'IS', sector: 'beauty', color: 'oklch(48% 0.13 350)', tier: 'chain' },
  hagkaup_b:{ id: 'hagkaup_b', name: 'Hagkaup Beauty', short: 'H', country: 'IS', sector: 'beauty', color: 'oklch(50% 0.12 25)',  tier: 'department' },
};

// =========== GROCERIES (Stockholm baseline; data scales by country) ===========
const GROCERY_PRODUCTS = [
  { slug: 'arla-milk-1l', name: 'Mellanmjölk 1.5%', size: '1 L', brand: 'Arla', category: 'dairy', emoji: '🥛',
    price: { SE: 13.90, NO: 26.50, IS: 379 }, regular: { SE: 14.90, NO: 27.90, IS: 395 },
    low52: { SE: 12.50, NO: 24.90, IS: 349 }, high52: { SE: 16.20, NO: 29.50, IS: 425 },
    chains: { SE: { lidl: 13.90, willys: 14.50, ica: 15.90, coop: 14.90, hemkop: 15.50 },
              NO: { kiwi: 26.50, remate: 27.90, meny: 28.50, bunnpris: 27.90 },
              IS: { bonus: 379, kronan: 389, netto: 379, hagkaup: 419 } },
    cheapest: { SE: 'lidl', NO: 'kiwi', IS: 'bonus' },
    sparkline: [14.5, 14.7, 15.0, 15.2, 15.0, 14.8, 14.5, 14.2, 14.0, 13.9, 13.9, 14.0, 13.9],
    confidence: 'high', verdict: 'hold',
  },
  { slug: 'zoegas-coffee-450g', name: 'Zoégas Skånerost Kaffe', size: '450 g', brand: 'Zoégas', category: 'coffee', emoji: '☕',
    price: { SE: 49.90, NO: 94.50, IS: 1290 }, regular: { SE: 64.90, NO: 124.00, IS: 1690 },
    low52: { SE: 47.90, NO: 89.00, IS: 1190 }, high52: { SE: 78.00, NO: 145.00, IS: 1990 },
    chains: { SE: { willys: 49.90, ica: 64.50, coop: 58.90, lidl: 54.90, hemkop: 62.90 },
              NO: { remate: 94.50, kiwi: 96.90, meny: 109.00, bunnpris: 99.50 },
              IS: { bonus: 1290, kronan: 1349, hagkaup: 1490 } },
    cheapest: { SE: 'willys', NO: 'remate', IS: 'bonus' },
    sparkline: [78, 76, 75, 72, 68, 66, 64, 62, 58, 55, 52, 50, 49.9],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'pagen-jattefralla-500g', name: 'Pågen Jättefralla', size: '500 g', brand: 'Pågen', category: 'bread', emoji: '🍞',
    price: { SE: 32.95, NO: 58.90, IS: 689 }, regular: { SE: 36.95, NO: 64.00, IS: 749 },
    low52: { SE: 29.90, NO: 54.00, IS: 649 }, high52: { SE: 38.50, NO: 68.00, IS: 789 },
    chains: { SE: { ica: 32.95, willys: 33.90, coop: 35.50, lidl: 31.50, hemkop: 34.90 },
              NO: { kiwi: 58.90, remate: 59.90, meny: 62.50 },
              IS: { bonus: 689, kronan: 699 } },
    cheapest: { SE: 'lidl', NO: 'kiwi', IS: 'bonus' },
    sparkline: [36, 36, 35.5, 35, 34.5, 34, 33.9, 33.5, 33, 32.95, 33, 32.9, 32.95],
    confidence: 'high', verdict: 'hold',
  },
  { slug: 'felix-ketchup-1kg', name: 'Felix Tomatketchup', size: '1 kg', brand: 'Felix', category: 'pantry', emoji: '🍅',
    price: { SE: 32.00, NO: 58.90, IS: 749 }, regular: { SE: 39.90, NO: 69.00, IS: 879 },
    low52: { SE: 28.50, NO: 54.00, IS: 695 }, high52: { SE: 44.90, NO: 75.00, IS: 920 },
    chains: { SE: { hemkop: 32.00, willys: 35.90, ica: 38.50, coop: 39.90, lidl: 34.50 },
              NO: { remate: 58.90, kiwi: 60.00, meny: 64.90 },
              IS: { kronan: 749, bonus: 769 } },
    cheapest: { SE: 'hemkop', NO: 'remate', IS: 'kronan' },
    sparkline: [42, 41, 40, 39.9, 39, 38, 36.5, 35, 34, 33, 32.5, 32.2, 32.0],
    confidence: 'medium', verdict: 'buy',
  },
  { slug: 'marabou-mjolkchoklad-200g', name: 'Marabou Mjölkchoklad', size: '200 g', brand: 'Marabou', category: 'snacks', emoji: '🍫',
    price: { SE: 24.50, NO: 38.90, IS: 549 }, regular: { SE: 27.90, NO: 42.00, IS: 595 },
    low52: { SE: 19.90, NO: 32.00, IS: 449 }, high52: { SE: 29.50, NO: 45.00, IS: 619 },
    chains: { SE: { lidl: 24.50, willys: 25.90, ica: 26.50, coop: 27.50, hemkop: 26.90 },
              NO: { kiwi: 38.90, remate: 39.90, meny: 42.90 },
              IS: { bonus: 549, kronan: 559 } },
    cheapest: { SE: 'lidl', NO: 'kiwi', IS: 'bonus' },
    sparkline: [22, 22.5, 23, 23.5, 24, 24.2, 24.5, 24.9, 25, 24.8, 24.5, 24.6, 24.5],
    confidence: 'high', verdict: 'wait',
  },
  { slug: 'bregott-normalsaltat-600g', name: 'Bregott Normalsaltat', size: '600 g', brand: 'Bregott', category: 'dairy', emoji: '🧈',
    price: { SE: 56.90, NO: 89.00, IS: 1290 }, regular: { SE: 62.90, NO: 98.00, IS: 1390 },
    low52: { SE: 48.50, NO: 79.00, IS: 1190 }, high52: { SE: 64.90, NO: 105.00, IS: 1490 },
    chains: { SE: { willys: 56.90, lidl: 58.50, ica: 62.90, coop: 64.50, hemkop: 63.50 },
              NO: { kiwi: 89.00, remate: 92.00, meny: 95.00 },
              IS: { bonus: 1290, kronan: 1349 } },
    cheapest: { SE: 'willys', NO: 'kiwi', IS: 'bonus' },
    sparkline: [54, 55, 56, 58, 60, 62, 63, 62, 61, 59, 57, 56.5, 56.9],
    confidence: 'high', verdict: 'wait',
  },
  { slug: 'kronfagel-kycklingfile-1kg', name: 'Kronfågel Kycklingfilé', size: '1 kg', brand: 'Kronfågel', category: 'meat', emoji: '🍗',
    price: { SE: 109.00, NO: 169.00, IS: 2490 }, regular: { SE: 129.00, NO: 189.00, IS: 2790 },
    low52: { SE: 99.00, NO: 155.00, IS: 2290 }, high52: { SE: 139.00, NO: 199.00, IS: 2890 },
    chains: { SE: { hemkop: 109.00, willys: 119.00, ica: 125.00, coop: 129.00, lidl: 115.00 },
              NO: { kiwi: 169.00, remate: 175.00, meny: 189.00 },
              IS: { bonus: 2490, kronan: 2590 } },
    cheapest: { SE: 'hemkop', NO: 'kiwi', IS: 'bonus' },
    sparkline: [129, 128, 130, 132, 128, 125, 122, 120, 118, 115, 112, 110, 109],
    confidence: 'medium', verdict: 'buy',
  },
  { slug: 'lindahls-kvarg-500g', name: 'Lindahls Kvarg Naturell', size: '500 g', brand: 'Lindahls', category: 'dairy', emoji: '🥣',
    price: { SE: 19.90, NO: 35.50, IS: 489 }, regular: { SE: 26.90, NO: 42.00, IS: 549 },
    low52: { SE: 17.90, NO: 32.00, IS: 449 }, high52: { SE: 28.50, NO: 45.00, IS: 599 },
    chains: { SE: { willys: 19.90, lidl: 22.50, ica: 24.90, coop: 26.50, hemkop: 25.90 },
              NO: { remate: 35.50, kiwi: 37.00 },
              IS: { bonus: 489, kronan: 499 } },
    cheapest: { SE: 'willys', NO: 'remate', IS: 'bonus' },
    sparkline: [27, 26.5, 26, 25.5, 25, 24, 23, 22, 21, 20.5, 20, 19.9, 19.9],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'eldorado-basmati-rice-1kg', name: 'Eldorado Basmati Ris', size: '1 kg', brand: 'Eldorado', category: 'pantry', emoji: '🍚',
    price: { SE: 18.90, NO: 36.00, IS: 549 }, regular: { SE: 27.90, NO: 49.00, IS: 749 },
    low52: { SE: 18.90, NO: 34.00, IS: 529 }, high52: { SE: 32.50, NO: 55.00, IS: 829 },
    chains: { SE: { matmiss: 18.90, willys: 24.90, ica: 27.50, coop: 28.50, lidl: 22.90 },
              NO: { remate: 36.00, kiwi: 39.00 },
              IS: { bonus: 549, kronan: 569 } },
    cheapest: { SE: 'matmiss', NO: 'remate', IS: 'bonus' },
    sparkline: [30, 29, 28, 27.5, 26.5, 25, 23.5, 22, 21, 20, 19.5, 19, 18.9],
    confidence: 'medium', verdict: 'buy',
  },
  { slug: 'garant-havregryn-1kg', name: 'Havregryn', size: '1 kg', brand: 'Garant', category: 'breakfast', emoji: '🥣',
    price: { SE: 21.90, NO: 39.00, IS: 549 }, regular: { SE: 25.80, NO: 45.00, IS: 619 },
    low52: { SE: 19.90, NO: 36.00, IS: 519 }, high52: { SE: 27.50, NO: 48.00, IS: 649 },
    chains: { SE: { tempo: 21.90, willys: 23.50, ica: 25.50, coop: 25.90, lidl: 22.50 },
              NO: { kiwi: 39.00, remate: 40.00 },
              IS: { bonus: 549, kronan: 559 } },
    cheapest: { SE: 'tempo', NO: 'kiwi', IS: 'bonus' },
    sparkline: [25, 25.2, 25, 24.5, 24, 23.5, 23, 22.5, 22.2, 22, 21.9, 21.9, 21.9],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'bravo-apelsinjuice-1l', name: 'Bravo Apelsinjuice', size: '1 L', brand: 'Bravo', category: 'beverages', emoji: '🍊',
    price: { SE: 22.90, NO: 36.50, IS: 549 }, regular: { SE: 27.90, NO: 42.00, IS: 619 },
    low52: { SE: 19.90, NO: 32.00, IS: 489 }, high52: { SE: 32.50, NO: 45.00, IS: 649 },
    chains: { SE: { hemkop: 22.90, willys: 24.50, ica: 26.50, coop: 27.90, lidl: 23.50 },
              NO: { kiwi: 36.50, remate: 38.00 },
              IS: { bonus: 549, kronan: 559 } },
    cheapest: { SE: 'hemkop', NO: 'kiwi', IS: 'bonus' },
    sparkline: [27, 27, 26.5, 26, 25.5, 25, 24.5, 24, 23.5, 23, 22.9, 22.9, 22.9],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'fiskeriet-laxfile-500g', name: 'Laxfilé', size: '500 g', brand: 'Fiskeriet', category: 'fish', emoji: '🐟',
    price: { SE: 119.00, NO: 159.00, IS: 2490 }, regular: { SE: 139.00, NO: 179.00, IS: 2790 },
    low52: { SE: 109.00, NO: 145.00, IS: 2290 }, high52: { SE: 159.00, NO: 195.00, IS: 2890 },
    chains: { SE: { ica: 119.00, willys: 125.00, coop: 135.00, hemkop: 139.00 },
              NO: { kiwi: 159.00, meny: 169.00 },
              IS: { bonus: 2490, kronan: 2590 } },
    cheapest: { SE: 'ica', NO: 'kiwi', IS: 'bonus' },
    sparkline: [139, 142, 145, 140, 135, 132, 128, 125, 123, 121, 120, 119, 119],
    confidence: 'medium', verdict: 'hold',
  },
];

// =========== FUEL ===========
const FUEL_PRODUCTS = [
  { slug: 'bensin-95', name: 'Bensin 95', emoji: '⛽', unit: 'kr/L',
    price: { SE: 17.89, NO: 21.45, IS: 318.9 },
    low52: { SE: 16.79, NO: 19.95, IS: 295 }, high52: { SE: 19.49, NO: 23.50, IS: 349 },
    sparkline: [18.5, 18.7, 18.8, 18.4, 18.2, 18.0, 17.9, 17.95, 17.85, 17.92, 17.88, 17.89, 17.89],
    cheapestStation: { SE: 'ingo-skarpnack', NO: 'uno-x-helsfyr', IS: 'orkan-fellsmuli' },
  },
  { slug: 'diesel', name: 'Diesel', emoji: '🛢️', unit: 'kr/L',
    price: { SE: 19.29, NO: 22.80, IS: 339.9 },
    low52: { SE: 17.95, NO: 20.85, IS: 318 }, high52: { SE: 21.50, NO: 25.40, IS: 369 },
    sparkline: [20.5, 20.4, 20.3, 20.1, 19.9, 19.7, 19.5, 19.4, 19.35, 19.3, 19.29, 19.29, 19.29],
    cheapestStation: { SE: 'ingo-skarpnack', NO: 'uno-x-helsfyr', IS: 'orkan-fellsmuli' },
  },
  { slug: 'el-laddning', name: 'El-laddning (snabb)', emoji: '🔌', unit: 'kr/kWh',
    price: { SE: 6.49, NO: 5.85, IS: 89.5 },
    low52: { SE: 4.95, NO: 4.50, IS: 75 }, high52: { SE: 7.95, NO: 7.20, IS: 109 },
    sparkline: [7.5, 7.4, 7.2, 7.0, 6.8, 6.7, 6.6, 6.55, 6.5, 6.48, 6.49, 6.49, 6.49],
    cheapestStation: { SE: 'circle-k-globen', NO: 'circle-k-bryn', IS: 'n1-laugarvegur' },
  },
  { slug: 'etanol-e85', name: 'Etanol E85', emoji: '🌱', unit: 'kr/L',
    price: { SE: 14.45, NO: 18.90, IS: null },
    low52: { SE: 13.45, NO: 17.50, IS: null }, high52: { SE: 16.20, NO: 21.00, IS: null },
    sparkline: [15.5, 15.3, 15.1, 14.9, 14.7, 14.6, 14.5, 14.48, 14.45, 14.45, 14.45, 14.45, 14.45],
    cheapestStation: { SE: 'okq8-arsta', NO: 'st1-furuset' },
  },
];

const FUEL_STATIONS = {
  // SE
  'ingo-skarpnack':   { name: 'Ingo Skärpnack',   chain: 'ingo',     city: 'Stockholm', country: 'SE', coords: [0.55, 0.65], distance: 4.2 },
  'okq8-arsta':       { name: 'OKQ8 Årsta',       chain: 'okq8',     city: 'Stockholm', country: 'SE', coords: [0.45, 0.62], distance: 3.1 },
  'circle-k-globen':  { name: 'Circle K Globen',  chain: 'circle_k', city: 'Stockholm', country: 'SE', coords: [0.52, 0.60], distance: 3.4 },
  'preem-vasastan':   { name: 'Preem Vasastan',   chain: 'preem',    city: 'Stockholm', country: 'SE', coords: [0.34, 0.30], distance: 1.5 },
  'shell-essingeleden': { name: 'Shell Essinge',  chain: 'shell',    city: 'Stockholm', country: 'SE', coords: [0.18, 0.46], distance: 2.8 },
  'st1-kungsholmen':  { name: 'St1 Kungsholmen',  chain: 'st1',      city: 'Stockholm', country: 'SE', coords: [0.22, 0.42], distance: 2.3 },
  'circle-k-norrtull':{ name: 'Circle K Norrtull',chain: 'circle_k', city: 'Stockholm', country: 'SE', coords: [0.38, 0.20], distance: 2.0 },
  'okq8-hagastaden':  { name: 'OKQ8 Hagastaden',  chain: 'okq8',     city: 'Stockholm', country: 'SE', coords: [0.38, 0.16], distance: 2.4 },
  // NO
  'uno-x-helsfyr':    { name: 'Uno-X Helsfyr',    chain: 'uno_x',    city: 'Oslo',      country: 'NO', coords: [0.62, 0.55], distance: 3.2 },
  'circle-k-bryn':    { name: 'Circle K Bryn',    chain: 'circle_k', city: 'Oslo',      country: 'NO', coords: [0.58, 0.52], distance: 2.8 },
  'st1-furuset':      { name: 'St1 Furuset',      chain: 'st1',      city: 'Oslo',      country: 'NO', coords: [0.70, 0.45], distance: 6.0 },
  'esso-skoyen':      { name: 'Esso Skøyen',      chain: 'esso',     city: 'Oslo',      country: 'NO', coords: [0.25, 0.40], distance: 4.5 },
  'yx-sinsen':        { name: 'YX Sinsen',        chain: 'yx',       city: 'Oslo',      country: 'NO', coords: [0.42, 0.30], distance: 3.0 },
  // IS
  'orkan-fellsmuli':  { name: 'Orkan Fellsmúli',  chain: 'orkan',    city: 'Reykjavík', country: 'IS', coords: [0.55, 0.55], distance: 2.5 },
  'n1-laugarvegur':   { name: 'N1 Laugavegur',    chain: 'n1',       city: 'Reykjavík', country: 'IS', coords: [0.40, 0.40], distance: 1.2 },
  'olis-ananaust':    { name: 'Olís Ánanaust',    chain: 'olis',     city: 'Reykjavík', country: 'IS', coords: [0.30, 0.30], distance: 1.8 },
};

// =========== PHARMACY ===========
const PHARMACY_PRODUCTS = [
  { slug: 'alvedon-500mg-20', name: 'Alvedon 500 mg', size: '20 tablets', brand: 'Alvedon', category: 'pain', emoji: '💊', otc: true,
    price: { SE: 28.50, NO: 45.00, IS: 749 }, regular: { SE: 34.50, NO: 49.00, IS: 829 },
    low52: { SE: 26.00, NO: 42.00, IS: 695 }, high52: { SE: 39.50, NO: 55.00, IS: 895 },
    chains: { SE: { lloyds: 28.50, apoteket: 34.50, ap_hjart: 35.00, kron_apo: 33.50 },
              NO: { vitusapo: 45.00, boots: 47.50, apo1: 49.00 },
              IS: { lyfja: 749, apotekarinn: 789 } },
    cheapest: { SE: 'lloyds', NO: 'vitusapo', IS: 'lyfja' },
    sparkline: [38, 37, 36, 35.5, 34, 33, 32, 31, 30, 29.5, 29, 28.5, 28.5],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'ipren-200mg-30', name: 'Ipren 200 mg', size: '30 tablets', brand: 'Ipren', category: 'pain', emoji: '💊', otc: true,
    price: { SE: 49.00, NO: 79.00, IS: 1290 }, regular: { SE: 59.00, NO: 89.00, IS: 1490 },
    low52: { SE: 45.00, NO: 75.00, IS: 1190 }, high52: { SE: 65.00, NO: 98.00, IS: 1590 },
    chains: { SE: { lloyds: 49.00, apoteket: 56.00, ap_hjart: 55.00, kron_apo: 55.50 },
              NO: { vitusapo: 79.00, boots: 84.00, apo1: 89.00 },
              IS: { lyfja: 1290, apotekarinn: 1349 } },
    cheapest: { SE: 'lloyds', NO: 'vitusapo', IS: 'lyfja' },
    sparkline: [62, 61, 60, 58, 56, 55, 53, 52, 50.5, 49.5, 49, 49, 49],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'nicorette-2mg-30', name: 'Nicorette Tuggummi 2mg', size: '30 pieces', brand: 'Nicorette', category: 'wellness', emoji: '🟢', otc: true,
    price: { SE: 89.00, NO: 139.00, IS: 1990 }, regular: { SE: 119.00, NO: 169.00, IS: 2390 },
    low52: { SE: 85.00, NO: 132.00, IS: 1890 }, high52: { SE: 129.00, NO: 179.00, IS: 2590 },
    chains: { SE: { lloyds: 89.00, apoteket: 108.00, ap_hjart: 105.00, kron_apo: 109.00 },
              NO: { vitusapo: 139.00, boots: 145.00, apo1: 149.00 },
              IS: { lyfja: 1990, apotekarinn: 2090 } },
    cheapest: { SE: 'lloyds', NO: 'vitusapo', IS: 'lyfja' },
    sparkline: [125, 122, 119, 115, 110, 105, 100, 98, 94, 92, 90, 89, 89],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'd-vitamin-2000', name: 'D-vitamin 2000 IE', size: '100 caps', brand: 'Apobase', category: 'vitamins', emoji: '💛', otc: true,
    price: { SE: 89.00, NO: 119.00, IS: 1690 }, regular: { SE: 109.00, NO: 139.00, IS: 1890 },
    low52: { SE: 79.00, NO: 109.00, IS: 1590 }, high52: { SE: 119.00, NO: 149.00, IS: 2090 },
    chains: { SE: { lloyds: 89.00, apoteket: 99.00, ap_hjart: 95.00, kron_apo: 109.00 },
              NO: { vitusapo: 119.00, boots: 125.00, apo1: 129.00 },
              IS: { lyfja: 1690, apotekarinn: 1790 } },
    cheapest: { SE: 'lloyds', NO: 'vitusapo', IS: 'lyfja' },
    sparkline: [115, 112, 109, 105, 102, 99, 96, 94, 92, 91, 90, 89, 89],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'sensodyne-toothpaste', name: 'Sensodyne Repair', size: '75 ml', brand: 'Sensodyne', category: 'oral', emoji: '🦷', otc: true,
    price: { SE: 59.00, NO: 89.00, IS: 1190 }, regular: { SE: 79.00, NO: 109.00, IS: 1490 },
    low52: { SE: 55.00, NO: 84.00, IS: 1090 }, high52: { SE: 85.00, NO: 119.00, IS: 1590 },
    chains: { SE: { lloyds: 59.00, ap_hjart: 65.00, apoteket: 69.00, kron_apo: 72.00 },
              NO: { vitusapo: 89.00, boots: 94.00, apo1: 99.00 },
              IS: { lyfja: 1190, apotekarinn: 1290 } },
    cheapest: { SE: 'lloyds', NO: 'vitusapo', IS: 'lyfja' },
    sparkline: [82, 80, 78, 75, 72, 70, 68, 65, 63, 61, 60, 59, 59],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'omega3-90', name: 'Omega-3 Fiskolja', size: '90 caps', brand: 'Möllers', category: 'vitamins', emoji: '🐟', otc: true,
    price: { SE: 129.00, NO: 189.00, IS: 2490 }, regular: { SE: 159.00, NO: 219.00, IS: 2790 },
    low52: { SE: 119.00, NO: 175.00, IS: 2390 }, high52: { SE: 179.00, NO: 235.00, IS: 2890 },
    chains: { SE: { lloyds: 129.00, apoteket: 149.00, ap_hjart: 145.00 },
              NO: { vitusapo: 189.00, boots: 199.00, apo1: 209.00 },
              IS: { lyfja: 2490, apotekarinn: 2590 } },
    cheapest: { SE: 'lloyds', NO: 'vitusapo', IS: 'lyfja' },
    sparkline: [170, 165, 160, 155, 150, 145, 140, 137, 134, 132, 130, 129, 129],
    confidence: 'medium', verdict: 'buy',
  },
];

// =========== BEAUTY ===========
const BEAUTY_PRODUCTS = [
  { slug: 'cerave-moisturising-cream-340', name: 'Moisturising Cream', size: '340 ml', brand: 'CeraVe', category: 'skincare',
    price: { SE: 129.00, NO: 169.00, IS: 2190 }, regular: { SE: 169.00, NO: 199.00, IS: 2590 },
    low52: { SE: 119.00, NO: 159.00, IS: 1990 }, high52: { SE: 189.00, NO: 219.00, IS: 2890 },
    chains: { SE: { lyko: 129.00, kicks: 149.00, ahlens: 159.00, sephora: 169.00 },
              NO: { vita: 169.00, kicks_no: 179.00 }, IS: { snyrti: 2190, hagkaup_b: 2390 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [168, 165, 162, 158, 152, 148, 142, 138, 134, 131, 130, 129, 129],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'ordinary-niacinamide-30', name: 'Niacinamide 10% + Zinc 1%', size: '30 ml', brand: 'The Ordinary', category: 'skincare',
    price: { SE: 79.00, NO: 99.00, IS: 1290 }, regular: { SE: 95.00, NO: 115.00, IS: 1490 },
    low52: { SE: 72.00, NO: 92.00, IS: 1190 }, high52: { SE: 109.00, NO: 129.00, IS: 1690 },
    chains: { SE: { lyko: 79.00, kicks: 89.00, ahlens: 95.00, sephora: 95.00 },
              NO: { vita: 99.00, kicks_no: 105.00 }, IS: { snyrti: 1290, hagkaup_b: 1390 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [95, 94, 92, 90, 88, 86, 84, 82, 81, 80, 79, 79, 79],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'maybelline-sky-high-mascara', name: 'Sky High Mascara', size: '7.2 ml', brand: 'Maybelline', category: 'makeup',
    price: { SE: 119.00, NO: 149.00, IS: 1690 }, regular: { SE: 139.00, NO: 169.00, IS: 1890 },
    low52: { SE: 109.00, NO: 139.00, IS: 1590 }, high52: { SE: 149.00, NO: 179.00, IS: 1990 },
    chains: { SE: { lyko: 119.00, kicks: 129.00, ahlens: 135.00, sephora: 139.00 },
              NO: { vita: 149.00, kicks_no: 155.00 }, IS: { snyrti: 1690, hagkaup_b: 1790 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [138, 136, 134, 132, 129, 126, 124, 122, 121, 120, 119, 119, 119],
    confidence: 'high', verdict: 'hold',
  },
  { slug: 'loreal-revitalift-serum-30', name: 'Revitalift Hyaluron Serum', size: '30 ml', brand: "L'Oréal Paris", category: 'skincare',
    price: { SE: 159.00, NO: 199.00, IS: 2490 }, regular: { SE: 229.00, NO: 269.00, IS: 3290 },
    low52: { SE: 149.00, NO: 189.00, IS: 2390 }, high52: { SE: 239.00, NO: 279.00, IS: 3390 },
    chains: { SE: { lyko: 159.00, kicks: 179.00, ahlens: 199.00, sephora: 209.00 },
              NO: { vita: 199.00, kicks_no: 215.00 }, IS: { snyrti: 2490, hagkaup_b: 2690 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [228, 222, 215, 205, 195, 185, 178, 172, 168, 162, 160, 159, 159],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'olaplex-no3-100', name: 'No.3 Hair Perfector', size: '100 ml', brand: 'Olaplex', category: 'haircare',
    price: { SE: 239.00, NO: 299.00, IS: 3690 }, regular: { SE: 309.00, NO: 359.00, IS: 4290 },
    low52: { SE: 229.00, NO: 289.00, IS: 3490 }, high52: { SE: 329.00, NO: 379.00, IS: 4490 },
    chains: { SE: { lyko: 239.00, kicks: 269.00, ahlens: 289.00, sephora: 299.00 },
              NO: { vita: 299.00, kicks_no: 315.00 }, IS: { snyrti: 3690, hagkaup_b: 3890 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [305, 300, 292, 285, 275, 268, 260, 252, 248, 244, 240, 239, 239],
    confidence: 'medium', verdict: 'buy',
  },
  { slug: 'garnier-micellar-400', name: 'Micellar Cleansing Water', size: '400 ml', brand: 'Garnier', category: 'skincare',
    price: { SE: 49.00, NO: 65.00, IS: 829 }, regular: { SE: 65.00, NO: 79.00, IS: 990 },
    low52: { SE: 39.00, NO: 59.00, IS: 749 }, high52: { SE: 69.00, NO: 85.00, IS: 1090 },
    chains: { SE: { lyko: 49.00, kicks: 55.00, ahlens: 59.00, sephora: 62.00 },
              NO: { vita: 65.00, kicks_no: 69.00 }, IS: { snyrti: 829, hagkaup_b: 899 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [64, 62, 60, 58, 55, 53, 51, 50, 49, 49, 49, 49, 49],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'nyx-foundation', name: "Can't Stop Won't Stop Foundation", size: '30 ml', brand: 'NYX', category: 'makeup',
    price: { SE: 139.00, NO: 169.00, IS: 1990 }, regular: { SE: 159.00, NO: 189.00, IS: 2190 },
    low52: { SE: 129.00, NO: 159.00, IS: 1890 }, high52: { SE: 169.00, NO: 199.00, IS: 2290 },
    chains: { SE: { lyko: 139.00, kicks: 149.00, ahlens: 155.00, sephora: 159.00 },
              NO: { vita: 169.00, kicks_no: 175.00 }, IS: { snyrti: 1990, hagkaup_b: 2090 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [158, 156, 154, 151, 148, 145, 143, 141, 140, 139, 139, 139, 139],
    confidence: 'medium', verdict: 'hold',
  },
  { slug: 'lancome-la-vie-est-belle-50', name: 'La Vie Est Belle EdP', size: '50 ml', brand: 'Lancôme', category: 'fragrance',
    price: { SE: 749.00, NO: 949.00, IS: 11900 }, regular: { SE: 899.00, NO: 1099.00, IS: 13900 },
    low52: { SE: 699.00, NO: 899.00, IS: 11200 }, high52: { SE: 949.00, NO: 1149.00, IS: 14500 },
    chains: { SE: { lyko: 749.00, kicks: 829.00, ahlens: 879.00, sephora: 899.00 },
              NO: { vita: 949.00, kicks_no: 989.00 }, IS: { snyrti: 11900, hagkaup_b: 12500 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [895, 880, 865, 845, 825, 805, 788, 772, 765, 755, 750, 749, 749],
    confidence: 'medium', verdict: 'buy',
  },
  { slug: 'nivea-body-lotion-400', name: 'Nourishing Body Lotion', size: '400 ml', brand: 'Nivea', category: 'bodycare',
    price: { SE: 45.00, NO: 59.00, IS: 749 }, regular: { SE: 59.00, NO: 72.00, IS: 890 },
    low52: { SE: 39.00, NO: 52.00, IS: 690 }, high52: { SE: 65.00, NO: 79.00, IS: 950 },
    chains: { SE: { lyko: 45.00, kicks: 49.00, ahlens: 55.00, sephora: 57.00 },
              NO: { vita: 59.00, kicks_no: 62.00 }, IS: { snyrti: 749, hagkaup_b: 799 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [58, 57, 55, 53, 51, 49, 48, 47, 46, 45, 45, 45, 45],
    confidence: 'high', verdict: 'buy',
  },
  { slug: 'lyko-daily-shampoo-500', name: 'Daily Shampoo', size: '500 ml', brand: 'Lyko', category: 'haircare',
    price: { SE: 59.00, NO: 75.00, IS: 949 }, regular: { SE: 79.00, NO: 95.00, IS: 1190 },
    low52: { SE: 49.00, NO: 65.00, IS: 849 }, high52: { SE: 85.00, NO: 99.00, IS: 1290 },
    chains: { SE: { lyko: 59.00, kicks: 69.00, ahlens: 75.00 },
              NO: { vita: 75.00, kicks_no: 79.00 }, IS: { snyrti: 949, hagkaup_b: 999 } },
    cheapest: { SE: 'lyko', NO: 'vita', IS: 'snyrti' },
    sparkline: [78, 76, 73, 70, 67, 64, 62, 61, 60, 59, 59, 59, 59],
    confidence: 'high', verdict: 'buy',
  },
];

// =========== STORES (groceries — per country) ===========
const STORES = [
  // SE
  { slug: 'willys-odenplan', name: 'Willys Odenplan', chain: 'willys', city: 'Stockholm', country: 'SE', district: 'Vasastan', distance: 1.2, basketCost: 1247, basketDiff: -184, percentile: 18, openTill: '22:00', coords: [0.30, 0.30] },
  { slug: 'lidl-sveavagen', name: 'Lidl Sveavägen', chain: 'lidl', city: 'Stockholm', country: 'SE', district: 'Vasastan', distance: 1.6, basketCost: 1198, basketDiff: -233, percentile: 11, openTill: '21:00', coords: [0.36, 0.28] },
  { slug: 'ica-nara-sergel', name: 'ICA Nära Sergel', chain: 'ica', city: 'Stockholm', country: 'SE', district: 'Norrmalm', distance: 0.6, basketCost: 1432, basketDiff: 1, percentile: 62, openTill: '23:00', coords: [0.42, 0.36] },
  { slug: 'coop-swedenborgs', name: 'Coop Swedenborgsgatan', chain: 'coop', city: 'Stockholm', country: 'SE', district: 'Södermalm', distance: 2.4, basketCost: 1389, basketDiff: -42, percentile: 54, openTill: '22:00', coords: [0.46, 0.62] },
  { slug: 'hemkop-stockholm', name: 'Hemköp Stockholm', chain: 'hemkop', city: 'Stockholm', country: 'SE', district: 'Norrmalm', distance: 1.1, basketCost: 1378, basketDiff: -53, percentile: 48, openTill: '23:00', coords: [0.40, 0.42] },
  { slug: 'matmissionen-hagersten', name: 'Matmissionen Hägersten', chain: 'matmiss', city: 'Stockholm', country: 'SE', district: 'Hägersten', distance: 5.8, basketCost: 1112, basketDiff: -319, percentile: 4, openTill: '20:00', coords: [0.22, 0.78] },
  { slug: 'tempo-hornstull', name: 'Tempo Hornstull', chain: 'tempo', city: 'Stockholm', country: 'SE', district: 'Södermalm', distance: 3.1, basketCost: 1492, basketDiff: 61, percentile: 71, openTill: '23:00', coords: [0.36, 0.68] },
  { slug: 'city-gross-stockholm', name: 'City Gross Stockholm', chain: 'city', city: 'Stockholm', country: 'SE', district: 'Stockholm Co.', distance: 8.7, basketCost: 1268, basketDiff: -163, percentile: 22, openTill: '21:00', coords: [0.78, 0.74] },
  { slug: 'willys-skanstull', name: 'Willys Skanstull', chain: 'willys', city: 'Stockholm', country: 'SE', district: 'Södermalm', distance: 3.6, basketCost: 1234, basketDiff: -197, percentile: 14, openTill: '22:00', coords: [0.52, 0.68] },
  { slug: 'lidl-hammarby', name: 'Lidl Hammarby', chain: 'lidl', city: 'Stockholm', country: 'SE', district: 'Hammarby Sj.', distance: 4.2, basketCost: 1184, basketDiff: -247, percentile: 9, openTill: '21:00', coords: [0.60, 0.76] },
  // NO
  { slug: 'kiwi-grunerlokka', name: 'Kiwi Grünerløkka', chain: 'kiwi', city: 'Oslo', country: 'NO', district: 'Grünerløkka', distance: 1.5, basketCost: 2189, basketDiff: -198, percentile: 14, openTill: '23:00', coords: [0.42, 0.30] },
  { slug: 'rema-1000-majorstuen', name: 'REMA 1000 Majorstuen', chain: 'remate', city: 'Oslo', country: 'NO', district: 'Majorstuen', distance: 2.1, basketCost: 2156, basketDiff: -231, percentile: 9, openTill: '23:00', coords: [0.30, 0.38] },
  { slug: 'meny-aker-brygge', name: 'Meny Aker Brygge', chain: 'meny', city: 'Oslo', country: 'NO', district: 'Aker Brygge', distance: 1.0, basketCost: 2498, basketDiff: 111, percentile: 75, openTill: '23:00', coords: [0.38, 0.55] },
  { slug: 'bunnpris-sentrum', name: 'Bunnpris Sentrum', chain: 'bunnpris', city: 'Oslo', country: 'NO', district: 'Sentrum', distance: 0.8, basketCost: 2289, basketDiff: -98, percentile: 36, openTill: '23:00', coords: [0.45, 0.48] },
  { slug: 'joker-frogner', name: 'Joker Frogner', chain: 'joker', city: 'Oslo', country: 'NO', district: 'Frogner', distance: 2.3, basketCost: 2434, basketDiff: 47, percentile: 68, openTill: '22:00', coords: [0.28, 0.50] },
  // IS
  { slug: 'bonus-kringlan', name: 'Bónus Kringlan', chain: 'bonus', city: 'Reykjavík', country: 'IS', district: 'Kringlan', distance: 2.4, basketCost: 24890, basketDiff: -2150, percentile: 8, openTill: '20:00', coords: [0.55, 0.55] },
  { slug: 'kronan-skeifan', name: 'Krónan Skeifan', chain: 'kronan', city: 'Reykjavík', country: 'IS', district: 'Skeifan', distance: 2.8, basketCost: 26340, basketDiff: -700, percentile: 28, openTill: '21:00', coords: [0.50, 0.50] },
  { slug: 'netto-mjodd', name: 'Netto Mjódd', chain: 'netto', city: 'Reykjavík', country: 'IS', district: 'Mjódd', distance: 4.5, basketCost: 25120, basketDiff: -1920, percentile: 12, openTill: '21:00', coords: [0.65, 0.65] },
  { slug: 'hagkaup-smaralind', name: 'Hagkaup Smáralind', chain: 'hagkaup', city: 'Reykjavík', country: 'IS', district: 'Kópavogur', distance: 5.2, basketCost: 28490, basketDiff: 1450, percentile: 78, openTill: '23:00', coords: [0.72, 0.72] },
];

// =========== CATEGORIES ===========
const CATEGORIES = [
  { slug: 'dairy',      name: 'Dairy & Eggs',    nameSv: 'Mejeri',           emoji: '🥛', count: 184 },
  { slug: 'bread',      name: 'Bread & Bakery',  nameSv: 'Bröd',             emoji: '🍞', count: 92 },
  { slug: 'meat',       name: 'Meat',            nameSv: 'Kött',             emoji: '🥩', count: 128 },
  { slug: 'fish',       name: 'Fish & Seafood',  nameSv: 'Fisk',             emoji: '🐟', count: 64 },
  { slug: 'produce',    name: 'Fruit & Veg',     nameSv: 'Frukt & Grönt',    emoji: '🥬', count: 246 },
  { slug: 'pantry',     name: 'Pantry',          nameSv: 'Skafferi',         emoji: '🥫', count: 312 },
  { slug: 'snacks',     name: 'Snacks',          nameSv: 'Snacks',           emoji: '🍫', count: 186 },
  { slug: 'beverages',  name: 'Drinks',          nameSv: 'Dryck',            emoji: '🥤', count: 224 },
  { slug: 'frozen',     name: 'Frozen',          nameSv: 'Frys',             emoji: '🥶', count: 156 },
  { slug: 'breakfast',  name: 'Breakfast',       nameSv: 'Frukost',          emoji: '🥣', count: 78 },
  { slug: 'coffee',     name: 'Coffee & Tea',    nameSv: 'Kaffe & Te',       emoji: '☕', count: 64 },
  { slug: 'plant-based',name: 'Plant-based',     nameSv: 'Växtbaserat',      emoji: '🌱', count: 96 },
  // Beauty
  { slug: 'skincare',   name: 'Skincare',        nameSv: 'Hudvård',          emoji: '🧴', count: 412, sector: 'beauty' },
  { slug: 'makeup',     name: 'Makeup',          nameSv: 'Smink',            emoji: '💄', count: 386, sector: 'beauty' },
  { slug: 'haircare',   name: 'Haircare',        nameSv: 'Hårvård',          emoji: '💇', count: 214, sector: 'beauty' },
  { slug: 'fragrance',  name: 'Fragrance',       nameSv: 'Doft',             emoji: '🌸', count: 156, sector: 'beauty' },
  { slug: 'bodycare',   name: 'Bath & Body',     nameSv: 'Kropp',            emoji: '🧼', count: 92,  sector: 'beauty' },
];

// =========== PRICE HISTORY ===========
const PRICE_HISTORY_LONG = (() => {
  const days = 180; const out = []; const today = new Date('2026-05-25');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const seasonal = Math.sin(i / 24) * 5;
    const trend = -8 * ((days - i) / days);
    const noise = (Math.sin(i * 1.31) + Math.cos(i * 0.71)) * 1.4;
    const promo = (i % 22 < 4) ? -7 : 0;
    out.push({ date: d.toISOString().slice(0, 10), price: Math.max(46, +(72 + seasonal + trend + noise + promo).toFixed(2)) });
  }
  return out;
})();

// =========== BASKET ===========
const MY_BASKET_DEFAULT = [
  { slug: 'arla-milk-1l', qty: 4 },
  { slug: 'pagen-jattefralla-500g', qty: 2 },
  { slug: 'zoegas-coffee-450g', qty: 1 },
  { slug: 'bregott-normalsaltat-600g', qty: 1 },
  { slug: 'lindahls-kvarg-500g', qty: 3 },
  { slug: 'garant-havregryn-1kg', qty: 1 },
  { slug: 'eldorado-basmati-rice-1kg', qty: 1 },
  { slug: 'felix-ketchup-1kg', qty: 1 },
  { slug: 'kronfagel-kycklingfile-1kg', qty: 1 },
  { slug: 'bravo-apelsinjuice-1l', qty: 2 },
];

// =========== ALL PRODUCTS unified ===========
const ALL_PRODUCTS = [
  ...GROCERY_PRODUCTS.map(p => ({ ...p, sector: 'groceries' })),
  ...FUEL_PRODUCTS.map(p => ({ ...p, sector: 'fuel' })),
  ...PHARMACY_PRODUCTS.map(p => ({ ...p, sector: 'pharmacy' })),
  ...BEAUTY_PRODUCTS.map(p => ({ ...p, sector: 'beauty' })),
];

// =========== Helpers ===========
function fmtPrice(value, country = 'SE') {
  if (value == null) return '—';
  const c = COUNTRIES[country];
  const formatted = new Intl.NumberFormat(c.locale, {
    minimumFractionDigits: country === 'IS' ? 0 : 2,
    maximumFractionDigits: country === 'IS' ? 0 : 2,
  }).format(value);
  return `${formatted}\u00A0${c.currency}`;
}
function fmtPct(value) {
  const sign = value > 0 ? '+' : '';
  return sign + value.toFixed(1) + '%';
}
function findProduct(slug) {
  return ALL_PRODUCTS.find(p => p.slug === slug);
}
function findStore(slug) {
  return STORES.find(s => s.slug === slug);
}
function findCategory(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}
function priceOf(product, country = 'SE') {
  if (!product) return null;
  return product.price?.[country] ?? product.price;
}
function chainsOf(product, country = 'SE') {
  return product.chains?.[country] ?? {};
}
function cheapestChainOf(product, country = 'SE') {
  return product.cheapest?.[country];
}

// Comparison price (jämförpris) — normalized per-unit price, used app-wide.
function jamforpris(product, country = 'SE') {
  const c = COUNTRIES[country];
  const price = priceOf(product, country);
  if (price == null || !c) return null;
  const dec = country === 'IS' ? 0 : 2;
  const fmt = (v) => v.toLocaleString(c.locale, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  // fuel / energy: price is already per-unit (p.unit like 'kr/L', 'kr/kWh')
  if (product.unit) {
    const u = String(product.unit).replace(/^kr\s*\//i, '').toLowerCase();
    return `${fmt(price)} ${c.currency}/${u}`;
  }
  const s = String(product.size || '').toLowerCase();
  const m = s.match(/([\d.,]+)\s*([a-zà-ÿ]+)/);
  if (!m) return null;
  const qty = parseFloat(m[1].replace(',', '.'));
  const unit = m[2];
  if (!qty || qty <= 0) return null;
  let per, label;
  if (unit === 'kg') { per = price / qty; label = 'kg'; }
  else if (unit.startsWith('g')) { per = price / (qty / 1000); label = 'kg'; }
  else if (unit === 'l' || unit.startsWith('liter')) { per = price / qty; label = 'l'; }
  else if (unit === 'dl') { per = price / (qty / 10); label = 'l'; }
  else if (unit === 'cl') { per = price / (qty / 100); label = 'l'; }
  else if (unit === 'ml') { per = price / (qty / 1000); label = 'l'; }
  else { per = price / qty; label = 'st'; } // tablets / pieces / caps / pack → per unit
  const pdec = per >= 100 ? Math.min(dec, 0) : dec;
  const pfmt = per.toLocaleString(c.locale, { minimumFractionDigits: pdec, maximumFractionDigits: pdec });
  return `${pfmt} ${c.currency}/${label}`;
}

Object.assign(window, {
  COUNTRIES, SECTORS, CHAINS, CATEGORIES, STORES,
  GROCERY_PRODUCTS, FUEL_PRODUCTS, PHARMACY_PRODUCTS, BEAUTY_PRODUCTS, ALL_PRODUCTS,
  FUEL_STATIONS, PRICE_HISTORY_LONG, MY_BASKET_DEFAULT, SECTOR_THEME,
  fmtPrice, fmtPct, findProduct, findStore, findCategory, priceOf, chainsOf, cheapestChainOf,
});
