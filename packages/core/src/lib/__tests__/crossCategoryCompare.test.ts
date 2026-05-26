import { describe, expect, it } from 'vitest';
import { findCheapestCrossCategorySource } from '../crossCategoryCompare.js';

describe('findCheapestCrossCategorySource', () => {
  it('returns the cheapest exact SKU across grocery and variety retailer types', () => {
    const result = findCheapestCrossCategorySource({
      canonicalProduct: { productId: 'toothpaste-75ml', name: 'Toothpaste 75 ml', sku: '7318690000012' },
      candidates: [
        {
          productId: 'toothpaste-75ml',
          productName: 'Toothpaste 75 ml',
          chainId: 'willys',
          chainName: 'Willys',
          storeName: 'Willys Odenplan',
          retailerType: 'grocery',
          price: 29.9,
          currency: 'SEK',
          sku: '7318690000012'
        },
        {
          productId: 'normal-toothpaste-75ml',
          productName: 'Toothpaste 75 ml',
          chainId: 'normal-se',
          chainName: 'Normal',
          storeName: 'Normal Drottninggatan',
          retailerType: 'variety',
          price: 19.9,
          currency: 'SEK',
          canonicalSku: '7318690000012'
        },
        {
          productId: 'other-toothpaste-125ml',
          productName: 'Different toothpaste 125 ml',
          chainId: 'cheap-variety',
          retailerType: 'variety',
          price: 9.9,
          currency: 'SEK',
          sku: '0000000000000'
        }
      ]
    });

    expect(result.status).toBe('priced');
    expect(result.cheapest).toMatchObject({
      chainId: 'normal-se',
      retailerType: 'variety',
      price: 19.9,
      effectivePrice: 19.9,
      savingsVsNext: 10
    });
    expect(result.rows.map((row) => row.chainId)).toEqual(['normal-se', 'willys']);
    expect(result.coverage).toMatchObject({
      sourceCount: 2,
      retailerTypes: ['grocery', 'variety'],
      varietySourceCount: 1,
      rejectedSourceCount: 1
    });
    expect(result.badgeLabel).toContain('Normal Drottninggatan');
  });

  it('supports declared product equivalents without inferring category-only name matches', () => {
    const result = findCheapestCrossCategorySource({
      canonicalProduct: {
        productId: 'diapers-size-4-canonical',
        name: 'Diapers size 4',
        equivalentProductIds: ['diapers-size-4-variety']
      },
      candidates: [
        {
          productId: 'diapers-size-4-variety',
          productName: 'Diapers size 4',
          chainId: 'dollarstore-se',
          retailerType: 'variety',
          price: 69,
          unitPrice: 1.15,
          currency: 'SEK'
        },
        {
          productId: 'diapers-size-5-cheaper',
          productName: 'Diapers size 5',
          chainId: 'other-variety',
          retailerType: 'variety',
          price: 59,
          unitPrice: 0.98,
          currency: 'SEK'
        }
      ],
      priceBasis: 'unit'
    });

    expect(result.rows).toHaveLength(1);
    expect(result.cheapest).toMatchObject({
      productId: 'diapers-size-4-variety',
      effectivePrice: 1.15,
      priceBasis: 'unit'
    });
    expect(result.coverage.rejectedSourceCount).toBe(1);
    expect(result.guardrails[0]).toMatch(/exact canonical product ids/i);
  });
});
