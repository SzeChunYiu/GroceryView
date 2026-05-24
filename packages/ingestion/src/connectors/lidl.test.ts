import { describe, expect, it } from 'vitest';
import { normalizeLidlOffer, parseLidlMultiBuyPromotion } from './lidl';

describe('Lidl SE pricing quirks', () => {
  it('marks Lidl Plus coupon rows as store-channel member coupon prices', () => {
    const row = normalizeLidlOffer(
      {
        productId: 'sugar-1',
        title: 'Strösocker',
        regionsPrices: {
          se: {
            currentLidlPlusPrice: {
              highlightText: 'Kupong -23%',
              price: { price: 16.9, oldPrice: 22.2, currencyCode: 'SEK', packaging: { text: '2 kg' } }
            }
          }
        }
      },
      'https://www.lidl.se/c/lidl-plus-erbjudanden/a10094682',
      '2026-05-24T00:00:00.000Z'
    );

    expect(row?.channel).toBe('store');
    expect(row?.is_member_price).toBe(true);
    expect(row?.is_coupon_price).toBe(true);
  });

  it('extracts multi-buy tiers from flyer promotion text', () => {
    expect(parseLidlMultiBuyPromotion('2 FÖR:', 25, '25.00 SEK')).toEqual({
      price: 25,
      priceText: '25.00 SEK',
      quantity: 2,
      text: '2 FÖR:'
    });
  });
});
