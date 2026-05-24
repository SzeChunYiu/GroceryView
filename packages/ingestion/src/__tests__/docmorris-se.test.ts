import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DOCMORRIS_SE_PRICING_QUIRKS, normalizeDocMorrisSeRow } from '../index.js';

describe('DocMorris SE connector pricing quirks', () => {
  it('defaults verified rows to the online channel from the docmorris.se redirect study', () => {
    const row = normalizeDocMorrisSeRow({
      sourceUrl: 'https://www.docmorris.de/',
      productName: 'DocMorris source example',
      price: 4.99,
      currency: 'EUR'
    });

    assert.equal(row.source, 'docmorris-se');
    assert.equal(row.channel, 'online');
  });

  it('codifies every justified price-quirk field without inventing unsupported store/counter rows', () => {
    const couponRow = normalizeDocMorrisSeRow({
      sourceUrl: 'https://www.docmorris.de/lp/gutschein',
      productName: 'Coupon example',
      price: 24.49,
      currency: 'EUR',
      is_coupon_price: true
    });
    const pointsRow = normalizeDocMorrisSeRow({
      sourceUrl: 'https://www.docmorris.de/punkte',
      productName: 'Points redemption example',
      price: 10,
      currency: 'EUR',
      is_member_price: true
    });
    const subscriptionRow = normalizeDocMorrisSeRow({
      sourceUrl: 'https://www.docmorris.de/rezepte/rezept-abo',
      productName: 'Prescription subscription example',
      price: 0,
      currency: 'EUR',
      is_subscription_price: true
    });
    const multiBuyRow = normalizeDocMorrisSeRow({
      sourceUrl: 'https://www.docmorris.de/',
      productName: 'Future product-level N+ example',
      price: 3,
      currency: 'EUR',
      multi_buy: { minimumQuantity: 2, unitPrice: 3 }
    });

    assert.equal(couponRow[DOCMORRIS_SE_PRICING_QUIRKS.couponField], true);
    assert.equal(pointsRow[DOCMORRIS_SE_PRICING_QUIRKS.loyaltyField], true);
    assert.equal(subscriptionRow[DOCMORRIS_SE_PRICING_QUIRKS.subscriptionField], true);
    assert.deepEqual(multiBuyRow[DOCMORRIS_SE_PRICING_QUIRKS.multiBuyField], { minimumQuantity: 2, unitPrice: 3 });
    assert.deepEqual(DOCMORRIS_SE_PRICING_QUIRKS.unsupportedChannels, ['store', 'counter']);
  });
});
