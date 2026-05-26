import { describe, expect, it } from 'vitest';
import { resolvePromotionByStore, type StoreScopedPromotion } from '../promotionByStore.js';

const now = '2026-05-25T12:00:00.000Z';

function promo(input: Partial<StoreScopedPromotion> & Pick<StoreScopedPromotion, 'promotionId'>): StoreScopedPromotion {
  return {
    listingId: 'listing:coffee',
    startsAt: '2026-05-20T00:00:00.000Z',
    endsAt: '2026-05-31T23:59:59.000Z',
    ...input
  };
}

describe('resolvePromotionByStore', () => {
  it('prefers an active exact-store promotion over a chain-wide promotion', () => {
    const result = resolvePromotionByStore({
      listingId: 'listing:coffee',
      storeId: 'ica-odenplan',
      now,
      promotions: [
        promo({ promotionId: 'chain-wide', storeId: null, priority: 50 }),
        promo({ promotionId: 'store-only', storeId: 'ica-odenplan', priority: 1 })
      ]
    });

    expect(result.scope).toBe('store');
    expect(result.promotion?.promotionId).toBe('store-only');
  });

  it('falls back to an active chain-wide promotion when no store row applies', () => {
    const result = resolvePromotionByStore({
      listingId: 'listing:coffee',
      storeId: 'coop-odenplan',
      now,
      promotions: [
        promo({ promotionId: 'other-store', storeId: 'ica-odenplan' }),
        promo({ promotionId: 'chain-wide', storeId: null })
      ]
    });

    expect(result).toMatchObject({
      scope: 'chain',
      promotion: { promotionId: 'chain-wide' }
    });
  });

  it('ignores inactive, wrong-listing, and wrong-store rows before tie-breaking', () => {
    const result = resolvePromotionByStore({
      listingId: 'listing:coffee',
      storeId: 'ica-odenplan',
      now,
      promotions: [
        promo({ promotionId: 'expired', storeId: 'ica-odenplan', endsAt: '2026-05-21T00:00:00.000Z' }),
        promo({ promotionId: 'future', storeId: 'ica-odenplan', startsAt: '2026-05-27T00:00:00.000Z' }),
        promo({ promotionId: 'wrong-listing', listingId: 'listing:tea', storeId: 'ica-odenplan' }),
        promo({ promotionId: 'wrong-store', storeId: 'willys-odenplan' }),
        promo({ promotionId: 'active', storeId: 'ica-odenplan' })
      ]
    });

    expect(result.promotion?.promotionId).toBe('active');
  });

  it('uses priority, recency, and id as deterministic tie-breakers within the same scope', () => {
    const result = resolvePromotionByStore({
      listingId: 'listing:coffee',
      storeId: 'ica-odenplan',
      now,
      promotions: [
        promo({ promotionId: 'older', storeId: null, priority: 5, startsAt: '2026-05-20T00:00:00.000Z' }),
        promo({ promotionId: 'newer', storeId: null, priority: 5, startsAt: '2026-05-22T00:00:00.000Z' }),
        promo({ promotionId: 'lower-priority', storeId: null, priority: 1, startsAt: '2026-05-24T00:00:00.000Z' })
      ]
    });

    expect(result.promotion?.promotionId).toBe('newer');
  });

  it('returns null when no promotion applies and validates required inputs', () => {
    expect(resolvePromotionByStore({
      listingId: 'listing:coffee',
      storeId: 'ica-odenplan',
      now,
      promotions: [promo({ promotionId: 'wrong-store', storeId: 'coop-odenplan' })]
    })).toEqual({ promotion: null, scope: null });

    expect(() => resolvePromotionByStore({ listingId: '', storeId: 'ica', now, promotions: [] })).toThrow(/listingId/);
    expect(() => resolvePromotionByStore({ listingId: 'listing', storeId: '', now, promotions: [] })).toThrow(/storeId/);
    expect(() => resolvePromotionByStore({ listingId: 'listing', storeId: 'ica', now: 'bad', promotions: [] })).toThrow(/now/);
  });
});
