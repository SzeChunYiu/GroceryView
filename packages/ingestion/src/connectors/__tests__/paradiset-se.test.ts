import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ownerDiscountRow,
  PARADISET_SE_BRANNKYRKAGATAN_STORE_ID,
  PARADISET_SE_SICKLA_STORE_ID,
  parseParadisetSeProductHtml
} from '../paradiset-se.js';

const RETRIEVED_AT = '2026-05-25T17:30:00.000Z';

const STORE_HTML = `
  <h1>Ekologiska tomater 500g</h1>
  <p>Pris 39,90 kr</p>
  <p>Art.nr: TOMAT500</p>
  <p>Paradiset Brannkyrkagatan 62-64</p>
  <p>Jmf pris 79,80 kr/kg</p>
`;

const ONLINE_HTML = `
  <h1>Naturligt diskmedel 500ml</h1>
  <p>59,00 SEK</p>
  <p>SKU DISK500</p>
  <p>Endast online</p>
`;

const COUNTER_HTML = `
  <h1>Dagens deliportion</h1>
  <p>89:-</p>
  <p>Foodcourt Sickla</p>
  <p>tillagad i delikatessdisken</p>
`;

describe('Paradiset SE connector', () => {
  it('parses Stockholm store rows with source-backed owner/member discount fields', () => {
    const [base, owner] = parseParadisetSeProductHtml(
      STORE_HTML,
      'https://www.paradiset.com/butik/ekologiska-tomater-500g.html',
      RETRIEVED_AT,
      { includeOwnerDiscountRows: true }
    );

    assert.equal(base.channel, 'store');
    assert.equal(base.country, 'SE');
    assert.equal(base.currency, 'SEK');
    assert.equal(base.chain, 'paradiset-se');
    assert.equal(base.code, 'TOMAT500');
    assert.equal(base.name, 'Ekologiska tomater 500g');
    assert.equal(base.category, 'butik');
    assert.equal(base.format, 'organic_market');
    assert.equal(base.store_id, PARADISET_SE_BRANNKYRKAGATAN_STORE_ID);
    assert.equal(base.region, 'stockholm');
    assert.equal(base.price, 39.9);
    assert.equal(base.priceText, '39,90 SEK');
    assert.equal(base.unitPrice, 79.8);
    assert.equal(base.unitPriceUnit, 'SEK comparable unit');
    assert.equal(base.is_member_price, false);
    assert.equal(base.is_subscription_price, false);
    assert.equal(base.is_coupon_price, false);
    assert.equal(base.is_clearance, false);
    assert.equal(base.multi_buy, null);

    assert.equal(owner.is_member_price, true);
    assert.equal(owner.is_coupon_price, false);
    assert.equal(owner.membershipProgram, 'Paradiset delagare');
    assert.equal(owner.membershipDiscountPercent, 20);
    assert.equal(owner.sourceDiscountTier, 'owner_20_percent_store');
    assert.equal(owner.price, 31.92);
  });

  it('uses the documented 10 percent owner tier for online rows', () => {
    const [row] = parseParadisetSeProductHtml(ONLINE_HTML, 'https://www.paradiset.com/hushall/naturligt-diskmedel-500ml.html', RETRIEVED_AT);
    const owner = ownerDiscountRow(row);

    assert.equal(row.channel, 'online');
    assert.equal(row.store_id, null);
    assert.equal(row.region, null);
    assert.equal(owner.is_member_price, true);
    assert.equal(owner.membershipDiscountPercent, 10);
    assert.equal(owner.sourceDiscountTier, 'owner_10_percent_online');
    assert.equal(owner.price, 53.1);
  });

  it('supports source-identified counter rows without synthesizing unverified multi-buy or subscription fields', () => {
    const [row] = parseParadisetSeProductHtml(COUNTER_HTML, 'https://www.paradiset.com/sickla/deliportion.html', RETRIEVED_AT);

    assert.equal(row.channel, 'counter');
    assert.equal(row.store_id, PARADISET_SE_SICKLA_STORE_ID);
    assert.equal(row.region, 'stockholm');
    assert.equal(row.is_clearance, false);
    assert.equal(row.is_subscription_price, false);
    assert.equal(row.is_coupon_price, false);
    assert.equal(row.multi_buy, null);
  });
});
