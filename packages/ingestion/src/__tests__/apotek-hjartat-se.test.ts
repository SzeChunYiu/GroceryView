import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeApotekHjartatPriceRows } from '../connectors/apotek-hjartat-se.js';

describe('normalizeApotekHjartatPriceRows', () => {
  it('emits online and store rows when both prices are present', () => {
    const rows = normalizeApotekHjartatPriceRows({
      sku: 'barebells-banana-55g',
      name: 'Barebells Soft Bar Banana Dream 55 g',
      sourceUrl: 'https://www.apotekhjartat.se/varumarken/barebells/barebells-soft-bar-banana-dream-55-g',
      onlinePrice: 18.4,
      storePrice: 32.9,
      campaignText: '20% online',
      category: 'Mat & dryck',
      observedAt: '2026-05-24T15:00:00.000Z'
    });

    assert.deepEqual(rows.map((row) => [row.channel, row.price]), [['online', 18.4], ['store', 32.9]]);
  });

  it('marks member and coupon rows from verified Klubb Hjärtat campaign text', () => {
    const rows = normalizeApotekHjartatPriceRows({
      sku: 'senior-discount',
      name: 'Senior discount basket',
      sourceUrl: 'https://www.apotekhjartat.se/samarbetspartners-och-klubbformaner',
      onlinePrice: 95,
      campaignText: 'Klubb Hjärtat seniorrabatt KHSE5',
      observedAt: '2026-05-24T15:00:00.000Z'
    });

    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.is_coupon_price, true);
  });

  it('extracts multi-buy mechanics from offer labels', () => {
    const rows = normalizeApotekHjartatPriceRows({
      sku: 'offer-2-for-25',
      name: 'Offer row',
      sourceUrl: 'https://www.apotekhjartat.se/erbjudanden',
      onlinePrice: 100,
      campaignText: '2 för 25% online',
      observedAt: '2026-05-24T15:00:00.000Z'
    });

    assert.deepEqual(rows[0]?.multi_buy, { quantity: 2, mechanic: '2 för 25%' });
  });
});
