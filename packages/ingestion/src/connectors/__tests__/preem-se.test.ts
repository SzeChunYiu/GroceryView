import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchPreemSeBusinessListPrices,
  fetchPreemSeMemberFuelDiscounts,
  parsePreemSeBusinessListPrices,
  parsePreemSeMemberFuelDiscounts,
  PREEM_SE_BUSINESS_LIST_URL,
  PREEM_SE_MEMBER_URL
} from '../preem-se.js';

const OBSERVED_AT = '2026-05-25T10:00:00.000Z';
const FIXTURE = `<!doctype html><main>
<h1>Aktuella listpriser för företagskunder</h1>
<h2>Listpriser Företagskort och Transportkort</h2>
Diesel Pris inkl. moms Gäller fr.om
Diesel Preem Evolution Diesel Pris inkl. moms 21,34 kr/l Gäller fr.om 2026-05-21
Bensin Preem Evolution Bensin 95 Pris inkl. moms 18,89 kr/l Gäller fr.om 2026-05-22
Alternativa drivmedel CBG - Fordonsgas Pris inkl. moms 29,89 kr/kg Gäller fr.om 2026-03-12
<h2>Listpriser Truckkort</h2>
Diesel ACP Diesel Pris inkl. moms 21,45 kr/l Gäller fr.om 2026-05-25
<h2>Listpriser Bulk</h2>
Diesel Preem Evolution Diesel Pris exkl. moms 16 307 kr/m3 Gäller fr.om 2026-05-25
Eldningsolja Eldningsolja E0504 Pris exkl. moms 13 384 kr/Nm3 Gäller fr.om 2026-05-25
<h2>Listpriser Elfordonsladdning</h2>
Laddningstyp Preem Pris inkl. moms 4,99 kr/kWh Gäller fr.om 2025-11-13
</main>`;
const MEMBER_FIXTURE = `<!doctype html><main>
<h1>Preem Medlem</h1>
25 öre/liter i drivmedelsrabatt på butikstationer med Preem Mastercard
15 öre/liter i rabatt på butikstationer med Preem Privatkort eller ett anslutet betalkort
10 öre/liter i rabatt på automatstationer
Preempris på elfordonsladdning i appen
</main>`;

describe('Preem SE business list connector', () => {
  it('parses business-card, truck-card, and bulk fuel rows with source-backed units and dates', () => {
    const rows = parsePreemSeBusinessListPrices({ html: FIXTURE, observedAt: OBSERVED_AT });

    assert.equal(rows.length, 6);
    assert.deepEqual(rows[0], {
      id: 'preem-business_card-preem-evolution-diesel-2026-05-21',
      domain: 'fuel',
      chainId: 'preem',
      operatorName: 'Preem',
      customerSegment: 'business',
      listPriceKind: 'business_card',
      channel: 'business_list',
      priceScope: 'national_business_list',
      discountBasis: 'pre_discount_list_price',
      isMemberPrice: false,
      isSubscriptionPrice: false,
      isCouponPrice: false,
      isClearance: false,
      multiBuy: null,
      productName: 'Preem Evolution Diesel',
      price: 21.34,
      currency: 'SEK',
      unit: 'l',
      includesVat: true,
      effectiveFrom: '2026-05-21',
      observedAt: OBSERVED_AT,
      sourceUrl: PREEM_SE_BUSINESS_LIST_URL,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.productName === 'ACP Diesel')?.listPriceKind, 'truck_card');
    assert.equal(rows.find((row) => row.productName === 'Preem Evolution Diesel' && row.listPriceKind === 'bulk')?.includesVat, false);
    assert.equal(rows.find((row) => row.unit === 'Nm3')?.price, 13384);
  });

  it('parses Preem Medlem per-liter fuel discounts as member-price rows', () => {
    const rows = parsePreemSeMemberFuelDiscounts({ html: MEMBER_FIXTURE, observedAt: OBSERVED_AT });

    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      stationFormat: row.stationFormat,
      requirement: row.requirement,
      discountAmount: row.discountAmount,
      discountUnit: row.discountUnit,
      isMemberPrice: row.isMemberPrice,
      isCouponPrice: row.isCouponPrice
    })), [
      {
        id: 'preem-member-mastercard-staffed',
        channel: 'member_discount',
        stationFormat: 'staffed',
        requirement: 'preem_mastercard',
        discountAmount: 0.25,
        discountUnit: 'SEK/l',
        isMemberPrice: true,
        isCouponPrice: false
      },
      {
        id: 'preem-member-private-card-or-connected-card-staffed',
        channel: 'member_discount',
        stationFormat: 'staffed',
        requirement: 'preem_privatkort_or_connected_payment_card',
        discountAmount: 0.15,
        discountUnit: 'SEK/l',
        isMemberPrice: true,
        isCouponPrice: false
      },
      {
        id: 'preem-member-member-card-automatic',
        channel: 'member_discount',
        stationFormat: 'automatic',
        requirement: 'preem_member_payment_card',
        discountAmount: 0.1,
        discountUnit: 'SEK/l',
        isMemberPrice: true,
        isCouponPrice: false
      }
    ]);
    assert.equal(rows[0]?.sourceUrl, PREEM_SE_MEMBER_URL);
  });

  it('fails closed for consumer pump URLs and blocked pages', () => {
    assert.throws(
      () => parsePreemSeBusinessListPrices({ html: FIXTURE, observedAt: OBSERVED_AT, sourceUrl: 'https://www.preem.se/privat/drivmedelspriser/' }),
      /business list price page/
    );
    assert.throws(
      () => parsePreemSeBusinessListPrices({ html: 'Access denied captcha', observedAt: OBSERVED_AT }),
      /blocked\/login/
    );
  });

  it('uses crawler headers and fails closed on blocked HTTP responses', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchPreemSeBusinessListPrices({
      observedAt: OBSERVED_AT,
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 6);
    assert.equal(JSON.stringify(headers[0]).includes('preem-business-list-connector'), true);
    await assert.rejects(
      () => fetchPreemSeBusinessListPrices({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fetches member-discount rows with connector headers and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchPreemSeMemberFuelDiscounts({
      observedAt: OBSERVED_AT,
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(MEMBER_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 3);
    assert.equal(JSON.stringify(headers[0]).includes('preem-member-discount-connector'), true);
    await assert.rejects(
      () => fetchPreemSeMemberFuelDiscounts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
