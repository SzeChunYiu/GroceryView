// Demo seed for the homepage / product / store / category routes.
// Mirrors the store fixtures in packages/ingestion/src/index.ts.
// Real prices replace these as packages/ingestion connectors come online.

import { buildExpiryDealRadar, buildPriceChartSeries, buildWatchlistAlerts, calculateMealCostBreakdown, calculatePersonalGroceryInflation, compareBasketStrategies, forecastGrocerySpend, planGroceryAlertChannelDefault, planMultiWeekStockUpList, planNotifications, planPantryReplenishment, rankDealOpportunities, rankNutritionPerKrona, suggestDealBasedMeals, summarizeBudget, summarizeCategoryDealLeaders, summarizePriceHistory, summarizeStoreBasketCoverage, type BasketComparisonInput, type HouseholdSnapshot, type PantryDeal, type PantryInventoryItem, type PriceChartObservation, type WatchlistItem, type WatchlistProductSnapshot } from '@groceryview/core';
import { pricedProducts } from './openprices-products';

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
  },
  {
    slug: 'dafgard-kaldolmar-600g',
    ticker: 'DAFGARD-KALDOLMAR-600G',
    name: 'Dafgårds Kåldolmar 600g',
    store: 'Willys Skanstull',
    price: '44.90 SEK',
    unitPrice: '74.83 SEK/kg',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-21 14:10 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'felix-pyttipanna-720g',
    ticker: 'FELIX-PYTTIPANNA-720G',
    name: 'Felix Pyttipanna 720g',
    store: 'Willys Skanstull',
    price: '34.90 SEK',
    unitPrice: '48.47 SEK/kg',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-21 14:18 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'gb-graddglass-2l',
    ticker: 'GB-GRADDGLASS-2L',
    name: 'GB Gräddglass Vanilj 2L',
    store: 'Lidl Hammarby Sjöstad',
    price: '36.90 SEK',
    unitPrice: '18.45 SEK/l',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-21 14:32 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'pagen-lingongrova-500g',
    ticker: 'PAGEN-LINGONGROVA-500G',
    name: 'Pågen Lingongrova 500g',
    store: 'Coop Medborgarplatsen',
    price: '33.90 SEK',
    unitPrice: '67.80 SEK/kg',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-21 15:05 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'arla-hushallsost-500g',
    ticker: 'ARLA-HUSHALLSOST-500G',
    name: 'Arla Hushållsost 500g',
    store: 'Coop Medborgarplatsen',
    price: '54.90 SEK',
    unitPrice: '109.80 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-21 15:12 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'garant-gurka-300g',
    ticker: 'GARANT-GURKA-300G',
    name: 'Garant Gurka 300g',
    store: 'Coop Medborgarplatsen',
    price: '16.90 SEK',
    unitPrice: '56.33 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-21 15:18 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'loka-naturell-150cl',
    ticker: 'LOKA-NATURELL-150CL',
    name: 'Loka Naturell 1.5L',
    store: 'ICA Nära Mariatorget',
    price: '14.90 SEK',
    unitPrice: '9.93 SEK/l',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-21 16:05 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'festis-paron-10p',
    ticker: 'FESTIS-PARON-10P',
    name: 'Festis Päron 10-pack',
    store: 'ICA Nära Mariatorget',
    price: '39.90 SEK',
    unitPrice: '7.98 SEK/l',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-21 16:12 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'proviva-blabar-1l',
    ticker: 'PROVIVA-BLABAR-1L',
    name: 'Proviva Blåbär 1L',
    store: 'ICA Nära Mariatorget',
    price: '24.90 SEK',
    unitPrice: '24.90 SEK/l',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-21 16:20 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'lindahls-kvarg-500g',
    ticker: 'LINDAHLS-KVARG-500G',
    name: 'Lindahls Kvarg Naturell 500g',
    store: 'Willys Fridhemsplan',
    price: '19.90 SEK',
    unitPrice: '39.80 SEK/kg',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-21 17:05 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'arla-keso-500g',
    ticker: 'ARLA-KESO-500G',
    name: 'Arla Keso Cottage Cheese 500g',
    store: 'Willys Fridhemsplan',
    price: '32.90 SEK',
    unitPrice: '65.80 SEK/kg',
    priceType: 'shelf',
    confidence: 'high',
    observedAt: '2026-05-21 17:12 CET',
    source: 'in-store shelf observation'
  },
  {
    slug: 'ica-applen-royal-gala-1kg',
    ticker: 'ICA-APPLEN-ROYAL-GALA-1KG',
    name: 'ICA Äpplen Royal Gala 1kg',
    store: 'Willys Fridhemsplan',
    price: '29.90 SEK',
    unitPrice: '29.90 SEK/kg',
    priceType: 'weekly deal',
    confidence: 'medium',
    observedAt: '2026-05-21 17:20 CET',
    source: 'retailer flyer observation'
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
    distanceLabel: '1.2 km from saved area',
    mobileRoute: '/stores?selectedStoreId=willys-odenplan'
  },
  {
    slug: 'ica-nara-sergels-torg',
    name: 'ICA Nära Sergels Torg',
    ingestionFixture: 'ICA Nara Sergels Torg',
    district: 'Norrmalm',
    format: 'convenience supermarket',
    bestCategory: 'Snacks',
    distanceLabel: '0.6 km from saved area',
    mobileRoute: '/stores?selectedStoreId=ica-nara-sergels-torg'
  },
  {
    slug: 'coop-swedenborgsgatan',
    name: 'Coop Swedenborgsgatan',
    ingestionFixture: 'Coop Swedenborgsgatan',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Dairy',
    distanceLabel: '2.4 km from saved area',
    mobileRoute: '/stores?selectedStoreId=coop-swedenborgsgatan'
  },
  {
    slug: 'lidl-sveavagen',
    name: 'Lidl Sveavägen',
    ingestionFixture: 'Lidl Sveavagen',
    district: 'Vasastan',
    format: 'discount supermarket',
    bestCategory: 'Dairy',
    distanceLabel: '1.6 km from saved area',
    mobileRoute: '/stores?selectedStoreId=lidl-sveavagen'
  },
  {
    slug: 'hemkop-stockholm',
    name: 'Hemköp Stockholm',
    ingestionFixture: 'Hemkop Stockholm locator result',
    district: 'Norrmalm',
    format: 'mid-size supermarket',
    bestCategory: 'Pantry',
    distanceLabel: '1.1 km from saved area',
    mobileRoute: '/stores?selectedStoreId=hemkop-stockholm'
  },
  {
    slug: 'city-gross-stockholm',
    name: 'City Gross Stockholm',
    ingestionFixture: 'City Gross Stockholm county locator result',
    district: 'Stockholm County',
    format: 'big-box supermarket',
    bestCategory: 'Frozen',
    distanceLabel: '8.7 km from saved area',
    mobileRoute: '/stores?selectedStoreId=city-gross-stockholm'
  },
  {
    slug: 'matmissionen-hagersten',
    name: 'Matmissionen Hägersten',
    district: 'Hägersten',
    format: 'social supermarket',
    bestCategory: 'Pantry',
    distanceLabel: '5.8 km from saved area',
    mobileRoute: '/stores?selectedStoreId=matmissionen-hagersten'
  },
  {
    slug: 'tempo-hornstull',
    name: 'Tempo Hornstull',
    district: 'Södermalm',
    format: 'neighborhood supermarket',
    bestCategory: 'Breakfast',
    distanceLabel: '3.1 km from saved area',
    mobileRoute: '/stores?selectedStoreId=tempo-hornstull'
  },
  {
    slug: 'ica-kvantum-liljeholmen',
    name: 'ICA Kvantum Liljeholmen',
    ingestionFixture: 'ICA Kvantum Liljeholmen',
    district: 'Liljeholmen',
    format: 'large supermarket',
    bestCategory: 'Dinner staples',
    distanceLabel: '4.4 km from saved area',
    mobileRoute: '/stores?selectedStoreId=ica-kvantum-liljeholmen'
  },
  {
    slug: 'hemkop-hornstull',
    name: 'Hemköp Hornstull',
    ingestionFixture: 'Hemkop Hornstull',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Beverages',
    distanceLabel: '3.3 km from saved area',
    mobileRoute: '/stores?selectedStoreId=hemkop-hornstull'
  },
  {
    slug: 'coop-daglivs-fridhemsplan',
    name: 'Coop Daglivs Fridhemsplan',
    ingestionFixture: 'Coop Daglivs Fridhemsplan',
    district: 'Kungsholmen',
    format: 'large supermarket',
    bestCategory: 'Produce',
    distanceLabel: '2.8 km from saved area',
    mobileRoute: '/stores?selectedStoreId=coop-daglivs-fridhemsplan'
  },
  {
    slug: 'hemkop-skanstull',
    name: 'Hemköp Skanstull',
    ingestionFixture: 'Hemkop Skanstull',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Meat',
    distanceLabel: '3.7 km from saved area',
    mobileRoute: '/stores?selectedStoreId=hemkop-skanstull'
  },
  {
    slug: 'ica-maxi-lindhagen',
    name: 'ICA Maxi Lindhagen',
    ingestionFixture: 'ICA Maxi Lindhagen',
    district: 'Kungsholmen',
    format: 'hypermarket',
    bestCategory: 'Personal care',
    distanceLabel: '2.9 km from saved area',
    mobileRoute: '/stores?selectedStoreId=ica-maxi-lindhagen'
  },
  {
    slug: 'coop-norra-stationsgatan',
    name: 'Coop Norra Stationsgatan',
    ingestionFixture: 'Coop Norra Stationsgatan',
    district: 'Vasastan',
    format: 'mid-size supermarket',
    bestCategory: 'Plant-based',
    distanceLabel: '1.9 km from saved area',
    mobileRoute: '/stores?selectedStoreId=coop-norra-stationsgatan'
  },
  {
    slug: 'willys-skanstull',
    name: 'Willys Skanstull',
    ingestionFixture: 'Willys Skanstull',
    district: 'Södermalm',
    format: 'discount supermarket',
    bestCategory: 'Frozen',
    distanceLabel: '3.6 km from saved area',
    mobileRoute: '/stores?selectedStoreId=willys-skanstull'
  },
  {
    slug: 'lidl-hammarby-sjostad',
    name: 'Lidl Hammarby Sjöstad',
    ingestionFixture: 'Lidl Hammarby Sjostad',
    district: 'Hammarby Sjöstad',
    format: 'discount supermarket',
    bestCategory: 'Frozen snacks',
    distanceLabel: '4.2 km from saved area',
    mobileRoute: '/stores?selectedStoreId=lidl-hammarby-sjostad'
  },
  {
    slug: 'coop-medborgarplatsen',
    name: 'Coop Medborgarplatsen',
    ingestionFixture: 'Coop Medborgarplatsen',
    district: 'Södermalm',
    format: 'mid-size supermarket',
    bestCategory: 'Lunchbox value',
    distanceLabel: '3.4 km from saved area',
    mobileRoute: '/stores?selectedStoreId=coop-medborgarplatsen'
  },
  {
    slug: 'ica-nara-mariatorget',
    name: 'ICA Nära Mariatorget',
    ingestionFixture: 'ICA Nara Mariatorget',
    district: 'Södermalm',
    format: 'convenience supermarket',
    bestCategory: 'Beverages',
    distanceLabel: '3.0 km from saved area',
    mobileRoute: '/stores?selectedStoreId=ica-nara-mariatorget'
  },
  {
    slug: 'willys-fridhemsplan',
    name: 'Willys Fridhemsplan',
    ingestionFixture: 'Willys Fridhemsplan',
    district: 'Kungsholmen',
    format: 'discount supermarket',
    bestCategory: 'Protein snacks',
    distanceLabel: '2.6 km from saved area',
    mobileRoute: '/stores?selectedStoreId=willys-fridhemsplan'
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
    index: '99.1',
    movement: '-0.9%',
    topDeal: 'LINDAHLS-KVARG-500G'
  },
  {
    slug: 'bread',
    name: 'Bread',
    index: '96.5',
    movement: '-3.5%',
    topDeal: 'PAGEN-LINGONGROVA-500G'
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
    index: '94.9',
    movement: '-5.1%',
    topDeal: 'FELIX-PYTTIPANNA-720G'
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
    index: '94.6',
    movement: '-5.4%',
    topDeal: 'FESTIS-PARON-10P'
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
      productId: 'felix-pyttipanna-720g',
      productName: 'Felix Pyttipanna 720g',
      storeId: 'willys-skanstull',
      storeName: 'Willys Skanstull',
      currentPrice: 34.9,
      regularPrice: 45.9,
      dealScore: 86,
      sourceConfidence: 0.89
    },
    {
      productId: 'pagen-lingongrova-500g',
      productName: 'Pågen Lingongrova 500g',
      storeId: 'coop-medborgarplatsen',
      storeName: 'Coop Medborgarplatsen',
      currentPrice: 33.9,
      regularPrice: 42.9,
      dealScore: 78,
      sourceConfidence: 0.9
    },
    {
      productId: 'festis-paron-10p',
      productName: 'Festis Päron 10-pack',
      storeId: 'ica-nara-mariatorget',
      storeName: 'ICA Nära Mariatorget',
      currentPrice: 39.9,
      regularPrice: 49.9,
      dealScore: 80,
      sourceConfidence: 0.76
    },
    {
      productId: 'lindahls-kvarg-500g',
      productName: 'Lindahls Kvarg Naturell 500g',
      storeId: 'willys-fridhemsplan',
      storeName: 'Willys Fridhemsplan',
      currentPrice: 19.9,
      regularPrice: 26.9,
      dealScore: 85,
      sourceConfidence: 0.91
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

export const priceReportDigest = [
  {
    title: 'Coffee promo spread',
    scope: 'Vasastan',
    anchor: 'Zoegas Coffee 450g',
    summary: 'Willys member promo remains the strongest coffee signal against the current index.',
    metric: '-15.00 SEK',
    confidence: '92%',
    href: '/products/zoegas-coffee-450g'
  },
  {
    title: 'Dinner protein watch',
    scope: 'Södermalm + Liljeholmen',
    anchor: 'Chicken vs salmon',
    summary: 'Two dinner protein rows are visible, but the salmon receipt line still needs review.',
    metric: '-10.00 SEK',
    confidence: '72%',
    href: '/meal-planner'
  },
  {
    title: 'Pantry split signal',
    scope: 'Hägersten',
    anchor: 'Rice and pasta',
    summary: 'Matmissionen rice keeps the pantry split attractive when combined with county pasta rows.',
    metric: '-14.20 SEK',
    confidence: '69%',
    href: '/categories/pantry'
  }
];

export const priceReportCenter = {
  title: 'Price report center',
  freshnessWindow: 'May 21, 2026 08:00 CET',
  headline: '3 shopper-ready reports need one source-confidence pass before send',
  readyCount: 2,
  reviewCount: 1,
  checklistTitle: 'Report send checklist',
  reports: [
    {
      title: 'Coffee promo spread',
      owner: 'Savings desk',
      status: 'ready',
      audience: 'Vasastan households',
      source: 'Weekly offers plus product terminal',
      metric: '-15.00 SEK',
      confidence: '92%',
      href: '/products/zoegas-coffee-450g'
    },
    {
      title: 'Dinner protein watch',
      owner: 'Meal planning desk',
      status: 'review',
      audience: 'Sodermalm and Liljeholmen',
      source: 'Meal planner plus receipt queue',
      metric: '-10.00 SEK',
      confidence: '72%',
      href: '/meal-planner'
    },
    {
      title: 'Pantry split signal',
      owner: 'Pantry desk',
      status: 'ready',
      audience: 'Hagersten stock-up trips',
      source: 'Category tape plus store comparison',
      metric: '-14.20 SEK',
      confidence: '69%',
      href: '/categories/pantry'
    }
  ],
  checklist: [
    { label: 'Source timestamp', value: 'Show last observed date before every report is sent' },
    { label: 'Confidence label', value: 'Hold reports below 70% until a receipt or source refresh lands' },
    { label: 'Route evidence', value: 'Link each report to the product, meal, or category page behind the claim' }
  ]
};

const dealCategoryByProductId: Record<string, string> = {
  'zoegas-coffee-450g': 'Coffee',
  'eldorado-basmati-rice-1kg': 'Rice',
  'garant-havregryn-1kg': 'Breakfast',
  'bravo-apelsinjuice-1l': 'Beverages',
  'festis-paron-10p': 'Beverages',
  'lindahls-kvarg-500g': 'Dairy',
  'garant-korsbarstomater-250g': 'Produce',
  'libresse-bindor-normal-14p': 'Personal care',
  'anamma-formbar-fars-850g': 'Plant-based',
  'felix-pyttipanna-720g': 'Frozen',
  'pagen-lingongrova-500g': 'Bread',
  'felix-ketchup-1kg': 'Pantry'
};

export const categoryDealLeaders = summarizeCategoryDealLeaders({
  candidates: dealOpportunityRail.map((deal) => ({
    productId: deal.productId,
    productName: deal.productName,
    category: dealCategoryByProductId[deal.productId] ?? 'Pantry',
    storeName: deal.storeName,
    price: deal.currentPrice,
    dealScore: deal.dealScore,
    sourceConfidence: deal.sourceConfidence
  })),
  minimumSourceConfidence: 0.6
});

export const dealScreener = {
  title: 'Deal screener',
  minimumScore: 75,
  minimumSourceConfidence: 0.7,
  categoryFilter: 'all visible ranked deal rows',
  rows: dealOpportunityRail
    .filter((deal) => deal.dealScore >= 75 && deal.sourceConfidence >= 0.7)
    .map((deal) => ({
      ...deal,
      category: dealCategoryByProductId[deal.productId] ?? 'Pantry',
      discountPercent: Math.round(((deal.regularPrice - deal.currentPrice) / deal.regularPrice) * 1000) / 10,
      savings: Math.round((deal.regularPrice - deal.currentPrice) * 100) / 100,
      sourceConfidenceLabel: `${Math.round(deal.sourceConfidence * 100)}%`
    })),
  categoryFacets: Object.entries(
    dealOpportunityRail
      .filter((deal) => deal.dealScore >= 75 && deal.sourceConfidence >= 0.7)
      .reduce<Record<string, number>>((facets, deal) => {
        const category = dealCategoryByProductId[deal.productId] ?? 'Pantry';
        facets[category] = (facets[category] ?? 0) + 1;
        return facets;
      }, {})
  ).map(([category, count]) => ({ category, count })),
  guardrails: [
    'Uses rankDealOpportunities output from visible ranked deal rows; hidden retailer data and sponsored boosts are excluded.',
    'minimumScore and sourceConfidence gates are shown so weak evidence does not look like a shopper-ready bargain.',
    'categoryFilter facets only group observed deal rows; empty categories are not backfilled with estimates.'
  ]
};


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
  },
  {
    anchorSlug: 'dafgard-kaldolmar-600g',
    anchorName: 'Dafgårds Kåldolmar 600g',
    anchorStoreSlug: 'willys-skanstull',
    anchorStoreName: 'Willys Skanstull',
    substituteSlug: 'felix-pyttipanna-720g',
    substituteName: 'Felix Pyttipanna 720g',
    substituteStoreSlug: 'willys-skanstull',
    substituteStoreName: 'Willys Skanstull',
    verdict: 'bundle',
    basketImpact: '-11.00 SEK freezer stock-up',
    sourceConfidence: 0.89,
    reason: 'Two frozen dinner rows are visible at the same Skanstull stop, making the freezer top-up worth bundling before weekend snacks.'
  },
  {
    anchorSlug: 'pagen-lingongrova-500g',
    anchorName: 'Pågen Lingongrova 500g',
    anchorStoreSlug: 'coop-medborgarplatsen',
    anchorStoreName: 'Coop Medborgarplatsen',
    substituteSlug: 'arla-hushallsost-500g',
    substituteName: 'Arla Hushållsost 500g',
    substituteStoreSlug: 'coop-medborgarplatsen',
    substituteStoreName: 'Coop Medborgarplatsen',
    verdict: 'bundle',
    basketImpact: '-10.80 SEK lunchbox basket',
    sourceConfidence: 0.9,
    reason: 'Bread, cheese, and cucumber rows are all high-confidence at one Södermalm stop, so lunchbox prep can be bundled.'
  },
  {
    anchorSlug: 'bravo-apelsinjuice-1l',
    anchorName: 'Bravo Apelsinjuice 1L',
    anchorStoreSlug: 'hemkop-hornstull',
    anchorStoreName: 'Hemköp Hornstull',
    substituteSlug: 'loka-naturell-150cl',
    substituteName: 'Loka Naturell 1.5L',
    substituteStoreSlug: 'ica-nara-mariatorget',
    substituteStoreName: 'ICA Nära Mariatorget',
    verdict: 'compare',
    basketImpact: '-8.50 SEK hydration top-up',
    sourceConfidence: 0.76,
    reason: 'Hydration rows now span juice, water, and kids drinks, so beverage trips should compare Mariatorget against Hornstull before routing.'
  },
  {
    anchorSlug: 'lindahls-kvarg-500g',
    anchorName: 'Lindahls Kvarg Naturell 500g',
    anchorStoreSlug: 'willys-fridhemsplan',
    anchorStoreName: 'Willys Fridhemsplan',
    substituteSlug: 'arla-keso-500g',
    substituteName: 'Arla Keso Cottage Cheese 500g',
    substituteStoreSlug: 'willys-fridhemsplan',
    substituteStoreName: 'Willys Fridhemsplan',
    verdict: 'bundle',
    basketImpact: '-7.00 SEK protein snack',
    sourceConfidence: 0.91,
    reason: 'Kvarg and cottage cheese rows are both high-confidence at one Fridhemsplan stop, making protein snack prep easy to bundle.'
  }
];

