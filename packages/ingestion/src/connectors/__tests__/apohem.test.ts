import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeApohemProduct } from '../apohem.js';

const SOURCE_URL = 'https://www.apohem.se/rabattkod';
const RETRIEVED_AT = '2026-05-25T14:00:00.000Z';

describe('Apohem pricing quirks', () => {
  it('emits online channel and coupon/member/multi-buy flags from Apohem labels', () => {
    const row = normalizeApohemProduct(
      {
        url: '/libresse',
        displayName: '20% MAJ20 Club Apohem Libresse 2 st',
        brandName: 'Libresse',
        code: 'libresse-2st',
        variationEAN: '7310791185601',
        price: {
          current: { inclVat: 48, vatPercent: 25 },
          previous: { inclVat: 60 }
        },
        stock: { status: 'Finns i lager' },
        isotc: false,
        campaignLabel: 'Club Deal',
        promotionLabel: '2 för 89 kr',
        requiresCoupon: true
      },
      SOURCE_URL,
      RETRIEVED_AT
    );

    assert.equal(row?.chain, 'apohem');
    assert.equal(row?.channel, 'online');
    assert.equal(row?.is_member_price, true);
    assert.equal(row?.is_coupon_price, true);
    assert.equal(row?.multi_buy, '2 för 89 kr');
    assert.equal(row?.price, 48);
    assert.equal(row?.originalPrice, 60);
  });

  it('does not emit prescription products', () => {
    assert.equal(
      normalizeApohemProduct(
        {
          displayName: 'Receptbelagt läkemedel',
          variationEAN: '7310791185601',
          price: { current: { inclVat: 99 } },
          isPrescriptionProduct: true
        },
        SOURCE_URL,
        RETRIEVED_AT
      ),
      null
    );
  });
});
