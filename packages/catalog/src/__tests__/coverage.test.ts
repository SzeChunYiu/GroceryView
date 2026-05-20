import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalogCoverageReport, buildMyStoresCoverageReport } from '../index.js';
import { buildCatalogCoverageReport, buildCatalogFreshnessReport } from '../index.js';

describe('buildCatalogCoverageReport', () => {
  it('quantifies category, chain, and store coverage gaps against launch targets', () => {
    const report = buildCatalogCoverageReport({
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
        categories: { covered: 2, target: 4, percent: 50, missing: ['bread', 'eggs'] },
        chains: { covered: 2, target: 3, percent: 66.67, missing: ['ica'] },
        stores: { covered: 2, target: 3, percent: 66.67, missing: ['ica-odenplan'] }
      },
      requiredActions: ['backfill_categories:bread,eggs', 'backfill_chains:ica', 'backfill_stores:ica-odenplan']
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
    assert.deepEqual(report.requiredActions, []);
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
describe('buildCatalogFreshnessReport', () => {
  it('flags stale and never-observed products for backfill', () => {
    const report = buildCatalogFreshnessReport({
      now: '2026-05-20T00:00:00.000Z',
      maxAgeDays: 7,
      products: [
        { id: 'coffee', categoryId: 'pantry', lastObservedAt: '2026-05-19T00:00:00.000Z' },
        { id: 'milk', categoryId: 'dairy', lastObservedAt: '2026-05-01T00:00:00.000Z' },
        { id: 'eggs', categoryId: 'dairy' }
      ]
    });

    assert.equal(report.status, 'stale');
    assert.equal(report.productCount, 3);
    assert.equal(report.freshCount, 1);
    assert.equal(report.staleCount, 1);
    assert.equal(report.neverObservedCount, 1);
    assert.deepEqual(report.requiredActions, ['backfill_stale_catalog:eggs,milk']);
    assert.deepEqual(
      report.products.map((product) => ({ id: product.id, ageDays: product.ageDays, status: product.status })),
      [
        { id: 'eggs', ageDays: null, status: 'never_observed' },
        { id: 'milk', ageDays: 19, status: 'stale' },
        { id: 'coffee', ageDays: 1, status: 'fresh' }
      ]
    );
  });

  it('passes when every product is within the freshness window', () => {
    const report = buildCatalogFreshnessReport({
      now: '2026-05-20T00:00:00.000Z',
      maxAgeDays: 3,
      products: [
        { id: 'coffee', categoryId: 'pantry', lastObservedAt: '2026-05-18T12:00:00.000Z' },
        { id: 'milk', categoryId: 'dairy', lastObservedAt: '2026-05-19T00:00:00.000Z' }
      ]
    });

    assert.equal(report.status, 'fresh');
    assert.equal(report.freshCount, 2);
    assert.deepEqual(report.requiredActions, []);
  });

  it('rejects future observation timestamps', () => {
    assert.throws(
      () =>
        buildCatalogFreshnessReport({
          now: '2026-05-20T00:00:00.000Z',
          maxAgeDays: 3,
          products: [{ id: 'coffee', categoryId: 'pantry', lastObservedAt: '2026-05-21T00:00:00.000Z' }]
        }),
      /lastObservedAt for coffee cannot be in the future/
    );
  });
});
