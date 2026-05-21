// Demo seed for the homepage / product / store / category routes.
// Mirrors the store fixtures in packages/ingestion/src/index.ts.
// Real prices replace these as packages/ingestion connectors come online.

import { rankDealOpportunities } from '@groceryview/core';

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
  },
  {
    slug: 'garant-havregryn-1kg',
    ticker: 'GARANT-HAVREGRYN-1KG',
    name: 'Garant Havregryn 1kg',
    store: 'Tempo Hornstull',
    price: '21.90 SEK',
    unitPrice: '21.90 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 13:05 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'zeta-olivolja-classico-500ml',
    ticker: 'ZETA-OLIVOLJA-CLASSICO-500ML',
    name: 'Zeta Olivolja Classico 500ml',
    store: 'Coop Swedenborgsgatan',
    price: '79.90 SEK',
    unitPrice: '159.80 SEK/l',
    priceType: 'member promo',
    confidence: 'medium',
    observedAt: '2026-05-20 13:25 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'santa-maria-taco-spice-28g',
    ticker: 'SANTA-MARIA-TACO-SPICE-28G',
    name: 'Santa Maria Taco Spice Mix 28g',
    store: 'ICA Nära Sergels Torg',
    price: '11.95 SEK',
    unitPrice: '426.79 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 13:40 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'bravo-apelsinjuice-1l',
    ticker: 'BRAVO-APELSINJUICE-1L',
    name: 'Bravo Apelsinjuice 1L',
    store: 'Hemköp Hornstull',
    price: '22.90 SEK',
    unitPrice: '22.90 SEK/l',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-20 16:10 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'scan-falukorv-800g',
    ticker: 'SCAN-FALUKORV-800G',
    name: 'Scan Falukorv 800g',
    store: 'ICA Kvantum Liljeholmen',
    price: '49.95 SEK',
    unitPrice: '62.44 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 17:05 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'felix-potatismos-33p',
    ticker: 'FELIX-POTATISMOS-33P',
    name: 'Felix Potatismos 33 portioner',
    store: 'City Gross Stockholm',
    price: '39.90 SEK',
    unitPrice: '120.91 SEK/kg',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-20 15:45 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'garant-svensk-potatis-2kg',
    ticker: 'GARANT-SVENSK-POTATIS-2KG',
    name: 'Garant Svensk Potatis 2kg',
    store: 'Tempo Hornstull',
    price: '24.90 SEK',
    unitPrice: '12.45 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 16:35 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'garant-korsbarstomater-250g',
    ticker: 'GARANT-KORSBARSTOMATER-250G',
    name: 'Garant Körsbärstomater 250g',
    store: 'Coop Daglivs Fridhemsplan',
    price: '19.90 SEK',
    unitPrice: '79.60 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 18:05 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'fiskeriet-laxfile-500g',
    ticker: 'FISKERIET-LAXFILE-500G',
    name: 'Fiskeriet Laxfilé 500g',
    store: 'ICA Kvantum Liljeholmen',
    price: '119.00 SEK',
    unitPrice: '238.00 SEK/kg',
    priceType: 'member promo',
    confidence: 'medium',
    observedAt: '2026-05-20 18:30 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'kronfagel-kycklingfile-1kg',
    ticker: 'KRONFAGEL-KYCKLINGFILE-1KG',
    name: 'Kronfågel Kycklingfilé 1kg',
    store: 'Hemköp Skanstull',
    price: '109.00 SEK',
    unitPrice: '109.00 SEK/kg',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-20 18:45 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'libresse-bindor-normal-14p',
    ticker: 'LIBRESSE-BINDOR-NORMAL-14P',
    name: 'Libresse Bindor Normal 14-pack',
    store: 'ICA Maxi Lindhagen',
    price: '29.90 SEK',
    unitPrice: '2.14 SEK/each',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-20 19:05 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'pepsodent-super-fluor-75ml',
    ticker: 'PEPSODENT-SUPER-FLUOR-75ML',
    name: 'Pepsodent Super Fluor 75ml',
    store: 'Coop Daglivs Fridhemsplan',
    price: '18.90 SEK',
    unitPrice: '252.00 SEK/l',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 19:15 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'grumme-handdisk-original-500ml',
    ticker: 'GRUMME-HANDDISK-ORIGINAL-500ML',
    name: 'Grumme Handdisk Original 500ml',
    store: 'Hemköp Skanstull',
    price: '24.90 SEK',
    unitPrice: '49.80 SEK/l',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-20 19:25 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'anamma-formbar-fars-850g',
    ticker: 'ANAMMA-FORMBAR-FARS-850G',
    name: 'Anamma Formbar Färs 850g',
    store: 'Coop Norra Stationsgatan',
    price: '64.90 SEK',
    unitPrice: '76.35 SEK/kg',
    priceType: 'member promo',
    confidence: 'medium',
    observedAt: '2026-05-20 20:05 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'garant-ekologisk-tofu-270g',
    ticker: 'GARANT-EKO-TOFU-270G',
    name: 'Garant Ekologisk Tofu 270g',
    store: 'Willys Odenplan',
    price: '21.90 SEK',
    unitPrice: '81.11 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 20:15 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'zeta-kikartor-380g',
    ticker: 'ZETA-KIKARTOR-380G',
    name: 'Zeta Kikärtor 380g',
    store: 'Hemköp Hornstull',
    price: '14.90 SEK',
    unitPrice: '39.21 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-20 20:25 CET',
    source: 'in-store shelf observation'
  }
];