export const stockholmAreas = [
  { slug: 'norrmalm',   name: 'Norrmalm',   storeCount: 2, topSavings: 'Snacks' },
  { slug: 'sodermalm',  name: 'Södermalm',  storeCount: 6, topSavings: 'Beverages' },
  { slug: 'vasastan',   name: 'Vasastan',   storeCount: 3, topSavings: 'Plant-based' },
  { slug: 'hagersten',  name: 'Hägersten',  storeCount: 1, topSavings: 'Rice' },
  { slug: 'liljeholmen', name: 'Liljeholmen', storeCount: 1, topSavings: 'Pantry' },
  { slug: 'stockholm-county', name: 'Stockholm County', storeCount: 1, topSavings: 'Pasta' },
  { slug: 'kungsholmen',name: 'Kungsholmen',storeCount: 3, topSavings: 'Protein snacks' },
  { slug: 'hammarby-sjostad', name: 'Hammarby Sjöstad', storeCount: 1, topSavings: 'Frozen snacks' },
  { slug: 'ostermalm',  name: 'Östermalm',  storeCount: 0, topSavings: '—' }
];

export const sourceCoverage = [
  {
    chain: 'ICA',
    fixture: 'Store locator',
    surface: 'public locator',
    status: 'ready',
    visibleRows: 7,
    newestSignal: 'Sergels Torg, Liljeholmen, Lindhagen, and Mariatorget rows cover snacks, egg, dinner, hygiene staples, and hydration top-ups'
  },
  {
    chain: 'Willys',
    fixture: 'Weekly offers',
    surface: 'public flyer',
    status: 'ready',
    visibleRows: 9,
    newestSignal: 'Coffee, peas, fil, butter, kåldolmar, pyttipanna, kvarg, keso, and apples anchor basket planning'
  },
  {
    chain: 'Coop',
    fixture: 'Store profile',
    surface: 'district store',
    status: 'ready',
    visibleRows: 8,
    newestSignal: 'Swedenborgsgatan, Daglivs, Norra Stationsgatan, and Medborgarplatsen rows now cover dairy, bread, produce, toothpaste, plant-based protein, and lunchbox value'
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
    visibleRows: 3,
    newestSignal: 'Milk, chocolate, and Hammarby Sjöstad ice cream rows provide cross-store comparisons'
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
  },
  {
    slug: 'sodermalm-freezer-stockup',
    area: 'Södermalm + Hammarby Sjöstad',
    primaryStoreSlug: 'willys-skanstull',
    primaryStoreName: 'Willys Skanstull',
    comparisonStoreSlug: 'lidl-hammarby-sjostad',
    comparisonStoreName: 'Lidl Hammarby Sjöstad',
    basketFocus: 'Frozen dinner and snacks',
    leadSignal: 'Pyttipanna and kåldolmar are below baseline while Lidl ice cream keeps the snack top-up visible.',
    visibleItems: 3,
    basketImpact: '-16.50 SEK'
  },
  {
    slug: 'sodermalm-lunchbox-value',
    area: 'Södermalm',
    primaryStoreSlug: 'coop-medborgarplatsen',
    primaryStoreName: 'Coop Medborgarplatsen',
    comparisonStoreSlug: 'tempo-hornstull',
    comparisonStoreName: 'Tempo Hornstull',
    basketFocus: 'Lunchbox prep',
    leadSignal: 'Lingongrova, hushållsost, and cucumber rows keep lunchbox prep visible without adding another store stop.',
    visibleItems: 3,
    basketImpact: '-10.80 SEK'
  },
  {
    slug: 'sodermalm-hydration-topup',
    area: 'Södermalm',
    primaryStoreSlug: 'ica-nara-mariatorget',
    primaryStoreName: 'ICA Nära Mariatorget',
    comparisonStoreSlug: 'hemkop-hornstull',
    comparisonStoreName: 'Hemköp Hornstull',
    basketFocus: 'Hydration top-up',
    leadSignal: 'Loka, Festis, and Proviva rows make beverage restocks visible before the Hornstull juice run.',
    visibleItems: 3,
    basketImpact: '-8.50 SEK'
  },
  {
    slug: 'kungsholmen-protein-snack',
    area: 'Kungsholmen',
    primaryStoreSlug: 'willys-fridhemsplan',
    primaryStoreName: 'Willys Fridhemsplan',
    comparisonStoreSlug: 'coop-daglivs-fridhemsplan',
    comparisonStoreName: 'Coop Daglivs Fridhemsplan',
    basketFocus: 'Protein snack prep',
    leadSignal: 'Kvarg, keso, and apples give the nutrition board a protein snack route before evening training.',
    visibleItems: 3,
    basketImpact: '-12.20 SEK'
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
  },
  {
    title: 'Freezer stock-up',
    area: 'Södermalm + Hammarby Sjöstad',
    store: 'Willys Skanstull',
    category: 'Frozen',
    basket: 'Pyttipanna, kåldolmar, ice cream',
    spend: '116.70 SEK',
    saving: '-16.50 SEK',
    decision: 'Use when freezer space is available and weekend snack stock is low.',
    href: '/categories/frozen'
  },
  {
    title: 'Lunchbox value stop',
    area: 'Södermalm',
    store: 'Coop Medborgarplatsen',
    category: 'Bread',
    basket: 'Lingongrova, cheese, cucumber',
    spend: '105.70 SEK',
    saving: '-10.80 SEK',
    decision: 'Use when weekday lunches need one high-confidence stop near the saved route.',
    href: '/categories/bread'
  },
  {
    title: 'Hydration top-up',
    area: 'Södermalm',
    store: 'ICA Nära Mariatorget',
    category: 'Beverages',
    basket: 'Loka, Festis, Proviva',
    spend: '79.70 SEK',
    saving: '-8.50 SEK',
    decision: 'Use when school drinks and sparkling water can be added without a second beverage stop.',
    href: '/categories/beverages'
  },
  {
    title: 'Protein snack prep',
    area: 'Kungsholmen',
    store: 'Willys Fridhemsplan',
    category: 'Dairy',
    basket: 'Kvarg, keso, apples',
    spend: '82.70 SEK',
    saving: '-12.20 SEK',
    decision: 'Use before evening training when protein snacks can be handled in one discount stop.',
    href: '/nutrition-value'
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
  { date: '2026-05-19', coffee:  91.6, dairy: 102.3, bread:  98.7, pantry:  95.2, snacks: 104.1, frozen:  97.4 },
  { date: '2026-05-20', coffee:  91.5, dairy: 102.1, bread:  98.8, pantry:  95.0, snacks: 103.4, frozen:  94.9 },
  { date: '2026-05-21', coffee:  91.4, dairy:  99.1, bread:  96.5, pantry:  94.9, snacks: 103.1, frozen:  94.7, beverages: 94.6 }
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
  { slug: 'zeta-kikartor-380g',             qty: 2, total: '29.80 SEK', vsLastWeek: '-2.4%' },
  { slug: 'felix-pyttipanna-720g',          qty: 1, total: '34.90 SEK', vsLastWeek: '-5.1%' },
  { slug: 'gb-graddglass-2l',               qty: 1, total: '36.90 SEK', vsLastWeek: '-2.8%' },
  { slug: 'pagen-lingongrova-500g',         qty: 1, total: '33.90 SEK', vsLastWeek: '-3.5%' },
  { slug: 'arla-hushallsost-500g',          qty: 1, total: '54.90 SEK', vsLastWeek: '-1.1%' },
  { slug: 'garant-gurka-300g',              qty: 1, total: '16.90 SEK', vsLastWeek: '-2.6%' },
  { slug: 'loka-naturell-150cl',            qty: 2, total: '29.80 SEK', vsLastWeek: '-5.4%' },
  { slug: 'festis-paron-10p',               qty: 1, total: '39.90 SEK', vsLastWeek: '-4.0%' },
  { slug: 'proviva-blabar-1l',              qty: 1, total: '24.90 SEK', vsLastWeek: '-1.8%' },
  { slug: 'lindahls-kvarg-500g',            qty: 2, total: '39.80 SEK', vsLastWeek: '-0.9%' },
  { slug: 'arla-keso-500g',                 qty: 1, total: '32.90 SEK', vsLastWeek: '-1.5%' },
  { slug: 'ica-applen-royal-gala-1kg',      qty: 1, total: '29.90 SEK', vsLastWeek: '-2.2%' }
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
  },
  {
    title: 'Freezer stock-up window',
    trigger: 'Frozen index is 5.1% under baseline with two Skanstull deal rows',
    action: 'Bundle Felix pyttipanna with Dafgårds kåldolmar before adding Lidl ice cream',
    impact: '-16.50 SEK freezer basket',
    href: '/categories/frozen'
  },
  {
    title: 'Lunchbox value bundle',
    trigger: 'Bread index is 3.5% under baseline with a high-confidence Medborgarplatsen row',
    action: 'Bundle Lingongrova, hushållsost, and cucumber when weekday lunches need a single stop',
    impact: '-10.80 SEK lunchbox basket',
    href: '/products/pagen-lingongrova-500g'
  },
  {
    title: 'Hydration top-up check',
    trigger: 'Beverages index is 5.4% under baseline with Mariatorget drink rows',
    action: 'Bundle Loka, Festis, and Proviva when the route already crosses Mariatorget',
    impact: '-8.50 SEK beverage basket',
    href: '/categories/beverages'
  },
  {
    title: 'Protein snack prep',
    trigger: 'Dairy index is back under baseline with a Fridhemsplan kvarg promo',
    action: 'Bundle kvarg, keso, and apples for training snacks when the route passes Kungsholmen',
    impact: '-12.20 SEK snack basket',
    href: '/nutrition-value'
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
  },
  {
    productSlug: 'felix-pyttipanna-720g',
    storeSlug: 'willys-skanstull',
    targetPrice: 38,
    currentPrice: 34.9,
    usualPrice: 45.9,
    trigger: 'target met',
    channel: 'push',
    confidence: 'high',
    allowedPriceTypes: ['member promo', 'weekly deal'],
    nextAction: 'Add the freezer dinner row when the Skanstull route is already planned.'
  },
  {
    productSlug: 'pagen-lingongrova-500g',
    storeSlug: 'coop-medborgarplatsen',
    targetPrice: 35,
    currentPrice: 33.9,
    usualPrice: 42.9,
    trigger: 'target met',
    channel: 'email',
    confidence: 'high',
    allowedPriceTypes: ['member promo', 'shelf'],
    nextAction: 'Use the Medborgarplatsen bread row as the anchor for weekday lunchbox prep.'
  },
  {
    productSlug: 'festis-paron-10p',
    storeSlug: 'ica-nara-mariatorget',
    targetPrice: 42,
    currentPrice: 39.9,
    usualPrice: 49.9,
    trigger: 'target met',
    channel: 'push',
    confidence: 'medium',
    allowedPriceTypes: ['weekly deal', 'member promo'],
    nextAction: 'Add the kids drink pack only when the Mariatorget route is already planned.'
  },
  {
    productSlug: 'lindahls-kvarg-500g',
    storeSlug: 'willys-fridhemsplan',
    targetPrice: 22,
    currentPrice: 19.9,
    usualPrice: 26.9,
    trigger: 'target met',
    channel: 'push',
    confidence: 'high',
    allowedPriceTypes: ['member promo', 'shelf'],
    nextAction: 'Add two kvarg tubs before the nutrition board locks the protein snack route.'
  }
];






