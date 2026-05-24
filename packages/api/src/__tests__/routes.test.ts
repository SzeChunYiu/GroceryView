import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPriceObservationDto,
  basketCompareEndpoint,
  buildFacetedProductSearch,
  buildFlyerOfferReport,
  buildProductLatestPrices,
  buildProductCheapestNowReport,
  buildProductPriceHistoryReport,
  facetedProductSearchEndpoint,
  productCheapestNowEndpoint,
  buildRealBrandPriceIndices,
  buildRealCategoryPriceIndices,
  buildRealChainPriceIndices,
  buildRealBasketComparison,
  createGroceryViewApi,
  productPriceHistoryEndpoint,
  realBrandPriceIndicesEndpoint,
  realCategoryPriceIndicesEndpoint,
  realChainPriceIndicesEndpoint,
  productPriceHistoryPriceTypes,
  savedBasketCompareEndpoint,
  validatePriceObservationDto,
  type RealCatalogSearchPriceRow
} from '../index.js';

describe('createGroceryViewApi', () => {
  const realRows: RealCatalogSearchPriceRow[] = [
    {
      productId: 'product-milk',
      slug: 'standardmjolk-1l',
      canonicalName: 'Standardmjolk 3% 1 l',
      brand: 'Arla',
      categoryPath: ['Dairy', 'Milk'],
      packageSize: 1,
      packageUnit: 'l',
      comparableUnit: 'l',
      observationId: 'obs-milk-willys',
      price: 14.9,
      unitPrice: 14.9,
      currency: 'SEK',
      priceType: 'shelf',
      confidence: 0.94,
      observedAt: '2026-05-21T09:00:00.000Z',
      chainId: 'chain-willys',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeId: 'store-willys',
      storeSlug: 'willys-hemma-stockholm-torsplan',
      storeName: 'Willys Hemma Stockholm Torsplan'
    },
    {
      productId: 'product-milk',
      slug: 'standardmjolk-1l',
      canonicalName: 'Standardmjolk 3% 1 l',
      brand: 'Arla',
      categoryPath: ['Dairy', 'Milk'],
      packageSize: 1,
      packageUnit: 'l',
      comparableUnit: 'l',
      observationId: 'obs-milk-coop',
      price: 15.5,
      unitPrice: 15.5,
      currency: 'SEK',
      priceType: 'shelf',
      confidence: 0.91,
      observedAt: '2026-05-21T08:00:00.000Z',
      chainId: 'chain-coop',
      chainSlug: 'coop',
      chainName: 'Coop',
      storeId: 'store-coop',
      storeSlug: 'coop-odenplan',
      storeName: 'Coop Odenplan'
    },
    {
      productId: 'product-butter',
      slug: 'smor-500g',
      canonicalName: 'Smor 500 g',
      categoryPath: ['Dairy', 'Butter'],
      packageSize: 500,
      packageUnit: 'g',
      comparableUnit: 'kg',
      observationId: 'obs-butter-willys',
      price: 54.9,
      unitPrice: 109.8,
      currency: 'SEK',
      priceType: 'shelf',
      confidence: 0.9,
      observedAt: '2026-05-21T09:10:00.000Z',
      chainId: 'chain-willys',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeId: 'store-willys',
      storeSlug: 'willys-hemma-stockholm-torsplan',
      storeName: 'Willys Hemma Stockholm Torsplan'
    }
  ];

  it('builds store detail reports with opening hours and category-sorted assortment items', () => {
    const api = createGroceryViewApi();

    const detail = api.getStoreDetail('willys-odenplan');

    assert.equal(detail?.id, 'willys-odenplan');
    assert.equal(detail?.name, 'Willys Odenplan');
    assert.equal(detail?.store.id, 'willys-odenplan');
    assert.equal(detail?.store.address, 'Odenplan, Stockholm');
    assert.deepEqual(detail?.openingHours, ['Mon-Fri 08:00-22:00', 'Sat-Sun 09:00-21:00']);
    assert.deepEqual(detail?.assortment.items.map((item) => [item.category, item.productId, item.priceLabel]), [
      ['coffee', 'coffee', 'verified_shelf'],
      ['dairy', 'milk', 'verified_shelf'],
      ['dairy', 'butter', 'verified_shelf'],
      ['dairy', 'private-label-milk', 'verified_shelf']
    ]);
    assert.deepEqual(detail?.assortment.categories.map((category) => [category.category, category.itemCount]), [
      ['coffee', 1],
      ['dairy', 3]
    ]);
    assert.match(detail?.guardrails[0] ?? '', /verified shelf price rows/i);
    assert.equal(api.getStoreDetail('missing-store'), null);
  });

  it('returns supported retailer labels with logo and website metadata', () => {
    const api = createGroceryViewApi();

    assert.deepEqual(api.getRetailers().map((retailer) => [retailer.id, retailer.name, retailer.logo, retailer.websiteUrl]), [
      ['city-gross', 'City Gross', '/retailers/city-gross.svg', 'https://www.citygross.se/'],
      ['coop', 'Coop', '/retailers/coop.svg', 'https://www.coop.se/'],
      ['hemkop', 'Hemköp', '/retailers/hemkop.svg', 'https://www.hemkop.se/'],
      ['ica', 'ICA', '/retailers/ica.svg', 'https://www.ica.se/'],
      ['lidl', 'Lidl', '/retailers/lidl.svg', 'https://www.lidl.se/'],
      ['netto', 'Netto', '/retailers/netto.svg', 'https://www.coop.se/'],
      ['willys', 'Willys', '/retailers/willys.svg', 'https://www.willys.se/']
    ]);
  });

  it('returns category navigation tree nodes with product counts', () => {
    const api = createGroceryViewApi();

    assert.deepEqual(api.getCategories(), [
      { id: 'coffee', name: 'Coffee', slug: 'coffee', parentId: null, itemCount: 1 },
      { id: 'dairy', name: 'Dairy', slug: 'dairy', parentId: null, itemCount: 3 }
    ]);
  });

  it('builds product price-history reports from persisted observation inputs', () => {
    assert.deepEqual(productPriceHistoryPriceTypes, ['shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'estimated']);
    assert.deepEqual(productPriceHistoryEndpoint, {
      method: 'GET',
      controllerPath: 'products/:productId',
      actionPath: 'price-history',
      path: '/products/:productId/price-history',
      queryParams: ['priceType', 'chain', 'store', 'sourceRun', 'minConfidence', 'from', 'to', 'limit']
    });

    const report = buildProductPriceHistoryReport([
      {
        observationId: 'obs-coffee-new',
        productId: 'product-coffee',
        productSlug: 'bryggkaffe-450g',
        productName: 'Bryggkaffe mellanrost 450 g',
        chainId: 'chain-willys',
        chainSlug: 'willys',
        chainName: 'Willys',
        storeId: 'store-willys',
        storeSlug: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        priceType: 'promotion',
        price: 49.9,
        regularPrice: 59.9,
        unitPrice: 110.89,
        currency: 'SEK',
        memberRequired: false,
        observedAt: '2026-05-19T09:00:00.000Z',
        confidence: 0.94,
        provenance: { source: 'open_prices', rawSnapshotRef: 's3://raw/coffee-new.html' }
      },
      {
        observationId: 'obs-coffee-old',
        productId: 'product-coffee',
        productSlug: 'bryggkaffe-450g',
        productName: 'Bryggkaffe mellanrost 450 g',
        chainId: 'chain-willys',
        storeId: 'store-willys',
        priceType: 'shelf',
        price: 59.9,
        unitPrice: 133.11,
        currency: 'SEK',
        memberRequired: false,
        observedAt: '2026-05-01T09:00:00.000Z',
        confidence: 0.91,
        provenance: { source: 'open_prices', rawSnapshotRef: 's3://raw/coffee-old.html' }
      }
    ], { priceType: 'shelf', chain: 'willys', store: 'willys-odenplan', sourceRun: 'run-open-prices-1', minConfidence: 0.9, limit: 100 });

    assert.equal(report?.productSlug, 'bryggkaffe-450g');
    assert.deepEqual(report?.evidence, {
      observationCount: 2,
      sourceTables: ['products', 'observations', 'chains', 'stores']
    });
    assert.deepEqual(report?.points.map((point) => point.observationId), ['obs-coffee-old', 'obs-coffee-new']);
    assert.deepEqual(report?.points.at(-1), {
      observationId: 'obs-coffee-new',
      productId: 'product-coffee',
      productSlug: 'bryggkaffe-450g',
      productName: 'Bryggkaffe mellanrost 450 g',
      chainId: 'chain-willys',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeId: 'store-willys',
      storeSlug: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      priceType: 'promotion',
      price: 49.9,
      regularPrice: 59.9,
      unitPrice: 110.89,
      currency: 'SEK',
      memberRequired: false,
      observedAt: '2026-05-19T09:00:00.000Z',
      confidence: 0.94,
      provenance: { source: 'open_prices', rawSnapshotRef: 's3://raw/coffee-new.html' }
    });
    assert.deepEqual(report?.priceTypes, ['promotion', 'shelf']);
    assert.deepEqual(report?.filters, {
      priceType: 'shelf',
      chain: 'willys',
      store: 'willys-odenplan',
      sourceRun: 'run-open-prices-1',
      minConfidence: 0.9,
      limit: 100
    });
    assert.equal(report?.summary?.latestPrice, 49.9);
    assert.equal(report?.summary?.changeFromPrevious, -10);
    assert.equal(report?.guardrails.some((guardrail) => /persisted observation rows/i.test(guardrail)), true);
  });

  it('builds faceted search responses from persisted catalog and latest price rows', () => {
    assert.deepEqual(facetedProductSearchEndpoint, {
      method: 'GET',
      controllerPath: 'products',
      actionPath: 'search/faceted',
      path: '/products/search/faceted',
      queryParams: ['q', 'category', 'brand', 'label', 'chain', 'store', 'priceType', 'minPrice', 'maxPrice', 'inStockOnly', 'minConfidence', 'limit']
    });

    const result = buildFacetedProductSearch({
      rows: realRows,
      filters: { query: 'mjolk', categories: ['Dairy'], chains: ['willys'], limit: 10 }
    });

    assert.equal(result.count, 1);
    assert.equal(result.products[0]?.productId, 'product-milk');
    assert.equal(result.products[0]?.cheapestPrice, 14.9);
    assert.equal(result.products[0]?.currentPrices[0]?.observationId, 'obs-milk-willys');
    assert.equal(result.products[0]?.currentPrices[0]?.isAvailable, true);
    assert.deepEqual(result.filters.labels, []);
    assert.equal(result.products[0]?.currentPrices.some((price) => price.chainSlug === 'coop'), false);
    assert.deepEqual(result.facets.categories.find((facet) => facet.value === 'Dairy'), { value: 'Dairy', count: 1 });
    assert.deepEqual(result.facets.chains.find((facet) => facet.value === 'willys'), { value: 'willys', label: 'Willys', count: 1 });
    assert.deepEqual(result.facets.priceRange, { min: 14.9, max: 14.9 });
    assert.deepEqual(result.evidence.sourceTables, ['products', 'latest_prices', 'chains', 'stores']);
  });

  it('applies label, unit-price, in-stock, and confidence filters for faceted search', () => {
    const result = buildFacetedProductSearch({
      rows: [
        {
          productId: 'product-yogurt',
          slug: 'naturell-yoghurt-1kg',
          canonicalName: 'Naturell yoghurt 1 kg',
          brand: 'Arla',
          categoryPath: ['Dairy', 'Yogurt'],
          labels: ['keyhole', 'lactose_free'],
          packageSize: 1,
          packageUnit: 'kg',
          comparableUnit: 'kg',
          observationId: 'obs-yogurt-willys',
          price: 32,
          unitPrice: 32,
          currency: 'SEK',
          priceType: 'online',
          confidence: 0.96,
          observedAt: '2026-05-21T09:00:00.000Z',
          isAvailable: true,
          chainId: 'chain-willys',
          chainSlug: 'willys',
          chainName: 'Willys'
        },
        {
          productId: 'product-yogurt',
          slug: 'naturell-yoghurt-1kg',
          canonicalName: 'Naturell yoghurt 1 kg',
          brand: 'Arla',
          categoryPath: ['Dairy', 'Yogurt'],
          labels: ['keyhole', 'lactose_free'],
          packageSize: 1,
          packageUnit: 'kg',
          comparableUnit: 'kg',
          observationId: 'obs-yogurt-coop-low-confidence',
          price: 31,
          unitPrice: 31,
          currency: 'SEK',
          priceType: 'online',
          confidence: 0.6,
          observedAt: '2026-05-21T09:00:00.000Z',
          isAvailable: true,
          chainId: 'chain-coop',
          chainSlug: 'coop',
          chainName: 'Coop'
        },
        {
          productId: 'product-cereal',
          slug: 'flingor-500g',
          canonicalName: 'Flingor 500 g',
          brand: 'Garant',
          categoryPath: ['Pantry', 'Breakfast'],
          labels: ['vegan'],
          packageSize: 500,
          packageUnit: 'g',
          comparableUnit: 'kg',
          observationId: 'obs-cereal-willys',
          price: 28,
          unitPrice: 56,
          currency: 'SEK',
          priceType: 'online',
          confidence: 0.97,
          observedAt: '2026-05-21T09:00:00.000Z',
          isAvailable: false,
          chainId: 'chain-willys',
          chainSlug: 'willys',
          chainName: 'Willys'
        }
      ],
      filters: {
        query: 'yoghurt',
        labels: ['keyhole'],
        minPrice: 30,
        maxPrice: 35,
        inStockOnly: true,
        minConfidence: 0.9,
        limit: 10
      }
    });

    assert.deepEqual(result.filters.labels, ['keyhole']);
    assert.equal(result.filters.inStockOnly, true);
    assert.equal(result.filters.minConfidence, 0.9);
    assert.equal(result.count, 1);
    assert.equal(result.products[0]?.productId, 'product-yogurt');
    assert.deepEqual(result.products[0]?.labels, ['keyhole', 'lactose_free']);
    assert.deepEqual(result.products[0]?.currentPrices.map((price) => price.observationId), ['obs-yogurt-willys']);
    assert.deepEqual(result.facets.labels.find((facet) => facet.value === 'keyhole'), { value: 'keyhole', count: 1 });
    assert.deepEqual(result.facets.priceRange, { min: 32, max: 32 });
    assert.equal(result.evidence.latestPriceCount, 1);
  });

  it('carries latest_prices availability into faceted product cards for out-of-stock badges', () => {
    const result = buildFacetedProductSearch({
      rows: [
        {
          productId: 'product-coffee',
          slug: 'bryggkaffe-450g',
          canonicalName: 'Bryggkaffe 450 g',
          brand: 'Rosteriet',
          categoryPath: ['Pantry', 'Coffee'],
          packageSize: 450,
          packageUnit: 'g',
          comparableUnit: 'kg',
          observationId: 'obs-coffee-out',
          price: 49.9,
          unitPrice: 110.8889,
          currency: 'SEK',
          priceType: 'online',
          confidence: 0.95,
          observedAt: '2026-05-21T10:00:00.000Z',
          chainId: 'chain-coop',
          chainSlug: 'coop',
          chainName: 'Coop',
          isAvailable: false
        }
      ]
    });

    assert.equal(result.products[0]?.currentPrices[0]?.isAvailable, false);
    assert.equal(result.products[0]?.isAvailable, false);
    assert.equal(result.evidence.availableLatestPriceCount, 0);
    assert.equal(result.evidence.outOfStockLatestPriceCount, 1);
  });

  it('keeps unpriced catalog rows unpriced in faceted search responses', () => {
    const result = buildFacetedProductSearch({
      rows: [
        ...realRows,
        {
          productId: 'product-oats',
          slug: 'havregryn-1kg',
          canonicalName: 'Havregryn 1 kg',
          brand: 'Axa',
          categoryPath: ['Pantry', 'Breakfast'],
          packageSize: 1,
          packageUnit: 'kg',
          comparableUnit: 'kg'
        }
      ],
      filters: { query: 'havre', limit: 10 }
    });

    const oats = result.products.find((product) => product.productId === 'product-oats');
    assert.equal(oats?.cheapestPrice, null);
    assert.deepEqual(oats?.currentPrices, []);
    assert.equal(result.evidence.latestPriceCount, 0);
  });

  it('builds basket comparisons from latest price rows without estimated fallback prices', () => {
    assert.deepEqual(basketCompareEndpoint, {
      method: 'POST',
      controllerPath: '',
      actionPath: 'baskets/compare',
      path: '/baskets/compare',
      bodyFields: ['items', 'storeSlugs']
    });
    assert.deepEqual(savedBasketCompareEndpoint, {
      method: 'GET',
      controllerPath: '',
      actionPath: 'users/:userId/basket/compare',
      path: '/users/:userId/basket/compare',
      pathParams: ['userId'],
      queryParams: ['stores']
    });

    const report = buildRealBasketComparison({
      userId: 'user-1',
      selectedStoreSlugs: ['willys-hemma-stockholm-torsplan', 'coop-odenplan'],
      items: [
        { productId: ' product-milk ', quantity: 2 },
        { productId: 'product-butter', quantity: 1 },
        { productId: 'product-missing', quantity: 1 }
      ],
      latestPrices: realRows
    });

    assert.equal(report.userId, 'user-1');
    assert.equal(report.strategies[0]?.total, null);
    assert.deepEqual(report.strategies[0]?.assignments.map((assignment) => ({
      productId: assignment.productId,
      storeSlug: assignment.storeSlug,
      lineTotal: assignment.lineTotal,
      priceLabel: assignment.priceLabel
    })), [
      {
        productId: 'product-milk',
        storeSlug: 'willys-hemma-stockholm-torsplan',
        lineTotal: 29.8,
        priceLabel: 'verified_latest_price'
      },
      {
        productId: 'product-butter',
        storeSlug: 'willys-hemma-stockholm-torsplan',
        lineTotal: 54.9,
        priceLabel: 'verified_latest_price'
      },
      { productId: 'product-missing', storeSlug: null, lineTotal: null, priceLabel: 'missing_price' }
    ]);
    assert.deepEqual(report.missingProductIds, ['product-missing']);
    assert.match(report.strategies[0]?.warnings[0] ?? '', /missing persisted latest_prices/i);
    assert.deepEqual(report.evidence, {
      basketSource: 'request_body',
      latestPriceCount: realRows.length,
      sourceTables: ['products', 'latest_prices', 'stores']
    });
  });

  it('keeps real partial single-store basket quotes visible without estimating missing prices', () => {
    const report = buildRealBasketComparison({
      selectedStoreSlugs: ['coop-odenplan'],
      items: [
        { productId: 'product-milk', quantity: 2 },
        { productId: 'product-butter', quantity: 1 }
      ],
      latestPrices: realRows
    });

    assert.equal(report.strategies[1]?.id, 'all_at_one_store');
    assert.equal(report.strategies[1]?.total, null);
    assert.deepEqual(report.strategies[1]?.assignments.map((assignment) => ({
      productId: assignment.productId,
      storeSlug: assignment.storeSlug,
      lineTotal: assignment.lineTotal,
      priceLabel: assignment.priceLabel
    })), [
      {
        productId: 'product-milk',
        storeSlug: 'coop-odenplan',
        lineTotal: 31,
        priceLabel: 'verified_latest_price'
      },
      { productId: 'product-butter', storeSlug: 'coop-odenplan', lineTotal: null, priceLabel: 'missing_price' }
    ]);
    assert.deepEqual(report.strategies[1]?.missingProductIds, ['product-butter']);
    assert.match(report.strategies[1]?.warnings[0] ?? '', /without estimating missing prices/i);
  });

  it('keeps catalog metadata for real basket products that lack selected-store latest prices', () => {
    const report = buildRealBasketComparison({
      selectedStoreSlugs: ['coop-odenplan'],
      items: [
        { productId: 'product-milk', quantity: 2 },
        { productId: 'product-oats', quantity: 1 }
      ],
      latestPrices: [
        ...realRows,
        {
          productId: 'product-oats',
          slug: 'havregryn-1kg',
          canonicalName: 'Havregryn 1 kg',
          brand: 'Axa',
          categoryPath: ['Pantry', 'Breakfast'],
          packageSize: 1,
          packageUnit: 'kg',
          comparableUnit: 'kg'
        }
      ]
    });

    const missing = report.strategies[0]?.assignments.find((assignment) => assignment.productId === 'product-oats');
    assert.equal(missing?.slug, 'havregryn-1kg');
    assert.equal(missing?.productName, 'Havregryn 1 kg');
    assert.equal(missing?.lineTotal, null);
    assert.equal(missing?.priceLabel, 'missing_price');
    assert.deepEqual(report.missingProductIds, ['product-oats']);
    assert.equal(report.evidence.latestPriceCount, realRows.length);
  });

  it('builds latest product price rows from persisted latest price inputs', () => {
    const prices = buildProductLatestPrices([
      {
        observationId: 'obs-milk-willys',
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        storeSlug: 'willys-hemma-stockholm-torsplan',
        storeName: 'Willys Hemma Stockholm Torsplan',
        chainSlug: 'willys',
        chainName: 'Willys',
        price: 14.9,
        unitPrice: 14.9,
        currency: 'SEK',
        priceType: 'shelf',
        confidence: 0.94,
        observedAt: '2026-05-21T09:00:00.000Z',
        provenance: { sourceType: 'retailer_api', sourceRunId: 'run-willys' }
      },
      {
        observationId: 'obs-milk-coop',
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        storeSlug: 'coop-odenplan',
        storeName: 'Coop Odenplan',
        chainSlug: 'coop',
        chainName: 'Coop',
        price: 15.5,
        unitPrice: 15.5,
        currency: 'SEK',
        priceType: 'promotion',
        confidence: 0.73,
        observedAt: '2026-05-21T08:00:00.000Z',
        provenance: { sourceType: 'retailer_page' }
      },
      {
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l'
      }
    ]);

    assert.deepEqual(prices.map((row) => [row.observationId, row.storeId, row.price, row.confidence, row.sourceType]), [
      ['obs-milk-willys', 'willys-hemma-stockholm-torsplan', 14.9, 'high', 'retailer_api'],
      ['obs-milk-coop', 'coop-odenplan', 15.5, 'low', 'retailer_page']
    ]);
    assert.equal(prices[0]?.productId, 'standardmjolk-1l');
    assert.equal(prices[0]?.confidenceScore, 0.94);
    assert.deepEqual(prices[0]?.provenance, { sourceType: 'retailer_api', sourceRunId: 'run-willys' });
  });

  it('builds cheapest-now reports from persisted latest price rows', () => {
    assert.deepEqual(productCheapestNowEndpoint, {
      method: 'GET',
      controllerPath: 'products/:productId',
      actionPath: 'cheapest-now',
      path: '/products/:productId/cheapest-now',
      pathParams: ['productId']
    });

    const report = buildProductCheapestNowReport([
      {
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        categoryPath: ['Dairy', 'Milk'],
        comparableUnit: 'l',
        price: 14.9,
        unitPrice: 14.9,
        currency: 'SEK',
        observedAt: '2026-05-21T09:00:00.000Z',
        chainSlug: 'willys',
        chainName: 'Willys',
        storeSlug: 'willys-hemma-stockholm-torsplan',
        storeName: 'Willys Hemma Stockholm Torsplan'
      },
      {
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        categoryPath: ['Dairy', 'Milk'],
        comparableUnit: 'l',
        price: 15.5,
        unitPrice: 15.5,
        currency: 'SEK',
        observedAt: '2026-05-21T08:00:00.000Z',
        chainSlug: 'coop',
        chainName: 'Coop',
        storeSlug: 'coop-odenplan',
        storeName: 'Coop Odenplan'
      },
      {
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        categoryPath: ['Dairy', 'Milk'],
        comparableUnit: 'l',
        price: 13.9,
        unitPrice: 13.9,
        currency: 'SEK',
        observedAt: '2026-05-21T10:00:00.000Z',
        chainSlug: 'willys',
        chainName: 'Willys',
        storeSlug: 'willys-odenplan',
        storeName: 'Willys Odenplan'
      },
      {
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        categoryPath: ['Dairy', 'Milk'],
        comparableUnit: 'l',
        price: 0,
        unitPrice: 0,
        currency: 'SEK',
        observedAt: '2026-05-21T11:00:00.000Z',
        chainSlug: 'lidl',
        chainName: 'Lidl',
        storeSlug: 'lidl-odenplan',
        storeName: 'Lidl Odenplan'
      }
    ]);

    assert.equal(report?.productId, 'product-milk');
    assert.equal(report?.cheapest?.chain, 'willys');
    assert.equal(report?.cheapest?.storeId, 'willys-odenplan');
    assert.deepEqual(report?.chainPrices.map((row) => [row.chain, row.packagePrice]), [
      ['willys', 13.9],
      ['coop', 15.5]
    ]);
    assert.equal(report?.chainCount, 2);
    assert.equal(report?.observedPriceCount, 3);
    assert.equal(report?.lastObservedAt, '2026-05-21T10:00:00.000Z');
    assert.match(report?.guardrails[1] ?? '', /non-positive package\/unit prices/i);
  });

  it('builds real market index reports from persisted current and historical price rows', () => {
    assert.deepEqual(realChainPriceIndicesEndpoint, {
      method: 'GET',
      controllerPath: 'indices',
      actionPath: 'chains',
      path: '/indices/chains'
    });
    assert.deepEqual(realCategoryPriceIndicesEndpoint, {
      method: 'GET',
      controllerPath: 'indices',
      actionPath: 'categories',
      path: '/indices/categories'
    });
    assert.deepEqual(realBrandPriceIndicesEndpoint, {
      method: 'GET',
      controllerPath: 'indices',
      actionPath: 'brands',
      path: '/indices/brands'
    });

    const rows = [
      {
        productId: 'product-coffee',
        productSlug: 'bryggkaffe-450g',
        productName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['coffee'],
        chainSlug: 'willys',
        brand: 'Zoegas',
        currentUnitPrice: 110.89,
        baseUnitPrice: 133.11,
        baseObservedAt: '2026-05-01T09:00:00.000Z',
        currentObservedAt: '2026-05-21T09:00:00.000Z'
      },
      {
        productId: 'product-coffee',
        productSlug: 'bryggkaffe-450g',
        productName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['coffee'],
        chainSlug: 'coop',
        brand: 'Zoegas',
        currentUnitPrice: 133.11,
        currentObservedAt: '2026-05-21T08:00:00.000Z'
      },
      {
        productId: 'product-coffee',
        productSlug: 'bryggkaffe-450g',
        productName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['coffee'],
        chainSlug: 'willys',
        brand: 'Zoegas',
        currentUnitPrice: 121.5,
        currentObservedAt: '2026-05-21T07:00:00.000Z'
      },
      {
        productId: 'product-milk',
        productSlug: 'standardmjolk-1l',
        productName: 'Standardmjolk 3% 1 l',
        categoryPath: ['dairy'],
        chainSlug: 'lidl',
        brand: 'Arla',
        currentUnitPrice: 13.9,
        baseUnitPrice: 16.9,
        baseObservedAt: '2026-05-01T09:00:00.000Z',
        currentObservedAt: '2026-05-21T09:00:00.000Z'
      },
      {
        productId: 'product-private-label-milk',
        productSlug: 'garant-mjolk-1l',
        productName: 'Garant Milk 1 l',
        categoryPath: ['dairy'],
        chainSlug: 'willys',
        brand: 'Garant',
        privateLabelOwner: 'Axfood',
        currentUnitPrice: 12.9,
        baseUnitPrice: 19.9,
        baseObservedAt: '2026-05-02T09:00:00.000Z',
        currentObservedAt: '2026-05-21T10:00:00.000Z'
      }
    ];

    const chains = buildRealChainPriceIndices(rows);
    assert.equal(chains.generatedFrom, 4);
    assert.deepEqual(chains.categories, ['coffee', 'dairy']);
    assert.equal(chains.currency, 'SEK');
    assert.match(chains.guardrails[0], /one cheapest current product price per chain/i);

    const categories = buildRealCategoryPriceIndices(rows);
    assert.deepEqual(categories.indices.map((row) => [row.category, row.value, row.productCount]), [
      ['dairy', 72.83, 2],
      ['coffee', 83.31, 1]
    ]);
    assert.equal(categories.generatedFrom, 3);
    assert.match(categories.guardrails[0], /earliest persisted observations/i);

    const brands = buildRealBrandPriceIndices(rows);
    assert.deepEqual(brands.indices.map((row) => [row.brandTier, row.value, row.categoryCount]), [
      ['standard_private_label', 64.82, 1],
      ['national', 83.19, 2]
    ]);
    assert.equal(brands.privateLabelSavingsPercent, 7.19);
    assert.deepEqual(brands.highestSavingsCategories, ['dairy']);
    assert.equal(brands.generatedFrom, 3);
    assert.match(brands.guardrails[1], /private_label_owner/i);
  });

  it('validates canonical price observation provenance DTOs', () => {
    const baseObservation = {
      observationId: 'obs-coffee-willys-2026-05-20',
      productId: 'coffee',
      retailerId: 'willys',
      storeId: 'willys-odenplan',
      priceType: 'online' as const,
      packagePrice: 49.9,
      unitPrice: 110.89,
      currency: 'SEK' as const,
      quantityBasis: 'kg',
      observedAt: '2026-05-20T08:00:00.000Z',
      validFrom: '2026-05-20T00:00:00.000Z',
      validThrough: '2026-05-26T23:59:59.000Z',
      availability: 'in_stock' as const,
      confidence: 0.92,
      confidenceReasons: ['official_source' as const],
      sourceSurface: 'store_page' as const,
      sourceUrl: 'https://example.test/willys/coffee',
      rawSnapshotRef: {
        uri: 's3://groceryview-raw/willys/coffee/2026-05-20.html',
        contentType: 'text/html',
        retrievedAt: '2026-05-20T08:00:03.000Z',
        contentDigest: {
          algorithm: 'sha-256' as const,
          value: 'sha256-test-digest'
        }
      },
      captureActivityId: 'capture-run-2026-05-20',
      capturedBy: 'worker:data-pipeline',
      legalReviewStatus: 'approved' as const,
      reviewStatus: 'approved' as const
    };

    assert.deepEqual(validatePriceObservationDto(baseObservation), []);
    assert.equal(assertPriceObservationDto(baseObservation).priceType, 'online');

    assert.deepEqual(validatePriceObservationDto({
      ...baseObservation,
      priceType: undefined,
      confidence: 1.2,
      sourceSurface: undefined,
      rawSnapshotRef: undefined
    }), [
      'missing_price_type',
      'invalid_confidence',
      'missing_source_surface',
      'missing_raw_snapshot_ref',
      'missing_content_digest'
    ]);

    assert.deepEqual(validatePriceObservationDto({
      ...baseObservation,
      priceType: 'member',
      confidenceReasons: ['member_only']
    }), ['missing_membership_requirement']);

    assert.throws(() => assertPriceObservationDto({
      ...baseObservation,
      rawSnapshotRef: {
        ...baseObservation.rawSnapshotRef,
        contentDigest: { algorithm: 'sha-256', value: '' }
      }
    }), /missing_content_digest/);
  });

  it('serves market overview, product search, and product details', () => {
    const api = createGroceryViewApi();

    const market = api.getMarketOverview();
    assert.equal(market.city, 'Stockholm');
    assert.ok(market.topDeals.length >= 3);
    assert.equal(market.indices[0].id, 'stockholm-grocery-index');
    assert.deepEqual(
      market.movers.find((mover) => mover.productId === 'coffee'),
      {
        productId: 'coffee',
        ticker: 'ZOEGAS-COFFEE-450G',
        productName: 'Zoégas Coffee 450g',
        currentPrice: 49.9,
        bestStoreId: 'willys-odenplan',
        bestStoreName: 'Willys Odenplan',
        oneMonthMovePercent: -16.7,
        range52Week: { low: 49.9, high: 69.9 },
        range52WeekPositionPercent: 0,
        stockholmMedianGap: -10,
        historyPoints: 3,
        verifiedHistoryPoints: 3
      }
    );
    assert.deepEqual(
      market.movers.find((mover) => mover.productId === 'milk')?.range52Week,
      { low: 13.9, high: 16.9 }
    );
    assert.deepEqual(
      market.topDeals.find((deal) => deal.productId === 'milk'),
      {
        productId: 'milk',
        ticker: 'ARLA-MILK-1L',
        bestPrice: 13.9,
        bestStoreId: 'lidl-sveavagen',
        dealScore: 73,
        band: { label: 'Fair deal', verdict: 'Compare' }
      }
    );

    const fuel = api.getFuelPrices();
    assert.equal(fuel.domain, 'fuel');
    assert.equal(fuel.litreBasis, 1);
    assert.deepEqual(fuel.observations.map((row) => [row.grade, row.pricePerLitre.amount, row.source.kind]), [
      ['98', 20.19, 'operator'],
      ['95', 18.89, 'operator'],
      ['E85', 15.84, 'operator'],
      ['diesel', 21.34, 'operator'],
      ['HVO100', 29.74, 'operator']
    ]);
    assert.equal(fuel.sources[0]?.operatorName, 'St1 Sverige AB');
    assert.match(fuel.guardrails[0], /operator list-price observations/i);

    const search = api.searchProducts('coffee');
    assert.equal(search[0].ticker, 'ZOEGAS-COFFEE-450G');

    const detail = api.getProduct('milk');
    assert.deepEqual(
      detail?.currentPrices.map((price) => price.storeId),
      ['lidl-sveavagen', 'willys-odenplan']
    );
    assert.equal(detail?.dealScore, 73);
  });

  it('serves nutrition-per-krona value rows for customer value comparisons', () => {
    const api = createGroceryViewApi();

    const report = api.getNutritionValueReport('protein');

    assert.equal(report.metric, 'protein');
    assert.equal(report.currency, 'SEK');
    assert.equal(report.rows.length, 3);
    assert.deepEqual(report.rows.map((row) => row.productId), ['chicken', 'eggs', 'yogurt']);
    assert.deepEqual(report.leader, {
      productId: 'chicken',
      name: 'Chicken thighs',
      valuePer10Sek: 22.89,
      saltWarning: true
    });
    assert.match(report.guardrails[0], /nutrition labels cannot override allergen locks/i);
  });

  it('serves deal-based meal suggestions with cost and household guardrails', () => {
    const api = createGroceryViewApi();

    const report = api.getMealPlanSuggestionsReport('user-1', { maxMealCost: 120, servings: 4 });

    assert.equal(report.userId, 'user-1');
    assert.equal(report.currency, 'SEK');
    assert.equal(report.maxMealCost, 120);
    assert.equal(report.servings, 4);
    assert.equal(report.dealCount, 4);
    assert.deepEqual(report.ingredientProductIds, ['chicken', 'pasta', 'tomatoes']);
    assert.deepEqual(report.suggestions, [{
      title: 'Chicken thighs pasta bowl',
      ingredientProductIds: ['chicken', 'pasta', 'tomatoes'],
      estimatedCost: 104.7,
      estimatedCostPerServing: 26.18,
      reason: 'Uses high-scoring current deals across protein, pantry, and vegetables.'
    }]);
    assert.match(report.guardrails[0], /never update a basket/i);
    assert.deepEqual(api.getMealPlanSuggestionsReport('user-1', { maxMealCost: 20 }).suggestions, []);
    assert.throws(() => api.getMealPlanSuggestionsReport('user-1', { servings: 0 }), /servings must be positive/);
  });

  it('persists only opted-in friend-shared deal signals for recommendations', () => {
    const api = createGroceryViewApi();

    const report = api.createFriendDealShareSignal('user-1', {
      productId: 'coffee',
      scope: 'friend',
      signal: 'price_drop',
      consented: true,
      sourceDisplayName: 'Alex',
      note: 'Willys shelf dropped today',
      sharedAt: '2026-05-23T10:00:00.000Z'
    });

    assert.equal(report.userId, 'user-1');
    assert.equal(report.signalCount, 1);
    assert.deepEqual(report.suggestionProductIds, ['coffee']);
    assert.deepEqual(report.signals[0], {
      id: 'friend-deal-user-1-1',
      userId: 'user-1',
      sourceUserId: 'user-1',
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      scope: 'friend',
      signal: 'price_drop',
      consented: true,
      createdAt: '2026-05-23T10:00:00.000Z',
      sourceDisplayName: 'Alex',
      note: 'Willys shelf dropped today'
    });

    const suggestions = api.suggestFriendSharedDeals('user-1');
    assert.equal(suggestions.suggestionCount, 1);
    assert.deepEqual(suggestions.suggestions.map((suggestion) => suggestion.productId), ['coffee']);
    assert.match(suggestions.guardrails[1], /Anonymous or non-consented/i);

    assert.throws(() => api.createFriendDealShareSignal('user-1', {
      productId: 'coffee',
      scope: 'household',
      signal: 'spotted_deal',
      consented: false
    }), /explicit opt-in consent/);
    assert.throws(() => api.createFriendDealShareSignal('user-1', {
      productId: 'coffee',
      scope: 'friend',
      signal: 'coupon',
      consented: true,
      sourceUserId: 'user-2'
    }), /sourceUserId must match/);
  });

  it('serves expiry markdown radar scoped by favorite store and category filters', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'coop-odenplan');

    const report = api.getExpiryDealRadarReport('user-1', {
      now: '2026-05-20T10:00:00.000Z',
      categoryFilter: ['vegetables'],
      maxDistanceKm: 2
    });

    assert.equal(report.userId, 'user-1');
    assert.deepEqual(report.favoriteStoreIds, ['coop-odenplan']);
    assert.deepEqual(report.categoryFilter, ['vegetables']);
    assert.equal(report.maxDistanceKm, 2);
    assert.equal(report.reportCount, 3);
    assert.deepEqual(report.stores.map((store) => store.storeId), ['coop-odenplan']);
    assert.deepEqual(report.stores[0]?.items.map((item) => ({
      id: item.id,
      urgency: item.urgency,
      verification: item.verification,
      savings: item.savings,
      radarScore: item.radarScore
    })), [{
      id: 'expiry-tomatoes-coop',
      urgency: 'expires_soon',
      verification: 'needs_confirmation',
      savings: 15,
      radarScore: 68
    }]);
    assert.deepEqual(report.alerts, []);
    assert.match(report.guardrails[0], /separate from public shelf-price history/i);
    assert.throws(() => api.getExpiryDealRadarReport('user-1', { maxDistanceKm: 0 }), /maxDistanceKm must be positive/);
  });

  it('serves active per-branch flyer offers with source evidence and filters', () => {
    const api = createGroceryViewApi();

    const report = api.getFlyerOffers({
      asOf: '2026-05-20T12:00:00.000Z',
      chain: 'willys'
    });

    assert.equal(report.offerCount, 2);
    assert.deepEqual(report.filters, { chain: 'willys' });
    assert.deepEqual(report.stores, [{
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      chain: 'willys',
      offerCount: 2,
      totalOneEachSavings: 22,
      topOfferId: 'flyer-willys-odenplan-coffee-2026w21',
      topDealScore: 82
    }]);
    assert.deepEqual(report.offers.map((offer) => [offer.offerId, offer.storeId, offer.productId, offer.savings, offer.discountPercent, offer.sourceRunId]), [
      ['flyer-willys-odenplan-coffee-2026w21', 'willys-odenplan', 'coffee', 15, 23.1, 'source-run-willys-flyer-2026-05-19'],
      ['flyer-willys-odenplan-private-label-milk-2026w21', 'willys-odenplan', 'private-label-milk', 7, 35.2, 'source-run-willys-flyer-2026-05-19']
    ]);
    assert.match(report.guardrails[0], /validity window/i);

    const storeReport = api.getStoreFlyerOffers('lidl-sveavagen', { asOf: '2026-05-20T12:00:00.000Z' });
    assert.equal(storeReport.offerCount, 1);
    assert.equal(storeReport.bestOffer?.productId, 'milk');
    assert.equal(storeReport.totalOneEachSavings, 3);
    assert.throws(() => api.getStoreFlyerOffers('missing-store'), /Unknown storeId/);
  });

  it('builds flyer offers from persisted promotion observations', () => {
    const report = buildFlyerOfferReport({
      asOf: '2026-05-20T12:00:00.000Z',
      filters: { storeId: 'willys-odenplan' },
      observations: [{
        observationId: 'obs-promo-coffee',
        sourceRunId: 'run-weekly-leaflet',
        rawRecordId: 'raw-weekly-leaflet',
        priceType: 'promotion',
        price: 49.9,
        regularPrice: 64.9,
        currency: 'SEK',
        promotionText: 'Weekly leaflet',
        promotionStartsOn: '2026-05-19T00:00:00.000Z',
        promotionEndsOn: '2026-05-25T21:59:59.000Z',
        memberRequired: false,
        observedAt: '2026-05-19T06:30:00.000Z',
        confidence: 0.92,
        provenance: { sourceUrl: 'https://example.test/flyer' },
        productId: 'product-coffee',
        productSlug: 'coffee',
        productName: 'Zoégas Coffee 450g',
        categoryPath: ['coffee'],
        chainId: 'chain-willys',
        chainSlug: 'willys',
        chainName: 'Willys',
        storeId: 'store-willys',
        storeSlug: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        storeCity: 'Stockholm'
      }]
    });

    assert.equal(report.offerCount, 1);
    assert.equal(report.offers[0]?.offerId, 'obs-promo-coffee');
    assert.equal(report.offers[0]?.sourceRunId, 'run-weekly-leaflet');
    assert.equal(report.offers[0]?.savings, 15);
    assert.equal(report.offers[0]?.sourceUrl, 'https://example.test/flyer');
  });

  it('serves pantry replenishment plans with live deal and basket duplicate context', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });

    const plan = api.getPantryReplenishment('user-1', '2026-05-20T08:00:00.000Z');

    assert.equal(plan.householdId, 'user-1');
    assert.deepEqual(
      plan.statuses.map((item) => ({ productId: item.productId, status: item.status, remainingQuantity: item.remainingQuantity })),
      [
        { productId: 'coffee', status: 'low_stock', remainingQuantity: 0.5 },
        { productId: 'milk', status: 'expiring_soon', remainingQuantity: 1 },
        { productId: 'butter', status: 'in_stock', remainingQuantity: 1 }
      ]
    );
    assert.deepEqual(plan.expiringSoonProductIds, ['milk']);
    assert.deepEqual(plan.replenishment.map((item) => ({
      productId: item.productId,
      alreadyInBasket: item.alreadyInBasket,
      bestDeal: item.bestDeal && { storeId: item.bestDeal.storeId, price: item.bestDeal.price }
    })), [
      { productId: 'coffee', alreadyInBasket: true, bestDeal: { storeId: 'willys-odenplan', price: 49.9 } }
    ]);
  });

  it('serves account-scoped loyalty offers with savings and action requirements', () => {
    const api = createGroceryViewApi();

    const report = api.getLoyaltyOfferReport('user-1');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.totalEligibleSavings, 26);
    assert.equal(report.requiresActionCount, 1);
    assert.equal(report.membershipRequiredCount, 1);
    assert.deepEqual(report.offers.map((offer) => ({
      productId: offer.productId,
      chain: offer.chain,
      savings: offer.savings,
      status: offer.status,
      actionRequired: offer.actionRequired
    })), [
      { productId: 'coffee', chain: 'ica', savings: 7, status: 'eligible', actionRequired: false },
      { productId: 'milk', chain: 'coop', savings: 12, status: 'needs_coupon', actionRequired: true },
      { productId: 'private-label-milk', chain: 'willys', savings: 7, status: 'eligible', actionRequired: false }
    ]);
    assert.match(report.guardrails[0], /member-only savings never overwrite verified public shelf evidence/i);
  });

  it('serves ad disclosure reports with premium removal and ranking separation guardrails', () => {
    const api = createGroceryViewApi();

    const freeReport = api.getAdDisclosureReport('user-1');

    assert.equal(freeReport.userId, 'user-1');
    assert.equal(freeReport.userTier, 'free');
    assert.equal(freeReport.placementPlan.slots.length, 2);
    assert.equal(freeReport.premiumAdsRemoved, false);
    assert.equal(freeReport.affectsDealScore, false);
    assert.equal(freeReport.allowedCount, 2);
    assert.equal(freeReport.blockedCount, 2);
    assert.deepEqual(freeReport.excludedSurfaces, ['deal_score', 'checkout_decision', 'basket_optimizer']);
    assert.match(freeReport.guardrails[0], /Sponsored placements cannot change Deal Score/i);

    api.upsertSubscriptionEntitlement('premium-user', {
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'active',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });

    const premiumReport = api.getAdDisclosureReport('premium-user');
    assert.equal(premiumReport.userTier, 'premium');
    assert.equal(premiumReport.placementPlan.slots.length, 0);
    assert.equal(premiumReport.premiumAdsRemoved, true);
    assert.equal(premiumReport.allowedCount, 0);
    assert.equal(premiumReport.blockedCount, 4);
  });

  it('serves notification inbox reports from watchlist alerts plus delivery guardrails', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', {
      productId: 'coffee',
      targetPrice: 50,
      alertDealScoreAt: 80,
      favoriteStoresOnly: true
    });

    const report = api.getNotificationInboxReport('user-1', { now: '2026-05-20T08:00:00.000Z' });

    assert.equal(report.userId, 'user-1');
    assert.equal(report.generatedAt, '2026-05-20T08:00:00.000Z');
    assert.equal(report.trackedItemCount, 1);
    assert.equal(report.activeAlertCount, 3);
    assert.equal(report.deliveredCount, 3);
    assert.equal(report.heldCount, 1);
    assert.equal(report.suppressedCount, 1);
    assert.deepEqual(report.summary, {
      delivered: 3,
      held: 1,
      suppressed: 1,
      total: 5
    });
    assert.match(report.queue[0]?.title ?? '', /Zoégas Coffee 450g/);
    assert.equal(report.queue.every((item) => item.sendAt === report.generatedAt), true);
    assert.match(report.queue.find((item) => item.status === 'held')?.reason ?? '', /Quiet hours/i);
    assert.match(report.queue.find((item) => item.status === 'suppressed')?.reason ?? '', /Provider token invalid/i);
    assert.match(report.guardrails[0], /Estimated prices never generate household alerts/i);
  });

  it('serves receipt review reports with budget actuals, match confidence, and writeback guardrails', () => {
    const api = createGroceryViewApi();

    const report = api.getReceiptReviewReport('user-1');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.lineCount, 3);
    assert.equal(report.matchedCount, 2);
    assert.equal(report.needsReviewCount, 2);
    assert.equal(report.review.budget.afterReceiptSpend, 762);
    assert.equal(report.review.budget.remaining, 38);
    assert.equal(report.review.comparedWithLocalMedianDelta, 3);
    assert.deepEqual(report.review.goodBuys.map((item) => item.productId), ['coffee']);
    assert.deepEqual(report.review.overspend.map((item) => [item.productId, item.deltaVsMedian]), [['cheese', 18]]);
    assert.match(report.guardrails[0], /Low confidence.*cannot update catalog or Deal Score/i);
  });

  it('serves category market reports with terminal-style mover evidence', () => {
    const api = createGroceryViewApi();

    const coffee = api.getCategoryMarket('coffee');

    assert.equal(coffee?.category, 'coffee');
    assert.equal(coffee?.city, 'Stockholm');
    assert.equal(coffee?.productCount, 1);
    assert.equal(coffee?.topDeal?.productId, 'coffee');
    assert.deepEqual(coffee?.rows.map((row) => ({
      productId: row.productId,
      currentPrice: row.currentPrice,
      dealScore: row.dealScore,
      oneMonthMovePercent: row.oneMonthMovePercent,
      range52WeekPositionPercent: row.range52WeekPositionPercent,
      stockholmMedianGap: row.stockholmMedianGap,
      verifiedHistoryPoints: row.verifiedHistoryPoints
    })), [
      {
        productId: 'coffee',
        currentPrice: 49.9,
        dealScore: 82,
        oneMonthMovePercent: -16.7,
        range52WeekPositionPercent: 0,
        stockholmMedianGap: -10,
        verifiedHistoryPoints: 3
      }
    ]);
    assert.match(coffee?.rows[0]?.customerRead ?? '', /49\.90 SEK at Willys Odenplan/);
    assert.match(coffee?.guardrails[0] ?? '', /verified category rows/i);
    assert.equal(api.getCategoryMarket('missing-category'), null);
  });

  it('returns cheapest product prices first and uses the cheapest quote for watchlist alerts', () => {
    const api = createGroceryViewApi();

    const milkPrices = api.getProductPrices('milk');
    assert.deepEqual(
      milkPrices.map((price) => price.storeId),
      ['lidl-sveavagen', 'willys-odenplan']
    );

    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addWatchlistItem('user-1', { productId: 'milk', targetPrice: 14, favoriteStoresOnly: true });

    assert.deepEqual(api.getWatchlist('user-1').alerts, [
      {
        productId: 'milk',
        productName: 'Arla Milk 1L',
        type: 'target_price',
        severity: 'opportunity',
        trigger: {
          metric: 'price',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          threshold: 14,
          value: 13.9
        },
        message: 'Arla Milk 1L is 13.90 SEK at Lidl Sveavagen, below your 14.00 SEK target.'
      }
    ]);

    const priceAlerts = api.getWatchlistPriceAlerts('user-1');
    assert.equal(priceAlerts.trackedItemCount, 1);
    assert.equal(priceAlerts.alertCount, 1);
    assert.equal(priceAlerts.alerts[0]?.type, 'target_price');
    assert.match(priceAlerts.guardrails[0], /target price/i);
  });

  it('returns ranked store-specific deals without mixing other stores', () => {
    const api = createGroceryViewApi();

    const willysDeals = api.getStoreDeals('willys-odenplan');
    assert.deepEqual(
      willysDeals.map((deal) => ({ productId: deal.productId, storeId: deal.storeId, dealScore: deal.dealScore })),
      [
        { productId: 'coffee', storeId: 'willys-odenplan', dealScore: 82 },
        { productId: 'private-label-milk', storeId: 'willys-odenplan', dealScore: 73 },
        { productId: 'milk', storeId: 'willys-odenplan', dealScore: 73 },
        { productId: 'butter', storeId: 'willys-odenplan', dealScore: 40 }
      ]
    );
    assert.deepEqual(willysDeals[0].band, { label: 'Good deal', verdict: 'Buy' });
    assert.throws(() => api.getStoreDeals('missing-store'), /Unknown storeId/);
  });


  it('returns product price terminal reports with distribution and chart data', () => {
    const api = createGroceryViewApi();

    const terminal = api.getProductPriceTerminal('coffee');
    assert.equal(terminal?.productId, 'coffee');
    assert.equal(terminal?.ticker, 'ZOEGAS-COFFEE-450G');
    assert.deepEqual(terminal?.quote, {
      bestPrice: 49.9,
      bestStoreId: 'willys-odenplan',
      bestStoreName: 'Willys Odenplan',
      unitPrice: '110.89 SEK/kg',
      dealScore: 82,
      band: { label: 'Good deal', verdict: 'Buy' },
      oneMonthMovePercent: -16.7,
      range52Week: { low: 49.9, high: 69.9 },
      evidenceVolume: { currentPrices: 3, historyPoints: 3, verifiedHistoryPoints: 3 }
    });
    assert.deepEqual(terminal?.distributions.map((distribution) => distribution.label), [
      'Whole Stockholm',
      'Odenplan local area'
    ]);
    assert.equal(terminal?.distributions[0].sampleSize, 3);
    assert.equal(terminal?.distributions[0].median, 59.9);
    assert.equal(terminal?.distributions[0].currentPercentile, 8);
    assert.match(terminal?.distributions[0].customerRead ?? '', /cheaper than 92% of verified Stockholm observations/);
    assert.equal(terminal?.distributions[1].sampleSize, 2);
    assert.equal(terminal?.chart.series[0].id, 'willys-odenplan:shelf');
    assert.equal(terminal?.chart.series[0].lineStyle, 'solid');
    assert.deepEqual(terminal?.chart.series[0].points.map((point) => point.value), [69.9, 59.9, 49.9]);
    assert.equal(terminal?.historySummary?.isNewLow, true);
    assert.deepEqual(api.getProductPriceTerminal('milk')?.quote.range52Week, { low: 13.9, high: 16.9 });
    assert.deepEqual(terminal?.evidenceGuardrails, [
      'Verified shelf or retailer-page prices can power current quote, Deal Score, and basket totals.',
      'Member, promotion, estimated, and low-confidence rows must stay explicitly labeled before customer action.',
      'Distribution and chart samples include sample size and provenance-aware confidence styling.'
    ]);
    assert.equal(api.getProductPriceTerminal('missing-product'), null);
  });

  it('returns product price spread reports across verified store quotes', () => {
    const api = createGroceryViewApi();

    const spread = api.getProductPriceSpread('coffee');

    assert.equal(spread?.productId, 'coffee');
    assert.equal(spread?.currency, 'SEK');
    assert.equal(spread?.sampleSize, 3);
    assert.equal(spread?.bestStoreId, 'willys-odenplan');
    assert.equal(spread?.highestStoreId, 'coop-odenplan');
    assert.equal(spread?.spread, 15);
    assert.equal(spread?.spreadPercent, 30.1);
    assert.deepEqual(spread?.rows.map((row) => ({
      storeId: row.storeId,
      rank: row.rank,
      price: row.price,
      deltaFromBest: row.deltaFromBest,
      deltaFromBestPercent: row.deltaFromBestPercent,
      priceLabel: row.priceLabel
    })), [
      { storeId: 'willys-odenplan', rank: 1, price: 49.9, deltaFromBest: 0, deltaFromBestPercent: 0, priceLabel: 'best' },
      { storeId: 'lidl-sveavagen', rank: 2, price: 59.9, deltaFromBest: 10, deltaFromBestPercent: 20, priceLabel: 'above_best' },
      { storeId: 'coop-odenplan', rank: 3, price: 64.9, deltaFromBest: 15, deltaFromBestPercent: 30.1, priceLabel: 'above_best' }
    ]);
    assert.match(spread?.customerRead ?? '', /ranges 15\.00 SEK across 3 verified store quotes/i);
    assert.match(spread?.guardrails[0] ?? '', /current verified store quotes/i);
    assert.equal(api.getProductPriceSpread('missing-product'), null);
  });

  it('returns Deal Score v1 reports without using distance in the default score', () => {
    const api = createGroceryViewApi();

    const nearby = api.getDealScore('coffee', { distanceKm: 0.3 });
    const farAway = api.getDealScore('coffee', { distanceKm: 12.5 });

    assert.deepEqual(nearby, farAway);
    assert.deepEqual(nearby, {
      productId: 'coffee',
      score: 82,
      band: { label: 'Good deal', verdict: 'Buy' },
      verdict: 'Buy',
      discountVsMedianPercent: 16.7,
      historicalPercentile: 12,
      confidence: 0.9,
      reasons: [
        'Best current quote is 49.90 SEK at Willys Odenplan.',
        'Zoégas Coffee 450g is in the 8th city price percentile.',
        'Historical promo percentile is 12.',
        'Equivalent unit-price percentile is 18.',
        'Source confidence is 90%.',
        'Default verdict is Buy.'
      ]
    });
    assert.equal(api.getDealScore('missing-product'), null);
  });

  it('serves product equivalents for comparison routes', () => {
    const api = createGroceryViewApi();

    assert.deepEqual(api.getProductEquivalents('milk'), [
      {
        productId: 'private-label-milk',
        productName: 'Garant Milk 1L',
        category: 'dairy',
        bestPrice: 12.9,
        bestStoreId: 'willys-odenplan',
        dealScore: 73,
        reason: 'Same dairy category with comparable current price evidence.'
      },
      {
        productId: 'butter',
        productName: 'Butter 600g',
        category: 'dairy',
        bestPrice: 54.9,
        bestStoreId: 'coop-odenplan',
        dealScore: 40,
        reason: 'Same dairy category with comparable current price evidence.'
      }
    ]);
    assert.deepEqual(api.getProductEquivalents('coffee'), []);
    assert.deepEqual(api.getProductEquivalents('missing-product'), []);
  });

  it('builds a price freshness report with stale backfill actions', () => {
    const api = createGroceryViewApi();

    assert.deepEqual(api.getPriceFreshnessReport('2026-05-20').summary, { fresh: 4, aging: 0, stale: 0 });

    const report = api.getPriceFreshnessReport('2026-06-03T00:00:00.000Z');
    assert.deepEqual(report.thresholds, { agingAfterDays: 7, staleAfterDays: 14 });
    assert.deepEqual(report.summary, { fresh: 0, aging: 0, stale: 4 });
    assert.deepEqual(report.backfillProductIds, ['butter', 'coffee', 'milk', 'private-label-milk']);
    assert.deepEqual(
      report.products.map((product) => ({
        productId: product.productId,
        latestVerifiedPriceDate: product.latestVerifiedPriceDate,
        ageDays: product.ageDays,
        status: product.status,
        action: product.action
      })),
      [
        {
          productId: 'coffee',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'milk',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'private-label-milk',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'butter',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        }
      ]
    );
    assert.throws(() => api.getPriceFreshnessReport('June 3, 2026'), /asOf must be an ISO timestamp/);
  });

  it('supports favorite stores, watchlist, basket, budget, and index endpoints', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.removeFavoriteStore('user-1', 'lidl-sveavagen');
    api.addWatchlistItem('user-1', {
      productId: 'coffee',
      targetPrice: 50,
      alertDealScoreAt: 80,
      favoriteStoresOnly: true,
      allowedPriceTypes: ['shelf']
    });
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });
    api.updateWatchlistItem('user-1', 'coffee', { targetPrice: 48 });
    api.updateBasketItem('user-1', 'coffee', 2);
    api.updateBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });

    assert.deepEqual(api.getFavoriteStores('user-1').map((store) => store.id), ['willys-odenplan']);
    assert.deepEqual(api.getWatchlist('user-1').items[0]?.allowedPriceTypes, ['shelf']);
    assert.equal(api.getWatchlist('user-1').alerts.length, 2);
    const updatedPriceAlerts = api.addWatchlistPriceAlert('user-1', {
      productId: 'coffee',
      targetPrice: 48,
      favoriteStoresOnly: false,
      allowedPriceTypes: ['shelf']
    });
    assert.equal(updatedPriceAlerts.trackedItemCount, 1);
    assert.equal(updatedPriceAlerts.alertCount, 0);
    assert.equal(api.getWatchlist('user-1').items.length, 1);
    assert.equal(api.getWatchlist('user-1').items[0]?.targetPrice, 48);
    assert.deepEqual(api.getBasket('user-1').items[0], { productId: 'coffee', quantity: 2 });
    assert.equal(api.compareBasket('user-1').cheapestByProduct.total, 99.8);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 800);
    assert.equal(api.getIndex('stockholm-grocery-index')?.label, 'Stockholm Grocery Index');

    const chainIndices = api.getChainPriceIndices();
    assert.equal(chainIndices.generatedFrom, 8);
    assert.deepEqual(chainIndices.categories, ['coffee', 'dairy']);
    assert.deepEqual(chainIndices.chains.map((chain) => chain.chainId), ['willys', 'lidl', 'coop']);
    assert.equal(chainIndices.chains[0]?.byCategory.find((row) => row.category === 'coffee')?.index, 96.66);

    const categoryIndices = api.getCategoryPriceIndices();
    assert.equal(categoryIndices.generatedFrom, 4);
    assert.deepEqual(categoryIndices.indices.map((row) => row.category), ['coffee', 'dairy']);
    assert.equal(categoryIndices.indices.find((row) => row.category === 'coffee')?.value, 71.39);
    assert.equal(categoryIndices.indices.find((row) => row.category === 'dairy')?.productCount, 3);

    const brandIndices = api.getBrandPriceIndices();
    assert.equal(brandIndices.generatedFrom, 4);
    assert.deepEqual(brandIndices.indices.map((row) => row.brandTier), ['national', 'standard_private_label']);
    assert.equal(brandIndices.indices[0]?.value, 84.97);

    const cheapestNow = api.getProductCheapestNow('coffee');
    assert.equal(cheapestNow?.cheapest?.chain, 'willys');
    assert.equal(cheapestNow?.cheapest?.packagePrice, 49.9);
    assert.deepEqual(cheapestNow?.chainPrices.map((row) => row.chain), ['willys', 'lidl', 'coop']);
    assert.equal(api.getProductCheapestNow('missing-product'), null);

    api.removeWatchlistItem('user-1', 'coffee');
    api.removeBasketItem('user-1', 'coffee');
    assert.deepEqual(api.getWatchlist('user-1').items, []);
    assert.deepEqual(api.getBasket('user-1').items, []);
  });

  it('summarizes category budgets from the current basket and reports unbudgeted spend', () => {
    const api = createGroceryViewApi();

    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });
    api.updateCategoryBudgets('user-1', [
      { category: 'dairy', weeklyBudget: 70 },
      { category: 'coffee', weeklyBudget: 40 },
      { category: 'pantry', weeklyBudget: 120 }
    ]);

    assert.deepEqual(api.getCategoryBudgetSummary('user-1'), {
      userId: 'user-1',
      categories: [
        { category: 'coffee', weeklyBudget: 40, estimatedSpend: 49.9, remaining: -9.9, status: 'over', productIds: ['coffee'] },
        { category: 'dairy', weeklyBudget: 70, estimatedSpend: 82.7, remaining: -12.7, status: 'over', productIds: ['butter', 'milk'] },
        { category: 'pantry', weeklyBudget: 120, estimatedSpend: 0, remaining: 120, status: 'under', productIds: [] }
      ],
      unbudgetedCategories: []
    });

    api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: 60 }]);
    assert.deepEqual(api.getCategoryBudgetSummary('user-1').unbudgetedCategories, [
      { category: 'dairy', estimatedSpend: 82.7, productIds: ['butter', 'milk'] }
    ]);
    assert.throws(
      () => api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: 10 }, { category: ' coffee ', weeklyBudget: 20 }]),
      /categories must be unique/
    );
    assert.throws(() => api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: -1 }]), /weeklyBudget/);
  });

  it('returns basket comparison reports with explicit strategy and trust labels', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });

    const report = api.compareBasketReport('user-1');
    assert.equal(report.currency, 'SEK');
    assert.deepEqual(report.favoriteStoreIds, ['willys-odenplan', 'lidl-sveavagen']);
    assert.deepEqual(report.strategies.map((strategy) => strategy.id), [
      'cheapest_across_selected',
      'all_at_one_store',
      'favorite_only',
      'private_label_substitution'
    ]);
    assert.deepEqual(report.strategies[0], {
      id: 'cheapest_across_selected',
      label: 'Cheapest across selected stores',
      total: 84.7,
      savingsVsBestSingleStore: 2,
      storeCount: 2,
      assignments: [
        {
          productId: 'milk',
          productName: 'Arla Milk 1L',
          quantity: 2,
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          unitPrice: 13.9,
          lineTotal: 27.8,
          priceLabel: 'verified_shelf'
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          quantity: 1,
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          unitPrice: 56.9,
          lineTotal: 56.9,
          priceLabel: 'verified_shelf'
        }
      ],
      missingProductIds: [],
      estimatedProductIds: [],
      warnings: ['All included prices are verified shelf demo prices.']
    });
    assert.deepEqual(report.strategies[1]?.total, 86.7);
    assert.deepEqual(report.strategies[3]?.assignments[0], {
      productId: 'private-label-milk',
      productName: 'Garant Milk 1L',
      quantity: 2,
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      unitPrice: 12.9,
      lineTotal: 25.8,
      priceLabel: 'verified_shelf',
      substitutionForProductId: 'milk',
      substitutionForProductName: 'Arla Milk 1L'
    });
    assert.equal(report.strategies[3]?.total, 82.7);
  });




  it('imports consented bookmarklet basket rows and leaves unmatched retailer rows for review', () => {
    const api = createGroceryViewApi();

    const report = api.importBasketFromRetailerPage('user-1', {
      source: {
        sourceKind: 'bookmarklet',
        retailerId: 'willys',
        origin: 'https://www.willys.se',
        capturedAt: '2026-05-22T09:35:00.000Z',
        consentGranted: true
      },
      capturedLines: [
        { rawName: 'Zoégas Coffee 450g', productId: 'coffee', quantity: 1, productUrl: 'https://www.willys.se/produkt/coffee' },
        { rawName: 'Arla Milk 1L', quantity: 2 },
        { rawName: 'Retailer-only bakery bun', quantity: 3 }
      ]
    });

    assert.equal(report.status, 'needs_review');
    assert.deepEqual(report.acceptedItems.map((item) => ({ productId: item.productId, quantity: item.quantity, matchSource: item.matchSource })), [
      { productId: 'coffee', quantity: 1, matchSource: 'product_id' },
      { productId: 'milk', quantity: 2, matchSource: 'alias' }
    ]);
    assert.equal(report.reviewItems[0]?.rawName, 'Retailer-only bakery bun');
    assert.deepEqual(api.getBasket('user-1').items, [
      { productId: 'coffee', quantity: 1 },
      { productId: 'milk', quantity: 2 }
    ]);
    assert.match(report.exportText, /1 × Zoégas Coffee 450g/);
    assert.match(report.guardrails[0], /explicit shopper consent/);
  });

  it('persists account-scoped retailer basket import reviews before adding unmatched rows', () => {
    const api = createGroceryViewApi();

    const report = api.importBasketFromRetailerPage('user-1', {
      source: {
        sourceKind: 'browser_extension',
        retailerId: 'willys',
        origin: 'https://www.willys.se',
        capturedAt: '2026-05-22T09:45:00.000Z',
        consentGranted: true
      },
      capturedLines: [
        { rawName: 'Retailer-only bakery bun', quantity: 3 },
        { rawName: 'Zoégas Coffee 450g', productId: 'coffee', quantity: 1 }
      ]
    });

    assert.equal(report.reviewItemCount, 1);
    const queue = api.getBasketImportReviewQueue('user-1');
    assert.equal(queue.userId, 'user-1');
    assert.equal(queue.openItemCount, 1);
    assert.equal(queue.items[0]?.rawName, 'Retailer-only bakery bun');
    assert.equal(queue.items[0]?.status, 'open');
    assert.equal(queue.items[0]?.retailerId, 'willys');
    assert.match(queue.guardrails[0], /account-bound/);

    const reviewItemId = queue.items[0]!.reviewItemId;
    const decision = api.resolveBasketImportReviewItem('user-1', reviewItemId, { decision: 'accept_as_product', productId: 'milk', quantity: 3 });
    assert.equal(decision.status, 'accepted');
    assert.deepEqual(api.getBasket('user-1').items, [
      { productId: 'coffee', quantity: 1 },
      { productId: 'milk', quantity: 3 }
    ]);
    assert.equal(api.getBasketImportReviewQueue('user-1').openItemCount, 0);

    assert.throws(
      () => api.resolveBasketImportReviewItem('user-2', reviewItemId, { decision: 'dismiss' }),
      /Basket import review item not found/
    );
  });

  it('blocks retailer basket transfer sessions unless support is verified', () => {
    const api = createGroceryViewApi();

    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    const report = api.getRetailerBasketTransferSession('user-1', 'willys');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.retailerId, 'willys');
    assert.equal(report.status, 'blocked');
    assert.equal(report.canAttemptTransfer, false);
    assert.match(report.blockedReasons[0] ?? '', /not verified as supported/);
    assert.match(report.guardrails[0], /verified retailer capability/);
  });

  it('returns retailer handoff plans with support matrix fallbacks and checkout guardrails', () => {
    const api = createGroceryViewApi();

    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });

    const report = api.getRetailerHandoffPlan('user-1', 'willys');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.retailerId, 'willys');
    assert.equal(report.primaryAction.actionType, 'copy_list');
    assert.deepEqual(report.actions.map((action) => ({ actionType: action.actionType, status: action.status, lineCount: action.lineCount })), [
      { actionType: 'copy_list', status: 'ready', lineCount: 2 },
      { actionType: 'product_deep_links', status: 'ready', lineCount: 2 },
      { actionType: 'retailer_app_search', status: 'manual_review', lineCount: 2 },
      { actionType: 'basket_transfer', status: 'unsupported', lineCount: 0 }
    ]);
    assert.deepEqual(report.unsupportedReasons, [
      'Willys does not currently support verified basket transfer.',
      'Checkout confirmation is not available, so GroceryView cannot claim purchase completion.'
    ]);
    assert.match(report.guardrails[0], /not checkout confirmation/i);
  });


  it('returns fulfillment slot evidence without claiming reservations', () => {
    const api = createGroceryViewApi();
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });

    const report = api.getBasketFulfillmentSlots('user-1', 'willys', 'willys-odenplan');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.retailerId, 'willys');
    assert.equal(report.status, 'evidence_available');
    assert.equal(report.availableSlotCount, 1);
    assert.deepEqual(report.availableSlots.map((slot) => [slot.slotId, slot.mode, slot.fee]), [['willys-pickup-tomorrow-0900', 'pickup', 0]]);
    assert.match(report.guardrails[0], /not retailer reservations/i);
    assert.match(report.guardrails[2], /cannot claim checkout completion/i);
  });

  it('returns basket trip-cost optimizer reports with travel estimates separated from shelf totals', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });

    const report = api.getBasketTripCostReport('user-1', {
      travelMode: 'car',
      valueOfTimePerHour: 120,
      carCostPerKm: 3.5,
      splitTripPenalty: 15
    });

    assert.equal(report.userId, 'user-1');
    assert.equal(report.currency, 'SEK');
    assert.equal(report.bestOption?.strategyId, 'private_label_substitution');
    assert.deepEqual(report.options.map((option) => ({
      strategyId: option.strategyId,
      pricedBasketTotal: option.pricedBasketTotal,
      travelCost: option.travelCost,
      effectiveTotal: option.effectiveTotal,
      storeIds: option.storeIds,
      missingProductIds: option.missingProductIds
    })), [
      {
        strategyId: 'private_label_substitution',
        pricedBasketTotal: 82.7,
        travelCost: 12.33,
        effectiveTotal: 95.03,
        storeIds: ['willys-odenplan'],
        missingProductIds: []
      },
      {
        strategyId: 'all_at_one_store',
        pricedBasketTotal: 86.7,
        travelCost: 12.33,
        effectiveTotal: 99.03,
        storeIds: ['willys-odenplan'],
        missingProductIds: []
      },
      {
        strategyId: 'cheapest_across_selected',
        pricedBasketTotal: 84.7,
        travelCost: 44.13,
        effectiveTotal: 128.83,
        storeIds: ['lidl-sveavagen', 'willys-odenplan'],
        missingProductIds: []
      },
      {
        strategyId: 'favorite_only',
        pricedBasketTotal: 84.7,
        travelCost: 44.13,
        effectiveTotal: 128.83,
        storeIds: ['lidl-sveavagen', 'willys-odenplan'],
        missingProductIds: []
      }
    ]);
    assert.match(report.guardrails[0], /separately from verified shelf totals/i);
  });

  it('returns recurring basket digest changes for the signed-in weekly shop', () => {
    const api = createGroceryViewApi();

    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });

    const digest = api.getRecurringBasketDigest('user-1', {
      templateId: 'weekly-basics',
      templateName: 'Weekly basics',
      cadence: 'weekly',
      asOf: '2026-05-22T08:00:00.000Z'
    });

    assert.equal(digest.templateId, 'weekly-basics');
    assert.equal(digest.lineCount, 3);
    assert.equal(digest.comparableCurrentTotal, 132.6);
    assert.equal(digest.comparablePreviousTotal, 146.6);
    assert.equal(digest.comparableDelta, -14);
    assert.deepEqual(digest.lines.map((line) => ({
      productId: line.productId,
      changeType: line.changeType,
      currentStoreName: line.currentStoreName,
      lineDelta: line.lineDelta
    })), [
      { productId: 'coffee', changeType: 'price_down', currentStoreName: 'Willys Odenplan', lineDelta: -10 },
      { productId: 'milk', changeType: 'price_down', currentStoreName: 'Lidl Sveavägen', lineDelta: -6 },
      { productId: 'butter', changeType: 'price_up', currentStoreName: 'Coop Odenplan', lineDelta: 2 }
    ]);
    assert.match(digest.headline, /Weekly basics is 9.55% lower/);
    assert.match(digest.guardrails[1], /never rewrite a saved recurring basket automatically/);
  });

  it('returns local offer basket reports for selected favorite stores', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });

    const report = api.getLocalOfferBasketReport('user-1');
    assert.equal(report.userId, 'user-1');
    assert.deepEqual(report.storeIds, ['willys-odenplan', 'lidl-sveavagen']);
    assert.equal(report.basketItemCount, 2);
    assert.equal(report.baselineTotal, 84.7);
    assert.deepEqual(report.bestStore && {
      storeId: report.bestStore.storeId,
      subtotal: report.bestStore.subtotal,
      coveragePercent: report.bestStore.coveragePercent,
      averageConfidence: report.bestStore.averageConfidence,
      freshnessLabel: report.bestStore.freshnessLabel,
      savingsVsBaseline: report.bestStore.savingsVsBaseline
    }, {
      storeId: 'willys-odenplan',
      subtotal: 86.7,
      coveragePercent: 100,
      averageConfidence: 0.79,
      freshnessLabel: 'fresh',
      savingsVsBaseline: -2
    });
    assert.deepEqual(report.stores[1]?.missingProductIds, ['butter']);
    assert.match(report.guardrails[1], /Distance/);
  });

  it('quotes the current basket at a single store with missing-price labels', () => {
    const api = createGroceryViewApi();

    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });

    assert.deepEqual(api.quoteBasketAtStore('user-1', 'willys-odenplan'), {
      userId: 'user-1',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      currency: 'SEK',
      itemCount: 3,
      pricedItemCount: 3,
      total: 86.7,
      priceGapVsCheapestComplete: 4,
      lines: [
        { productId: 'milk', productName: 'Arla Milk 1L', quantity: 2, unitPrice: 14.9, lineTotal: 29.8, priceLabel: 'verified_shelf' },
        { productId: 'butter', productName: 'Butter 600g', quantity: 1, unitPrice: 56.9, lineTotal: 56.9, priceLabel: 'verified_shelf' }
      ],
      missingProductIds: [],
      warnings: ['All basket items have verified shelf prices at this store.']
    });

    assert.deepEqual(api.quoteBasketAtStore('user-1', 'lidl-sveavagen'), {
      userId: 'user-1',
      storeId: 'lidl-sveavagen',
      storeName: 'Lidl Sveavägen',
      currency: 'SEK',
      itemCount: 3,
      pricedItemCount: 2,
      total: null,
      priceGapVsCheapestComplete: null,
      lines: [
        { productId: 'milk', productName: 'Arla Milk 1L', quantity: 2, unitPrice: 13.9, lineTotal: 27.8, priceLabel: 'verified_shelf' },
        { productId: 'butter', productName: 'Butter 600g', quantity: 1, unitPrice: null, lineTotal: null, priceLabel: 'missing_price' }
      ],
      missingProductIds: ['butter'],
      warnings: ['Some basket items are missing verified shelf prices at this store.']
    });
    assert.throws(() => api.quoteBasketAtStore('user-1', 'missing-store'), /Unknown storeId/);
  });

  it('removes watched products and recomputes alerts from remaining items', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.addWatchlistItem('user-1', { productId: 'milk', targetPrice: 14, favoriteStoresOnly: true });

    assert.equal(api.getWatchlist('user-1').items.length, 2);
    assert.equal(api.removeWatchlistItem('user-1', 'coffee').removed, true);

    const watchlist = api.getWatchlist('user-1');
    assert.deepEqual(watchlist.items.map((item) => item.productId), ['milk']);
    assert.equal(watchlist.alerts.some((alert) => alert.productId === 'coffee'), false);
    assert.equal(api.removeWatchlistItem('user-1', 'coffee').removed, false);
  });

  it('rejects invalid mutable route inputs before storing state', () => {
    const api = createGroceryViewApi();

    assert.throws(() => api.addFavoriteStore('user-1', 'missing-store'), /Unknown storeId/);
    assert.throws(
      () => api.addWatchlistItem('user-1', { productId: 'missing-product', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true }),
      /Unknown productId/
    );
    assert.throws(
      () => api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 0, alertDealScoreAt: 80, favoriteStoresOnly: true }),
      /targetPrice must be positive/
    );
    assert.throws(
      () => api.addWatchlistItem('user-1', {
        productId: 'coffee',
        targetPrice: 50,
        favoriteStoresOnly: true,
        allowedPriceTypes: ['scraped' as 'shelf']
      }),
      /allowedPriceTypes/
    );
    assert.throws(() => api.addBasketItem('user-1', { productId: 'coffee', quantity: 0 }), /quantity must be an integer/);
    assert.throws(() => api.updateWatchlistItem('user-1', 'coffee', { targetPrice: 40 }), /Watchlist item not found/);
    assert.deepEqual(api.removeWatchlistItem('user-1', 'coffee'), { removed: false });
    assert.throws(() => api.updateBasketItem('user-1', 'coffee', 1), /Basket item not found/);
    assert.throws(() => api.removeBasketItem('user-1', 'coffee'), /Basket item not found/);
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 98 });
    assert.throws(() => api.addBasketItem('user-1', { productId: 'coffee', quantity: 2 }), /quantity must be an integer/);
    assert.throws(() => api.updateBudget('user-1', { weeklyBudget: -1, monthlyBudget: 3200 }), /weeklyBudget/);

    assert.deepEqual(api.getFavoriteStores('user-1'), []);
    assert.deepEqual(api.getWatchlist('user-1').items, []);
    assert.deepEqual(api.getBasket('user-1').items, [{ productId: 'coffee', quantity: 98 }]);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 0);
  });
});