export const stores = [
  {
    slug: 'willys-odenplan',
    name: 'Willys Odenplan',
    ingestionFixture: 'Willys Odenplan',
    district: 'Vasastan',
    format: 'discount supermarket',
    bestCategory: 'Coffee',
    distanceLabel: '1.2 km from saved area'
  },
  {
    slug: 'ica-nara-sergels-torg',
    name: 'ICA Nära Sergels Torg',
    ingestionFixture: 'ICA Nara Sergels Torg',
    district: 'Norrmalm',
    format: 'convenience supermarket',
    bestCategory: 'Snacks',
    distanceLabel: '0.6 km from saved area'
  },
  {
    slug: 'coop-swedenborgsgatan',
    name: 'Coop Swedenborgsgatan',
    ingestionFixture: 'Coop Swedenborgsgatan',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Dairy',
    distanceLabel: '2.4 km from saved area'
  },
  {
    slug: 'lidl-sveavagen',
    name: 'Lidl Sveavägen',
    ingestionFixture: 'Lidl Sveavagen',
    district: 'Vasastan',
    format: 'discount supermarket',
    bestCategory: 'Dairy',
    distanceLabel: '1.6 km from saved area'
  },
  {
    slug: 'hemkop-stockholm',
    name: 'Hemköp Stockholm',
    ingestionFixture: 'Hemkop Stockholm locator result',
    district: 'Norrmalm',
    format: 'mid-size supermarket',
    bestCategory: 'Pantry',
    distanceLabel: '1.1 km from saved area'
  },
  {
    slug: 'city-gross-stockholm',
    name: 'City Gross Stockholm',
    ingestionFixture: 'City Gross Stockholm county locator result',
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
  },
  {
    slug: 'tempo-hornstull',
    name: 'Tempo Hornstull',
    district: 'Södermalm',
    format: 'neighborhood supermarket',
    bestCategory: 'Breakfast',
    distanceLabel: '3.1 km from saved area'
  },
  {
    slug: 'ica-kvantum-liljeholmen',
    name: 'ICA Kvantum Liljeholmen',
    ingestionFixture: 'ICA Kvantum Liljeholmen',
    district: 'Liljeholmen',
    format: 'large supermarket',
    bestCategory: 'Dinner staples',
    distanceLabel: '4.4 km from saved area'
  },
  {
    slug: 'hemkop-hornstull',
    name: 'Hemköp Hornstull',
    ingestionFixture: 'Hemkop Hornstull',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Beverages',
    distanceLabel: '3.3 km from saved area'
  },
  {
    slug: 'coop-daglivs-fridhemsplan',
    name: 'Coop Daglivs Fridhemsplan',
    ingestionFixture: 'Coop Daglivs Fridhemsplan',
    district: 'Kungsholmen',
    format: 'large supermarket',
    bestCategory: 'Produce',
    distanceLabel: '2.8 km from saved area'
  },
  {
    slug: 'hemkop-skanstull',
    name: 'Hemköp Skanstull',
    ingestionFixture: 'Hemkop Skanstull',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Meat',
    distanceLabel: '3.7 km from saved area'
  },
  {
    slug: 'ica-maxi-lindhagen',
    name: 'ICA Maxi Lindhagen',
    ingestionFixture: 'ICA Maxi Lindhagen',
    district: 'Kungsholmen',
    format: 'hypermarket',
    bestCategory: 'Personal care',
    distanceLabel: '2.9 km from saved area'
  },
  {
    slug: 'coop-norra-stationsgatan',
    name: 'Coop Norra Stationsgatan',
    ingestionFixture: 'Coop Norra Stationsgatan',
    district: 'Vasastan',
    format: 'mid-size supermarket',
    bestCategory: 'Plant-based',
    distanceLabel: '1.9 km from saved area'
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
  },
  {
    slug: 'breakfast',
    name: 'Breakfast',
    index: '93.4',
    movement: '-6.6%',
    topDeal: 'GARANT-HAVREGRYN-1KG'
  },
  {
    slug: 'beverages',
    name: 'Beverages',
    index: '96.8',
    movement: '-3.2%',
    topDeal: 'BRAVO-APELSINJUICE-1L'
  },
  {
    slug: 'produce',
    name: 'Produce',
    index: '94.6',
    movement: '-5.4%',
    topDeal: 'GARANT-KORSBARSTOMATER-250G'
  },
  {
    slug: 'fish',
    name: 'Fish',
    index: '98.9',
    movement: '-1.1%',
    topDeal: 'FISKERIET-LAXFILE-500G'
  },
  {
    slug: 'meat',
    name: 'Meat',
    index: '97.8',
    movement: '-2.2%',
    topDeal: 'KRONFAGEL-KYCKLINGFILE-1KG'
  },
  {
    slug: 'personal-care',
    name: 'Personal care',
    index: '95.9',
    movement: '-4.1%',
    topDeal: 'LIBRESSE-BINDOR-NORMAL-14P'
  },
  {
    slug: 'plant-based',
    name: 'Plant-based',
    index: '93.8',
    movement: '-6.2%',
    topDeal: 'ANAMMA-FORMBAR-FARS-850G'
  }
];