export const weeklyBasketOptimizerInput: BasketComparisonInput = {
  favoriteStoreIds: ['willys-odenplan', 'coop-medborgarplatsen', 'hemkop-hornstull'],
  items: [
    {
      productId: 'zoegas-coffee-450g',
      quantity: 1,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 56.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 54.9 }
      ]
    },
    {
      productId: 'pagen-lingongrova-500g',
      quantity: 2,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 36.9 },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 33.9 }
      ]
    },
    {
      productId: 'bravo-apelsinjuice-1l',
      quantity: 2,
      prices: [
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 25.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 22.9 }
      ]
    },
    {
      productId: 'garant-ekologisk-tofu-270g',
      quantity: 3,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 21.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 24.9 }
      ]
    }
  ]
};

export const weeklyBasketOptimizer = {
  comparison: compareBasketStrategies(weeklyBasketOptimizerInput),
  coverage: summarizeStoreBasketCoverage(weeklyBasketOptimizerInput),
  confidence: {
    level: 'medium',
    caveat: 'The optimizer uses visible price rows for favorite stores only; missing store-product prices reduce coverage instead of being estimated.'
  }
};

const budgetStretchKronaComparison = compareBasketStrategies(weeklyBasketOptimizerInput);
const budgetStretchKronaExtraStores = Math.max(0, budgetStretchKronaComparison.splitStoreCount - 1);

const oneTapBasketComparison = compareBasketStrategies(weeklyBasketOptimizerInput);
const oneTapBasketCoverage = summarizeStoreBasketCoverage(weeklyBasketOptimizerInput);

export const oneTapBasketOptimizer = {
  persona: 'Busy professionals',
  title: 'One-tap basket optimizer',
  comparison: oneTapBasketComparison,
  coverage: oneTapBasketCoverage,
  readyAction: {
    label: oneTapBasketComparison.savingsVsBestSingleStore > 0 ? 'Apply cheapest split plan' : 'Keep best single-store basket',
    storeCount: oneTapBasketComparison.splitStoreCount,
    assignmentCount: oneTapBasketComparison.cheapestByProduct.assignments.length,
    total: oneTapBasketComparison.cheapestByProduct.total,
    savingsVsBestSingleStore: oneTapBasketComparison.savingsVsBestSingleStore
  },
  quickestPath: oneTapBasketComparison.cheapestByProduct.assignments.slice(0, 4).map((assignment) => ({
    productId: assignment.productId,
    storeName: assignment.storeName,
    lineTotal: assignment.lineTotal,
    priceType: assignment.priceType
  })),
  checkoutGuardrails: [
    'Requires a signed-in saved basket before GroceryView can prepare account-bound changes.',
    'One tap prepares a reviewed optimization plan only; no retailer checkout is submitted automatically.',
    'Missing prices and unsupported retailer handoffs remain visible blockers instead of hidden estimates.'
  ]
};

const savedBasketAutoReorderComparison = compareBasketStrategies(weeklyBasketOptimizerInput);

export const savedBasketAutoReorderPlan = {
  persona: 'Busy professionals',
  title: 'Saved basket auto-reorder readiness',
  comparison: savedBasketAutoReorderComparison,
  autoReorderEligibleLines: savedBasketAutoReorderComparison.cheapestByProduct.assignments
    .filter((assignment) => assignment.priceType !== 'member')
    .map((assignment) => ({
      productId: assignment.productId,
      storeName: assignment.storeName,
      quantity: assignment.quantity,
      lineTotal: assignment.lineTotal,
      priceType: assignment.priceType
    })),
  manualReviewRequired: weeklyBasketOptimizerInput.items
    .filter((item) => item.prices.length < weeklyBasketOptimizerInput.favoriteStoreIds.length)
    .map((item) => ({
      productId: item.productId,
      reason: 'Missing favorite-store price rows block unattended reorder.',
      missingStoreCount: weeklyBasketOptimizerInput.favoriteStoreIds.length - item.prices.length
    })),
  readyAction: {
    label: 'Prepare reviewed auto-reorder draft',
    nextRunLabel: 'weekly saved-basket review',
    estimatedTotal: savedBasketAutoReorderComparison.cheapestByProduct.total,
    storeCount: savedBasketAutoReorderComparison.splitStoreCount
  },
  guardrails: [
    'Requires a signed-in saved basket and explicit shopper approval before GroceryView can prepare a reorder draft.',
    'No retailer checkout or payment is submitted automatically.',
    'manualReviewRequired lines stay blocked when favorite-store prices or retailer handoff support are missing.'
  ]
};

export const budgetStretchKronaOptimizer = {
  persona: 'Budget-conscious / low-income',
  title: 'Stretch your krona optimizer',
  comparison: budgetStretchKronaComparison,
  kronaSavedPerExtraStore: budgetStretchKronaExtraStores > 0
    ? budgetStretchKronaComparison.savingsVsBestSingleStore / budgetStretchKronaExtraStores
    : 0,
  missingPriceBlockers: weeklyBasketOptimizerInput.items
    .filter((item) => item.prices.length < weeklyBasketOptimizerInput.favoriteStoreIds.length)
    .map((item) => ({
      productId: item.productId,
      missingStoreCount: weeklyBasketOptimizerInput.favoriteStoreIds.length - item.prices.length
    })),
  guardrail: 'Splitting stores is recommended only when the real compareBasketStrategies savings beats the extra-store burden; missing prices remain blockers instead of estimates.'
};

export const loyaltyAdjustedBasketInput: BasketComparisonInput = {
  favoriteStoreIds: ['willys-odenplan', 'coop-medborgarplatsen', 'hemkop-hornstull'],
  enabledMemberStoreIds: ['willys-odenplan', 'coop-medborgarplatsen'],
  items: [
    {
      productId: 'zoegas-coffee-450g',
      quantity: 1,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 54.9, priceType: 'shelf' },
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, priceType: 'member' },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 56.9, priceType: 'shelf' },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 54.9, priceType: 'shelf' }
      ]
    },
    {
      productId: 'pagen-lingongrova-500g',
      quantity: 2,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 36.9, priceType: 'shelf' },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 35.9, priceType: 'shelf' },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 33.9, priceType: 'member' }
      ]
    },
    {
      productId: 'bravo-apelsinjuice-1l',
      quantity: 2,
      prices: [
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 25.9, priceType: 'shelf' },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 24.9, priceType: 'shelf' },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 22.9, priceType: 'member' }
      ]
    },
    {
      productId: 'garant-ekologisk-tofu-270g',
      quantity: 3,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 21.9, priceType: 'shelf' },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 24.9, priceType: 'shelf' }
      ]
    }
  ]
};

const loyaltyAdjustedBasketResult = compareBasketStrategies(loyaltyAdjustedBasketInput);
const loyaltyAdjustedShelfOnlyResult = compareBasketStrategies({
  ...loyaltyAdjustedBasketInput,
  enabledMemberStoreIds: [],
  items: loyaltyAdjustedBasketInput.items.map((item) => ({
    ...item,
    prices: item.prices.filter((price) => price.priceType !== 'member')
  }))
});
const loyaltyAdjustedAllMemberStoreIds = [...new Set(loyaltyAdjustedBasketInput.items
  .flatMap((item) => item.prices)
  .filter((price) => price.priceType === 'member')
  .map((price) => price.storeId))]
  .sort();
const loyaltyAdjustedAllMemberResult = compareBasketStrategies({
  ...loyaltyAdjustedBasketInput,
  enabledMemberStoreIds: loyaltyAdjustedAllMemberStoreIds
});

export const loyaltyAdjustedBasketComparison = {
  persona: 'Loyalty-aware basket shoppers',
  title: 'Loyalty-adjusted basket comparison',
  comparison: loyaltyAdjustedBasketResult,
  shelfOnlyComparison: loyaltyAdjustedShelfOnlyResult,
  allMemberComparison: loyaltyAdjustedAllMemberResult,
  enabledMemberStoreIds: loyaltyAdjustedBasketInput.enabledMemberStoreIds ?? [],
  allMemberStoreIds: loyaltyAdjustedAllMemberStoreIds,
  memberSavingsTotal: loyaltyAdjustedBasketResult.memberSavingsTotal,
  excludedMemberPriceProductIds: loyaltyAdjustedBasketResult.excludedMemberPriceProductIds,
  scenarioRows: [
    {
      label: 'Normal shelf prices',
      total: loyaltyAdjustedShelfOnlyResult.cheapestByProduct.total,
      detail: 'Member rows removed; baseline uses only visible shelf prices.'
    },
    {
      label: 'Selected loyalty programs',
      total: loyaltyAdjustedBasketResult.cheapestByProduct.total,
      detail: `Enabled: ${(loyaltyAdjustedBasketInput.enabledMemberStoreIds ?? []).join(', ')}. Other member prices stay blocked.`
    },
    {
      label: 'All visible member programs',
      total: loyaltyAdjustedAllMemberResult.cheapestByProduct.total,
      detail: `Requires: ${loyaltyAdjustedAllMemberStoreIds.join(', ')}. No account ownership is assumed.`
    }
  ],
  guardrail: 'Public shelf prices stay the baseline; member prices are only counted for enabled loyalty chains, and non-enabled member rows remain blockers instead of hidden savings.'
};

export const familyBulkUnitPriceComparison = {
  persona: 'Families with kids',
  title: 'Family-pack unit prices',
  rows: [
    {
      productId: 'pagen-lingongrova-500g',
      productName: 'Pågen Lingongrova bread',
      standardPack: '500g shelf loaf',
      familyPack: '2 × 500g lunchbox bundle',
      storeName: 'Coop Medborgarplatsen',
      standardUnitPrice: 67.8,
      bulkUnitPrice: 61.9,
      comparableUnit: 'SEK/kg',
      unitSavingsPercent: 9,
      source: 'visible weekly basket bread rows at Coop and Willys'
    },
    {
      productId: 'bravo-apelsinjuice-1l',
      productName: 'Bravo Apelsinjuice',
      standardPack: '1L carton',
      familyPack: '2L breakfast bundle',
      storeName: 'Hemköp Hornstull',
      standardUnitPrice: 25.9,
      bulkUnitPrice: 22.9,
      comparableUnit: 'SEK/l',
      unitSavingsPercent: 12,
      source: 'visible weekly basket juice rows across Coop and Hemköp'
    },
    {
      productId: 'garant-ekologisk-tofu-270g',
      productName: 'Garant Ekologisk Tofu',
      standardPack: '270g pack',
      familyPack: '3 × 270g dinner bundle',
      storeName: 'Willys Odenplan',
      standardUnitPrice: 92.22,
      bulkUnitPrice: 81.11,
      comparableUnit: 'SEK/kg',
      unitSavingsPercent: 12,
      source: 'visible weekly basket tofu rows across Willys and Hemköp'
    }
  ],
  coverage: {
    confidence: 'medium',
    caveat: 'Compares visible package rows and family-sized bundles only; missing club-card multi-buy prices are not estimated.'
  }
};

export const mealPrepBulkBuyOptimizer = {
  persona: 'Meal-preppers / large households',
  title: 'Meal-prepper bulk-buy optimizer',
  rows: familyBulkUnitPriceComparison.rows.map((row, index) => ({
    ...row,
    freezerPortions: [6, 4, 8][index] ?? 4,
    paybackMeals: [3, 2, 4][index] ?? 3,
    stockUpDecision: row.unitSavingsPercent >= 10
      ? 'Stock up if the freezer or pantry space is available'
      : 'Buy only the standard pack unless this is already in the meal plan',
    coverageEvidence: `${row.source}; bulkUnitPrice is compared against standardUnitPrice on ${row.comparableUnit}.`
  })),
  coverageGuardrails: [
    'No forecast: stock-up advice uses the visible bulkUnitPrice versus standardUnitPrice spread only.',
    'Freezer and pantry capacity are shopper-entered constraints; GroceryView does not infer household storage from public rows.',
    'Meal-prepper rows stay hidden when comparable units or visible package rows are missing.',
    'Bulk savings are shown per comparable unit, not as a future-price or spoilage prediction.'
  ],
  coverage: {
    confidence: 'medium',
    caveat: 'Optimizes around visible package math already used on the weekly basket; it does not estimate future prices, unseen club-card bundles, or household spoilage.'
  }
};

const openPricesStockUpProducts = [
  { slug: 'orientaliskt-r-gbr-d-7340083492464', weeklyNeedUnits: 2, storageLimitWeeks: 3 },
  { slug: 'havredryck-choklad-7340083494406', weeklyNeedUnits: 3, storageLimitWeeks: 2 },
  { slug: 'hummus-original-7331217012993', weeklyNeedUnits: 2, storageLimitWeeks: 3 }
].map((candidate) => {
  const product = pricedProducts.find((row) => row.slug === candidate.slug);
  if (!product) throw new Error(`Missing OpenPrices stock-up product ${candidate.slug}`);
  const datedObservations = product.observations
    .filter((observation) => observation.date && Number.isFinite(observation.price))
    .sort((left, right) => left.date.localeCompare(right.date));
  const latestObservation = datedObservations.at(-1);
  if (!latestObservation) throw new Error(`Missing OpenPrices observations for ${candidate.slug}`);
  return {
    product,
    latestObservation,
    weeklyNeedUnits: candidate.weeklyNeedUnits,
    storageLimitWeeks: candidate.storageLimitWeeks,
    history: datedObservations.map((observation) => ({
      observedAt: `${observation.date}T00:00:00.000Z`,
      unitPrice: observation.price,
      sourceType: 'online' as const,
      confidence: product.observationCount >= 8 ? 0.78 : 0.66
    }))
  };
});

const plannedMultiWeekStockUpList = planMultiWeekStockUpList({
  asOf: '2026-05-22T10:00:00.000Z',
  planningWeeks: 3,
  weeklyBudget: 1150,
  items: openPricesStockUpProducts.map((row) => ({
    productId: row.product.slug,
    productName: row.product.name,
    storeName: 'OpenPrices SEK observations',
    weeklyNeedUnits: row.weeklyNeedUnits,
    packageUnits: 1,
    comparableUnit: 'pack',
    currentUnitPrice: row.latestObservation.price,
    history: row.history,
    storageLimitWeeks: row.storageLimitWeeks,
    seasonalityNote: `OpenPrices dated SEK observations for barcode ${row.product.code}; no seasonality or future shelf-price projection.`
  }))
});

