import { describe, expect, it } from 'vitest';
import { rankUnitPriceBeaters } from '../rankers/unitPriceBeaters.js';

describe('rankUnitPriceBeaters', () => {
  it('keeps only promos whose effective kr/kg beats the canonical product 30-day median', () => {
    const ranked = rankUnitPriceBeaters({
      asOf: '2026-05-25T12:00:00.000Z',
      promos: [
        {
          promoId: 'coffee-real',
          canonicalProductId: 'coffee-zoegas-kg',
          productName: 'Zoegas Coffee 450g',
          storeName: 'Willys Odenplan',
          effectiveKrPerKg: 108
        },
        {
          promoId: 'coffee-shrinkflation',
          canonicalProductId: 'coffee-zoegas-kg',
          productName: 'Zoegas Coffee 375g',
          storeName: 'ICA City',
          effectiveKrPerKg: 132
        },
        {
          promoId: 'butter-real',
          canonicalProductId: 'butter-kg',
          productName: 'Butter 500g',
          storeName: 'Coop Odenplan',
          effectiveKrPerKg: 71
        }
      ],
      priceHistory: [
        { canonicalProductId: 'coffee-zoegas-kg', observedAt: '2026-05-01T12:00:00.000Z', krPerKg: 120 },
        { canonicalProductId: 'coffee-zoegas-kg', observedAt: '2026-05-10T12:00:00.000Z', krPerKg: 122 },
        { canonicalProductId: 'coffee-zoegas-kg', observedAt: '2026-05-15T12:00:00.000Z', krPerKg: 124 },
        { canonicalProductId: 'butter-kg', observedAt: '2026-05-03T12:00:00.000Z', krPerKg: 80 },
        { canonicalProductId: 'butter-kg', observedAt: '2026-05-11T12:00:00.000Z', krPerKg: 82 },
        { canonicalProductId: 'butter-kg', observedAt: '2026-05-18T12:00:00.000Z', krPerKg: 84 }
      ]
    });

    expect(ranked.map((promo) => promo.promoId)).toEqual(['butter-real', 'coffee-real']);
    expect(ranked[0]).toMatchObject({
      promoId: 'butter-real',
      rank: 1,
      medianKrPerKg: 82,
      beatKrPerKg: 11,
      beatPercent: 13.41,
      historyObservationCount: 3
    });
    expect(ranked[0]?.explanation).toContain('beats its 30-day median');
  });

  it('uses only active, in-window, same-canonical history and honors confidence thresholds', () => {
    const ranked = rankUnitPriceBeaters({
      asOf: '2026-05-25T12:00:00.000Z',
      minimumSourceConfidence: 0.8,
      minimumBeatPercent: 10,
      promos: [
        {
          promoId: 'active',
          canonicalProductId: 'olive-oil-kg',
          productName: 'Olive Oil 500ml',
          effectiveKrPerKg: 90,
          sourceConfidence: 0.9
        },
        {
          promoId: 'low-confidence',
          canonicalProductId: 'olive-oil-kg',
          productName: 'Olive Oil 1L',
          effectiveKrPerKg: 85,
          sourceConfidence: 0.7
        },
        {
          promoId: 'expired',
          canonicalProductId: 'olive-oil-kg',
          productName: 'Expired Olive Oil',
          effectiveKrPerKg: 80,
          endsAt: '2026-05-20T12:00:00.000Z'
        }
      ],
      priceHistory: [
        { canonicalProductId: 'olive-oil-kg', observedAt: '2026-04-01T12:00:00.000Z', krPerKg: 200 },
        { canonicalProductId: 'olive-oil-kg', observedAt: '2026-05-01T12:00:00.000Z', krPerKg: 100, sourceConfidence: 0.95 },
        { canonicalProductId: 'olive-oil-kg', observedAt: '2026-05-12T12:00:00.000Z', krPerKg: 110, sourceConfidence: 0.9 },
        { canonicalProductId: 'olive-oil-kg', observedAt: '2026-05-20T12:00:00.000Z', krPerKg: 210, sourceConfidence: 0.6 },
        { canonicalProductId: 'different-canonical', observedAt: '2026-05-22T12:00:00.000Z', krPerKg: 150, sourceConfidence: 0.95 }
      ]
    });

    expect(ranked.map((promo) => promo.promoId)).toEqual(['active']);
    expect(ranked[0]).toMatchObject({
      medianKrPerKg: 105,
      beatPercent: 14.29,
      historyObservationCount: 2
    });
  });

  it('drops fake deals priced at or above the 30-day median kr/kg', () => {
    const ranked = rankUnitPriceBeaters({
      asOf: '2026-05-25T12:00:00.000Z',
      promos: [
        {
          promoId: 'same-price',
          canonicalProductId: 'milk-kg',
          productName: 'Milk 1L',
          effectiveKrPerKg: 15
        },
        {
          promoId: 'higher-price',
          canonicalProductId: 'milk-kg',
          productName: 'Milk 750ml',
          effectiveKrPerKg: 18
        }
      ],
      priceHistory: [
        { canonicalProductId: 'milk-kg', observedAt: '2026-05-01T12:00:00.000Z', krPerKg: 14 },
        { canonicalProductId: 'milk-kg', observedAt: '2026-05-12T12:00:00.000Z', krPerKg: 16 }
      ]
    });

    expect(ranked).toEqual([]);
  });

  it('validates money, dates, thresholds, and required canonical identifiers', () => {
    expect(() =>
      rankUnitPriceBeaters({
        topN: 0,
        promos: [],
        priceHistory: []
      })
    ).toThrow(/topN/);

    expect(() =>
      rankUnitPriceBeaters({
        promos: [
          {
            promoId: 'bad',
            canonicalProductId: '',
            productName: 'Bad Promo',
            effectiveKrPerKg: 10
          }
        ],
        priceHistory: []
      })
    ).toThrow(/canonicalProductId/);

    expect(() =>
      rankUnitPriceBeaters({
        promos: [],
        priceHistory: [{ canonicalProductId: 'milk-kg', observedAt: 'not-a-date', krPerKg: 15 }]
      })
    ).toThrow(/observedAt/);
  });
});