export const dealOpportunityRail = rankDealOpportunities({
  deals: [
    {
      productId: 'zoegas-coffee-450g',
      productName: 'Zoegas Coffee 450g',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      currentPrice: 49.9,
      regularPrice: 64.9,
      dealScore: 91,
      sourceConfidence: 0.92
    },
    {
      productId: 'eldorado-basmati-rice-1kg',
      productName: 'Eldorado Basmati Rice 1kg',
      storeId: 'matmissionen-hagersten',
      storeName: 'Matmissionen Hägersten',
      currentPrice: 18.9,
      regularPrice: 27.9,
      dealScore: 88,
      sourceConfidence: 0.74
    },
    {
      productId: 'garant-havregryn-1kg',
      productName: 'Garant Havregryn 1kg',
      storeId: 'tempo-hornstull',
      storeName: 'Tempo Hornstull',
      currentPrice: 21.9,
      regularPrice: 25.8,
      dealScore: 81,
      sourceConfidence: 0.86
    },
    {
      productId: 'bravo-apelsinjuice-1l',
      productName: 'Bravo Apelsinjuice 1L',
      storeId: 'hemkop-hornstull',
      storeName: 'Hemköp Hornstull',
      currentPrice: 22.9,
      regularPrice: 27.9,
      dealScore: 79,
      sourceConfidence: 0.9
    },
    {
      productId: 'garant-korsbarstomater-250g',
      productName: 'Garant Körsbärstomater 250g',
      storeId: 'coop-daglivs-fridhemsplan',
      storeName: 'Coop Daglivs Fridhemsplan',
      currentPrice: 19.9,
      regularPrice: 27.9,
      dealScore: 84,
      sourceConfidence: 0.88
    },
    {
      productId: 'libresse-bindor-normal-14p',
      productName: 'Libresse Bindor Normal 14-pack',
      storeId: 'ica-maxi-lindhagen',
      storeName: 'ICA Maxi Lindhagen',
      currentPrice: 29.9,
      regularPrice: 39.9,
      dealScore: 82,
      sourceConfidence: 0.87
    },
    {
      productId: 'anamma-formbar-fars-850g',
      productName: 'Anamma Formbar Färs 850g',
      storeId: 'coop-norra-stationsgatan',
      storeName: 'Coop Norra Stationsgatan',
      currentPrice: 64.9,
      regularPrice: 79.9,
      dealScore: 83,
      sourceConfidence: 0.8
    },
    {
      productId: 'felix-ketchup-1kg',
      productName: 'Felix Tomatketchup 1kg',
      storeId: 'hemkop-stockholm',
      storeName: 'Hemköp Stockholm',
      currentPrice: 32,
      regularPrice: 39.9,
      dealScore: 76,
      sourceConfidence: 0.68
    }
  ],
  minimumDealScore: 70,
  minimumSourceConfidence: 0.6
});

export const basketSubstitutionRadar = [
  {
    anchorSlug: 'bregott-normalsaltat-600g',
    anchorName: 'Bregott Normalsaltat 600g',
    anchorStoreSlug: 'willys-odenplan',
    anchorStoreName: 'Willys Odenplan',
    substituteSlug: 'garant-havregryn-1kg',
    substituteName: 'Garant Havregryn 1kg',
    substituteStoreSlug: 'tempo-hornstull',
    substituteStoreName: 'Tempo Hornstull',
    verdict: 'hold',
    basketImpact: '+3.70 SEK risk',
    sourceConfidence: 0.86,
    reason: 'Butter is above baseline while breakfast oats remain under trend for a nearby top-up.'
  },
  {
    anchorSlug: 'barilla-spaghetti-1kg',
    anchorName: 'Barilla Spaghetti 1kg',
    anchorStoreSlug: 'city-gross-stockholm',
    anchorStoreName: 'City Gross Stockholm',
    substituteSlug: 'eldorado-basmati-rice-1kg',
    substituteName: 'Eldorado Basmati Rice 1kg',
    substituteStoreSlug: 'matmissionen-hagersten',
    substituteStoreName: 'Matmissionen Hägersten',
    verdict: 'swap',
    basketImpact: '-9.00 SEK',
    sourceConfidence: 0.74,
    reason: 'Pantry rice is materially below the pasta row and should be checked before a county trip.'
  },
  {
    anchorSlug: 'marabou-mjolkchoklad-200g',
    anchorName: 'Marabou Mjölkchoklad 200g',
    anchorStoreSlug: 'lidl-sveavagen',
    anchorStoreName: 'Lidl Sveavägen',
    substituteSlug: 'olw-cheez-doodles-160g',
    substituteName: 'OLW Cheez Doodles 160g',
    substituteStoreSlug: 'ica-nara-sergels-torg',
    substituteStoreName: 'ICA Nära Sergels Torg',
    verdict: 'compare',
    basketImpact: 'snack basket check',
    sourceConfidence: 0.91,
    reason: 'High-confidence snack rows are split across stores, so the terminal should flag the comparison.'
  },
  {
    anchorSlug: 'kelda-pumpkin-soup-1l',
    anchorName: 'Kelda Pumpa Soppa 1L',
    anchorStoreSlug: 'hemkop-stockholm',
    anchorStoreName: 'Hemköp Stockholm',
    substituteSlug: 'felix-ketchup-1kg',
    substituteName: 'Felix Tomatketchup 1kg',
    substituteStoreSlug: 'hemkop-stockholm',
    substituteStoreName: 'Hemköp Stockholm',
    verdict: 'bundle',
    basketImpact: '-2.90 SEK pantry add-on',
    sourceConfidence: 0.68,
    reason: 'Medium-confidence Hemkop rows should travel together until receipt review confirms the soup price.'
  },
  {
    anchorSlug: 'fiskeriet-laxfile-500g',
    anchorName: 'Fiskeriet Laxfilé 500g',
    anchorStoreSlug: 'ica-kvantum-liljeholmen',
    anchorStoreName: 'ICA Kvantum Liljeholmen',
    substituteSlug: 'kronfagel-kycklingfile-1kg',
    substituteName: 'Kronfågel Kycklingfilé 1kg',
    substituteStoreSlug: 'hemkop-skanstull',
    substituteStoreName: 'Hemköp Skanstull',
    verdict: 'compare',
    basketImpact: '-10.00 SEK dinner protein check',
    sourceConfidence: 0.78,
    reason: 'Fish and meat promos are close enough that dinner baskets should compare both before routing.'
  },
  {
    anchorSlug: 'libresse-bindor-normal-14p',
    anchorName: 'Libresse Bindor Normal 14-pack',
    anchorStoreSlug: 'ica-maxi-lindhagen',
    anchorStoreName: 'ICA Maxi Lindhagen',
    substituteSlug: 'pepsodent-super-fluor-75ml',
    substituteName: 'Pepsodent Super Fluor 75ml',
    substituteStoreSlug: 'coop-daglivs-fridhemsplan',
    substituteStoreName: 'Coop Daglivs Fridhemsplan',
    verdict: 'bundle',
    basketImpact: '-13.00 SEK hygiene restock',
    sourceConfidence: 0.87,
    reason: 'Personal-care staples are under baseline and should be bundled before household items run out.'
  },
  {
    anchorSlug: 'anamma-formbar-fars-850g',
    anchorName: 'Anamma Formbar Färs 850g',
    anchorStoreSlug: 'coop-norra-stationsgatan',
    anchorStoreName: 'Coop Norra Stationsgatan',
    substituteSlug: 'garant-ekologisk-tofu-270g',
    substituteName: 'Garant Ekologisk Tofu 270g',
    substituteStoreSlug: 'willys-odenplan',
    substituteStoreName: 'Willys Odenplan',
    verdict: 'compare',
    basketImpact: '-15.00 SEK meal-prep check',
    sourceConfidence: 0.8,
    reason: 'Plant-based protein rows are below baseline and should be compared before locking meal-prep baskets.'
  }
];

