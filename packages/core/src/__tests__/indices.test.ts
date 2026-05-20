import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildStorePriceLevelProfile, calculateFixedBasketIndex } from '../index.js';

describe('calculateFixedBasketIndex', () => {
  it('normalizes a fixed grocery basket against a base date', () => {
    const index = calculateFixedBasketIndex({
      id: 'stockholm-coffee-index',
      label: 'Stockholm Coffee Index',
      baseDate: '2026-01-01',
      currentDate: '2026-05-19',
      components: [
        { productId: 'coffee-a', baseUnitPrice: 100, currentUnitPrice: 90, weight: 1 },
        { productId: 'coffee-b', baseUnitPrice: 80, currentUnitPrice: 88, weight: 1 }
      ]
    });

    assert.equal(index.value, 98.89);
    assert.equal(index.movementPercent, -1.11);
    assert.equal(index.confidence, 'medium');
  });

  it('summarizes a store price-level profile against Stockholm, chain, and favorite stores', () => {
    const profile = buildStorePriceLevelProfile({
      storeId: 'willys-odenplan',
      favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan'],
      observations: [
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', chainId: 'willys', category: 'Coffee', basketUnitPrice: 88, stockholmMedianUnitPrice: 100, isDeal: true, watchlistMatch: true },
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', chainId: 'willys', category: 'Frozen', basketUnitPrice: 92, stockholmMedianUnitPrice: 100, isDeal: true },
        { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', chainId: 'willys', category: 'Fresh vegetables', basketUnitPrice: 104, stockholmMedianUnitPrice: 100, watchlistMatch: true },
        { storeId: 'willys-city', storeName: 'Willys City', chainId: 'willys', category: 'Coffee', basketUnitPrice: 94, stockholmMedianUnitPrice: 100 },
        { storeId: 'willys-city', storeName: 'Willys City', chainId: 'willys', category: 'Frozen', basketUnitPrice: 95, stockholmMedianUnitPrice: 100 },
        { storeId: 'willys-city', storeName: 'Willys City', chainId: 'willys', category: 'Fresh vegetables', basketUnitPrice: 110, stockholmMedianUnitPrice: 100 },
        { storeId: 'willys-sickla', storeName: 'Willys Sickla', chainId: 'willys', category: 'Coffee', basketUnitPrice: 82, stockholmMedianUnitPrice: 100 },
        { storeId: 'willys-sickla', storeName: 'Willys Sickla', chainId: 'willys', category: 'Frozen', basketUnitPrice: 89, stockholmMedianUnitPrice: 100 },
        { storeId: 'willys-sickla', storeName: 'Willys Sickla', chainId: 'willys', category: 'Fresh vegetables', basketUnitPrice: 98, stockholmMedianUnitPrice: 100 },
        { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', chainId: 'lidl', category: 'Coffee', basketUnitPrice: 86, stockholmMedianUnitPrice: 100 },
        { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', chainId: 'lidl', category: 'Frozen', basketUnitPrice: 91, stockholmMedianUnitPrice: 100 },
        { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', chainId: 'lidl', category: 'Fresh vegetables', basketUnitPrice: 96, stockholmMedianUnitPrice: 100 },
        { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', chainId: 'coop', category: 'Coffee', basketUnitPrice: 101, stockholmMedianUnitPrice: 100 },
        { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', chainId: 'coop', category: 'Frozen', basketUnitPrice: 104, stockholmMedianUnitPrice: 100 },
        { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', chainId: 'coop', category: 'Fresh vegetables', basketUnitPrice: 108, stockholmMedianUnitPrice: 100 }
      ]
    });

    assert.equal(profile.storeName, 'Willys Odenplan');
    assert.equal(profile.overallVsStockholmPercent, -5.33);
    assert.equal(profile.sameChainPercentile, 67);
    assert.equal(profile.favoriteStorePercentile, 67);
    assert.deepEqual(profile.bestCategories, ['Coffee', 'Frozen', 'Fresh vegetables']);
    assert.deepEqual(profile.worstCategories, ['Fresh vegetables', 'Frozen', 'Coffee']);
    assert.equal(profile.dealDensity, 'high');
    assert.equal(profile.watchlistMatchCount, 2);
  });
});
