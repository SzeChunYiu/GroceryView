import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseSevenElevenSeConvenienceProducts,
  parseSevenElevenSePricingQuirks,
  SEVEN_ELEVEN_SE_APP_TERMS_URL,
  SEVEN_ELEVEN_SE_APP_URL,
  SEVEN_ELEVEN_SE_BUSINESS_ORDERS_PATH,
  SEVEN_ELEVEN_SE_CLICK_AND_COLLECT_TERMS_URL
} from '../seven-eleven-se.js';

const RETRIEVED_AT = '2026-05-25T14:00:00.000Z';

const PDF_TEXT = `
FRALLA OST & SKINKA
39-45:-
KAFFE LATTE
29-35:-
`;

const APP_FIXTURE = `<!doctype html><main>
<h1>Ladda ner appen</h1>
<h2>Få våra bästa deals direkt i fickan med The Corner Club</h2>
<p>En gratis kopp kaffe när du laddar ned appen och registrerar dig.</p>
<p>Samla stämplar och välj olika Treats.</p>
<p>Få exklusiva app-deals på mat, mellis och fika.</p>
</main>`;

const APP_TERMS_FIXTURE = `<!doctype html><main>
<h1>ALLMÄNNA VILLKOR FÖR MEDLEMSKAP I 7-ELEVENS KUNDKLUBB THE CORNER CLUB</h1>
<p>Du blir medlem i The Corner Club när du laddar ner- och skapar ett konto i 7-Eleven appen.</p>
<p>Som medlem i 7-Eleven The Corner Club kan du få rabatter och erbjudanden som vi laddar upp i 7-Eleven App.</p>
<p>Du löser in ett erbjudande eller en rabatt genom att skanna den specifika App-kupongens QR-kod i kassan i en 7-Eleven butik.</p>
<p>En App-kupong kan vara en gratis- eller rabattkupong på en vara eller tjänst.</p>
</main>`;

const CLICK_COLLECT_FIXTURE = `<!doctype html><main>
<h1>Allmänna villkor för Click and Collect</h1>
<p>Click and Collect är en tjänst via shop.7-eleven.se.</p>
<p>RCS garanterar inte att priserna för Produkterna i Tjänsten följer priserna i butik.</p>
<p>Rabattkuponger/koder kan användas i samband med en beställning i Tjänsten.</p>
</main>`;

describe('7-Eleven SE connector', () => {
  it('marks B2B assortment PDF rows as business-channel rows outside consumer comparison', () => {
    const rows = parseSevenElevenSeConvenienceProducts(PDF_TEXT, {
      sourceUrl: `https://7-eleven.se${SEVEN_ELEVEN_SE_BUSINESS_ORDERS_PATH}`,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.channel, 'b2b');
    assert.equal(rows[0]?.customerSegment, 'business');
    assert.equal(rows[0]?.format, 'seven_eleven');
    assert.equal(rows[0]?.store_id, 'se:national-seven-eleven-b2b');
    assert.equal(rows[0]?.region, 'se-national');
    assert.equal(rows[0]?.is_member_price, false);
    assert.equal(rows[0]?.is_subscription_price, false);
    assert.equal(rows[0]?.is_coupon_price, false);
    assert.equal(rows[0]?.is_clearance, false);
    assert.equal(rows[0]?.multi_buy, null);
    assert.equal(rows[0]?.out_of_scope_for_consumer_connector, true);
  });

  it('emits source-backed The Corner Club app, coupon, and Click and Collect price-split quirks', () => {
    const rows = parseSevenElevenSePricingQuirks({
      retrievedAt: RETRIEVED_AT,
      pages: [
        { sourceUrl: SEVEN_ELEVEN_SE_APP_URL, html: APP_FIXTURE },
        { sourceUrl: SEVEN_ELEVEN_SE_APP_TERMS_URL, html: APP_TERMS_FIXTURE },
        { sourceUrl: SEVEN_ELEVEN_SE_CLICK_AND_COLLECT_TERMS_URL, html: CLICK_COLLECT_FIXTURE }
      ]
    });

    assert.deepEqual(rows.map((row) => row.id), [
      'seven-eleven-se-corner-club-app-deals',
      'seven-eleven-se-corner-club-coupon-redemption',
      'seven-eleven-se-click-and-collect-price-split'
    ]);
    assert.equal(rows[0]?.channel, 'app');
    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.membershipProgram, 'The Corner Club');
    assert.equal(rows[0]?.is_coupon_price, true);
    assert.equal(rows[1]?.is_coupon_price, true);
    assert.equal(rows[2]?.channel, 'online');
    assert.equal(rows[2]?.customerSegment, 'consumer');
    assert.equal(rows[2]?.is_coupon_price, true);
    assert.equal(rows[2]?.store_id, 'se:national-seven-eleven');
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_clearance || row.multi_buy), false);
  });

  it('rejects unsupported sources and blocked pages', () => {
    assert.throws(
      () => parseSevenElevenSePricingQuirks({ retrievedAt: RETRIEVED_AT, pages: [{ sourceUrl: 'https://example.com/', html: APP_FIXTURE }] }),
      /only accepts 7-eleven\.se/
    );
    assert.throws(
      () => parseSevenElevenSePricingQuirks({ retrievedAt: RETRIEVED_AT, pages: [{ sourceUrl: SEVEN_ELEVEN_SE_APP_URL, html: 'captcha access denied' }] }),
      /blocked\/login/
    );
  });
});