export const stockholmAreas = [
  { slug: 'norrmalm',   name: 'Norrmalm',   storeCount: 2, topSavings: 'Snacks' },
  { slug: 'sodermalm',  name: 'Södermalm',  storeCount: 3, topSavings: 'Meat' },
  { slug: 'vasastan',   name: 'Vasastan',   storeCount: 3, topSavings: 'Plant-based' },
  { slug: 'hagersten',  name: 'Hägersten',  storeCount: 1, topSavings: 'Rice' },
  { slug: 'liljeholmen', name: 'Liljeholmen', storeCount: 1, topSavings: 'Pantry' },
  { slug: 'stockholm-county', name: 'Stockholm County', storeCount: 1, topSavings: 'Pasta' },
  { slug: 'kungsholmen',name: 'Kungsholmen',storeCount: 2, topSavings: 'Personal care' },
  { slug: 'ostermalm',  name: 'Östermalm',  storeCount: 0, topSavings: '—' }
];

export const sourceCoverage = [
  {
    chain: 'ICA',
    fixture: 'Store locator',
    surface: 'public locator',
    status: 'ready',
    visibleRows: 4,
    newestSignal: 'Sergels Torg, Liljeholmen, and Lindhagen rows cover snacks, egg, dinner, and hygiene staples'
  },
  {
    chain: 'Willys',
    fixture: 'Weekly offers',
    surface: 'public flyer',
    status: 'ready',
    visibleRows: 4,
    newestSignal: 'Coffee, peas, fil, and butter prices anchor basket planning'
  },
  {
    chain: 'Coop',
    fixture: 'Store profile',
    surface: 'district store',
    status: 'ready',
    visibleRows: 5,
    newestSignal: 'Swedenborgsgatan, Daglivs, and Norra Stationsgatan rows now cover dairy, bread, produce, toothpaste, and plant-based protein'
  },
  {
    chain: 'Hemköp',
    fixture: 'Offer review',
    surface: 'weekly deal',
    status: 'review',
    visibleRows: 5,
    newestSignal: 'Ketchup, soup, Hornstull juice, Skanstull chicken, and dish soap rows keep offer review visible'
  },
  {
    chain: 'Lidl',
    fixture: 'Online shelf',
    surface: 'product page',
    status: 'ready',
    visibleRows: 2,
    newestSignal: 'Milk and chocolate rows provide cross-store comparisons'
  },
  {
    chain: 'City Gross',
    fixture: 'Regional offer',
    surface: 'weekly page',
    status: 'stub',
    visibleRows: 2,
    newestSignal: 'Pasta and pantry mash rows are visible while county coverage expands'
  },
  {
    chain: 'Fiskeriet',
    fixture: 'Seafood flyer',
    surface: 'fresh counter promo',
    status: 'review',
    visibleRows: 1,
    newestSignal: 'Laxfilé row is visible for dinner basket comparisons before receipt confirmation'
  }
];

export const storeComparisonBoard = [
  {
    slug: 'vasastan-coffee-dairy',
    area: 'Vasastan',
    primaryStoreSlug: 'willys-odenplan',
    primaryStoreName: 'Willys Odenplan',
    comparisonStoreSlug: 'lidl-sveavagen',
    comparisonStoreName: 'Lidl Sveavagen',
    basketFocus: 'Coffee + dairy top-up',
    leadSignal: 'Zoegas coffee is 8.4% under baseline while Lidl milk anchors the dairy check.',
    visibleItems: 5,
    basketImpact: '-21.20 SEK'
  },
  {
    slug: 'norrmalm-snack-check',
    area: 'Norrmalm',
    primaryStoreSlug: 'ica-nara-sergels-torg',
    primaryStoreName: 'ICA Nara Sergels Torg',
    comparisonStoreSlug: 'hemkop-stockholm',
    comparisonStoreName: 'Hemkop Stockholm',
    basketFocus: 'Snacks + pantry fill',
    leadSignal: 'High-confidence snack rows can be checked against Hemkop pantry deals before checkout.',
    visibleItems: 4,
    basketImpact: '-8.45 SEK'
  },
  {
    slug: 'sodermalm-breakfast-loop',
    area: 'Sodermalm',
    primaryStoreSlug: 'coop-swedenborgsgatan',
    primaryStoreName: 'Coop Swedenborgsgatan',
    comparisonStoreSlug: 'tempo-hornstull',
    comparisonStoreName: 'Tempo Hornstull',
    basketFocus: 'Breakfast staples',
    leadSignal: 'Tempo oats stay under trend while Coop bread and dairy keep the route comparable.',
    visibleItems: 3,
    basketImpact: '-6.60 SEK'
  },
  {
    slug: 'pantry-county-split',
    area: 'Stockholm County',
    primaryStoreSlug: 'matmissionen-hagersten',
    primaryStoreName: 'Matmissionen Hagersten',
    comparisonStoreSlug: 'city-gross-stockholm',
    comparisonStoreName: 'City Gross Stockholm',
    basketFocus: 'Pantry bulk buy',
    leadSignal: 'Rice and pasta rows expose whether the county trip is worth delaying or splitting.',
    visibleItems: 2,
    basketImpact: '-10.90 SEK'
  },
  {
    slug: 'dinner-protein-loop',
    area: 'Liljeholmen + Södermalm',
    primaryStoreSlug: 'ica-kvantum-liljeholmen',
    primaryStoreName: 'ICA Kvantum Liljeholmen',
    comparisonStoreSlug: 'hemkop-skanstull',
    comparisonStoreName: 'Hemköp Skanstull',
    basketFocus: 'Fish and chicken dinner',
    leadSignal: 'Laxfilé and kycklingfilé promos are both visible, so dinner baskets can compare protein cost before routing.',
    visibleItems: 2,
    basketImpact: '-10.00 SEK'
  },
  {
    slug: 'kungsholmen-hygiene-restock',
    area: 'Kungsholmen',
    primaryStoreSlug: 'ica-maxi-lindhagen',
    primaryStoreName: 'ICA Maxi Lindhagen',
    comparisonStoreSlug: 'coop-daglivs-fridhemsplan',
    comparisonStoreName: 'Coop Daglivs Fridhemsplan',
    basketFocus: 'Personal-care restock',
    leadSignal: 'Libresse and Pepsodent rows make hygiene restocks visible before the weekly food trip.',
    visibleItems: 2,
    basketImpact: '-13.00 SEK'
  },
  {
    slug: 'vasastan-plant-based-prep',
    area: 'Vasastan',
    primaryStoreSlug: 'coop-norra-stationsgatan',
    primaryStoreName: 'Coop Norra Stationsgatan',
    comparisonStoreSlug: 'willys-odenplan',
    comparisonStoreName: 'Willys Odenplan',
    basketFocus: 'Plant-based meal prep',
    leadSignal: 'Anamma färs and Garant tofu rows expose whether to split plant-based protein across nearby stores.',
    visibleItems: 2,
    basketImpact: '-15.00 SEK'
  }
];