export const multiWeekStockUpList = {
  persona: 'Meal-preppers / large households',
  title: 'Multi-week stock-up list',
  ...plannedMultiWeekStockUpList,
  rows: plannedMultiWeekStockUpList.rows.map((row) => ({
    ...row,
    observedHistoryWindow: row.observedHistoryWindow,
    reviewTrigger: row.reviewTrigger
  })),
  noForecastReason: 'No price forecast: the list combines current OpenPrices observed pack prices with factual observed low/typical context and spreads today’s budget impact across the planning horizon.',
  coverageGuardrails: [
    'No price forecast is displayed; every row is a present-tense stock-up plan from generated OpenPrices dated observations.',
    'PlanningWeeks is a household usage horizon, not a price outlook.',
    'Historical low and typical prices are computed from observed pack-price rows and labelled with coverage.',
    'Rows stay advisory until account-owned pantry, freezer, and expiry data confirm the storage limits.'
  ]
};

export const studentBasicsInput: BasketComparisonInput = {
  favoriteStoreIds: ['willys-odenplan', 'coop-medborgarplatsen', 'hemkop-hornstull'],
  items: [
    {
      productId: 'garant-havregryn-1kg',
      quantity: 1,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 23.9 },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 25.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 24.9 }
      ]
    },
    {
      productId: 'eldorado-basmati-rice-1kg',
      quantity: 1,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 24.9 },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 27.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 26.9 }
      ]
    },
    {
      productId: 'barilla-spaghetti-1kg',
      quantity: 1,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 29.9 },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 31.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 27.9 }
      ]
    },
    {
      productId: 'pagen-lingongrova-500g',
      quantity: 1,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 36.9 },
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 33.9 }
      ]
    },
    {
      productId: 'bravo-apelsinjuice-1l',
      quantity: 1,
      prices: [
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 25.9 },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 22.9 }
      ]
    }
  ]
};

const studentBasicsNames: Record<string, string> = {
  'garant-havregryn-1kg': 'Garant Havregryn 1kg',
  'eldorado-basmati-rice-1kg': 'Eldorado Basmati Rice 1kg',
  'barilla-spaghetti-1kg': 'Barilla Spaghetti 1kg',
  'pagen-lingongrova-500g': 'Pågen Lingongrova 500g',
  'bravo-apelsinjuice-1l': 'Bravo Apelsinjuice 1L'
};

const studentBasicsComparison = compareBasketStrategies(studentBasicsInput);
const studentBasicsCoverage = summarizeStoreBasketCoverage(studentBasicsInput);

export const studentBasicsBoard = {
  title: 'Student staples cheapest-basics board',
  persona: 'Students / young singles',
  comparison: studentBasicsComparison,
  coverage: studentBasicsCoverage,
  items: studentBasicsComparison.cheapestByProduct.assignments.map((assignment) => ({
    ...assignment,
    name: studentBasicsNames[assignment.productId] ?? assignment.productId
  })),
  confidence: {
    level: 'medium',
    caveat: 'Uses visible staple prices across favorite Stockholm stores; missing product-store rows reduce coverage and are not estimated.'
  }
};

export const watchlistAlertInputs: { favoriteStoreIds: string[]; watchlist: WatchlistItem[]; products: (WatchlistProductSnapshot & { source: string })[] } = {
  favoriteStoreIds: ['willys-odenplan', 'coop-medborgarplatsen', 'hemkop-hornstull'],
  watchlist: [
    { productId: 'zoegas-coffee-450g', targetPrice: 52, alertDealScoreAt: 80, favoriteStoresOnly: true, allowedPriceTypes: ['member'] },
    { productId: 'pagen-lingongrova-500g', targetPrice: 35, alertDealScoreAt: 75, favoriteStoresOnly: true, allowedPriceTypes: ['member'] },
    { productId: 'bravo-apelsinjuice-1l', targetPrice: 24, alertDealScoreAt: 70, favoriteStoresOnly: true, allowedPriceTypes: ['member'] },
    { productId: 'bregott-normalsaltat-600g', targetPrice: 50, alertDealScoreAt: 78, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] }
  ],
  products: [
    {
      productId: 'zoegas-coffee-450g',
      productName: 'Zoegas Coffee 450g',
      bestPrice: 49.9,
      bestStoreId: 'willys-odenplan',
      bestPriceType: 'member' as const,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, priceType: 'member' as const },
        { storeId: 'coop-swedenborgsgatan', storeName: 'Coop Swedenborgsgatan', price: 56.9, priceType: 'shelf' as const }
      ],
      dealScore: 86,
      isNew52WeekLow: true,
      source: 'visible member-promo row plus product price-history signal'
    },
    {
      productId: 'pagen-lingongrova-500g',
      productName: 'Pågen Lingongrova 500g',
      bestPrice: 33.9,
      bestStoreId: 'coop-medborgarplatsen',
      bestPriceType: 'member' as const,
      prices: [
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 33.9, priceType: 'member' as const },
        { storeId: 'ica-nara-mariatorget', storeName: 'ICA Nära Mariatorget', price: 39.9, priceType: 'shelf' as const }
      ],
      dealScore: 79,
      isNew52WeekLow: false,
      source: 'visible member-promo row plus current deal-score signal'
    },
    {
      productId: 'bravo-apelsinjuice-1l',
      productName: 'Bravo Apelsinjuice 1L',
      bestPrice: 22.9,
      bestStoreId: 'hemkop-hornstull',
      bestPriceType: 'member' as const,
      prices: [
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 22.9, priceType: 'member' as const }
      ],
      dealScore: 74,
      isNew52WeekLow: false,
      source: 'visible member-promo row plus current deal-score signal'
    },
    {
      productId: 'bregott-normalsaltat-600g',
      productName: 'Bregott Normalsaltat 600g',
      bestPrice: 56.9,
      bestStoreId: 'willys-odenplan',
      bestPriceType: 'member' as const,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 56.9, priceType: 'member' as const }
      ],
      dealScore: 61,
      isNew52WeekLow: false,
      source: 'visible member-promo row; shelf-only watch blocks alert because no shelf quote is present'
    }
  ]
};

const builtWatchlistAlerts = buildWatchlistAlerts(watchlistAlertInputs);

export const watchlistAlertBoard = {
  alerts: builtWatchlistAlerts,
  plannedNotifications: planNotifications({
    now: '2026-05-22T10:00:00.000Z',
    preferences: {
      channels: ['email', 'push'],
      enabledTypes: ['target_price', 'stock_up_opportunity'],
      quietHours: { startHour: 21, endHour: 7, timezone: 'Europe/Stockholm' }
    },
    events: builtWatchlistAlerts.map((alert) => ({
      type: alert.type === 'target_price' ? 'target_price' as const : 'stock_up_opportunity' as const,
      title: alert.productName,
      body: alert.message,
      priority: alert.severity === 'urgent' ? 'high' as const : 'normal' as const
    }))
  }),
  coverage: {
    watchedProducts: watchlistAlertInputs.watchlist.length,
    eligiblePriceRows: watchlistAlertInputs.products.reduce((sum, product) => sum + (product.prices?.length ?? 0), 0),
    confidence: 'medium',
    caveat: 'Alerts use visible price rows and allowed price-type filters; rows without the requested price type are excluded instead of estimated.'
  }
};

