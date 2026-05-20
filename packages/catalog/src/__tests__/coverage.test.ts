import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalogCoverageReport, buildMyStoresCoverageReport } from '../index.js';

describe('buildCatalogCoverageReport', () => {
  it('quantifies category, chain, and store coverage gaps against launch targets', () => {
    const report = buildCatalogCoverageReport({
      targetCategories: ['coffee', 'dairy', 'eggs', 'bread'],
      targetChains: ['willys', 'ica', 'coop'],
      targetStores: ['willys-odenplan', 'ica-odenplan', 'coop-odenplan'],
      minimumObservationsPerProduct: 3,
      minimumFreshPriceShare: 0.8,
      minimumMedianConfidenceScore: 0.75,
      products: [
        {
          id: 'coffee',
          categoryId: 'coffee',
          observedChainIds: ['willys'],
          observedStoreIds: ['willys-odenplan'],
          observedPriceCount: 2,
          freshPriceCount: 1,
          medianConfidenceScore: 0.7
        },
        {
          id: 'milk',
          categoryId: 'dairy',
          observedChainIds: ['willys', 'coop'],
          observedStoreIds: ['willys-odenplan', 'coop-odenplan'],
          observedPriceCount: 2,
          freshPriceCount: 2,
          medianConfidenceScore: 0.6
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'incomplete',
      productCount: 2,
      quality: {
        observedPriceCount: 4,
        freshPriceCount: 3,
        freshPriceShare: 0.75,
        observationsPerProduct: 2,
        medianConfidenceScore: 0.65
      },
      coverage: {
        categories: { covered: 2, target: 4, percent: 50, missing: ['bread', 'eggs'] },
        chains: { covered: 2, target: 3, percent: 66.67, missing: ['ica'] },
        stores: { covered: 2, target: 3, percent: 66.67, missing: ['ica-odenplan'] }
      },
      requiredActions: [
        'backfill_categories:bread,eggs',
        'backfill_chains:ica',
        'backfill_stores:ica-odenplan',
        'increase_price_observation_depth:min_3_per_product',
        'refresh_price_observations:min_80_percent_fresh',
        'raise_source_confidence:min_0.75'
      ]
    });
  });

  it('passes only when all target dimensions are covered', () => {
    const report = buildCatalogCoverageReport({
      targetCategories: ['coffee'],
      targetChains: ['willys'],
      targetStores: ['willys-odenplan'],
      minimumObservationsPerProduct: 3,
      minimumFreshPriceShare: 0.8,
      minimumMedianConfidenceScore: 0.75,
      products: [
        {
          id: 'coffee',
          categoryId: 'coffee',
          observedChainIds: ['willys'],
          observedStoreIds: ['willys-odenplan'],
          observedPriceCount: 4,
          freshPriceCount: 4,
          medianConfidenceScore: 0.95
        }
      ]
    });

    assert.equal(report.status, 'complete');
    assert.deepEqual(report.requiredActions, []);
  });

  it('blocks launch quality when target dimensions are present but observations are stale or weak', () => {
    const report = buildCatalogCoverageReport({
      targetCategories: ['coffee'],
      targetChains: ['willys'],
      targetStores: ['willys-odenplan'],
      minimumObservationsPerProduct: 2,
      minimumFreshPriceShare: 0.75,
      minimumMedianConfidenceScore: 0.8,
      products: [
        {
          id: 'coffee',
          categoryId: 'coffee',
          observedChainIds: ['willys'],
          observedStoreIds: ['willys-odenplan'],
          observedPriceCount: 2,
          freshPriceCount: 1,
          medianConfidenceScore: 0.55
        }
      ]
    });

    assert.equal(report.status, 'incomplete');
    assert.deepEqual(report.coverage.categories.missing, []);
    assert.deepEqual(report.requiredActions, ['refresh_price_observations:min_75_percent_fresh', 'raise_source_confidence:min_0.8']);
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