export const shoppingTripSwitchboard = [
  {
    title: 'Fast breakfast restock',
    area: 'Södermalm',
    store: 'Tempo Hornstull',
    category: 'Breakfast',
    basket: 'Oats, fil, bread',
    spend: '67.40 SEK',
    saving: '-10.50 SEK',
    decision: 'Use when pantry staples are low and dairy can wait one day.',
    href: '/stores/tempo-hornstull'
  },
  {
    title: 'Coffee and freezer run',
    area: 'Vasastan',
    store: 'Willys Odenplan',
    category: 'Coffee',
    basket: 'Zoegas, peas, butter',
    spend: '131.70 SEK',
    saving: '-18.30 SEK',
    decision: 'Best single stop when coffee index stays below baseline.',
    href: '/stores/willys-odenplan'
  },
  {
    title: 'Pantry split stop',
    area: 'Hägersten',
    store: 'Matmissionen Hägersten',
    category: 'Rice',
    basket: 'Rice, pasta, soup',
    spend: '109.60 SEK',
    saving: '-14.20 SEK',
    decision: 'Split from the main weekly basket when travel cost is already covered.',
    href: '/categories/rice'
  },
  {
    title: 'Hygiene restock add-on',
    area: 'Kungsholmen',
    store: 'ICA Maxi Lindhagen',
    category: 'Personal care',
    basket: 'Libresse, toothpaste, dish soap',
    spend: '73.70 SEK',
    saving: '-13.00 SEK',
    decision: 'Add to the route when personal-care stock falls below one week.',
    href: '/categories/personal-care'
  },
  {
    title: 'Plant-based meal prep',
    area: 'Vasastan',
    store: 'Coop Norra Stationsgatan',
    category: 'Plant-based',
    basket: 'Anamma färs, tofu, chickpeas',
    spend: '101.70 SEK',
    saving: '-15.00 SEK',
    decision: 'Split protein rows across Coop and Willys when weekday meal prep is planned.',
    href: '/categories/plant-based'
  }
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
  { slug: 'bregott-normalsaltat-600g',    qty: 1, total: '56.90 SEK', vsLastWeek: '+6.9%' },
  { slug: 'garant-havregryn-1kg',         qty: 1, total: '21.90 SEK', vsLastWeek: '-6.6%' },
  { slug: 'bravo-apelsinjuice-1l',         qty: 2, total: '45.80 SEK', vsLastWeek: '-3.2%' },
  { slug: 'garant-svensk-potatis-2kg',     qty: 1, total: '24.90 SEK', vsLastWeek: '-0.9%' },
  { slug: 'garant-korsbarstomater-250g',   qty: 2, total: '39.80 SEK', vsLastWeek: '-5.4%' },
  { slug: 'kronfagel-kycklingfile-1kg',    qty: 1, total: '109.00 SEK', vsLastWeek: '-2.2%' },
  { slug: 'libresse-bindor-normal-14p',     qty: 1, total: '29.90 SEK', vsLastWeek: '-4.1%' },
  { slug: 'grumme-handdisk-original-500ml', qty: 1, total: '24.90 SEK', vsLastWeek: '-1.7%' },
  { slug: 'anamma-formbar-fars-850g',       qty: 1, total: '64.90 SEK', vsLastWeek: '-6.2%' },
  { slug: 'zeta-kikartor-380g',             qty: 2, total: '29.80 SEK', vsLastWeek: '-2.4%' }
];

