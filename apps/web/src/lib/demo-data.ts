// Demo seed for the homepage / product / store / category routes.
// Mirrors the store fixtures in packages/ingestion/src/index.ts.
// Real prices replace these as packages/ingestion connectors come online.

export const products = [
  {
    slug: 'zoegas-coffee-450g',
    ticker: 'ZOEGAS-COFFEE-450G',
    name: 'Zoegas Coffee 450g',
    store: 'Willys Odenplan',
    price: '49.90 SEK',
    unitPrice: '110.89 SEK/kg',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-19 09:10 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'arla-milk-1l',
    ticker: 'ARLA-MILK-1L',
    name: 'Arla Mellanmjölk 1L',
    store: 'Lidl Sveavagen',
    price: '13.90 SEK',
    unitPrice: '13.90 SEK/l',
    priceType: 'online',
    confidence: 'medium',
    observedAt: '2026-05-19 08:45 CET',
    source: 'online shelf observation'
  },
  {
    slug: 'pagen-jattefralla-500g',
    ticker: 'PAGEN-JATTEFRALLA-500G',
    name: 'Pågen Jättefralla 500g',
    store: 'ICA Nära Sergels Torg',
    price: '32.95 SEK',
    unitPrice: '65.90 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 10:05 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'kavli-mese-700g',
    ticker: 'KAVLI-MESE-700G',
    name: 'Kavli Mesost 700g',
    store: 'Coop Swedenborgsgatan',
    price: '54.50 SEK',
    unitPrice: '77.86 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 09:30 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'felix-ketchup-1kg',
    ticker: 'FELIX-KETCHUP-1KG',
    name: 'Felix Tomatketchup 1kg',
    store: 'Hemköp Stockholm',
    price: '32.00 SEK',
    unitPrice: '32.00 SEK/kg',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-19 11:15 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'findus-arter-650g',
    ticker: 'FINDUS-ARTER-650G',
    name: 'Findus Ärter 650g',
    store: 'Willys Odenplan',
    price: '24.90 SEK',
    unitPrice: '38.31 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 09:55 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'marabou-mjolkchoklad-200g',
    ticker: 'MARABOU-MJOLKCHOKLAD-200G',
    name: 'Marabou Mjölkchoklad 200g',
    store: 'Lidl Sveavagen',
    price: '24.50 SEK',
    unitPrice: '122.50 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 12:00 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'olw-cheez-doodles-160g',
    ticker: 'OLW-CHEEZ-DOODLES-160G',
    name: 'OLW Cheez Doodles 160g',
    store: 'ICA Nära Sergels Torg',
    price: '29.90 SEK',
    unitPrice: '186.88 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 10:35 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'skogaholm-rostbrod-500g',
    ticker: 'SKOGAHOLM-ROSTBROD-500G',
    name: 'Skogaholm Rostbröd 500g',
    store: 'Coop Swedenborgsgatan',
    price: '26.50 SEK',
    unitPrice: '53.00 SEK/kg',
    priceType: 'shelf',
    confidence: 'medium',
    observedAt: '2026-05-19 11:40 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'icas-egg-15p',
    ticker: 'ICAS-EGG-15P',
    name: 'ICA Ägg 15-pack',
    store: 'ICA Nära Sergels Torg',
    price: '39.95 SEK',
    unitPrice: '2.66 SEK/egg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 09:20 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'lattfil-arla-1l',
    ticker: 'LATTFIL-ARLA-1L',
    name: 'Arla Lättfil 1L',
    store: 'Willys Odenplan',
    price: '18.50 SEK',
    unitPrice: '18.50 SEK/l',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-19 09:00 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'kelda-pumpkin-soup-1l',
    ticker: 'KELDA-PUMPKIN-SOUP-1L',
    name: 'Kelda Pumpa Soppa 1L',
    store: 'Hemköp Stockholm',
    price: '34.90 SEK',
    unitPrice: '34.90 SEK/l',
    priceType: 'shelf',
    confidence: 'medium',
    observedAt: '2026-05-19 11:30 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'eldorado-basmati-rice-1kg',
    ticker: 'ELDORADO-BASMATI-RICE-1KG',
    name: 'Eldorado Basmati Rice 1kg',
    store: 'Matmissionen Hägersten',
    price: '18.90 SEK',
    unitPrice: '18.90 SEK/kg',
    priceType: 'clearance shelf',
    confidence: 'medium',
    observedAt: '2026-05-20 12:20 CET',
    source: 'community shelf observation'
  },
  {
    slug: 'barilla-spaghetti-1kg',
    ticker: 'BARILLA-SPAGHETTI-1KG',
    name: 'Barilla Spaghetti 1kg',
    store: 'City Gross Stockholm',
    price: '27.90 SEK',
    unitPrice: '27.90 SEK/kg',
    priceType: 'online',
    confidence: 'medium',
    observedAt: '2026-05-20 10:50 CET',
    source: 'online shelf observation'
  },
  {
    slug: 'bregott-normalsaltat-600g',
    ticker: 'BREGOTT-NORMALSALTAT-600G',
    name: 'Bregott Normalsaltat 600g',
    store: 'Willys Odenplan',
    price: '56.90 SEK',
    unitPrice: '94.83 SEK/kg',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-20 09:35 CET',
    source: 'retailer flyer observation'
  }
];

