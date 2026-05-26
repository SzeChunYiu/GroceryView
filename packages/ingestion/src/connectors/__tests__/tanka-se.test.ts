import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchTankaSePricingQuirks, parseTankaSePricingQuirks, TANKA_SE_CARPAY_URL, TANKA_SE_HOME_URL } from '../tanka-se.js';

const OBSERVED_AT = '2026-05-25T12:00:00.000Z';
const HOME_FIXTURE = `<!doctype html><main>
<h2>Nytt kring prisinformation</h2>
<p>Vi publicerar inte längre rekommenderade drivmedelspriser på hemsidan men du hittar alltid aktuellt pris på prisskylten på din lokala Tankastation.</p>
</main>`;
const CARPAY_FIXTURE = `<!doctype html><main>
<h1>Det lönar sig att betala med CarPay på Tanka</h1>
<h3>Rabatt varje gång</h3>
<p>Utöver bonusen får du också fina rabatter varje gång du betalar med kortet eller appen. Hos Tanka har du alltid 10 öre per liter i rabatt och hos Tvätta får du 10 % rabatt på samtliga anläggningar runt om i landet.</p>
</main>`;

describe('Tanka SE pricing quirks connector', () => {
  it('emits station-local fuel price rows only when the source says public web prices are withdrawn', () => {
    const rows = parseTankaSePricingQuirks({
      observedAt: OBSERVED_AT,
      pages: [{ sourceUrl: TANKA_SE_HOME_URL, html: HOME_FIXTURE }]
    });

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      id: 'tanka-se-station-local-price-sign',
      domain: 'fuel',
      chainId: 'tanka-se',
      operatorName: 'Tanka',
      country: 'SE',
      kind: 'station_price_notice',
      channel: 'store',
      productScope: 'fuel',
      storePriceSource: 'local_station_price_sign',
      requiresStoreId: true,
      is_member_price: false,
      is_subscription_price: false,
      is_coupon_price: false,
      is_clearance: false,
      observedAt: OBSERVED_AT,
      sourceUrl: TANKA_SE_HOME_URL,
      provenance: rows[0]?.provenance
    });
  });

  it('emits a CarPay member-price adjustment with the source-backed per-litre discount', () => {
    const rows = parseTankaSePricingQuirks({
      observedAt: OBSERVED_AT,
      pages: [{ sourceUrl: TANKA_SE_CARPAY_URL, html: CARPAY_FIXTURE }]
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.kind, 'carpay_fuel_discount');
    assert.equal(rows[0]?.channel, 'store');
    assert.equal(rows[0]?.storePriceSource, 'local_station_price_sign');
    assert.equal(rows[0]?.requiresStoreId, true);
    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.membershipProgram, 'CarPay');
    assert.equal(rows[0]?.discountAmountSekPerLitre, 0.1);
    assert.equal(rows[0]?.is_subscription_price, false);
    assert.equal(rows[0]?.is_coupon_price, false);
    assert.equal(rows[0]?.is_clearance, false);
    assert.match(rows[0]?.provenance.matchedText ?? '', /10 öre per liter/);
  });

  it('deduplicates quirks across pages and rejects unsupported sources or blocked pages', () => {
    const rows = parseTankaSePricingQuirks({
      observedAt: OBSERVED_AT,
      pages: [
        { sourceUrl: TANKA_SE_HOME_URL, html: `${HOME_FIXTURE}${CARPAY_FIXTURE}` },
        { sourceUrl: TANKA_SE_CARPAY_URL, html: CARPAY_FIXTURE }
      ]
    });

    assert.deepEqual(rows.map((row) => row.id), ['tanka-se-station-local-price-sign', 'tanka-se-carpay-fuel-discount']);
    assert.throws(
      () => parseTankaSePricingQuirks({ observedAt: OBSERVED_AT, pages: [{ sourceUrl: 'https://example.com/', html: HOME_FIXTURE }] }),
      /only accepts tanka\.se/
    );
    assert.throws(
      () => parseTankaSePricingQuirks({ observedAt: OBSERVED_AT, pages: [{ sourceUrl: TANKA_SE_HOME_URL, html: 'captcha access denied' }] }),
      /blocked\/login/
    );
  });

  it('uses crawler headers, follows the Tanka SPA app bundle, and rejects blocked HTTP responses', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchTankaSePricingQuirks({
      observedAt: OBSERVED_AT,
      sourceUrls: [TANKA_SE_HOME_URL],
      fetchImpl: async (input, init) => {
        headers.push(init?.headers ?? {});
        if (String(input).includes('/resources/app.')) return new Response(`${HOME_FIXTURE}${CARPAY_FIXTURE}`, { status: 200 });
        return new Response('<!doctype html><script src="resources/app.fixture.js"></script>', { status: 200 });
      }
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('tanka-se-pricing-quirks-connector'), true);
    assert.equal(JSON.stringify(headers[1]).includes('application/javascript'), true);
    await assert.rejects(
      () => fetchTankaSePricingQuirks({ sourceUrls: [TANKA_SE_HOME_URL], fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