export const savingsPlaybook = [
  {
    title: 'Coffee stock-up window',
    trigger: 'Coffee index is 8.4% under baseline',
    action: 'Buy one extra Zoegas pack at Willys before promo expiry',
    impact: '-10.00 SEK vs usual shelf',
    href: '/products/zoegas-coffee-450g'
  },
  {
    title: 'Breakfast basket shift',
    trigger: 'Tempo oats row is high-confidence and under trend',
    action: 'Move weekday breakfast staples to Hornstull when nearby',
    impact: '-3.90 SEK per 1kg oats',
    href: '/categories/breakfast'
  },
  {
    title: 'Pantry split check',
    trigger: 'Matmissionen rice is 7.2% below recent pantry index',
    action: 'Split pantry top-ups from dairy trips when the route is practical',
    impact: '-9.00 SEK vs big-box rice',
    href: '/products/eldorado-basmati-rice-1kg'
  },
  {
    title: 'Butter caution flag',
    trigger: 'Butter index is 6.9% over baseline despite member pricing',
    action: 'Delay extra Bregott purchases unless basket coverage is low',
    impact: '+3.70 SEK risk per pack',
    href: '/categories/butter'
  },
  {
    title: 'Juice promo top-up',
    trigger: 'Beverages index is 3.2% under baseline with a high-confidence Hornstull row',
    action: 'Add two Bravo cartons when the household route already passes Hornstull',
    impact: '-5.00 SEK per carton vs usual shelf',
    href: '/products/bravo-apelsinjuice-1l'
  },
  {
    title: 'Dinner protein compare',
    trigger: 'Fish and meat indexes are both under baseline on fresh evening rows',
    action: 'Compare Liljeholmen salmon against Skanstull chicken before locking the dinner route',
    impact: '-10.00 SEK route choice',
    href: '/products/kronfagel-kycklingfile-1kg'
  },
  {
    title: 'Personal-care restock window',
    trigger: 'Personal care index is 4.1% under baseline with a high-confidence Lindhagen row',
    action: 'Bundle Libresse and Pepsodent before household staples hit low-stock status',
    impact: '-13.00 SEK restock basket',
    href: '/categories/personal-care'
  },
  {
    title: 'Plant-based meal-prep split',
    trigger: 'Plant-based index is 6.2% under baseline across Vasastan protein rows',
    action: 'Compare Coop Anamma with Willys tofu before building weekday bowls',
    impact: '-15.00 SEK prep basket',
    href: '/categories/plant-based'
  }
];

export const watchlistAlerts = [
  {
    productSlug: 'zoegas-coffee-450g',
    storeSlug: 'willys-odenplan',
    targetPrice: 52,
    currentPrice: 49.9,
    usualPrice: 64.9,
    trigger: 'target met',
    channel: 'push',
    confidence: 'high',
    allowedPriceTypes: ['member promo', 'shelf'],
    nextAction: 'Buy one extra coffee pack while the Willys member promo is active.'
  },
  {
    productSlug: 'bregott-normalsaltat-600g',
    storeSlug: 'willys-odenplan',
    targetPrice: 52,
    currentPrice: 56.9,
    usualPrice: 53.2,
    trigger: 'above target',
    channel: 'digest',
    confidence: 'high',
    allowedPriceTypes: ['member promo', 'shelf'],
    nextAction: 'Keep butter on watch and delay stock-up until the price falls below target.'
  },
  {
    productSlug: 'eldorado-basmati-rice-1kg',
    storeSlug: 'matmissionen-hagersten',
    targetPrice: 22,
    currentPrice: 18.9,
    usualPrice: 27.9,
    trigger: 'target met',
    channel: 'push',
    confidence: 'medium',
    allowedPriceTypes: ['clearance shelf', 'community shelf'],
    nextAction: 'Add a pantry top-up if the weekly route passes Hagersten.'
  },
  {
    productSlug: 'garant-havregryn-1kg',
    storeSlug: 'tempo-hornstull',
    targetPrice: 23,
    currentPrice: 21.9,
    usualPrice: 25.8,
    trigger: 'target met',
    channel: 'email',
    confidence: 'high',
    allowedPriceTypes: ['shelf'],
    nextAction: 'Move breakfast staples to Hornstull this week.'
  },
  {
    productSlug: 'anamma-formbar-fars-850g',
    storeSlug: 'coop-norra-stationsgatan',
    targetPrice: 68,
    currentPrice: 64.9,
    usualPrice: 79.9,
    trigger: 'target met',
    channel: 'push',
    confidence: 'medium',
    allowedPriceTypes: ['member promo', 'shelf'],
    nextAction: 'Add plant-based protein to the meal-prep route while the Coop promo is active.'
  }
];

export const householdSavings = {
  weeklyTotal: '438.50 SEK',
  vsLastWeek: '-30.10 SEK',
  vsLastMonth: '-78.40 SEK',
  topSaving: { product: 'Anamma Formbar Färs 850g', amount: '-15.00 SEK', driver: 'Norra Stationsgatan plant-based promo' }
};

export const savingsDashboard = {
  monthToDate: {
    plannedSpend: '1,756.00 SEK',
    avoidedSpend: '66.10 SEK',
    basketCount: 4,
    bestDistrict: 'Vasastan'
  },
  watchpoints: [
    {
      label: 'Coffee promo capture',
      product: 'Zoegas Coffee 450g',
      store: 'Willys Odenplan',
      signal: '8.4% under baseline',
      action: 'Buy one backup pack before the flyer expires',
      href: '/products/zoegas-coffee-450g'
    },
    {
      label: 'Butter price drag',
      product: 'Bregott Normalsaltat 600g',
      store: 'Willys Odenplan',
      signal: '6.9% over baseline',
      action: 'Hold unless the household stock is below one pack',
      href: '/categories/butter'
    },
    {
      label: 'Pantry split saver',
      product: 'Eldorado Basmati Rice 1kg',
      store: 'Matmissionen Hägersten',
      signal: '32% below regular big-box shelf',
      action: 'Route pantry top-ups separately from dairy trips',
      href: '/products/eldorado-basmati-rice-1kg'
    },
    {
      label: 'Dinner protein check',
      product: 'Kronfågel Kycklingfilé 1kg',
      store: 'Hemköp Skanstull',
      signal: '2.2% under meat baseline',
      action: 'Compare against the Liljeholmen salmon promo before shopping',
      href: '/products/kronfagel-kycklingfile-1kg'
    },
    {
      label: 'Plant-based meal prep',
      product: 'Anamma Formbar Färs 850g',
      store: 'Coop Norra Stationsgatan',
      signal: '6.2% under plant-based baseline',
      action: 'Split with Willys tofu when weekday bowls are planned',
      href: '/products/anamma-formbar-fars-850g'
    }
  ],
  districtSavings: [
    { district: 'Vasastan', planned: '612.40 SEK', avoided: '39.80 SEK', driver: 'Coffee, dairy, and plant-based promos' },
    { district: 'Södermalm', planned: '488.30 SEK', avoided: '23.50 SEK', driver: 'Breakfast and chicken promos' },
    { district: 'Norrmalm', planned: '391.20 SEK', avoided: '13.90 SEK', driver: 'Snacks and eggs' },
    { district: 'Hägersten', planned: '264.10 SEK', avoided: '9.90 SEK', driver: 'Rice and pantry clearance' },
    { district: 'Kungsholmen', planned: '198.70 SEK', avoided: '16.00 SEK', driver: 'Produce shelf drop' }
  ]
};