export const stores = [
  {
    slug: 'willys-odenplan',
    name: 'Willys Odenplan',
    district: 'Vasastan',
    format: 'discount supermarket',
    bestCategory: 'Coffee',
    distanceLabel: '1.2 km from saved area'
  },
  {
    slug: 'ica-nara-sergels-torg',
    name: 'ICA Nära Sergels Torg',
    district: 'Norrmalm',
    format: 'convenience supermarket',
    bestCategory: 'Snacks',
    distanceLabel: '0.6 km from saved area'
  },
  {
    slug: 'coop-swedenborgsgatan',
    name: 'Coop Swedenborgsgatan',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Dairy',
    distanceLabel: '2.4 km from saved area'
  },
  {
    slug: 'lidl-sveavagen',
    name: 'Lidl Sveavägen',
    district: 'Vasastan',
    format: 'discount supermarket',
    bestCategory: 'Dairy',
    distanceLabel: '1.6 km from saved area'
  },
  {
    slug: 'hemkop-stockholm',
    name: 'Hemköp Stockholm',
    district: 'Norrmalm',
    format: 'mid-size supermarket',
    bestCategory: 'Pantry',
    distanceLabel: '1.1 km from saved area'
  },
  {
    slug: 'city-gross-stockholm',
    name: 'City Gross Stockholm',
    district: 'Stockholm County',
    format: 'big-box supermarket',
    bestCategory: 'Frozen',
    distanceLabel: '8.7 km from saved area'
  },
  {
    slug: 'matmissionen-hagersten',
    name: 'Matmissionen Hägersten',
    district: 'Hägersten',
    format: 'social supermarket',
    bestCategory: 'Pantry',
    distanceLabel: '5.8 km from saved area'
  }
];

export const categories = [
  {
    slug: 'coffee',
    name: 'Coffee',
    index: '91.6',
    movement: '-8.4%',
    topDeal: 'ZOEGAS-COFFEE-450G'
  },
  {
    slug: 'dairy',
    name: 'Dairy',
    index: '102.3',
    movement: '+2.3%',
    topDeal: 'ARLA-MILK-1L'
  },
  {
    slug: 'bread',
    name: 'Bread',
    index: '98.7',
    movement: '-1.3%',
    topDeal: 'PAGEN-JATTEFRALLA-500G'
  },
  {
    slug: 'pantry',
    name: 'Pantry',
    index: '95.2',
    movement: '-4.8%',
    topDeal: 'FELIX-KETCHUP-1KG'
  },
  {
    slug: 'snacks',
    name: 'Snacks',
    index: '104.1',
    movement: '+4.1%',
    topDeal: 'MARABOU-MJOLKCHOKLAD-200G'
  },
  {
    slug: 'frozen',
    name: 'Frozen',
    index: '97.4',
    movement: '-2.6%',
    topDeal: 'FINDUS-ARTER-650G'
  },
  {
    slug: 'rice',
    name: 'Rice',
    index: '92.8',
    movement: '-7.2%',
    topDeal: 'ELDORADO-BASMATI-RICE-1KG'
  },
  {
    slug: 'butter',
    name: 'Butter',
    index: '106.9',
    movement: '+6.9%',
    topDeal: 'BREGOTT-NORMALSALTAT-600G'
  }
];

