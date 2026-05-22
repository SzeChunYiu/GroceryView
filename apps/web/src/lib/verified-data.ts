import { axfoodProducts } from './axfood-products';
import { openFoodFactsCatalog } from './openfoodfacts-catalog';
import { categoryLabels, pricedProducts } from './openprices-products';
import { osmStores } from './osm-stores';

export const snapshot = {
  retrievedLabel: '20-21 May 2026',
  axfoodSource: 'Willys and Hemköp public search endpoints',
  openPricesSource: 'OpenPrices / Open Food Facts SEK observations',
  openFoodFactsCatalogSource: 'OpenFoodFacts Sweden metadata catalog',
  osmSource: 'OpenStreetMap Overpass Sweden extract'
};

const sek = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });

export function formatSek(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? sek.format(value) : 'Not reported';
}

export function formatPct(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${pct.format(value)}%` : 'Not reported';
}

export function labelFromSlug(slug: string) {
  return categoryLabels[slug] ?? slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export const matchedChainProducts = axfoodProducts.filter((product) => product.inChains.length > 1 && product.lowestPrice > 0);
export const topChainSpreads = [...matchedChainProducts].sort((a, b) => b.spreadPct - a.spreadPct).slice(0, 18);
export const freshestOpenPrices = [...pricedProducts].sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt)).slice(0, 18);
export const productUniverse = [...topChainSpreads, ...freshestOpenPrices].slice(0, 36);
export const immigrantFamiliarBrandSearch = productUniverse
  .map((product) => {
    const isChainProduct = 'lowestPrice' in product;
    const reportedBrand = isChainProduct ? product.brand : product.brands || 'Brand not reported';
    const verifiedPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
    const evidenceLabel = isChainProduct
      ? `${product.inChains.length} Axfood chains`
      : `${product.observationCount} OpenPrices observations`;

    return {
      reportedBrand,
      productName: product.name,
      verifiedProductSlug: product.slug,
      categoryLabel: labelFromSlug(product.category),
      searchTokens: [reportedBrand, product.name, labelFromSlug(product.category)]
        .filter(Boolean)
        .join(' · '),
      evidenceLabel,
      verifiedPrice
    };
  })
  .filter((row) => row.reportedBrand !== 'Brand not reported')
  .sort((a, b) => a.reportedBrand.localeCompare(b.reportedBrand, 'sv') || a.productName.localeCompare(b.productName, 'sv'))
  .slice(0, 8);
export const immigrantImageFirstBrowsing = productUniverse
  .filter((product) => Boolean(product.image))
  .map((product) => {
    const isChainProduct = 'lowestPrice' in product;
    const reportedBrand = isChainProduct ? product.brand : product.brands || 'Brand not reported';
    const verifiedPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
    return {
      imageUrl: product.image,
      visualAlt: `${product.name} package image`,
      productName: product.name,
      reportedBrand,
      verifiedProductSlug: product.slug,
      categoryLabel: labelFromSlug(product.category),
      evidenceLabel: isChainProduct ? `${product.inChains.length} chain prices` : `${product.observationCount} observations`,
      verifiedPrice
    };
  })
  .slice(0, 10);


export const openFoodFactsCatalogSummary = {
  products: openFoodFactsCatalog.length,
  brands: new Set(openFoodFactsCatalog.map((product) => product.brands).filter(Boolean)).size,
  categories: new Set(openFoodFactsCatalog.flatMap((product) => product.categories)).size,
  labelledProducts: openFoodFactsCatalog.filter((product) => product.labels.length > 0).length,
  imagedProducts: openFoodFactsCatalog.filter((product) => product.imageUrl).length,
  latestRetrieved: openFoodFactsCatalog.reduce((latest, product) => product.retrievedDate > latest ? product.retrievedDate : latest, '')
};

export const openFoodFactsCatalogPreview = [...openFoodFactsCatalog]
  .filter((product) => product.name && product.brands)
  .sort((a, b) => (b.labels.length - a.labels.length) || a.name.localeCompare(b.name, 'sv'))
  .slice(0, 12);

export const storeUniverse = osmStores;
export const featuredStores = [...osmStores]
  .filter((store) => store.address)
  .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  .slice(0, 24);

export const storeBrandLedger = Object.values(
  osmStores.reduce<Record<string, {
    brand: string;
    stores: number;
    districts: Set<string>;
    formats: Set<string>;
    addressedStores: number;
    latestRetrieved: string;
    sampleSlug: string;
  }>>((ledger, store) => {
    const brand = store.brand || 'Unbranded';
    const row = ledger[brand] ?? {
      brand,
      stores: 0,
      districts: new Set<string>(),
      formats: new Set<string>(),
      addressedStores: 0,
      latestRetrieved: '',
      sampleSlug: store.slug
    };

    row.stores += 1;
    if (store.district) row.districts.add(store.district);
    if (store.format) row.formats.add(store.format);
    if (store.address) row.addressedStores += 1;
    if (store.retrievedDate > row.latestRetrieved) row.latestRetrieved = store.retrievedDate;
    ledger[brand] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    brand: row.brand,
    stores: row.stores,
    districts: row.districts.size,
    formats: Array.from(row.formats).sort((a, b) => a.localeCompare(b, 'sv')).slice(0, 3),
    addressCoverage: row.stores ? row.addressedStores / row.stores : 0,
    latestRetrieved: row.latestRetrieved,
    sampleSlug: row.sampleSlug
  }))
  .sort((a, b) => b.stores - a.stores || a.brand.localeCompare(b.brand, 'sv'))
  .slice(0, 8);

export const storeFormatCoverage = Object.values(
  osmStores.reduce<Record<string, {
    format: string;
    stores: number;
    addressedStores: number;
    brands: Set<string>;
    districts: Set<string>;
    latestRetrieved: string;
    sampleSlug: string;
  }>>((ledger, store) => {
    const format = store.format || store.shop || 'format not reported';
    const row = ledger[format] ?? {
      format,
      stores: 0,
      addressedStores: 0,
      brands: new Set<string>(),
      districts: new Set<string>(),
      latestRetrieved: '',
      sampleSlug: store.slug
    };

    row.stores += 1;
    if (store.address) row.addressedStores += 1;
    if (store.brand) row.brands.add(store.brand);
    if (store.district) row.districts.add(store.district);
    if (store.retrievedDate > row.latestRetrieved) row.latestRetrieved = store.retrievedDate;
    ledger[format] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    format: row.format,
    stores: row.stores,
    addressCoverage: row.stores ? row.addressedStores / row.stores : 0,
    brands: row.brands.size,
    districts: row.districts.size,
    latestRetrieved: row.latestRetrieved,
    sampleSlug: row.sampleSlug
  }))
  .sort((a, b) => b.stores - a.stores || a.format.localeCompare(b.format, 'sv'))
  .slice(0, 6);

export const categorySummaries = Object.entries(categoryLabels)
  .map(([slug, label]) => {
    const openRows = pricedProducts.filter((product) => product.category === slug);
    const chainRows = axfoodProducts.filter((product) => product.category === slug);
    const prices = openRows.map((product) => product.priceMedian).filter((price) => Number.isFinite(price));
    return {
      slug,
      label,
      openPriceRows: openRows.length,
      chainRows: chainRows.length,
      medianPrice: prices.length ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null,
      latestObservation: openRows.reduce((latest, product) => product.lastObservedAt > latest ? product.lastObservedAt : latest, ''),
      strongestSpread: chainRows.reduce((best, product) => Math.max(best, product.spreadPct), 0)
    };
  })
  .filter((category) => category.openPriceRows > 0 || category.chainRows > 0)
  .sort((a, b) => (b.openPriceRows + b.chainRows) - (a.openPriceRows + a.chainRows));

export const immigrantAisleFinder = [
  {
    label: 'Halal-friendly protein aisle',
    verifiedCategorySlug: 'meat-seafood',
    dietaryTags: ['halal candidate', 'ask-store-confirmation'],
    caveat: 'Uses verified meat and seafood category rows only; halal certification is not inferred from product name.'
  },
  {
    label: 'Kosher pantry staples',
    verifiedCategorySlug: 'pantry',
    dietaryTags: ['kosher candidate', 'pack-label-check'],
    caveat: 'Uses pantry category coverage and keeps kosher certification as a package-label check.'
  },
  {
    label: 'Ethnic aisle basics',
    verifiedCategorySlug: 'international',
    dietaryTags: ['rice', 'spices', 'world foods'],
    caveat: 'Shows verified category entry points without inventing store aisle numbers.'
  }
];

export const categoryQualityMatrix = categorySummaries
  .map((category) => {
    const openRows = pricedProducts.filter((product) => product.category === category.slug);
    const chainRows = axfoodProducts.filter((product) => product.category === category.slug);
    const latestOpenPrice = openRows.reduce((latest, product) => product.lastObservedAt > latest ? product.lastObservedAt : latest, '');
    const observedProducts = new Set(openRows.map((product) => product.code || product.slug)).size;
    const chainMatches = chainRows.filter((product) => product.inChains.length > 1).length;

    return {
      slug: category.slug,
      label: category.label,
      verifiedRows: openRows.length + chainRows.length,
      observedProducts,
      chainMatches,
      latestOpenPrice,
      spreadSignal: category.strongestSpread,
      qualityScore: openRows.length + chainMatches * 2 + (latestOpenPrice ? 1 : 0)
    };
  })
  .filter((category) => category.verifiedRows > 0)
  .sort((a, b) => b.qualityScore - a.qualityScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 8);

export const chainCategoryCoverage = Object.values(
  matchedChainProducts.reduce<Record<string, {
    slug: string;
    chainRows: number;
    matchedProducts: number;
    spreadTotal: number;
    topSpread: number;
    willysLowest: number;
    hemkopLowest: number;
  }>>((ledger, product) => {
    const row = ledger[product.category] ?? {
      slug: product.category,
      chainRows: 0,
      matchedProducts: 0,
      spreadTotal: 0,
      topSpread: 0,
      willysLowest: 0,
      hemkopLowest: 0
    };

    row.chainRows += 1;
    row.matchedProducts += 1;
    row.spreadTotal += product.spreadPct;
    row.topSpread = Math.max(row.topSpread, product.spreadPct);
    if (product.lowestChain === 'willys') row.willysLowest += 1;
    if (product.lowestChain === 'hemkop') row.hemkopLowest += 1;
    ledger[product.category] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug),
    chainRows: row.chainRows,
    matchedProducts: row.matchedProducts,
    averageSpread: row.matchedProducts ? row.spreadTotal / row.matchedProducts : 0,
    topSpread: row.topSpread,
    leadingLowestChain: row.willysLowest >= row.hemkopLowest ? 'Willys' : 'Hemkop',
    coverageScore: row.matchedProducts * 2 + row.topSpread
  }))
  .sort((a, b) => b.coverageScore - a.coverageScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 6);

export const openPriceObservationDepth = Object.values(
  pricedProducts.reduce<Record<string, {
    slug: string;
    products: number;
    observationTotal: number;
    latestObservation: string;
    topProductName: string;
    topProductSlug: string;
    topProductObservations: number;
  }>>((ledger, product) => {
    const row = ledger[product.category] ?? {
      slug: product.category,
      products: 0,
      observationTotal: 0,
      latestObservation: '',
      topProductName: '',
      topProductSlug: '',
      topProductObservations: 0
    };

    row.products += 1;
    row.observationTotal += product.observationCount;
    if (product.lastObservedAt > row.latestObservation) row.latestObservation = product.lastObservedAt;
    if (product.observationCount > row.topProductObservations) {
      row.topProductName = product.name;
      row.topProductSlug = product.slug;
      row.topProductObservations = product.observationCount;
    }
    ledger[product.category] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug),
    products: row.products,
    observationTotal: row.observationTotal,
    latestObservation: row.latestObservation,
    topProductName: row.topProductName,
    topProductSlug: row.topProductSlug,
    topProductObservations: row.topProductObservations,
    averageObservations: row.products ? row.observationTotal / row.products : 0
  }))
  .sort((a, b) => b.observationTotal - a.observationTotal || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 6);

export const sourceCoverage = [
  {
    name: 'Axfood chain price snapshot',
    source: snapshot.axfoodSource,
    rows: axfoodProducts.length,
    coverage: `${matchedChainProducts.length} Willys/Hemköp cross-chain matches`,
    freshness: snapshot.retrievedLabel,
    caveat: 'Chain-wide online catalogue prices; not per-branch shelf prices.'
  },
  {
    name: 'OpenPrices SEK observations',
    source: snapshot.openPricesSource,
    rows: pricedProducts.length,
    coverage: `${new Set(pricedProducts.map((product) => product.code)).size} EAN-coded products`,
    freshness: freshestOpenPrices[0]?.lastObservedAt ?? 'Not reported',
    caveat: 'Community observations; every row shows observation count and latest date.'
  },
  {
    name: 'OpenFoodFacts metadata catalog',
    source: snapshot.openFoodFactsCatalogSource,
    rows: openFoodFactsCatalog.length,
    coverage: `${openFoodFactsCatalogSummary.brands.toLocaleString('sv-SE')} brands · ${openFoodFactsCatalogSummary.categories.toLocaleString('sv-SE')} category tags`,
    freshness: openFoodFactsCatalogSummary.latestRetrieved || 'Not reported',
    caveat: 'Metadata-only product catalog; GroceryView prices are not inferred from these rows.'
  },
  {
    name: 'Sweden store directory',
    source: snapshot.osmSource,
    rows: osmStores.length,
    coverage: `${new Set(osmStores.map((store) => store.brand)).size} brands across Sweden`,
    freshness: osmStores[0]?.retrievedDate ?? 'Not reported',
    caveat: 'Location data only; prices are not inferred from store locations.'
  }
];

const sourceRowsTotal = sourceCoverage.reduce((total, source) => total + source.rows, 0);

export const sourceReadinessMatrix = sourceCoverage.map((source) => {
  const primaryRoute =
    source.name === 'Sweden store directory'
      ? '/stores'
      : source.name === 'OpenPrices SEK observations' || source.name === 'OpenFoodFacts metadata catalog'
        ? '/products'
        : '/compare';

  return {
    name: source.name,
    rows: source.rows,
    rowShare: sourceRowsTotal ? source.rows / sourceRowsTotal : 0,
    freshness: source.freshness,
    coverage: source.coverage,
    caveat: source.caveat,
    primaryRoute
  };
});

export const sourceRouteMap = sourceReadinessMatrix.map((source) => {
  const supportingRoutes =
    source.name === 'Sweden store directory'
      ? ['/stores', '/map', '/data-sources']
      : source.name === 'OpenPrices SEK observations'
        ? ['/products', '/categories', '/data-sources']
        : source.name === 'OpenFoodFacts metadata catalog'
          ? ['/products', '/data-sources']
          : ['/compare', '/chain-index', '/data-sources'];

  return {
    name: source.name,
    primaryRoute: source.primaryRoute,
    supportingRoutes,
    routeCount: supportingRoutes.length,
    freshness: source.freshness
  };
});

export const sourceClaimLedger = sourceCoverage.map((source) => {
  const route =
    source.name === 'Sweden store directory'
      ? '/stores'
      : source.name === 'OpenPrices SEK observations' || source.name === 'OpenFoodFacts metadata catalog'
        ? '/products'
        : '/compare';
  const allowedClaim =
    source.name === 'Sweden store directory'
      ? 'Verified Sweden store locations, brands, formats, districts, and address coverage.'
      : source.name === 'OpenPrices SEK observations'
        ? 'Observed community price medians, observation counts, product codes, and latest sighting dates.'
        : source.name === 'OpenFoodFacts metadata catalog'
          ? 'Metadata-only Swedish product names, brands, quantities, category tags, labels, package images, and OFF product URLs.'
          : 'Chain-wide Willys and Hemkop catalogue prices and same-product spread comparisons.';
  const blockedClaim =
    source.name === 'Sweden store directory'
      ? 'Branch-level prices, inventory, opening hours, or promotion availability.'
      : source.name === 'OpenPrices SEK observations'
        ? 'Guaranteed current shelf price, store-specific availability, or member-only offer state.'
        : source.name === 'OpenFoodFacts metadata catalog'
          ? 'Current prices, store availability, nutrition completeness, or verified retailer assortment.'
          : 'Per-branch shelf prices, stock status, authenticated loyalty prices, or checkout totals.';

  return {
    name: source.name,
    evidenceRoute: route,
    source: source.source,
    allowedClaim,
    blockedClaim,
    evidence: `${source.rows.toLocaleString('sv-SE')} rows · ${source.coverage}`,
    freshness: source.freshness
  };
});

export const chainSavingsLedger = Object.values(
  matchedChainProducts.reduce<Record<string, {
    chain: string;
    products: number;
    totalSavings: number;
    topSaving: number;
    topProductName: string;
    topProductSlug: string;
  }>>((ledger, product) => {
    for (const row of chainPriceRows(product)) {
      if (typeof row.savings !== 'number' || row.savings <= 0) continue;
      const chain = row.chain;
      const entry = ledger[chain] ?? {
        chain,
        products: 0,
        totalSavings: 0,
        topSaving: 0,
        topProductName: '',
        topProductSlug: ''
      };

      entry.products += 1;
      entry.totalSavings += row.savings;
      if (row.savings > entry.topSaving) {
        entry.topSaving = row.savings;
        entry.topProductName = product.name;
        entry.topProductSlug = product.slug;
      }
      ledger[chain] = entry;
    }
    return ledger;
  }, {})
)
  .map((row) => ({
    chain: row.chain,
    products: row.products,
    totalSavings: row.totalSavings,
    averageSaving: row.products ? row.totalSavings / row.products : 0,
    topSaving: row.topSaving,
    topProductName: row.topProductName,
    topProductSlug: row.topProductSlug
  }))
  .sort((a, b) => b.totalSavings - a.totalSavings || a.chain.localeCompare(b.chain, 'sv'));

export const budgetLowestPriceRadar = matchedChainProducts
  .map((product) => {
    const pricedRows = chainPriceRows(product).sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
    const cheapest = pricedRows[0];
    const priciest = pricedRows[pricedRows.length - 1];
    const cheapestPrice = cheapest?.price ?? product.lowestPrice;
    const expensivePrice = priciest?.price ?? product.highestPrice;

    return {
      productName: product.name,
      reportedBrand: product.brand,
      verifiedProductSlug: product.slug,
      cheapestChain: cheapest?.chain ?? product.lowestChain,
      cheapestPrice,
      expensiveChain: priciest?.chain ?? '',
      expensivePrice,
      priceGap: expensivePrice - cheapestPrice,
      spreadPct: product.spreadPct,
      evidenceLabel: `${pricedRows.length} matched chain prices`
    };
  })
  .filter((row) => row.priceGap > 0)
  .sort((a, b) => b.priceGap - a.priceGap || b.spreadPct - a.spreadPct)
  .slice(0, 8);

export const keyMetrics = [
  { label: 'Verified price rows', value: (axfoodProducts.length + pricedProducts.length).toLocaleString('sv-SE'), detail: 'Axfood products plus OpenPrices observations rendered from generated modules.' },
  { label: 'Matched Willys/Hemköp products', value: matchedChainProducts.length.toLocaleString('sv-SE'), detail: 'Only products present in both chain catalogues are compared.' },
  { label: 'Sweden stores', value: osmStores.length.toLocaleString('sv-SE'), detail: 'Physical stores from the Sweden-wide OSM Overpass extract.' },
  { label: 'Categories with data', value: categorySummaries.length.toLocaleString('sv-SE'), detail: 'Categories containing at least one verified product row.' }
];

export const unavailablePanels = [
  {
    title: 'Household profiles',
    detail: 'No verified household account records are bundled with this static website. The UI therefore hides names, budgets, dietary preferences, and notification preferences instead of inventing them.'
  },
  {
    title: 'Receipt scanner queue',
    detail: 'No production receipt-review records are present in the repo snapshot. Scanner routes show connector status and source coverage only.'
  },
  {
    title: 'Coupons and loyalty offers',
    detail: 'No authenticated coupon feed is ingested. Coupon pages show the currently verified chain-price spread surface, not fictional promotions.'
  }
];

export const basketImportExportContract = {
  endpoint: '/api/basket/import-export',
  title: 'Bookmarklet import/export',
  status: 'implemented_account_api',
  sourceKinds: ['bookmarklet', 'browser_extension', 'copy_paste'],
  staticAsset: '/bookmarklets/groceryview-basket-import.js',
  requiredInputs: [
    'signed-in userId',
    'explicit shopper consent before retailer page content is read',
    'retailerId, source origin, capturedAt timestamp, and captured retailer basket rows',
    'raw retailer item names plus quantities and optional GroceryView product ids or product URLs'
  ],
  shippedBehaviors: [
    'Imports only rows matched to verified GroceryView product ids or aliases.',
    'Leaves unmatched retailer rows in review instead of silently creating verified products.',
    'Returns copyable export text for matched lines so shoppers can move baskets between contexts.',
    'Supports bookmarklet and future browser_extension payloads through the same account API contract.'
  ],
  blockedInStaticSnapshot: [
    'No retailer page DOM is read by this static build.',
    'No private account basket is imported without production authentication.',
    'No unmatched retailer row is treated as verified catalogue evidence.'
  ]
};

export const basketImportReviewContract = {
  endpoint: '/api/basket/import-review',
  decisionEndpoint: '/api/basket/import-review/{reviewItemId}/decisions',
  title: 'Account-bound import review',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId from the authenticated session',
    'reviewItemId created from a consented bookmarklet or browser-extension import',
    'shopper decision to accept a verified GroceryView product match or dismiss the retailer row',
    'verified GroceryView productId before any unmatched retailer row can update the basket'
  ],
  shippedBehaviors: [
    'Lists only the signed-in shopper’s open retailer import review rows.',
    'Persists open and resolved review rows through the PostgreSQL-backed runtime repository when DATABASE_URL is configured.',
    'Keeps unmatched retailer rows stay out of the basket until a signed-in shopper accepts a verified GroceryView product match.',
    'Allows dismissing retailer-only rows without converting them into verified products.',
    'Marks accepted and dismissed rows resolved so they leave the open review queue.'
  ],
  blockedInStaticSnapshot: [
    'No private review queue rows are bundled with this static build.',
    'No unmatched retailer name is added to a basket without signed-in acceptance.',
    'No review row from one account is visible to another account.'
  ]
};

export const retailerHandoffContract = {
  endpoint: '/api/basket/handoff/{retailerId}',
  title: 'Retailer handoff support matrix',
  status: 'implemented_account_api',
  supportedRetailers: [
    { retailerId: 'willys', label: 'Willys', productLinks: 'supported', basketTransfer: 'unsupported', checkoutConfirmation: 'unsupported' },
    { retailerId: 'coop', label: 'Coop', productLinks: 'supported', basketTransfer: 'unsupported', checkoutConfirmation: 'unsupported' },
    { retailerId: 'lidl', label: 'Lidl', productLinks: 'manual', basketTransfer: 'unsupported', checkoutConfirmation: 'unsupported' }
  ],
  requiredInputs: [
    'signed-in userId',
    'target retailerId with a verified support-matrix entry',
    'current basket product ids, product names, quantities, and optional retailer product links',
    'explicit retailer capability flags for product links, basket transfer, app search, copy list, and checkout confirmation'
  ],
  shippedBehaviors: [
    'Builds a prioritized handoff plan with copy-list, product-link, retailer app search, and basket-transfer actions.',
    'Marks basket transfer unsupported unless a retailer capability is verified in the support matrix.',
    'Keeps unmatched basket lines visible for manual shopper review before leaving GroceryView.',
    'States that checkout confirmation is unavailable so GroceryView cannot claim purchase completion.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated household basket is bundled with this static build.',
    'No retailer checkout session, delivery slot, or purchase confirmation is rendered from static data.',
    'No automatic retailer basket transfer is advertised without verified retailer support.'
  ]
};

export const retailerBasketTransferContract = {
  endpoint: '/api/basket/transfer/{retailerId}',
  title: 'Secure basket transfer preflight',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'target retailerId from the verified support matrix',
    'current basket product ids, quantities, verified retailer product matches, and product URLs',
    'verified retailer basket-transfer capability, endpoint, signed payload, and active shopper retailer session'
  ],
  shippedBehaviors: [
    'Preflights basket transfer and blocks unless capability is verified as supported.',
    'Requires every basket line to have a verified retailer product match and product URL.',
    'Returns copy-list and product-link fallback paths through the handoff surface when transfer is blocked.',
    'Keeps transfer attempts separate from checkout confirmation, payment, delivery booking, and inventory reservation.'
  ],
  blockedInStaticSnapshot: [
    'No retailer currently has verified automatic basket transfer enabled in the public static snapshot.',
    'No unsupported retailer transfer endpoint is called from GroceryView.',
    'No basket transfer is described as checkout completion or purchase confirmation.'
  ]
};

export const basketTripCostContract = {
  endpoint: '/api/basket/trip-cost',
  title: 'Basket + trip cost optimizer',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'current basket quantities and favorite-store choices',
    'travelMode plus optional time, vehicle, transit, delivery, and split-shop cost settings',
    'current verified shelf totals for every ranked basket strategy'
  ],
  shippedBehaviors: [
    'Ranks complete basket strategies by shelf total plus explicit travel and time cost.',
    'Shows trip cost separately from verified shelf totals so price evidence stays auditable.',
    'Keeps missing-price options out of complete rankings even when travel looks cheap.',
    'Labels split-shop penalties instead of hiding extra effort inside product prices.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated home location, travel mode, or saved basket is bundled with this static build.',
    'No retailer delivery or checkout confirmation is claimed from optimizer output.',
    'No precise user location is rendered without explicit signed-in consent.'
  ]
};

export const elderlyNearestDeliveryPlanner = {
  persona: 'Elderly / seniors',
  title: 'Nearest-store + delivery options',
  status: 'static_public_planner',
  mobilitySupport: [
    { label: 'Nearest verified store', evidence: 'uses OSM store records and public district labels before any private home location is requested' },
    { label: 'Delivery fallback', evidence: 'routes shoppers to fulfillment slot evidence when walking or transit effort is too high' },
    { label: 'Pickup fallback', evidence: 'keeps pickup separate from delivery and requires retailer checkout confirmation' }
  ],
  guardrails: [
    'no private home location is bundled with the static snapshot',
    'store distance is not personalized until a signed-in shopper consents',
    'delivery and pickup options are evidence only, not retailer reservations'
  ]
};

export const budgetCheapestStoreRoutingPlanner = {
  persona: 'Budget-conscious / low-income',
  title: 'Cheapest-store-for-my-list routing',
  status: 'account_api_guardrail_surface',
  routeRankInputs: [
    'signed-in shopping list with verified product ids and quantities',
    'favorite or reachable store ids selected from verified GroceryView stores',
    'complete basket totals from the trip-cost optimizer for every ranked option',
    'explicit travel mode and shopper-approved location or district context'
  ],
  storeListGuardrails: [
    'No private home location is read or rendered in the public static snapshot.',
    'Stores with missing basket prices remain blockers instead of being ranked as cheapest.',
    'Routing ranks basket plus trip cost; it does not claim checkout, stock, or delivery reservation.',
    'Cheapest-store copy must link back to verified shelf-total and travel-cost evidence.'
  ],
  nextStep: 'Use the account-only basket trip-cost endpoint once a shopper signs in, consents to location context, and has a current list.'
};

export const fulfillmentSlotsContract = {
  endpoint: '/api/basket/fulfillment-slots/{retailerId}/{storeId}',
  title: 'Delivery and pickup slot evidence',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'retailerId and storeId selected from verified GroceryView store records',
    'shopper consent for manually captured retailer slot evidence',
    'capturedAt and asOf timestamps for every delivery or pickup availability snapshot'
  ],
  shippedBehaviors: [
    'Separates pickup and delivery availability evidence from basket pricing and trip-cost ranking.',
    'Returns only currently available slots in the available slot list while retaining unavailable-slot blockers.',
    'Labels every slot report as evidence, not retailer reservations or checkout completion.',
    'Requires shoppers to re-confirm delivery or pickup availability inside the retailer checkout.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated private basket or retailer session is bundled with this static build.',
    'No delivery or pickup slot is presented as reserved, booked, or guaranteed.',
    'No retailer checkout is completed or claimed from static evidence snapshots.'
  ]
};

export const recurringBasketDigestContract = {
  endpoint: '/api/basket/recurring-digest',
  title: 'Recurring basket digest',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'saved weekly basket item quantities',
    'templateId, templateName, cadence, and asOf timestamp',
    'current and previous verified product prices'
  ],
  shippedBehaviors: [
    'Changed since last shop totals are computed only from comparable verified lines.',
    'Price-up, price-down, substitute-available, new-item, and missing-current-price states are separated.',
    'Suggested substitutes require review and never rewrite a recurring basket automatically.',
    'Missing-price blockers stay visible and block automatic checkout handoff.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated household basket is bundled with this static build.',
    'No private purchase history is rendered without a production auth session.',
    'No checkout or retailer handoff is claimed from a digest response.'
  ]
};

export type PrivateFeatureRoute =
  | 'weekly-basket'
  | 'watchlist'
  | 'scanner'
  | 'household'
  | 'account'
  | 'account-profile'
  | 'basket-ideas'
  | 'coupon-stacks'
  | 'deals'
  | 'meal-planner'
  | 'nutrition-value'
  | 'pantry-planner'
  | 'price-reports'
  | 'savings-dashboard'
  | 'shopping-trips'
  | 'privacy';

export const privateFeatureCopy: Record<PrivateFeatureRoute, { verifiedSurface: string; gatedBy: string; nextStep: string }> = {
  'weekly-basket': {
    verifiedSurface: 'The page can compare verified Willys/Hemkop spreads and source coverage, but it cannot assemble a household basket without authenticated pantry and quantity records.',
    gatedBy: 'Requires a real household profile, saved staples, and opt-in purchase history before totals or substitutions are shown.',
    nextStep: 'Connect authenticated basket records, then render item-level totals with source timestamps beside every price.'
  },
  watchlist: {
    verifiedSurface: 'The public snapshot supports product spread browsing, but it does not know which products a shopper personally follows.',
    gatedBy: 'Requires signed-in watchlist records and notification consent before alerts can be personalized.',
    nextStep: 'Store verified watchlist preferences first, then show only alerts backed by current chain or OpenPrices rows.'
  },
  scanner: {
    verifiedSurface: 'Scanner routes can explain coverage and price sources, but no production receipt images or review queue rows are bundled.',
    gatedBy: 'Requires uploaded receipts, parser output, and human review status before line-item corrections appear.',
    nextStep: 'Add receipt review records with redacted merchant metadata, then expose the queue with confidence labels.'
  },
  household: {
    verifiedSurface: 'The static build can show public grocery data, not household members, budgets, diets, or location preferences.',
    gatedBy: 'Requires authenticated account records and explicit household sharing settings.',
    nextStep: 'Load profile fields from production auth, then render only confirmed preferences and consent states.'
  },
  account: {
    verifiedSurface: 'The account page stays browse-only because this repository snapshot has no verified user identity records.',
    gatedBy: 'Requires a production auth session plus alert, privacy, and subscription records.',
    nextStep: 'Wire the sign-in flow before showing account settings, saved areas, or message preferences.'
  },
  'account-profile': {
    verifiedSurface: 'The profile page can explain why account data is absent, but it cannot show names, emails, saved areas, or household roles from this static snapshot.',
    gatedBy: 'Requires a signed production session and verified account profile record before personal details are rendered.',
    nextStep: 'Load profile fields from authenticated storage, then show only confirmed identity, consent, and saved-area metadata.'
  },
  'basket-ideas': {
    verifiedSurface: 'The app can rank public price spreads, but it cannot suggest personal baskets without real household goals.',
    gatedBy: 'Requires saved staples, dietary constraints, and accepted substitutions before basket ideas are personalized.',
    nextStep: 'Combine verified profile preferences with current product rows, then label every suggestion by source confidence.'
  },
  'coupon-stacks': {
    verifiedSurface: 'The static snapshot has chain prices but no authenticated coupons, loyalty balances, or receipt bonuses.',
    gatedBy: 'Requires a coupon feed tied to a real account before stacked savings can be counted.',
    nextStep: 'Ingest coupon eligibility and expiry data, then separate guaranteed discounts from receipt-pending bonuses.'
  },
  deals: {
    verifiedSurface: 'Deal radar can point to verified chain-price spreads, but private deal decisions need shopper-specific thresholds.',
    gatedBy: 'Requires saved stores, stock-up rules, and notification consent before deal pushes are shown.',
    nextStep: 'Attach user thresholds to verified product rows, then show deal rationale with price-source caveats.'
  },
  'meal-planner': {
    verifiedSurface: 'Verified product rows can support ingredient research, but meal plans need real preferences and portions.',
    gatedBy: 'Requires dietary preferences, household size, and accepted recipe substitutions.',
    nextStep: 'Load signed-in meal constraints, then build plans only from products with current source coverage.'
  },
  'nutrition-value': {
    verifiedSurface: 'The static snapshot has price data, not complete nutrition labels for every rendered product.',
    gatedBy: 'Requires verified nutrition facts matched to each product code before nutrition-per-krona rankings are shown.',
    nextStep: 'Join nutrition labels to product identifiers, then rank only rows with both price and nutrition evidence.'
  },
  'pantry-planner': {
    verifiedSurface: 'Pantry planning is withheld because the app does not know current household inventory or shelf-life rules.',
    gatedBy: 'Requires saved pantry counts, preferred stores, and real replenishment cadence.',
    nextStep: 'Sync pantry records first, then show restock recommendations with verified price and freshness context.'
  },
  'price-reports': {
    verifiedSurface: 'Public report pages can summarize generated sources, but no private report subscriptions are present.',
    gatedBy: 'Requires subscribed audiences, send approvals, and report history before personalized reports appear.',
    nextStep: 'Store report recipients and approval records, then attach each report claim to a generated data source.'
  },
  'savings-dashboard': {
    verifiedSurface: 'The dashboard can show public coverage, not personal avoided spend or budget progress.',
    gatedBy: 'Requires real baskets, receipts, and baseline prices before savings totals are calculated.',
    nextStep: 'Backfill verified purchase history, then compute savings only from reviewed transactions.'
  },
  'shopping-trips': {
    verifiedSurface: 'Store and price rows are available, but route planning needs real saved locations and trip constraints.',
    gatedBy: 'Requires saved areas, transport mode, store preferences, and consent to use location context.',
    nextStep: 'Connect signed-in trip preferences, then show only trips with current store and product evidence.'
  },
  privacy: {
    verifiedSurface: 'The privacy page avoids pretend toggles because no authenticated consent records are loaded in this snapshot.',
    gatedBy: 'Requires real user consent state and account identity before controls can be changed.',
    nextStep: 'Read privacy preferences from production auth, then render controls with audit timestamps.'
  }
};

export function findProduct(slug: string) {
  return axfoodProducts.find((product) => product.slug === slug) ?? pricedProducts.find((product) => product.slug === slug);
}

export function findStore(slug: string) {
  return osmStores.find((store) => store.slug === slug);
}

export function chainPriceRows(product: (typeof axfoodProducts)[number]) {
  return Object.entries(product.chains)
    .map(([chain, price]) => ({ chain, ...price }))
    .filter((row) => typeof row.price === 'number');
}