export const accountProfile = {
  shopperName: 'Alex Household',
  homeDistrict: 'Vasastan',
  preferredStore: 'Willys Odenplan',
  weeklyBudget: '1,150.00 SEK',
  savedSince: '2026-05-01',
  profileCompleteness: '83%',
  preferences: [
    { label: 'Primary basket', value: 'Breakfast and pantry staples', status: 'Active' },
    { label: 'Substitution mode', value: 'Diet-safe savings first', status: 'Active' },
    { label: 'Receipt privacy', value: 'Line totals only for household sharing', status: 'Limited' },
    { label: 'Alert timing', value: 'Push before weekly route planning', status: 'Active' }
  ],
  routeLinks: [
    { label: 'Saved weekly basket', href: '/weekly-basket', detail: '12 visible driver rows' },
    { label: 'Savings dashboard', href: '/savings-dashboard', detail: '66.10 SEK avoided month-to-date' },
    { label: 'Home store profile', href: '/stores/willys-odenplan', detail: 'Coffee and dairy anchor store' }
  ]
};

export const receiptReviewQueue = [
  {
    receipt: 'Willys Odenplan basket',
    store: 'Willys Odenplan',
    area: 'Vasastan',
    items: 'Coffee, peas, butter',
    confidence: '84%',
    issue: 'Member promo needs line-total confirmation',
    impact: '-18.30 SEK',
    href: '/scanner'
  },
  {
    receipt: 'Hemköp Skanstull dinner stop',
    store: 'Hemköp Skanstull',
    area: 'Södermalm',
    items: 'Chicken, soup, ketchup',
    confidence: '73%',
    issue: 'Weekly deal rows are still medium confidence',
    impact: '-7.90 SEK',
    href: '/scanner'
  },
  {
    receipt: 'Matmissionen pantry split',
    store: 'Matmissionen Hägersten',
    area: 'Hägersten',
    items: 'Rice, pasta, shelf-stable pantry',
    confidence: '69%',
    issue: 'Community shelf observation needs reviewer approval',
    impact: '-14.20 SEK',
    href: '/scanner'
  }
];

export const receiptReviewDesk = [
  {
    receiptId: 'R-2026-05-21-ICA-LILJEHOLMEN',
    storeName: 'ICA Kvantum Liljeholmen',
    storeSlug: 'ica-kvantum-liljeholmen',
    capturedAt: '2026-05-21 18:42 CET',
    total: '286.40 SEK',
    status: 'Needs review',
    owner: 'Sam',
    confidence: 0.72,
    flaggedLines: [
      { productSlug: 'kronfagel-kycklingfile-1kg', label: 'Chicken fillet weight mismatch' },
      { productSlug: 'garant-korsbarstomater-250g', label: 'Produce price needs unit check' }
    ],
    nextAction: 'Confirm weighted dinner lines before they update the basket index.'
  },
  {
    receiptId: 'R-2026-05-20-WILLYS-ODENPLAN',
    storeName: 'Willys Odenplan',
    storeSlug: 'willys-odenplan',
    capturedAt: '2026-05-20 09:58 CET',
    total: '438.50 SEK',
    status: 'Matched',
    owner: 'Alex',
    confidence: 0.94,
    flaggedLines: [
      { productSlug: 'zoegas-coffee-450g', label: 'Member promo matched' },
      { productSlug: 'bregott-normalsaltat-600g', label: 'Above-target butter retained' }
    ],
    nextAction: 'Keep as verified evidence for watchlist and weekly basket totals.'
  },
  {
    receiptId: 'R-2026-05-19-TEMPO-HORNSTULL',
    storeName: 'Tempo Hornstull',
    storeSlug: 'tempo-hornstull',
    capturedAt: '2026-05-19 17:20 CET',
    total: '121.70 SEK',
    status: 'Ready',
    owner: 'Mira',
    confidence: 0.88,
    flaggedLines: [
      { productSlug: 'garant-havregryn-1kg', label: 'Breakfast staple confirmed' },
      { productSlug: 'bravo-apelsinjuice-1l', label: 'Beverage promo row accepted' }
    ],
    nextAction: 'Publish high-confidence breakfast and beverage rows to the savings dashboard.'
  }
];

