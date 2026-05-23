import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalogCoverageReport, buildMyStoresCoverageReport } from '../index.js';

describe('buildCatalogCoverageReport', () => {
  it('quantifies category, chain, and store coverage gaps against launch targets', () => {
    const report = buildCatalogCoverageReport({
      targetProducts: ['coffee', 'milk', 'eggs'],
      targetCategories: ['coffee', 'dairy', 'eggs', 'bread'],
      targetChains: ['willys', 'ica', 'coop'],
      targetStores: ['willys-odenplan', 'ica-odenplan', 'coop-odenplan'],
      products: [
        { id: 'coffee', categoryId: 'coffee', observedChainIds: ['willys'], observedStoreIds: ['willys-odenplan'] },
        { id: 'milk', categoryId: 'dairy', observedChainIds: ['willys', 'coop'], observedStoreIds: ['willys-odenplan', 'coop-odenplan'] }
      ]
    });

    assert.deepEqual(report, {
      status: 'incomplete',
      productCount: 2,
      coverage: {
        products: { covered: 2, target: 3, percent: 66.67, missing: ['eggs'] },
        categories: { covered: 2, target: 4, percent: 50, missing: ['bread', 'eggs'] },
        chains: { covered: 2, target: 3, percent: 66.67, missing: ['ica'] },
        stores: { covered: 2, target: 3, percent: 66.67, missing: ['ica-odenplan'] }
      },
      missingProductStorePairs: [],
      requiredActions: ['backfill_products:eggs', 'backfill_categories:bread,eggs', 'backfill_chains:ica', 'backfill_stores:ica-odenplan']
    });
  });

  it('passes only when all target dimensions are covered', () => {
    const report = buildCatalogCoverageReport({
      targetCategories: ['coffee'],
      targetChains: ['willys'],
      targetStores: ['willys-odenplan'],
      products: [{ id: 'coffee', categoryId: 'coffee', observedChainIds: ['willys'], observedStoreIds: ['willys-odenplan'] }]
    });

    assert.equal(report.status, 'complete');
    assert.deepEqual(report.missingProductStorePairs, []);
    assert.deepEqual(report.requiredActions, []);
  });

  it('can require every target product to have every target store price', () => {
    const report = buildCatalogCoverageReport({
      targetProducts: ['coffee', 'milk'],
      targetCategories: ['coffee', 'dairy'],
      targetChains: ['willys', 'coop'],
      targetStores: ['willys-odenplan', 'coop-odenplan'],
      requireEveryProductInEveryStore: true,
      products: [
        { id: 'coffee', categoryId: 'coffee', observedChainIds: ['willys', 'coop'], observedStoreIds: ['willys-odenplan', 'coop-odenplan'] },
        { id: 'milk', categoryId: 'dairy', observedChainIds: ['willys'], observedStoreIds: ['willys-odenplan'] }
      ]
    });

    assert.equal(report.status, 'incomplete');
    assert.deepEqual(report.missingProductStorePairs, [{ productId: 'milk', storeId: 'coop-odenplan' }]);
    assert.deepEqual(report.requiredActions, ['backfill_product_store_pairs:1']);
  });

  it('fails closed when target stores only have promotion coverage but branch product prices are required', () => {
    const report = buildCatalogCoverageReport({
      targetCategories: ['coffee'],
      targetChains: ['coop'],
      targetStores: ['216502', '196183'],
      targetPriceTypes: ['online'],
      requireEveryStorePriceType: true,
      products: [{
        id: 'coffee',
        categoryId: 'coffee',
        observedChainIds: ['coop'],
        observedStoreIds: ['216502', '196183'],
        observedPriceTypes: ['promotion'],
        observedStorePriceTypes: ['216502:promotion', '196183:promotion']
      }]
    });

    assert.equal(report.status, 'incomplete');
    assert.deepEqual(report.coverage.priceTypes, { covered: 0, target: 1, percent: 0, missing: ['online'] });
    assert.deepEqual(report.missingStorePriceTypes, [
      { storeId: '196183', priceType: 'online' },
      { storeId: '216502', priceType: 'online' }
    ]);
    assert.deepEqual(report.requiredActions, [
      'backfill_price_types:online',
      'backfill_store_price_types:2'
    ]);
  });

});

describe('buildMyStoresCoverageReport', () => {
  it('marks mobile My Stores coverage ready when saved stores cover required categories', () => {
    const report = buildMyStoresCoverageReport({
      favoriteStoreIds: ['willys-odenplan', 'coop-odenplan'],
      requiredCategoryIds: ['coffee', 'dairy'],
      products: [
        { id: 'coffee', categoryId: 'coffee', observedChainIds: ['willys'], observedStoreIds: ['willys-odenplan'] },
        { id: 'milk', categoryId: 'dairy', observedChainIds: ['coop'], observedStoreIds: ['coop-odenplan'] }
      ]
    });

    assert.deepEqual(report, {
      status: 'ready',
      favoriteStoreCount: 2,
      coveredProductIds: ['coffee', 'milk'],
      uncoveredStoreIds: [],
      missingCategoryIds: [],
      coveragePercent: 100,
      mobileActions: ['show_my_stores_deals']
    });
  });

  it('limits mobile My Stores deals when favorite stores or categories are missing coverage', () => {
    const report = buildMyStoresCoverageReport({
      favoriteStoreIds: ['willys-odenplan', 'ica-odenplan'],
      requiredCategoryIds: ['coffee', 'dairy', 'bread'],
      products: [
        { id: 'coffee', categoryId: 'coffee', observedChainIds: ['willys'], observedStoreIds: ['willys-odenplan'] },
        { id: 'milk', categoryId: 'dairy', observedChainIds: ['coop'], observedStoreIds: ['coop-odenplan'] }
      ]
    });

    assert.deepEqual(report, {
      status: 'limited',
      favoriteStoreCount: 2,
      coveredProductIds: ['coffee'],
      uncoveredStoreIds: ['ica-odenplan'],
      missingCategoryIds: ['bread', 'dairy'],
      coveragePercent: 41.67,
      mobileActions: ['show_my_stores_deals', 'backfill_favorite_store_prices', 'broaden_to_nearby_stores']
    });
  });
});