const watchlistSparklineObservations: Record<string, PriceChartObservation[]> = {
  'zoegas-coffee-450g': [
    { observedAt: '2026-03-05T09:00:00.000Z', price: 62.9, storeId: 'willys-odenplan', storeName: 'Willys Odenplan', sourceType: 'shelf', confidence: 0.9, provenanceLabel: 'visible shelf row' },
    { observedAt: '2026-03-28T09:00:00.000Z', price: 59.9, storeId: 'willys-odenplan', storeName: 'Willys Odenplan', sourceType: 'shelf', confidence: 0.9, provenanceLabel: 'visible shelf row' },
    { observedAt: '2026-04-20T09:00:00.000Z', price: 54.9, storeId: 'willys-odenplan', storeName: 'Willys Odenplan', sourceType: 'member', confidence: 0.86, provenanceLabel: 'visible member-promo row', markerType: 'member', markerLabel: 'Member' },
    { observedAt: '2026-05-20T09:00:00.000Z', price: 49.9, storeId: 'willys-odenplan', storeName: 'Willys Odenplan', sourceType: 'member', confidence: 0.86, provenanceLabel: 'visible member-promo row', markerType: 'new_low', markerLabel: 'New low' }
  ],
  'pagen-lingongrova-500g': [
    { observedAt: '2026-03-05T09:00:00.000Z', price: 41.9, storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', sourceType: 'shelf', confidence: 0.82, provenanceLabel: 'visible shelf row' },
    { observedAt: '2026-03-28T09:00:00.000Z', price: 39.9, storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', sourceType: 'shelf', confidence: 0.82, provenanceLabel: 'visible shelf row' },
    { observedAt: '2026-04-20T09:00:00.000Z', price: 36.9, storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', sourceType: 'member', confidence: 0.78, provenanceLabel: 'visible member-promo row', markerType: 'member', markerLabel: 'Member' },
    { observedAt: '2026-05-20T09:00:00.000Z', price: 33.9, storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', sourceType: 'member', confidence: 0.78, provenanceLabel: 'visible member-promo row' }
  ],
  'bravo-apelsinjuice-1l': [
    { observedAt: '2026-03-05T09:00:00.000Z', price: 27.9, storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', sourceType: 'shelf', confidence: 0.82, provenanceLabel: 'visible shelf row' },
    { observedAt: '2026-03-28T09:00:00.000Z', price: 26.9, storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', sourceType: 'shelf', confidence: 0.82, provenanceLabel: 'visible shelf row' },
    { observedAt: '2026-04-20T09:00:00.000Z', price: 24.9, storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', sourceType: 'member', confidence: 0.74, provenanceLabel: 'visible member-promo row', markerType: 'member', markerLabel: 'Member' },
    { observedAt: '2026-05-20T09:00:00.000Z', price: 22.9, storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', sourceType: 'member', confidence: 0.74, provenanceLabel: 'visible member-promo row' }
  ]
};

export const watchlistSparklineBoard = watchlistAlertInputs.products
  .filter((product) => watchlistSparklineObservations[product.productId])
  .map((product) => {
    const priceChartSeries = buildPriceChartSeries({
      observations: watchlistSparklineObservations[product.productId] ?? [],
      asOf: '2026-05-22T10:00:00.000Z',
      rangeDays: 90,
      markerLimitPerSeries: 4
    });
    const sparklinePoints = priceChartSeries.series
      .flatMap((series) => series.points)
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
    const firstPoint = sparklinePoints[0];
    const lastPoint = sparklinePoints.at(-1);
    const movementPercent = firstPoint && lastPoint && firstPoint.value > 0
      ? Math.round(((lastPoint.value - firstPoint.value) / firstPoint.value) * 1000) / 10
      : 0;

    return {
      productId: product.productId,
      productName: product.productName,
      priceChartSeries,
      sparklinePoints,
      latestPrice: lastPoint?.value ?? product.bestPrice,
      movementPercent,
      coverageLabel: `${sparklinePoints.length} real observed points · ${priceChartSeries.windowStart?.slice(0, 10)} to ${priceChartSeries.windowEnd?.slice(0, 10)}`,
      provenanceLabel: sparklinePoints.at(-1)?.provenanceLabel ?? product.source,
      confidence: sparklinePoints.length >= 4 ? 'medium' : 'limited'
    };
  });

const weeklyDigestBestDeals = dealOpportunityRail.slice(0, 3);
const weeklyWatchlistDigestChannelDefault = planGroceryAlertChannelDefault('weekly_watchlist_digest');
const weeklyDigestEmailEvents = [
  {
    type: 'weekly_report' as const,
    title: 'Weekly watchlist digest',
    body: `${builtWatchlistAlerts.length} watchlist alerts and ${weeklyDigestBestDeals.length} best deals are ready for this week.`,
    priority: builtWatchlistAlerts.some((alert) => alert.severity === 'urgent') ? 'high' as const : 'normal' as const
  },
  ...weeklyDigestBestDeals.map((deal) => ({
    type: 'weekly_report' as const,
    title: `Best deal: ${deal.productName}`,
    body: `${deal.storeName} has ${deal.productName} for ${deal.currentPrice} SEK with Deal Score ${deal.dealScore}.`,
    priority: 'normal' as const
  }))
];

export const weeklyPersonalizedEmailDigest = {
  title: 'Weekly personalised email digest',
  subject: `Your GroceryView week: ${builtWatchlistAlerts.length} watchlist alerts + ${weeklyDigestBestDeals.length} best deals`,
  cadence: 'weekly',
  channelDefault: weeklyWatchlistDigestChannelDefault,
  plannedEmails: planNotifications({
    now: '2026-05-22T10:00:00.000Z',
    preferences: {
      channels: ['email'],
      enabledTypes: ['weekly_report'],
      quietHours: { startHour: 21, endHour: 7, timezone: 'Europe/Stockholm' }
    },
    events: weeklyDigestEmailEvents
  }),
  watchlistAlerts: builtWatchlistAlerts.slice(0, 3).map((alert) => ({
    productId: alert.productId,
    productName: alert.productName,
    message: alert.message,
    severity: alert.severity,
    source: watchlistAlertInputs.products.find((product) => product.productId === alert.productId)?.source ?? 'visible watchlist price row'
  })),
  bestDeals: weeklyDigestBestDeals.map((deal) => ({
    productId: deal.productId,
    productName: deal.productName,
    storeName: deal.storeName,
    currentPrice: deal.currentPrice,
    regularPrice: deal.regularPrice,
    dealScore: deal.dealScore,
    sourceConfidence: deal.sourceConfidence
  })),
  coverage: {
    confidence: 'medium',
    caveat: 'Weekly digest combines buildWatchlistAlerts and rankDealOpportunities outputs from visible rows; email delivery requires explicit opt-in, preference links, and one-click unsubscribe.'
  }
};

const dealHunterPriceDropEvents = builtWatchlistAlerts.slice(0, 3).map((alert) => ({
  productId: alert.productId,
  productName: alert.productName,
  type: alert.type,
  severity: alert.severity,
  message: alert.message,
  triggerMetric: alert.trigger.metric,
  triggerValue: alert.trigger.value,
  source: watchlistAlertInputs.products.find((product) => product.productId === alert.productId)?.source ?? 'visible watchlist price row'
}));

const dealHunterNewProductSignals = dealOpportunityRail.slice(0, 3).map((deal) => ({
  productId: deal.productId,
  productName: deal.productName,
  storeName: deal.storeName,
  currentPrice: deal.currentPrice,
  dealScore: deal.dealScore,
  sourceConfidence: deal.sourceConfidence,
  discoverySignal: 'new to the deal-hunter rail from visible ranked deal rows'
}));

export const dealHunterNewProductPriceDropAlerts = {
  persona: 'Deal-hunters / foodies',
  title: 'New-product & price-drop alerts',
  priceDropAlerts: dealHunterPriceDropEvents,
  newProductSignals: dealHunterNewProductSignals,
  plannedNotifications: planNotifications({
    now: '2026-05-22T10:00:00.000Z',
    preferences: {
      channels: ['push', 'email'],
      enabledTypes: ['target_price', 'stock_up_opportunity', 'weekly_report'],
      quietHours: { startHour: 22, endHour: 8, timezone: 'Europe/Stockholm' }
    },
    events: [
      ...dealHunterPriceDropEvents.map((event) => ({
        type: event.type === 'target_price' ? 'target_price' as const : 'stock_up_opportunity' as const,
        title: event.productName,
        body: event.message,
        priority: event.severity === 'urgent' ? 'high' as const : 'normal' as const
      })),
      ...dealHunterNewProductSignals.map((event) => ({
        type: 'weekly_report' as const,
        title: `New deal signal: ${event.productName}`,
        body: `${event.storeName} surfaced ${event.productName} at ${event.currentPrice} SEK with Deal Score ${event.dealScore}.`,
        priority: 'normal' as const
      }))
    ]
  }),
  coverage: {
    confidence: 'medium',
    caveat: 'New-product means newly surfaced in visible ranked deal/watchlist rows, not a retailer launch claim; price drops come from buildWatchlistAlerts trigger evidence only.'
  }
};

export const budgetEssentialsWatchlistInputs: { favoriteStoreIds: string[]; watchlist: WatchlistItem[]; products: (WatchlistProductSnapshot & { source: string; essentialCategory: string; weeklyNeed: string })[] } = {
  favoriteStoreIds: ['willys-odenplan', 'tempo-hornstull', 'matmissionen-hagersten', 'hemkop-hornstull'],
  watchlist: [
    { productId: 'arla-milk-1l', targetPrice: 14, alertDealScoreAt: 70, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] },
    { productId: 'eldorado-basmati-rice-1kg', targetPrice: 20, alertDealScoreAt: 72, favoriteStoresOnly: false, allowedPriceTypes: ['shelf', 'promotion'] },
    { productId: 'garant-svensk-potatis-2kg', targetPrice: 25, alertDealScoreAt: 70, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] }
  ],
  products: [
    {
      productId: 'arla-milk-1l',
      productName: 'Arla Mellanmjölk 1L',
      bestPrice: 13.9,
      bestStoreId: 'lidl-sveavagen',
      bestPriceType: 'shelf' as const,
      prices: [
        { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9, priceType: 'shelf' as const },
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 15.9, priceType: 'shelf' as const }
      ],
      dealScore: 73,
      isNew52WeekLow: false,
      source: 'visible shelf rows for milk staples',
      essentialCategory: 'milk',
      weeklyNeed: 'breakfast and packed lunch'
    },
    {
      productId: 'eldorado-basmati-rice-1kg',
      productName: 'Eldorado Basmati Rice 1kg',
      bestPrice: 18.9,
      bestStoreId: 'matmissionen-hagersten',
      bestPriceType: 'shelf' as const,
      prices: [
        { storeId: 'matmissionen-hagersten', storeName: 'Matmissionen Hägersten', price: 18.9, priceType: 'shelf' as const },
        { storeId: 'tempo-hornstull', storeName: 'Tempo Hornstull', price: 24.9, priceType: 'shelf' as const }
      ],
      dealScore: 78,
      isNew52WeekLow: true,
      source: 'visible community shelf row and staple basket comparison row',
      essentialCategory: 'rice',
      weeklyNeed: 'bulk dinner base'
    },
    {
      productId: 'garant-svensk-potatis-2kg',
      productName: 'Garant Svensk Potatis 2kg',
      bestPrice: 24.9,
      bestStoreId: 'tempo-hornstull',
      bestPriceType: 'shelf' as const,
      prices: [
        { storeId: 'tempo-hornstull', storeName: 'Tempo Hornstull', price: 24.9, priceType: 'shelf' as const },
        { storeId: 'coop-daglivs-fridhemsplan', storeName: 'Coop Daglivs Fridhemsplan', price: 29.9, priceType: 'shelf' as const }
      ],
      dealScore: 72,
      isNew52WeekLow: false,
      source: 'visible shelf rows for potatoes',
      essentialCategory: 'staple vegetables',
      weeklyNeed: 'low-cost dinner side'
    }
  ]
};

const budgetEssentialsAlerts = buildWatchlistAlerts(budgetEssentialsWatchlistInputs);

export const budgetEssentialsPriceDropAlerts = {
  persona: 'Budget-conscious / low-income',
  title: 'Essentials price-drop alerts',
  alerts: budgetEssentialsAlerts,
  rows: budgetEssentialsWatchlistInputs.products.map((product) => ({
    productId: product.productId,
    productName: product.productName,
    essentialCategory: product.essentialCategory,
    weeklyNeed: product.weeklyNeed,
    bestPrice: product.bestPrice,
    dealScore: product.dealScore,
    source: product.source,
    alertCount: budgetEssentialsAlerts.filter((alert) => alert.productId === product.productId).length
  })),
  coverage: {
    caveat: 'Essential alerts use visible shelf, online, or promotion rows only; missing store prices are not estimated for low-income shopping decisions.'
  }
};

export const babyDiaperWatchlistInputs: { favoriteStoreIds: string[]; watchlist: WatchlistItem[]; products: (WatchlistProductSnapshot & { source: string; diaperUnitPrice: number })[] } = {
  favoriteStoreIds: ['willys-odenplan', 'hemkop-hornstull', 'coop-medborgarplatsen'],
  watchlist: [
    { productId: 'libero-touch-size-4-88p', targetPrice: 179, alertDealScoreAt: 75, favoriteStoresOnly: true, allowedPriceTypes: ['member', 'promotion'] },
    { productId: 'pampers-baby-dry-size-5-96p', targetPrice: 189, alertDealScoreAt: 76, favoriteStoresOnly: true, allowedPriceTypes: ['member', 'promotion'] }
  ],
  products: [
    {
      productId: 'libero-touch-size-4-88p',
      productName: 'Libero Touch Size 4 88-pack',
      bestPrice: 169,
      bestStoreId: 'willys-odenplan',
      bestPriceType: 'member' as const,
      prices: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 169, priceType: 'member' as const },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 189, priceType: 'shelf' as const }
      ],
      dealScore: 81,
      isNew52WeekLow: false,
      diaperUnitPrice: 1.92,
      source: 'visible baby aisle member-promo row with pack count'
    },
    {
      productId: 'pampers-baby-dry-size-5-96p',
      productName: 'Pampers Baby-Dry Size 5 96-pack',
      bestPrice: 185,
      bestStoreId: 'coop-medborgarplatsen',
      bestPriceType: 'promotion' as const,
      prices: [
        { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 185, priceType: 'promotion' as const },
        { storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 209, priceType: 'shelf' as const }
      ],
      dealScore: 78,
      isNew52WeekLow: true,
      diaperUnitPrice: 1.93,
      source: 'visible weekly-deal baby aisle row with pack count'
    }
  ]
};

const babyDiaperAlerts = buildWatchlistAlerts(babyDiaperWatchlistInputs);

export const babyDiaperPriceTracker = {
  persona: 'Families with kids',
  title: 'Baby & diaper price tracking',
  alerts: babyDiaperAlerts,
  rows: babyDiaperWatchlistInputs.products.map((product) => ({
    ...product,
    diaperUnitPrice: product.diaperUnitPrice,
    alertCount: babyDiaperAlerts.filter((alert) => alert.productId === product.productId).length
  })),
  coverage: {
    confidence: 'medium',
    caveat: 'Diaper tracking uses visible pack counts and watchlist alert rules; missing private loyalty wallet offers are not estimated.'
  }
};

export const dealBasedMealInputs = [
  { productId: 'kronfagel-kycklingfile-1kg', name: 'Kronfågel Kycklingfilé 1kg', category: 'protein' as const, price: 109, dealScore: 78, source: 'visible Hemköp Skanstull weekly-deal row' },
  { productId: 'barilla-spaghetti-1kg', name: 'Barilla Spaghetti 1kg', category: 'pantry' as const, price: 27.9, dealScore: 71, source: 'visible City Gross online row' },
  { productId: 'garant-korsbarstomater-250g', name: 'Garant Körsbärstomater 250g', category: 'vegetables' as const, price: 19.9, dealScore: 74, source: 'visible Coop Daglivs shelf row' },
  { productId: 'garant-ekologisk-tofu-270g', name: 'Garant Ekologisk Tofu 270g', category: 'protein' as const, price: 21.9, dealScore: 82, source: 'visible Willys shelf row' },
  { productId: 'zeta-kikartor-380g', name: 'Zeta Kikärtor 380g', category: 'pantry' as const, price: 14.9, dealScore: 76, source: 'visible Hemköp shelf row' },
  { productId: 'garant-gurka-300g', name: 'Garant Gurka 300g', category: 'vegetables' as const, price: 16.9, dealScore: 69, source: 'visible Coop Medborgarplatsen shelf row' }
];

export const dealBasedMeals = {
  servings: 4,
  maxMealCost: 120,
  suggestions: suggestDealBasedMeals({
    deals: dealBasedMealInputs.map(({ source: _source, ...deal }) => deal),
    maxMealCost: 120,
    servings: 4
  }).map((suggestion) => ({
    ...suggestion,
    ingredients: suggestion.ingredientProductIds.map((productId) => dealBasedMealInputs.find((deal) => deal.productId === productId)).filter(Boolean)
  })),
  coverage: {
    confidence: 'medium',
    dealCount: dealBasedMealInputs.length,
    caveat: 'Meal suggestions use visible price rows with deal scores; diet, allergen, and household preference data are not inferred.'
  }
};

const studentRecipeSteps: Record<string, string[]> = {
  'Deal bowl': ['Cook the pantry base first so the cheapest shelf item stretches the protein.', 'Pan-fry the deal protein and fold in the vegetable row.', 'Pack one portion now and cool the second portion for tomorrow.'],
  'Budget pasta': ['Boil half the pasta pack and reserve cooking water.', 'Warm the vegetable deal with the cheapest protein row.', 'Toss together and split into dinner plus lunchbox portions.'],
  'Protein lunchbox': ['Drain or slice the protein row.', 'Add the pantry deal for bulk without raising spend.', 'Finish with the vegetable deal and keep chilled until lunch.']
};

export const studentDealRecipes = {
  persona: 'Students / young singles',
  title: 'Student deal recipes',
  servings: 2,
  maxMealCost: 65,
  recipes: suggestDealBasedMeals({
    deals: dealBasedMealInputs.map(({ source: _source, ...deal }) => deal),
    maxMealCost: 65,
    servings: 2
  }).map((suggestion) => ({
    ...suggestion,
    ingredients: suggestion.ingredientProductIds.map((productId) => dealBasedMealInputs.find((deal) => deal.productId === productId)).filter(Boolean),
    cookSteps: studentRecipeSteps[suggestion.title] ?? ['Combine the selected deal ingredients.', 'Cook once and portion into two student meals.', 'Label leftovers with the visible deal source date.']
  })),
  coverage: {
    confidence: 'medium',
    caveat: 'Recipes are generated from suggestDealBasedMeals using visible deal prices only; prep time, allergens, and pantry spices are not inferred.'
  }
};

export const familyMealPlannerFromDeals = {
  persona: 'Families with kids',
  title: 'Family weekly meal planner',
  servings: 4,
  maxMealCost: 135,
  meals: suggestDealBasedMeals({
    deals: dealBasedMealInputs.map(({ source: _source, ...deal }) => deal),
    maxMealCost: 135,
    servings: 4
  }).map((suggestion, index) => ({
    ...suggestion,
    weeknightSlot: ['Monday dinner', 'Wednesday dinner', 'Friday freezer night'][index] ?? 'Weekend fallback',
    lunchboxLeftovers: suggestion.estimatedCostPerServing <= 35,
    ingredients: suggestion.ingredientProductIds.map((productId) => dealBasedMealInputs.find((deal) => deal.productId === productId)).filter(Boolean)
  })),
  coverage: {
    confidence: 'medium',
    caveat: 'Family meals use visible deal rows from the same core meal engine; snacks, allergens, and child preferences need account data before launch.'
  }
};

const freezerBatchCookSteps: Record<string, string[]> = {
  'Deal bowl': [
    'Cook the full pantry deal as a base, then cool half before adding fresh toppings.',
    'Portion the protein and vegetable deal into dinner servings first.',
    'Freeze labelled leftovers only after the visible deal price clears the batch budget.'
  ],
  'Budget pasta': [
    'Cook the pantry row once, split sauce into fresh dinner and freezer trays.',
    'Use the highest deal-score protein row across both trays.',
    'Keep one portion chilled and freeze the rest within two hours.'
  ],
  'Protein lunchbox': [
    'Batch the protein and pantry deal together for lunchbox bases.',
    'Hold watery vegetables out of freezer portions when texture would suffer.',
    'Mark freezer portions with product ids and deal source labels.'
  ]
};

export const freezerBatchCookPlanner = {
  persona: 'Meal-preppers / large households',
  title: 'Freezer batch-cook planner',
  servings: 8,
  maxBatchCost: 240,
  meals: suggestDealBasedMeals({
    deals: dealBasedMealInputs.map(({ source: _source, ...deal }) => deal),
    maxMealCost: 240,
    servings: 8
  }).map((suggestion) => ({
    ...suggestion,
    freezerPortions: Math.max(0, 8 - 4),
    batchCookSteps: freezerBatchCookSteps[suggestion.title] ?? [
      'Cook the selected deal ingredients once.',
      'Serve four portions fresh and chill the rest quickly.',
      'Freeze labelled portions with the visible deal source.'
    ],
    ingredients: suggestion.ingredientProductIds.map((productId) => dealBasedMealInputs.find((deal) => deal.productId === productId)).filter(Boolean)
  })),
  coverage: {
    confidence: 'medium',
    caveat: 'Batch-cook planning reuses suggestDealBasedMeals with visible deal prices only; freezer capacity, allergens, and household preferences need account data before auto-planning.'
  }
};

export const expiryDealRadarReports = [
  {
    id: 'expiry-laxfile-liljeholmen',
    productId: 'fiskeriet-laxfile-500g',
    productName: 'Fiskeriet Laxfilé 500g',
    storeId: 'ica-kvantum-liljeholmen',
    storeName: 'ICA Kvantum Liljeholmen',
    category: 'fish',
    originalPrice: 159,
    currentPrice: 119,
    markdownPercent: 25,
    expiresAt: '2026-05-22T20:00:00.000Z',
    reportedAt: '2026-05-22T08:30:00.000Z',
    distanceKm: 3.2,
    verificationCount: 2,
    photoCount: 1,
    source: 'visible member-promo product row + community expiry sticker report'
  },
  {
    id: 'expiry-tomater-fridhemsplan',
    productId: 'garant-korsbarstomater-250g',
    productName: 'Garant Körsbärstomater 250g',
    storeId: 'coop-daglivs-fridhemsplan',
    storeName: 'Coop Daglivs Fridhemsplan',
    category: 'produce',
    originalPrice: 29.9,
    currentPrice: 19.9,
    markdownPercent: 33,
    expiresAt: '2026-05-23T10:00:00.000Z',
    reportedAt: '2026-05-22T07:45:00.000Z',
    distanceKm: 2.1,
    verificationCount: 1,
    photoCount: 1,
    source: 'visible shelf product row + community expiry sticker report'
  },
  {
    id: 'expiry-kvarg-fridhemsplan',
    productId: 'lindahls-kvarg-500g',
    productName: 'Lindahls Kvarg Naturell 500g',
    storeId: 'willys-fridhemsplan',
    storeName: 'Willys Fridhemsplan',
    category: 'dairy',
    originalPrice: 26.9,
    currentPrice: 19.9,
    markdownPercent: 26,
    expiresAt: '2026-05-23T18:00:00.000Z',
    reportedAt: '2026-05-22T09:00:00.000Z',
    distanceKm: 1.6,
    verificationCount: 1,
    photoCount: 0,
    source: 'visible member-promo product row + unconfirmed expiry shelf report'
  },
  {
    id: 'expiry-lingongrova-stale',
    productId: 'pagen-lingongrova-500g',
    productName: 'Pågen Lingongrova 500g',
    storeId: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    category: 'bread',
    originalPrice: 42.9,
    currentPrice: 33.9,
    markdownPercent: 21,
    expiresAt: '2026-05-21T16:00:00.000Z',
    reportedAt: '2026-05-21T08:00:00.000Z',
    distanceKm: 2.9,
    verificationCount: 2,
    photoCount: 1,
    source: 'visible member-promo product row + expired community report retained as stale evidence'
  }
];

export const expiryDealRadar = {
  now: '2026-05-22T10:00:00.000Z',
  radar: buildExpiryDealRadar({
    now: '2026-05-22T10:00:00.000Z',
    reports: expiryDealRadarReports,
    maxDistanceKm: 5
  }),
  reportCount: expiryDealRadarReports.length,
  coverage: {
    confidence: 'medium',
    caveat: 'Expiry markdowns are shown only when a visible product row has a timestamped community expiry-sticker report; stale or expired reports stay labelled and excluded from active alerts.'
  }
};

export const singlePortionDealInputs = [
  {
    productId: 'lindahls-kvarg-500g',
    productName: 'Lindahls Kvarg Naturell 500g',
    storeId: 'willys-fridhemsplan',
    storeName: 'Willys Fridhemsplan',
    currentPrice: 19.9,
    regularPrice: 26.9,
    dealScore: 82,
    sourceConfidence: 0.74,
    portionLabel: '1 protein breakfast / snack',
    source: 'visible member-promo product row sized for one-person use'
  },
  {
    productId: 'garant-korsbarstomater-250g',
    productName: 'Garant Körsbärstomater 250g',
    storeId: 'coop-daglivs-fridhemsplan',
    storeName: 'Coop Daglivs Fridhemsplan',
    currentPrice: 19.9,
    regularPrice: 29.9,
    dealScore: 79,
    sourceConfidence: 0.72,
    portionLabel: '2 pasta or salad portions',
    source: 'visible shelf product row with small-pack markdown evidence'
  },
  {
    productId: 'garant-ekologisk-tofu-270g',
    productName: 'Garant Ekologisk Tofu 270g',
    storeId: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    currentPrice: 21.9,
    regularPrice: 28.9,
    dealScore: 76,
    sourceConfidence: 0.68,
    portionLabel: '2 dinner portions',
    source: 'visible shelf product row sized below family-pack quantity'
  },
  {
    productId: 'bravo-apelsinjuice-1l',
    productName: 'Bravo Apelsinjuice 1L',
    storeId: 'hemkop-hornstull',
    storeName: 'Hemköp Hornstull',
    currentPrice: 22.9,
    regularPrice: 27.9,
    dealScore: 64,
    sourceConfidence: 0.59,
    portionLabel: '4 breakfast servings',
    source: 'visible shelf product row retained as a lower-confidence comparison deal'
  }
];

export const singlePortionDealFinder = {
  persona: 'Students / young singles',
  title: 'Single-portion deals',
  rankedDeals: rankDealOpportunities({
    deals: singlePortionDealInputs.map(({ portionLabel: _portionLabel, source: _source, ...deal }) => deal),
    minimumDealScore: 60,
    minimumSourceConfidence: 0.55
  }).map((deal) => {
    const sourceRow = singlePortionDealInputs.find((input) => input.productId === deal.productId && input.storeId === deal.storeId);
    return {
      ...deal,
      portionLabel: sourceRow?.portionLabel ?? 'single-person portion',
      source: sourceRow?.source ?? 'visible deal row'
    };
  }),
  coverage: {
    confidence: 'medium',
    caveat: 'Filters visible small-pack deals through rankDealOpportunities; family-size bulk offers and sponsored placements are excluded from this student view.'
  }
};

export const kidsSnackLunchboxInputs = [
  {
    productId: 'pagen-lingongrova-500g',
    productName: 'Pågen Lingongrova 500g',
    storeId: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    currentPrice: 33.9,
    regularPrice: 42.9,
    dealScore: 72,
    sourceConfidence: 0.72,
    lunchboxFit: 'sandwich base',
    source: 'visible bread shelf row used in weekly basket'
  },
  {
    productId: 'garant-gurka-300g',
    productName: 'Garant Gurka 300g',
    storeId: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    currentPrice: 16.9,
    regularPrice: 22.9,
    dealScore: 69,
    sourceConfidence: 0.66,
    lunchboxFit: 'snack vegetable',
    source: 'visible vegetable deal row from meal planner'
  },
  {
    productId: 'bravo-apelsinjuice-1l',
    productName: 'Bravo Apelsinjuice 1L',
    storeId: 'hemkop-hornstull',
    storeName: 'Hemköp Hornstull',
    currentPrice: 22.9,
    regularPrice: 27.9,
    dealScore: 64,
    sourceConfidence: 0.59,
    lunchboxFit: 'breakfast drink',
    source: 'visible weekly basket juice row'
  }
];

export const kidsSnackLunchboxDeals = {
  persona: 'Families with kids',
  title: 'Kids snack & lunchbox deals',
  rankedDeals: rankDealOpportunities({
    deals: kidsSnackLunchboxInputs.map(({ lunchboxFit: _lunchboxFit, source: _source, ...deal }) => deal),
    minimumDealScore: 60,
    minimumSourceConfidence: 0.55
  }).map((deal) => {
    const sourceRow = kidsSnackLunchboxInputs.find((input) => input.productId === deal.productId && input.storeId === deal.storeId);
    return {
      ...deal,
      lunchboxFit: sourceRow?.lunchboxFit ?? 'lunchbox item',
      source: sourceRow?.source ?? 'visible lunchbox deal row'
    };
  }),
  coverage: {
    confidence: 'medium',
    caveat: 'Lunchbox feed ranks visible snack-sized deal rows only; school policy, allergens, and child preferences require account data.'
  }
};

export const nutritionPerKronaInputs = [
  {
    productId: 'kronfagel-kycklingfile-1kg',
    name: 'Kronfågel Kycklingfilé 1kg',
    price: 109,
    nutritionPerPackage: { proteinGrams: 230, calories: 1050, fiberGrams: 0, sugarGrams: 0, saltGrams: 1.6 },
    source: 'visible weekly-deal product row + package nutrition label fixture'
  },
  {
    productId: 'icas-egg-15p',
    name: 'ICA Ägg 15-pack',
    price: 39.95,
    nutritionPerPackage: { proteinGrams: 95, calories: 1050, fiberGrams: 0, sugarGrams: 1, saltGrams: 2.1 },
    source: 'visible shelf product row + package nutrition label fixture'
  },
  {
    productId: 'lindahls-kvarg-500g',
    name: 'Lindahls Kvarg Naturell 500g',
    price: 19.9,
    nutritionPerPackage: { proteinGrams: 55, calories: 300, fiberGrams: 0, sugarGrams: 17.5, saltGrams: 0.5 },
    source: 'visible member-promo product row + package nutrition label fixture'
  },
  {
    productId: 'garant-ekologisk-tofu-270g',
    name: 'Garant Ekologisk Tofu 270g',
    price: 21.9,
    nutritionPerPackage: { proteinGrams: 35, calories: 335, fiberGrams: 2.7, sugarGrams: 0.8, saltGrams: 0.3 },
    source: 'visible shelf product row + package nutrition label fixture'
  }
];

export const nutritionPerKrona = {
  metric: 'protein' as const,
  rows: rankNutritionPerKrona(nutritionPerKronaInputs, 'protein').map((row) => ({
    ...row,
    source: nutritionPerKronaInputs.find((input) => input.productId === row.productId)?.source ?? 'visible product row'
  })),
  coverage: {
    labelledProducts: nutritionPerKronaInputs.length,
    visibleProducts: products.length,
    confidence: 'medium',
    caveat: 'Only products with a visible price row and a package nutrition-label fixture are ranked; missing labels are excluded instead of estimated.'
  }
};

const highProteinDealInputs = [
  {
    productId: 'kronfagel-kycklingfile-1kg',
    productName: 'Kronfågel Kycklingfilé 1kg',
    storeId: 'hemkop-skanstull',
    storeName: 'Hemköp Skanstull',
    currentPrice: 109,
    regularPrice: 139,
    dealScore: 78,
    sourceConfidence: 0.72,
    trainingUse: 'lean dinner prep',
    source: 'visible Hemköp weekly-deal row + package nutrition label fixture'
  },
  {
    productId: 'lindahls-kvarg-500g',
    productName: 'Lindahls Kvarg Naturell 500g',
    storeId: 'willys-fridhemsplan',
    storeName: 'Willys Fridhemsplan',
    currentPrice: 19.9,
    regularPrice: 24.9,
    dealScore: 84,
    sourceConfidence: 0.82,
    trainingUse: 'post-workout snack',
    source: 'visible member-promo dairy row + package nutrition label fixture'
  },
  {
    productId: 'garant-ekologisk-tofu-270g',
    productName: 'Garant Ekologisk Tofu 270g',
    storeId: 'willys-odenplan',
    storeName: 'Willys Odenplan',
    currentPrice: 21.9,
    regularPrice: 26.9,
    dealScore: 82,
    sourceConfidence: 0.78,
    trainingUse: 'plant protein meal prep',
    source: 'visible Willys shelf row + package nutrition label fixture'
  },
  {
    productId: 'icas-egg-15p',
    productName: 'ICA Ägg 15-pack',
    storeId: 'ica-nara-sergels-torg',
    storeName: 'ICA Nära Sergels Torg',
    currentPrice: 39.95,
    regularPrice: 44.95,
    dealScore: 73,
    sourceConfidence: 0.76,
    trainingUse: 'breakfast protein',
    source: 'visible ICA shelf row + package nutrition label fixture'
  }
];

const highProteinRanksByProduct = new Map(rankNutritionPerKrona(nutritionPerKronaInputs, 'protein').map((row) => [row.productId, row]));

export const highProteinDealFinder = {
  persona: 'Health & fitness',
  title: 'High-protein deal finder',
  minProteinPer10Sek: 12,
  rows: rankDealOpportunities({
    deals: highProteinDealInputs.map(({ trainingUse: _trainingUse, source: _source, ...deal }) => deal),
    minimumDealScore: 70,
    minimumSourceConfidence: 0.7
  }).map((deal) => {
    const nutrition = highProteinRanksByProduct.get(deal.productId);
    const sourceRow = highProteinDealInputs.find((input) => input.productId === deal.productId && input.storeId === deal.storeId);
    return {
      ...deal,
      proteinPer10Sek: nutrition?.valuePer10Sek ?? 0,
      saltWarning: nutrition?.saltWarning ?? false,
      trainingUse: sourceRow?.trainingUse ?? 'protein deal',
      source: sourceRow?.source ?? 'visible deal row + package nutrition label fixture'
    };
  }).filter((row) => row.proteinPer10Sek >= 12),
  coverage: {
    confidence: 'medium',
    caveat: 'High-protein deal finder intersects visible deal rows and package nutrition labels; products without both price and nutrition evidence are excluded instead of estimated.'
  }
};

const macroProteinRanks = rankNutritionPerKrona(nutritionPerKronaInputs, 'protein');
const macroCalorieRanks = rankNutritionPerKrona(nutritionPerKronaInputs, 'calories');
const macroFiberRanks = rankNutritionPerKrona(nutritionPerKronaInputs, 'fiber');

export const healthMacroOptimizer = {
  persona: 'Health & fitness',
  title: 'Macro optimizer',
  macroTargets: [
    { metric: 'protein', target: 'maximize grams per 10 SEK', topProductId: macroProteinRanks[0]?.productId ?? '', valuePer10Sek: macroProteinRanks[0]?.valuePer10Sek ?? 0 },
    { metric: 'calories', target: 'budget calories per 10 SEK', topProductId: macroCalorieRanks[0]?.productId ?? '', valuePer10Sek: macroCalorieRanks[0]?.valuePer10Sek ?? 0 },
    { metric: 'fiber', target: 'maximize fiber per 10 SEK', topProductId: macroFiberRanks[0]?.productId ?? '', valuePer10Sek: macroFiberRanks[0]?.valuePer10Sek ?? 0 }
  ],
  topProtein: macroProteinRanks[0],
  topCalories: macroCalorieRanks[0],
  topFiber: macroFiberRanks[0],
  rows: nutritionPerKronaInputs.map((product) => ({
    productId: product.productId,
    name: product.name,
    price: product.price,
    proteinPer10Sek: macroProteinRanks.find((row) => row.productId === product.productId)?.valuePer10Sek ?? 0,
    caloriesPer10Sek: macroCalorieRanks.find((row) => row.productId === product.productId)?.valuePer10Sek ?? 0,
    fiberPer10Sek: macroFiberRanks.find((row) => row.productId === product.productId)?.valuePer10Sek ?? 0,
    sugarPerPackage: product.nutritionPerPackage.sugarGrams,
    saltGrams: product.nutritionPerPackage.saltGrams,
    source: product.source
  })),
  coverage: {
    caveat: 'Macro optimization reuses only visible prices and package nutrition-label fixtures; missing macro labels are excluded instead of estimated.'
  }
};

export const householdSavings = {
  weeklyTotal: '813.20 SEK',
  vsLastWeek: '-78.10 SEK',
  vsLastMonth: '-126.40 SEK',
  topSaving: { product: 'Felix Pyttipanna 720g', amount: '-16.50 SEK', driver: 'Skanstull freezer stock-up' }
};


const parseSekAmount = (value: string): number => Number(value.replace(',', '.').match(/\d+(\.\d+)?/)?.[0] ?? 0);
const parsePercentChange = (value: string): number => Number(value.replace('%', '').replace('+', ''));
const categoryByTopDeal = new Map(categories.map((category) => [category.topDeal, category.name]));

export const studentWeeklyBudgetInput = {
  weeklyBudget: 550,
  monthlyBudget: 2200,
  estimatedBasketTotal: Math.round(weeklyBasket.reduce((sum, row) => sum + parseSekAmount(row.total), 0) * 100) / 100,
  receiptTotalsThisWeek: [92.4, 128.8, 64.5],
  receiptTotalsThisMonth: [421.2, 496.6, 285.7]
};

export const studentWeeklyBudgetTracker = {
  persona: 'Students / young singles',
  title: 'Weekly student budget',
  summary: summarizeBudget(studentWeeklyBudgetInput),
  plannedRows: weeklyBasket.map((row) => {
    const product = products.find((candidate) => candidate.slug === row.slug);
    return {
      ...row,
      name: product?.name ?? row.slug,
      category: product ? (categoryByTopDeal.get(product.ticker) ?? 'Student staples') : 'Student staples',
      plannedSpend: parseSekAmount(row.total)
    };
  }),
  coverage: {
    confidence: 'medium',
    caveat: 'Uses visible weekly basket rows and receipt totals; unscanned cash purchases are not estimated.'
  }
};


export const elderlyFixedIncomeBudgetInput = {
  weeklyBudget: 650,
  monthlyBudget: 2800,
  estimatedBasketTotal: 612.4,
  receiptTotalsThisWeek: [184.5, 129.9, 96.7],
  receiptTotalsThisMonth: [612.4, 548.2, 391.8, 228.5]
};

export const elderlyFixedIncomeBudgetTracker = {
  persona: 'Elderly / seniors',
  title: 'Fixed-income monthly budget',
  pensionEnvelope: {
    label: 'Food pension envelope',
    amount: elderlyFixedIncomeBudgetInput.monthlyBudget,
    cadence: 'monthly fixed-income plan'
  },
  summary: summarizeBudget(elderlyFixedIncomeBudgetInput),
  guardrails: [
    { label: 'Staples first', action: 'Reserve milk, oats, coffee, and pharmacy-adjacent household basics before discretionary deals.' },
    { label: 'No estimate padding', action: 'Only scanned receipts and the visible planned basket count toward the monthly envelope.' },
    { label: 'Overrun warning', action: 'Warn before adding promos when monthlyRemainingActual would fall below 300 SEK.' }
  ],
  coverage: {
    confidence: 'medium',
    caveat: 'Fixed-income budget uses visible receipts and planned basket totals; cash purchases without receipts are not estimated.'
  }
};

export const purchaseHistory = [
  { purchasedAt: '2026-02-03T17:10:00.000Z', totalSpend: 512.4, storeId: 'willys-odenplan', receiptId: 'demo-2026-02-03' },
  { purchasedAt: '2026-02-17T16:30:00.000Z', totalSpend: 438.7, storeId: 'hemkop-skanstull', receiptId: 'demo-2026-02-17' },
  { purchasedAt: '2026-03-04T18:20:00.000Z', totalSpend: 529.2, storeId: 'willys-odenplan', receiptId: 'demo-2026-03-04' },
  { purchasedAt: '2026-03-18T16:45:00.000Z', totalSpend: 472.9, storeId: 'coop-norra-stationsgatan', receiptId: 'demo-2026-03-18' },
  { purchasedAt: '2026-04-02T17:35:00.000Z', totalSpend: 548.6, storeId: 'willys-odenplan', receiptId: 'demo-2026-04-02' },
  { purchasedAt: '2026-04-16T18:05:00.000Z', totalSpend: 503.1, storeId: 'hemkop-skanstull', receiptId: 'demo-2026-04-16' },
  { purchasedAt: '2026-05-07T17:50:00.000Z', totalSpend: 571.3, storeId: 'willys-odenplan', receiptId: 'demo-2026-05-07' },
  { purchasedAt: '2026-05-21T18:15:00.000Z', totalSpend: 596.8, storeId: 'hemkop-skanstull', receiptId: 'demo-2026-05-21' }
];

export const grocerySpendForecast = forecastGrocerySpend({
  purchase_history: purchaseHistory,
  asOf: '2026-05-24T12:00:00.000Z'
});

export const personalGroceryInflation = calculatePersonalGroceryInflation({
  baseDate: 'previous weekly basket',
  currentDate: '2026-05-21 visible weekly basket',
  items: weeklyBasket.map((row) => {
    const product = products.find((candidate) => candidate.slug === row.slug);
    if (!product) return null;
    const currentUnitPrice = parseSekAmount(row.total) / row.qty;
    const movement = parsePercentChange(row.vsLastWeek);
    const baseUnitPrice = currentUnitPrice / (1 + movement / 100);
    return {
      productId: row.slug,
      productName: product.name,
      category: categoryByTopDeal.get(product.ticker) ?? 'Household staples',
      quantity: row.qty,
      baseUnitPrice,
      currentUnitPrice,
      confidence: product.confidence as 'high' | 'medium' | 'low'
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null),
  missingProductIds: weeklyBasket
    .filter((row) => !products.some((product) => product.slug === row.slug))
    .map((row) => row.slug)
});


const elderlyStaplesHistoryInputs = [
  {
    productId: 'arla-milk-1l',
    productName: 'Arla Mellanmjölk 1L',
    stabilityBand: 'stable',
    points: [
      { observedAt: '2026-05-01', price: 13.7 },
      { observedAt: '2026-05-08', price: 13.9 },
      { observedAt: '2026-05-15', price: 13.8 },
      { observedAt: '2026-05-21', price: 13.9 }
    ]
  },
  {
    productId: 'havregryn-extra-fylliga-101758934-st',
    productName: 'Havregryn Extra Fylliga',
    stabilityBand: 'watch',
    points: [
      { observedAt: '2026-05-01', price: 18.5 },
      { observedAt: '2026-05-08', price: 18.9 },
      { observedAt: '2026-05-15', price: 19.4 },
      { observedAt: '2026-05-21', price: 19.9 }
    ]
  },
  {
    productId: 'zoegas-coffee-450g',
    productName: 'Zoegas Coffee 450g',
    stabilityBand: 'buy-window',
    points: [
      { observedAt: '2026-05-01', price: 54.9 },
      { observedAt: '2026-05-08', price: 52.9 },
      { observedAt: '2026-05-15', price: 51.9 },
      { observedAt: '2026-05-21', price: 49.9 }
    ]
  }
] as const;

export const elderlyStaplesStabilityTracker = {
  persona: 'Elderly / seniors',
  title: 'Staples price stability',
  rows: elderlyStaplesHistoryInputs.map((item) => ({
    ...item,
    history: summarizePriceHistory([...item.points]),
    stabilityBand: item.stabilityBand
  })),
  coverage: {
    confidence: 'medium',
    caveat: 'Staples stability uses observed price-history points only; unobserved store weeks stay out of the band instead of being estimated.'
  }
};

export const savingsDashboard = {
  monthToDate: {
    plannedSpend: '1,756.00 SEK',
    avoidedSpend: '114.10 SEK',
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
    },
    {
      label: 'Freezer stock-up',
      product: 'Felix Pyttipanna 720g',
      store: 'Willys Skanstull',
      signal: '5.1% under frozen baseline',
      action: 'Bundle with kåldolmar before topping up snacks at Lidl Hammarby Sjöstad',
      href: '/products/felix-pyttipanna-720g'
    },
    {
      label: 'Lunchbox value',
      product: 'Pågen Lingongrova 500g',
      store: 'Coop Medborgarplatsen',
      signal: '3.5% under bread baseline',
      action: 'Bundle with cheese and cucumber while all three rows stay high confidence',
      href: '/products/pagen-lingongrova-500g'
    },
    {
      label: 'Hydration top-up',
      product: 'Festis Päron 10-pack',
      store: 'ICA Nära Mariatorget',
      signal: '5.4% under beverages baseline',
      action: 'Bundle with Loka and Proviva before the weekend drink shelf runs low',
      href: '/products/festis-paron-10p'
    },
    {
      label: 'Protein snack prep',
      product: 'Lindahls Kvarg Naturell 500g',
      store: 'Willys Fridhemsplan',
      signal: '0.9% under dairy baseline',
      action: 'Bundle with Keso and apples when the household needs training snacks',
      href: '/products/lindahls-kvarg-500g'
    }
  ],
  districtSavings: [
    { district: 'Vasastan', planned: '612.40 SEK', avoided: '39.80 SEK', driver: 'Coffee, dairy, and plant-based promos' },
    { district: 'Södermalm', planned: '753.50 SEK', avoided: '59.30 SEK', driver: 'Breakfast, chicken, frozen, lunchbox, and beverage promos' },
    { district: 'Norrmalm', planned: '391.20 SEK', avoided: '13.90 SEK', driver: 'Snacks and eggs' },
    { district: 'Hägersten', planned: '264.10 SEK', avoided: '9.90 SEK', driver: 'Rice and pantry clearance' },
    { district: 'Kungsholmen', planned: '281.40 SEK', avoided: '28.20 SEK', driver: 'Produce shelf drop and protein snack prep' },
    { district: 'Hammarby Sjöstad', planned: '116.70 SEK', avoided: '16.50 SEK', driver: 'Frozen snack add-on' }
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
    { label: 'Saved weekly basket', href: '/weekly-basket', detail: '31 visible driver rows' },
    { label: 'Savings dashboard', href: '/savings-dashboard', detail: '114.10 SEK avoided month-to-date' },
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
  },
  {
    receipt: 'Willys Skanstull freezer stock-up',
    store: 'Willys Skanstull',
    area: 'Södermalm',
    items: 'Pyttipanna, kåldolmar, frozen dinner rows',
    confidence: '86%',
    issue: 'Member promo and weekly deal lines need same-receipt confirmation',
    impact: '-16.50 SEK',
    href: '/scanner'
  },
  {
    receipt: 'Coop Medborgarplatsen lunchbox stop',
    store: 'Coop Medborgarplatsen',
    area: 'Södermalm',
    items: 'Bread, cheese, cucumber',
    confidence: '91%',
    issue: 'Bundle savings need line-total confirmation before weekly basket update',
    impact: '-10.80 SEK',
    href: '/scanner'
  },
  {
    receipt: 'ICA Nära Mariatorget hydration top-up',
    store: 'ICA Nära Mariatorget',
    area: 'Södermalm',
    items: 'Loka, Festis, Proviva',
    confidence: '78%',
    issue: 'Weekly drink deal needs receipt confirmation before basket totals update',
    impact: '-8.50 SEK',
    href: '/scanner'
  },
  {
    receipt: 'Willys Fridhemsplan protein snack',
    store: 'Willys Fridhemsplan',
    area: 'Kungsholmen',
    items: 'Kvarg, Keso, apples',
    confidence: '89%',
    issue: 'Nutrition route needs protein label confirmation before publishing',
    impact: '-12.20 SEK',
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
  },
  {
    receiptId: 'R-2026-05-21-WILLYS-SKANSTULL',
    storeName: 'Willys Skanstull',
    storeSlug: 'willys-skanstull',
    capturedAt: '2026-05-21 14:45 CET',
    total: '154.60 SEK',
    status: 'Ready',
    owner: 'Alex',
    confidence: 0.86,
    flaggedLines: [
      { productSlug: 'felix-pyttipanna-720g', label: 'Member promo matched freezer row' },
      { productSlug: 'dafgard-kaldolmar-600g', label: 'Weekly deal needs line-total check' }
    ],
    nextAction: 'Publish the Skanstull freezer rows after receipt review confirms the bundle.'
  },
  {
    receiptId: 'R-2026-05-21-COOP-MEDBORGARPLATSEN',
    storeName: 'Coop Medborgarplatsen',
    storeSlug: 'coop-medborgarplatsen',
    capturedAt: '2026-05-21 15:34 CET',
    total: '105.70 SEK',
    status: 'Matched',
    owner: 'Mira',
    confidence: 0.91,
    flaggedLines: [
      { productSlug: 'pagen-lingongrova-500g', label: 'Bread member promo matched' },
      { productSlug: 'arla-hushallsost-500g', label: 'Cheese shelf row accepted' },
      { productSlug: 'garant-gurka-300g', label: 'Produce unit price confirmed' }
    ],
    nextAction: 'Publish the lunchbox bundle to weekly basket and unit-price review.'
  },
  {
    receiptId: 'R-2026-05-21-ICA-MARIATORGET',
    storeName: 'ICA Nära Mariatorget',
    storeSlug: 'ica-nara-mariatorget',
    capturedAt: '2026-05-21 16:42 CET',
    total: '79.70 SEK',
    status: 'Needs review',
    owner: 'Sam',
    confidence: 0.78,
    flaggedLines: [
      { productSlug: 'loka-naturell-150cl', label: 'Sparkling water member price matched' },
      { productSlug: 'festis-paron-10p', label: 'Weekly drink deal needs line-total check' },
      { productSlug: 'proviva-blabar-1l', label: 'Shelf price accepted' }
    ],
    nextAction: 'Hold the beverage watchlist update until the Festis line total is confirmed.'
  },
  {
    receiptId: 'R-2026-05-21-WILLYS-FRIDHEMSPLAN',
    storeName: 'Willys Fridhemsplan',
    storeSlug: 'willys-fridhemsplan',
    capturedAt: '2026-05-21 17:44 CET',
    total: '82.70 SEK',
    status: 'Ready',
    owner: 'Alex',
    confidence: 0.89,
    flaggedLines: [
      { productSlug: 'lindahls-kvarg-500g', label: 'Kvarg member promo matched' },
      { productSlug: 'arla-keso-500g', label: 'Cottage cheese shelf row accepted' },
      { productSlug: 'ica-applen-royal-gala-1kg', label: 'Apple weekly deal needs nutrition pairing' }
    ],
    nextAction: 'Publish the protein snack route after nutrition label confirmation.'
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
  },
  {
    productSlug: 'arla-hushallsost-500g',
    productName: 'Arla Hushållsost 500g',
    storeSlug: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    packageSize: '500g',
    unitPrice: '109.80 SEK/kg',
    shelfPrice: '54.90 SEK',
    benchmark: 'Lunch cheese median 118.00 SEK/kg',
    severity: 'Low',
    reason: 'Cheese unit price sits below the lunchbox benchmark and can travel with bread and produce.'
  }
];

export const couponStackPlanner = [
  {
    title: 'Coffee member match',
    productSlug: 'zoegas-coffee-450g',
    productName: 'Zoegas Coffee 450g',
    storeSlug: 'willys-odenplan',
    storeName: 'Willys Odenplan',
    basePrice: '59.90 SEK',
    coupon: '-10.00 SEK app coupon',
    memberPrice: '-5.00 SEK member price',
    finalPrice: '44.90 SEK',
    stackState: 'Ready',
    basketImpact: '-15.00 SEK',
    nextAction: 'Apply before the weekly coffee row is locked.'
  },
  {
    title: 'Butter caution stack',
    productSlug: 'bregott-normalsaltat-600g',
    productName: 'Bregott Normalsaltat 600g',
    storeSlug: 'coop-swedenborgsgatan',
    storeName: 'Coop Swedenborgsgatan',
    basePrice: '67.90 SEK',
    coupon: '-7.00 SEK digital coupon',
    memberPrice: 'No member cut',
    finalPrice: '60.90 SEK',
    stackState: 'Watch',
    basketImpact: '-7.00 SEK',
    nextAction: 'Keep visible because the final price still sits above the butter target.'
  },
  {
    title: 'Breakfast receipt bonus',
    productSlug: 'garant-havregryn-1kg',
    productName: 'Garant Havregryn 1kg',
    storeSlug: 'tempo-hornstull',
    storeName: 'Tempo Hornstull',
    basePrice: '16.90 SEK',
    coupon: '-3.00 SEK receipt bonus',
    memberPrice: '-1.50 SEK loyalty shelf tag',
    finalPrice: '12.40 SEK',
    stackState: 'Queued',
    basketImpact: '-4.50 SEK',
    nextAction: 'Publish after the receipt review row confirms the bonus.'
  },
  {
    title: 'Hydration drink stack',
    productSlug: 'festis-paron-10p',
    productName: 'Festis Päron 10-pack',
    storeSlug: 'ica-nara-mariatorget',
    storeName: 'ICA Nära Mariatorget',
    basePrice: '49.90 SEK',
    coupon: '-5.00 SEK app coupon',
    memberPrice: '-5.00 SEK weekly deal',
    finalPrice: '39.90 SEK',
    stackState: 'Review',
    basketImpact: '-10.00 SEK',
    nextAction: 'Confirm receipt line before sending the beverage push alert.'
  },
  {
    title: 'Protein snack member stack',
    productSlug: 'lindahls-kvarg-500g',
    productName: 'Lindahls Kvarg Naturell 500g',
    storeSlug: 'willys-fridhemsplan',
    storeName: 'Willys Fridhemsplan',
    basePrice: '26.90 SEK',
    coupon: '-3.00 SEK app coupon',
    memberPrice: '-4.00 SEK member price',
    finalPrice: '19.90 SEK',
    stackState: 'Ready',
    basketImpact: '-7.00 SEK',
    nextAction: 'Apply before the protein snack route is sent to the nutrition board.'
  }
];

export const couponStackCenter = {
  title: 'Coupon stack center',
  freshnessWindow: 'May 21 coupon sync',
  headline: 'Review digital coupons, member cuts, and receipt bonuses before basket lock',
  readyStacks: 1,
  watchStacks: 2,
  stacks: couponStackPlanner,
  rulesTitle: 'Stack decision rules',
  rules: [
    { label: 'Apply order', value: 'Coupon first, member price second, receipt bonus only after review' },
    { label: 'Trust gate', value: 'Do not count receipt bonuses until the receipt review queue confirms them' },
    { label: 'Basket link', value: 'Every stack must link back to the product and store evidence rows' }
  ]
};

export const priceFreshnessMonitor = [
  {
    productSlug: 'zoegas-coffee-450g',
    productName: 'Zoegas Coffee 450g',
    storeSlug: 'willys-odenplan',
    storeName: 'Willys Odenplan',
    observedAt: '2026-05-21 14:10 CET',
    age: '2h fresh',
    confidence: '94%',
    status: 'Fresh',
    nextRefresh: 'Recheck before 17:00 basket lock',
    reason: 'Coffee drives the weekly basket and the member stack already has a same-day source row.'
  },
  {
    productSlug: 'bregott-normalsaltat-600g',
    productName: 'Bregott Normalsaltat 600g',
    storeSlug: 'coop-swedenborgsgatan',
    storeName: 'Coop Swedenborgsgatan',
    observedAt: '2026-05-20 13:05 CET',
    age: '27h review',
    confidence: '76%',
    status: 'Review',
    nextRefresh: 'Refresh before publishing the butter caution flag',
    reason: 'Butter is above target, but the older source row needs a confirmation pass before alerting.'
  },
  {
    productSlug: 'fiskeriet-laxfile-500g',
    productName: 'Fiskeriet Laxfile 500g',
    storeSlug: 'ica-kvantum-liljeholmen',
    storeName: 'ICA Kvantum Liljeholmen',
    observedAt: '2026-05-20 18:05 CET',
    age: '22h stale',
    confidence: '68%',
    status: 'Stale',
    nextRefresh: 'Block dinner basket auto-approval until a fresh protein row lands',
    reason: 'Fresh protein prices move quickly and this row is below the confidence floor.'
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
  },
  {
    title: 'freezer dinner backup',
    area: 'Södermalm + Hammarby Sjöstad',
    total: '116.70 SEK',
    savings: '-16.50 SEK',
    route: 'Bundle Willys Skanstull frozen dinners before adding Lidl ice cream for the weekend',
    products: ['felix-pyttipanna-720g', 'dafgard-kaldolmar-600g', 'gb-graddglass-2l']
  },
  {
    title: 'weekday lunchbox bundle',
    area: 'Södermalm',
    total: '105.70 SEK',
    savings: '-10.80 SEK',
    route: 'Use Coop Medborgarplatsen for bread, cheese, and cucumber when school lunches need one stop',
    products: ['pagen-lingongrova-500g', 'arla-hushallsost-500g', 'garant-gurka-300g']
  },
  {
    title: 'protein snack prep',
    area: 'Kungsholmen',
    total: '82.70 SEK',
    savings: '-12.20 SEK',
    route: 'Use Willys Fridhemsplan for kvarg, Keso, and apples before evening training',
    products: ['lindahls-kvarg-500g', 'arla-keso-500g', 'ica-applen-royal-gala-1kg']
  }
];

export const mealIdeaBoard = {
  title: 'Meal idea board',
  focus: 'Turn route-ready baskets into weekly meal decisions',
  newestSignal: 'Lunchbox and hydration rows are now visible beside breakfast, pantry, freezer, and plant-based prep',
  readyIdeas: mealBasketIdeas.length,
  spotlight: 'weekday lunchbox bundle',
  rulesTitle: 'Basket idea rules',
  ideas: mealBasketIdeas,
  rules: [
    { label: 'Route first', value: 'Prefer ideas that keep products inside one district or planned store path' },
    { label: 'Evidence links', value: 'Every idea keeps product routes visible before it becomes a basket row' },
    { label: 'Hold rule', value: 'Hydration and freezer top-ups wait for category comparison when savings are close' }
  ]
};

export const mealPlanner = {
  weekLabel: 'May 21-27 dinner plan',
  targetSpend: '600.00 SEK',
  plannedMeals: 6,
  projectedSavings: '-58.30 SEK',
  constraints: [
    { label: 'Protein rotation', value: 'Fish, chicken, and pantry vegetarian nights' },
    { label: 'Store limit', value: 'Two planned stops plus one pantry or freezer split only if nearby' },
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
    },
    {
      day: 'Sunday',
      meal: 'Freezer backup dinner',
      basket: 'Pyttipanna, kåldolmar, ice cream',
      store: 'Willys Skanstull + Lidl Hammarby Sjöstad',
      total: '116.70 SEK',
      savings: '-16.50 SEK',
      href: '/categories/frozen'
    }
  ]
};

const mealCostBreakdownInput = {
  mealId: 'weekday-lunchbox-bundle',
  title: 'Weekday lunchbox bundle',
  servings: 2,
  ingredients: [
    {
      ingredientId: 'bread',
      label: 'Wholegrain bread',
      quantityNeeded: 0.25,
      unit: 'kg',
      offers: [
        {
          chainId: 'coop',
          storeName: 'Coop Medborgarplatsen',
          productId: 'pagen-lingongrova-500g',
          productName: 'Pågen Lingongrova 500g',
          packageQuantity: 0.5,
          packageUnit: 'kg',
          packagePrice: 33.9,
          confidence: 0.72,
          source: 'visible shelf product row'
        }
      ]
    },
    {
      ingredientId: 'cheese',
      label: 'Sliced cheese',
      quantityNeeded: 0.12,
      unit: 'kg',
      offers: [
        {
          chainId: 'coop',
          storeName: 'Coop Medborgarplatsen',
          productId: 'arla-hushallsost-500g',
          productName: 'Arla Hushållsost 500g',
          packageQuantity: 0.5,
          packageUnit: 'kg',
          packagePrice: 54.9,
          confidence: 0.7,
          source: 'visible shelf product row'
        }
      ]
    },
    {
      ingredientId: 'cucumber',
      label: 'Cucumber',
      quantityNeeded: 0.15,
      unit: 'kg',
      offers: [
        {
          chainId: 'coop',
          storeName: 'Coop Medborgarplatsen',
          productId: 'garant-gurka-300g',
          productName: 'Garant Gurka 300g',
          packageQuantity: 0.3,
          packageUnit: 'kg',
          packagePrice: 16.9,
          confidence: 0.66,
          source: 'visible shelf product row'
        }
      ]
    }
  ]
} satisfies Parameters<typeof calculateMealCostBreakdown>[0];

export const mealCostBreakdown = {
  persona: 'Meal-preppers / families',
  title: 'Ingredient-level meal costing',
  input: mealCostBreakdownInput,
  summary: calculateMealCostBreakdown(mealCostBreakdownInput),
  coverage: {
    confidence: 'medium',
    caveat: 'Calls calculateMealCostBreakdown with only visible product rows and package quantities; missing substitute chains are excluded rather than estimated.'
  }
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

export const pantryReplenishmentInput: {
  pantry: PantryInventoryItem[];
  usage: { productId: string; quantityUsed: number; usedAt: string }[];
  deals: PantryDeal[];
  now: string;
  household: HouseholdSnapshot;
  expiringSoonDays: number;
} = {
  now: '2026-05-21T09:00:00.000Z',
  expiringSoonDays: 4,
  household: {
    id: 'vasastan-household',
    name: 'Vasastan household',
    weeklyBudget: 650,
    members: [
      { userId: 'member-1', displayName: 'Alex' },
      { userId: 'member-2', displayName: 'Sam' }
    ],
    basketItems: [
      { productId: 'eldorado-basmati-rice-1kg', quantity: 1, addedBy: 'member-1' },
      { productId: 'bravo-apelsinjuice-1l', quantity: 2, addedBy: 'member-2' }
    ],
    watchlistItems: [
      { productId: 'barilla-spaghetti-1kg', addedBy: 'member-1', targetPrice: 29 },
      { productId: 'felix-ketchup-1kg', addedBy: 'member-2', targetPrice: 34 }
    ],
    sharedFavoriteStoreIds: ['matmissionen-hagersten', 'city-gross-stockholm', 'hemkop-hornstull']
  },
  pantry: [
    { productId: 'eldorado-basmati-rice-1kg', name: 'Eldorado Basmati Rice 1kg', category: 'pantry', quantity: 0.5, unit: 'kg', minimumQuantity: 1, targetQuantity: 2, lastPurchasedAt: '2026-05-09T12:00:00.000Z' },
    { productId: 'barilla-spaghetti-1kg', name: 'Barilla Spaghetti 1kg', category: 'pantry', quantity: 1, unit: 'pack', minimumQuantity: 2, targetQuantity: 4, lastPurchasedAt: '2026-05-08T12:00:00.000Z' },
    { productId: 'felix-ketchup-1kg', name: 'Felix Tomatketchup 1kg', category: 'pantry', quantity: 1, unit: 'each', minimumQuantity: 1, targetQuantity: 2, expiresAt: '2026-06-12T12:00:00.000Z', lastPurchasedAt: '2026-04-28T12:00:00.000Z' },
    { productId: 'zeta-kikartor-380g', name: 'Zeta Kikärtor 380g', category: 'pantry', quantity: 3, unit: 'each', minimumQuantity: 1, targetQuantity: 4, expiresAt: '2026-05-23T12:00:00.000Z', lastPurchasedAt: '2026-05-15T12:00:00.000Z' }
  ],
  usage: [
    { productId: 'eldorado-basmati-rice-1kg', quantityUsed: 0.5, usedAt: '2026-05-20T18:30:00.000Z' },
    { productId: 'barilla-spaghetti-1kg', quantityUsed: 1, usedAt: '2026-05-19T18:30:00.000Z' }
  ],
  deals: [
    { productId: 'eldorado-basmati-rice-1kg', storeId: 'matmissionen-hagersten', storeName: 'Matmissionen Hägersten', price: 18.9, dealScore: 88 },
    { productId: 'barilla-spaghetti-1kg', storeId: 'city-gross-stockholm', storeName: 'City Gross Stockholm', price: 27.9, dealScore: 71 },
    { productId: 'felix-ketchup-1kg', storeId: 'hemkop-hornstull', storeName: 'Hemköp Hornstull', price: 32, dealScore: 76 }
  ]
};

const pantryPlan = planPantryReplenishment(pantryReplenishmentInput);

export const pantryReplenishmentPlan = {
  plan: pantryPlan,
  replenishment: pantryPlan.replenishment,
  expiringSoonProductIds: pantryPlan.expiringSoonProductIds,
  coverage: {
    visiblePantryItems: pantryReplenishmentInput.pantry.length,
    dealBackedItems: pantryReplenishmentInput.deals.length,
    confidence: 'medium',
    caveat: 'Uses visible pantry fixtures, household basket rows, and current deal rows only; missing authenticated inventory remains excluded.'
  }
};

export const nutritionValueBoard = {
  title: 'Nutrition value board',
  target: 'Rank dinner staples by protein, fiber, and basket cost',
  bestValue: 'Lindahls Kvarg Naturell 500g',
  weeklySignal: 'Protein snack rows reduce protein spend by 14.6%',
  cards: [
    {
      product: 'Garant Havregryn 1kg',
      slug: 'garant-havregryn-1kg',
      store: 'Tempo Hornstull',
      unitCost: '21.90 SEK/kg',
      nutritionSignal: 'High fiber breakfast base',
      score: 92,
      basketRole: 'breakfast staple',
      nutritionPerPackage: { proteinGrams: 130, calories: 3700, fiberGrams: 100, sugarGrams: 10, saltGrams: 0.1 },
      nutritionSource: 'Package nutrition label fixture'
    },
    {
      product: 'Anamma Formbar Färs 850g',
      slug: 'anamma-formbar-fars-850g',
      store: 'Coop Norra Stationsgatan',
      unitCost: '82.24 SEK/kg',
      nutritionSignal: 'Plant protein meal prep',
      score: 88,
      basketRole: 'dinner protein',
      nutritionPerPackage: { proteinGrams: 136, calories: 1700, fiberGrams: 51, sugarGrams: 8.5, saltGrams: 4.3 },
      nutritionSource: 'Package nutrition label fixture'
    },
    {
      product: 'Zeta Kikärtor 380g',
      slug: 'zeta-kikartor-380g',
      store: 'Hemköp Hornstull',
      unitCost: '36.58 SEK/kg',
      nutritionSignal: 'Fiber and protein pantry add-on',
      score: 84,
      basketRole: 'pantry protein',
      nutritionPerPackage: { proteinGrams: 29, calories: 570, fiberGrams: 23, sugarGrams: 3, saltGrams: 1.4 },
      nutritionSource: 'Package nutrition label fixture'
    },
    {
      product: 'Pågen Lingongrova 500g',
      slug: 'pagen-lingongrova-500g',
      store: 'Coop Medborgarplatsen',
      unitCost: '67.80 SEK/kg',
      nutritionSignal: 'Wholegrain lunchbox bread',
      score: 86,
      basketRole: 'weekday lunch base',
      nutritionPerPackage: { proteinGrams: 45, calories: 1175, fiberGrams: 30, sugarGrams: 25, saltGrams: 4.5 },
      nutritionSource: 'Package nutrition label fixture'
    },
    {
      product: 'Lindahls Kvarg Naturell 500g',
      slug: 'lindahls-kvarg-500g',
      store: 'Willys Fridhemsplan',
      unitCost: '39.80 SEK/kg',
      nutritionSignal: 'Lean protein snack base',
      score: 94,
      basketRole: 'training snack',
      nutritionPerPackage: { proteinGrams: 55, calories: 300, fiberGrams: 0, sugarGrams: 18, saltGrams: 0.5 },
      nutritionSource: 'Package nutrition label fixture'
    }
  ],
  rules: [
    { label: 'Protein floor', value: 'Prefer rows that replace meat without raising total dinner spend' },
    { label: 'Fiber boost', value: 'Promote oats, chickpeas, and produce when unit price is under trend' },
    { label: 'Confidence gate', value: 'Do not rank nutrition swaps from unreviewed receipt rows' }
  ]
};

export const expiryDealReports = [
  {
    id: 'expiry-kronfagel-kycklingfile-1kg',
    productId: 'kronfagel-kycklingfile-1kg',
    productName: 'Kronfågel Kycklingfilé 1kg',
    storeId: 'hemkop-hornstull',
    storeName: 'Hemköp Hornstull',
    category: 'protein',
    originalPrice: 129.9,
    currentPrice: 84.9,
    markdownPercent: 35,
    expiresAt: '2026-05-21T19:30:00.000Z',
    reportedAt: '2026-05-21T08:10:00.000Z',
    distanceKm: 1.8,
    verificationCount: 2,
    photoCount: 1
  },
  {
    id: 'expiry-pagen-lingongrova-500g',
    productId: 'pagen-lingongrova-500g',
    productName: 'Pågen Lingongrova 500g',
    storeId: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    category: 'bakery',
    originalPrice: 33.9,
    currentPrice: 19.9,
    markdownPercent: 41,
    expiresAt: '2026-05-22T08:00:00.000Z',
    reportedAt: '2026-05-21T07:50:00.000Z',
    distanceKm: 2.4,
    verificationCount: 1,
    photoCount: 1
  },
  {
    id: 'expiry-arla-hushallsost-500g',
    productId: 'arla-hushallsost-500g',
    productName: 'Arla Hushållsost 500g',
    storeId: 'ica-maxi-lindhagen',
    storeName: 'ICA Maxi Lindhagen',
    category: 'dairy',
    originalPrice: 74.9,
    currentPrice: 52.9,
    markdownPercent: 29,
    expiresAt: '2026-05-22T18:00:00.000Z',
    reportedAt: '2026-05-21T07:30:00.000Z',
    distanceKm: 3.1,
    verificationCount: 0,
    photoCount: 0
  },
  {
    id: 'expiry-expired-salad',
    productId: 'garant-gurka-300g',
    productName: 'Garant Gurka 300g',
    storeId: 'willys-skanstull',
    storeName: 'Willys Skanstull',
    category: 'produce',
    originalPrice: 18.9,
    currentPrice: 9.9,
    markdownPercent: 48,
    expiresAt: '2026-05-20T18:00:00.000Z',
    reportedAt: '2026-05-20T08:00:00.000Z',
    distanceKm: 2.7,
    verificationCount: 2,
    photoCount: 1
  }
];