export const stockholmAreas = [
  { slug: 'norrmalm',   name: 'Norrmalm',   storeCount: 2, topSavings: 'Snacks' },
  { slug: 'sodermalm',  name: 'Södermalm',  storeCount: 1, topSavings: 'Dairy' },
  { slug: 'vasastan',   name: 'Vasastan',   storeCount: 2, topSavings: 'Coffee' },
  { slug: 'hagersten',  name: 'Hägersten',  storeCount: 1, topSavings: 'Rice' },
  { slug: 'stockholm-county', name: 'Stockholm County', storeCount: 1, topSavings: 'Pasta' },
  { slug: 'kungsholmen',name: 'Kungsholmen',storeCount: 0, topSavings: '—' },
  { slug: 'ostermalm',  name: 'Östermalm',  storeCount: 0, topSavings: '—' }
];

export const indexHistory = [
  { date: '2026-05-12', coffee: 100.0, dairy: 100.0, bread: 100.0, pantry: 100.0, snacks: 100.0, frozen: 100.0 },
  { date: '2026-05-13', coffee:  98.4, dairy: 100.6, bread:  99.5, pantry:  99.2, snacks: 100.8, frozen:  99.4 },
  { date: '2026-05-14', coffee:  96.1, dairy: 101.1, bread:  99.1, pantry:  98.4, snacks: 101.6, frozen:  98.8 },
  { date: '2026-05-15', coffee:  94.3, dairy: 101.7, bread:  98.8, pantry:  97.6, snacks: 102.3, frozen:  98.3 },
  { date: '2026-05-16', coffee:  93.0, dairy: 102.0, bread:  98.7, pantry:  96.8, snacks: 102.9, frozen:  97.9 },
  { date: '2026-05-17', coffee:  92.2, dairy: 102.2, bread:  98.7, pantry:  96.0, snacks: 103.5, frozen:  97.6 },
  { date: '2026-05-18', coffee:  91.8, dairy: 102.3, bread:  98.7, pantry:  95.5, snacks: 103.8, frozen:  97.5 },
  { date: '2026-05-19', coffee:  91.6, dairy: 102.3, bread:  98.7, pantry:  95.2, snacks: 104.1, frozen:  97.4 }
];

export const weeklyBasket = [
  { slug: 'arla-milk-1l',                qty: 3, total: '41.70 SEK', vsLastWeek: '-2.1%' },
  { slug: 'pagen-jattefralla-500g',      qty: 1, total: '32.95 SEK', vsLastWeek: '-0.3%' },
  { slug: 'zoegas-coffee-450g',          qty: 1, total: '49.90 SEK', vsLastWeek: '-8.4%' },
  { slug: 'lattfil-arla-1l',             qty: 2, total: '37.00 SEK', vsLastWeek: '+0.5%' },
  { slug: 'icas-egg-15p',                qty: 1, total: '39.95 SEK', vsLastWeek: '+1.8%' },
  { slug: 'felix-ketchup-1kg',           qty: 1, total: '32.00 SEK', vsLastWeek: '-3.0%' },
  { slug: 'skogaholm-rostbrod-500g',     qty: 1, total: '26.50 SEK', vsLastWeek: '+0.0%' },
  { slug: 'findus-arter-650g',           qty: 1, total: '24.90 SEK', vsLastWeek: '-1.4%' },
  { slug: 'eldorado-basmati-rice-1kg',   qty: 1, total: '18.90 SEK', vsLastWeek: '-7.2%' },
  { slug: 'barilla-spaghetti-1kg',        qty: 2, total: '55.80 SEK', vsLastWeek: '-1.9%' },
  { slug: 'bregott-normalsaltat-600g',    qty: 1, total: '56.90 SEK', vsLastWeek: '+6.9%' }
];

export const householdSavings = {
  weeklyTotal: '416.60 SEK',
  vsLastWeek: '-15.30 SEK',
  vsLastMonth: '-61.40 SEK',
  topSaving: { product: 'Zoegas Coffee 450g', amount: '-4.60 SEK', driver: 'member promo' }
};