export const unitPriceAlertDesk = [
  {
    productSlug: 'santa-maria-taco-spice-28g',
    productName: 'Santa Maria Taco Spice Mix 28g',
    storeSlug: 'ica-nara-sergels-torg',
    storeName: 'ICA Nära Sergels Torg',
    packageSize: '28g',
    unitPrice: '426.79 SEK/kg',
    shelfPrice: '11.95 SEK',
    benchmark: 'Pantry spice median 310.00 SEK/kg',
    severity: 'High',
    reason: 'Small package looks cheap at shelf price but is expensive per kilogram.'
  },
  {
    productSlug: 'zeta-olivolja-classico-500ml',
    productName: 'Zeta Olivolja Classico 500ml',
    storeSlug: 'coop-swedenborgsgatan',
    storeName: 'Coop Swedenborgsgatan',
    packageSize: '500ml',
    unitPrice: '159.80 SEK/l',
    shelfPrice: '79.90 SEK',
    benchmark: 'Oil median 142.00 SEK/l',
    severity: 'Medium',
    reason: 'Member label still sits above the category median once normalized by liter.'
  },
  {
    productSlug: 'fiskeriet-laxfile-500g',
    productName: 'Fiskeriet Laxfile 500g',
    storeSlug: 'ica-kvantum-liljeholmen',
    storeName: 'ICA Kvantum Liljeholmen',
    packageSize: '500g',
    unitPrice: '238.00 SEK/kg',
    shelfPrice: '119.00 SEK',
    benchmark: 'Dinner protein median 199.00 SEK/kg',
    severity: 'Review',
    reason: 'Protein promo needs comparison against chicken before a dinner basket locks.'
  }
];

export const mealBasketIdeas = [
  {
    title: 'weekday breakfast top-up',
    area: 'Vasastan + Hornstull',
    total: '99.30 SEK',
    savings: '-13.20 SEK',
    route: 'Start at Willys Odenplan, add Tempo oats when already near Hornstull',
    products: ['lattfil-arla-1l', 'garant-havregryn-1kg', 'icas-egg-15p']
  },
  {
    title: 'pantry pasta night',
    area: 'Stockholm County + Hägersten',
    total: '74.70 SEK',
    savings: '-15.40 SEK',
    route: 'Split pasta at City Gross from rice at Matmissionen when freezer space is low',
    products: ['barilla-spaghetti-1kg', 'eldorado-basmati-rice-1kg', 'felix-ketchup-1kg']
  },
  {
    title: 'coffee and fika hold',
    area: 'Vasastan + Norrmalm',
    total: '104.30 SEK',
    savings: '-10.50 SEK',
    route: 'Take the Zoegas member promo and skip chocolate stock-up while snacks trend high',
    products: ['zoegas-coffee-450g', 'marabou-mjolkchoklad-200g', 'skogaholm-rostbrod-500g']
  },
  {
    title: 'plant-based prep bowls',
    area: 'Vasastan + Hornstull',
    total: '116.60 SEK',
    savings: '-17.40 SEK',
    route: 'Start at Coop Norra Stationsgatan for Anamma and finish with Hemköp chickpeas when passing Hornstull',
    products: ['anamma-formbar-fars-850g', 'garant-ekologisk-tofu-270g', 'zeta-kikartor-380g']
  }
];

export const mealPlanner = {
  weekLabel: 'May 21-27 dinner plan',
  targetSpend: '525.00 SEK',
  plannedMeals: 5,
  projectedSavings: '-41.80 SEK',
  constraints: [
    { label: 'Protein rotation', value: 'Fish, chicken, and pantry vegetarian nights' },
    { label: 'Store limit', value: 'Two planned stops plus one pantry split only if nearby' },
    { label: 'Confidence rule', value: 'Skip low-confidence dinner rows until receipt review clears them' }
  ],
  days: [
    {
      day: 'Monday',
      meal: 'Salmon tray bake',
      basket: 'Laxfile, potatoes, tomatoes',
      store: 'ICA Kvantum Liljeholmen',
      total: '154.70 SEK',
      savings: '-10.00 SEK',
      href: '/products/fiskeriet-laxfile-500g'
    },
    {
      day: 'Tuesday',
      meal: 'Pantry pasta night',
      basket: 'Spaghetti, ketchup, soup',
      store: 'City Gross Stockholm + Hemkop',
      total: '90.70 SEK',
      savings: '-8.20 SEK',
      href: '/categories/pantry'
    },
    {
      day: 'Thursday',
      meal: 'Chicken rice bowls',
      basket: 'Kycklingfile, rice, peas',
      store: 'Hemkop Skanstull + Matmissionen',
      total: '152.80 SEK',
      savings: '-15.90 SEK',
      href: '/products/kronfagel-kycklingfile-1kg'
    },
    {
      day: 'Friday',
      meal: 'Breakfast-for-dinner',
      basket: 'Eggs, oats, fil',
      store: 'ICA Sergels Torg + Tempo Hornstull',
      total: '126.80 SEK',
      savings: '-7.70 SEK',
      href: '/weekly-basket'
    }
  ]
};

export const pantryPlanner = {
  title: 'Pantry split planner',
  target: 'Keep shelf-stable top-ups under 220.00 SEK',
  projectedSpend: '207.90 SEK',
  projectedSavings: '-28.30 SEK',
  anchorStore: 'Matmissionen Hägersten',
  reviewRule: 'Use medium-confidence pantry rows only when receipt review is queued',
  staples: [
    {
      product: 'Eldorado Basmati Rice 1kg',
      slug: 'eldorado-basmati-rice-1kg',
      store: 'Matmissionen Hägersten',
      role: 'bulk base',
      quantity: '2 bags',
      planned: '37.80 SEK',
      saving: '-18.00 SEK'
    },
    {
      product: 'Barilla Spaghetti 1kg',
      slug: 'barilla-spaghetti-1kg',
      store: 'City Gross Stockholm',
      role: 'dinner base',
      quantity: '2 packs',
      planned: '55.80 SEK',
      saving: '-3.80 SEK'
    },
    {
      product: 'Felix Tomatketchup 1kg',
      slug: 'felix-ketchup-1kg',
      store: 'Hemköp Stockholm',
      role: 'sauce add-on',
      quantity: '1 bottle',
      planned: '32.00 SEK',
      saving: '-7.90 SEK'
    }
  ],
  decisions: [
    { label: 'Split trip', value: 'Only if Hägersten route is already planned' },
    { label: 'Hold item', value: 'Delay soup until Hemköp receipt confirms shelf price' },
    { label: 'Stock limit', value: 'Two rice bags max to avoid stale inventory' }
  ]
};
