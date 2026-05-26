import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OKQ8_FUEL_PRICES_URL,
  OKQ8_MEMBER_BENEFITS_URL,
  OKQ8_MONTHLY_OFFERS_URL,
  parseOkq8FuelPricePage,
  parseOkq8PricingQuirks
} from '../okq8-fuel.js';

const OBSERVED_AT = '2026-05-25T12:00:00.000Z';

const FUEL_PRICE_FIXTURE = `{"title":"OKQ8 GoEasy 95 (Blyfri 95)","cells":[{"text":"18,89 kr","links":[]},{"text":"- 40 öre","links":[]},{"text":"2026-05-22","links":[]}]}
{"title":"OKQ8 GoEasy 98 (Blyfri 98)","cells":[{"text":"20,49 kr","links":[]},{"text":"- 40 öre","links":[]},{"text":"2026-05-22","links":[]}]}
{"title":"OKQ8 GoEasy Diesel","cells":[{"text":"21,34 kr","links":[]},{"text":"- 40 öre","links":[]},{"text":"2026-05-21","links":[]}]}
{"title":"Neste MY Förnybar Diesel (HVO100)","cells":[{"text":"29,89 kr","links":[]},{"text":"- 40 öre","links":[]},{"text":"2026-05-21","links":[]}]}
{"title":"Etanol E85","cells":[{"text":"15,84 kr","links":[]},{"text":"- 50 öre","links":[]},{"text":"2026-05-22","links":[]}]}
<p>För dig som är företagskund gäller priserna här i tabellen. Det pris som skyltas på stationerna och vid pumparna är priset för våra privatkunder.</p>
<p>Oavsett om du tankar i Pajala eller Nässjö, på bemannad eller obemannad station får du samma pris.</p>`;

const OFFERS_FIXTURE = `<!doctype html><main>
<h1>Nyheter och erbjudanden</h1>
<p>Ladda ner OKQ8-appen och bli medlem. I appen kommer du hitta dina kuponger och personliga erbjudanden.</p>
<h2>Några medlemserbjudanden</h2>
<article>Medlemspris Ramlösa & Imsdal 50-65 cl. Gäller alla smaker. 2 för 32 kr. Pant tillkommer. Ord. pris från 26 kr/st. Ej OK-medlem 2 för 37 kr.</article>
</main>`;

const BENEFITS_FIXTURE = `<!doctype html><main>
<h1>Medlemsförmåner</h1>
<p>Medlemserbjudande på OKQ8:s stationer varje månad.</p>
<p>Alltid 10 % rabatt på biltvätt - tänk på miljön - tvätta på station!</p>
</main>`;

describe('OKQ8 fuel and station pricing quirks connector', () => {
  it('marks public OKQ8 fuel table rows as business b2b with national metadata and no consumer promotion flags', () => {
    const rows = parseOkq8FuelPricePage({
      body: FUEL_PRICE_FIXTURE,
      capturedAt: OBSERVED_AT,
      sourceUrl: OKQ8_FUEL_PRICES_URL
    });

    assert.equal(rows.length, 5);
    assert.equal(rows[0]?.channel, 'b2b');
    assert.equal(rows[0]?.customerSegment, 'business');
    assert.equal(rows[0]?.store_id, 'se:national-okq8-business-fuel');
    assert.equal(rows[0]?.region, 'se-national');
    assert.equal(rows[0]?.format, 'okq8_station');
    assert.equal(rows[0]?.is_member_price, false);
    assert.equal(rows[0]?.is_subscription_price, false);
    assert.equal(rows[0]?.is_coupon_price, false);
    assert.equal(rows[0]?.is_clearance, false);
    assert.equal(rows[0]?.multi_buy, null);
    assert.equal(rows[0]?.out_of_scope_for_consumer_connector, true);
    assert.equal(rows[0]?.regional_price_policy, 'same_business_price_nationally_except_adblue_gas_alkylate');
  });

  it('emits source-backed OK member, coupon, multi-buy, car-wash, and b2b fuel quirk rows', () => {
    const rows = parseOkq8PricingQuirks({
      observedAt: OBSERVED_AT,
      pages: [
        { sourceUrl: OKQ8_MONTHLY_OFFERS_URL, html: OFFERS_FIXTURE },
        { sourceUrl: OKQ8_MEMBER_BENEFITS_URL, html: BENEFITS_FIXTURE },
        { sourceUrl: OKQ8_FUEL_PRICES_URL, html: FUEL_PRICE_FIXTURE }
      ]
    });

    assert.deepEqual(rows.map((row) => row.id), [
      'okq8-member-multi-buy-station-goods',
      'okq8-app-personal-coupons',
      'okq8-member-car-wash-discount',
      'okq8-business-fuel-price-split'
    ]);
    assert.equal(rows[0]?.channel, 'store');
    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.membershipProgram, 'OK');
    assert.equal(rows[0]?.price, 32);
    assert.equal(rows[0]?.multi_buy, '2 for 32 SEK; non-member 2 for 37 SEK');
    assert.equal(rows[1]?.channel, 'app');
    assert.equal(rows[1]?.is_coupon_price, true);
    assert.equal(rows[2]?.productScope, 'car_wash');
    assert.equal(rows[2]?.discountPercent, 10);
    assert.equal(rows[3]?.channel, 'b2b');
    assert.equal(rows[3]?.customerSegment, 'business');
    assert.equal(rows[3]?.out_of_scope_for_consumer_connector, true);
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_clearance), false);
  });

  it('rejects non-OKQ8 sources and blocked pages', () => {
    assert.throws(
      () => parseOkq8PricingQuirks({ observedAt: OBSERVED_AT, pages: [{ sourceUrl: 'https://example.com/', html: OFFERS_FIXTURE }] }),
      /only accepts OKQ8/
    );
    assert.throws(
      () => parseOkq8PricingQuirks({ observedAt: OBSERVED_AT, pages: [{ sourceUrl: OKQ8_MONTHLY_OFFERS_URL, html: 'captcha access denied' }] }),
      /blocked\/login/
    );
  });
});
