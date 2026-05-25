import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GOODSTORE_SE_STORE_ID,
  memberPriceRow,
  parseGoodstoreSeProductHtml
} from '../goodstore-se.js';

const RETRIEVED_AT = '2026-05-25T11:57:00.000Z';
const ONLINE_HTML = `
  <h1>Ugnsrengöring 500ml Ecover</h1>
  <p>79,95 SEK</p>
  <p>I lager: 9</p>
  <p>Leverans: Omgående</p>
  <p>Art.nr: 1008995</p>
`;
const STORE_ONLY_HTML = `
  <h1>Potatischips Olivolja 100g Trafo Eko</h1>
  <p>39,95 SEK</p>
  <p>Art.nr: 1003771</p>
  <p>Endast i butik</p>
  <p>Jmf pris SEK 400</p>
`;
const MULTIBUY_HTML = `
  <h1>Sweet Ps Jordnötter Choklad 150g - KÖP 2 SPARA 20KR!</h1>
  <p>49,95 SEK</p>
  <p>Art.nr: 1000001</p>
`;

describe('Goodstore SE connector', () => {
  it('parses online Goodstore rows with delivery fee, Stockholm store id, and single-store format', () => {
    const [row] = parseGoodstoreSeProductHtml(ONLINE_HTML, 'https://www.goodstore.se/hushall/ugnsrengoring-500ml-ecover.html', RETRIEVED_AT);

    assert.equal(row.channel, 'online');
    assert.equal(row.country, 'SE');
    assert.equal(row.currency, 'SEK');
    assert.equal(row.chain, 'goodstore-se');
    assert.equal(row.code, '1008995');
    assert.equal(row.name, 'Ugnsrengöring 500ml Ecover');
    assert.equal(row.category, 'hushall');
    assert.equal(row.format, 'single_store_webshop');
    assert.equal(row.store_id, GOODSTORE_SE_STORE_ID);
    assert.equal(row.storeName, 'Goodstore Åsögatan 116');
    assert.equal(row.region, 'stockholm');
    assert.equal(row.deliveryFeeSek, 79.95);
    assert.equal(row.freeShippingThresholdSek, 999);
    assert.equal(row.minimumOrderSek, 300);
    assert.equal(row.price, 79.95);
    assert.equal(row.priceText, '79,95 SEK');
    assert.equal(row.unitPrice, null);
    assert.equal(row.unitPriceUnit, '');
    assert.equal(row.is_member_price, false);
    assert.equal(row.is_coupon_price, false);
    assert.equal(row.is_subscription_price, false);
    assert.equal(row.is_clearance, false);
    assert.equal(row.membershipProgram, null);
    assert.equal(row.membershipDiscountPercent, null);
    assert.equal(row.productUrl, 'https://www.goodstore.se/hushall/ugnsrengoring-500ml-ecover.html');
    assert.equal(row.sourceUrl, 'https://www.goodstore.se/hushall/ugnsrengoring-500ml-ecover.html');
    assert.equal(row.retrievedAt, RETRIEVED_AT);
  });

  it('emits store-channel rows for source-marked store-only products without delivery fees', () => {
    const [row] = parseGoodstoreSeProductHtml(STORE_ONLY_HTML, 'https://www.goodstore.se/choklad-godis-bars-snacks/potatischips-olivolja-100g-trafo-eko.html', RETRIEVED_AT);

    assert.equal(row.channel, 'store');
    assert.equal(row.deliveryFeeSek, null);
    assert.equal(row.freeShippingThresholdSek, null);
    assert.equal(row.minimumOrderSek, null);
    assert.equal(row.price, 39.95);
    assert.equal(row.unitPrice, 400);
    assert.equal(row.unitPriceUnit, 'SEK comparable unit');
  });

  it('can emit Goodfriends member/coupon price rows and explicit multi-buy promotion rows', () => {
    const [base, member] = parseGoodstoreSeProductHtml(MULTIBUY_HTML, 'https://www.goodstore.se/choklad-godis-bars-snacks/sweet-ps-jordnotter-choklad-150g.html', RETRIEVED_AT, { includeMemberPriceRows: true });

    assert.equal(base.multi_buy, 'buy_2_save_20_sek');
    assert.equal(member.is_member_price, true);
    assert.equal(member.is_coupon_price, true);
    assert.equal(member.membershipProgram, 'Goodfriends');
    assert.equal(member.membershipDiscountPercent, 3);
    assert.equal(member.price, 48.45);

    const tenPercent = memberPriceRow(base, 10);
    assert.equal(tenPercent.membershipDiscountPercent, 10);
    assert.equal(tenPercent.price, 44.96);
  });
});
