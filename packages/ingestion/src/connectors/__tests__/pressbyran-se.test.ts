import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parsePressbyranSeMagazineProductHtml,
  pressbyranSeHalfPriceGlassPromotionRows,
  pressbyranSeKompisFikaPromotionRow
} from '../pressbyran-se.js';

const RETRIEVED_AT = '2026-05-25T13:40:00.000Z';

const ALLAS_HTML = `
  <h1>Allas</h1>
  <p>Ge bort som gåva?</p>
  <p>Vill du ge bort en tidning som gåva så väljer du det under leveranssteget i kassan.</p>
  <p>När startar min prenumeration?</p>
  <p>Prenumerationen aktiveras efter 14 dagar.</p>
  <p>Välj prenumeration eller lösnummer:</p>
  <p>Tillsvidareprenumeration44,90 kr</p>
  <p>Helår (52 nummer)2 334,80 kr</p>
  <p>Halvår (26 nummer)1 167,40 kr</p>
  <p>Kvartal (13 nummer)583,70 kr</p>
  <p>Lösnummer #21, 2026 44,90 kr</p>
  <button>Lägg i varukorgen</button>
  <p>Alla priser är inklusive moms. Avgift för frakt tillkommer vid beställningstillfället och börjar på 26 kr. Den slutliga kostnaden beror på leveransadress och paketets vikt. Vi levererar bara inom Sverige.</p>
`;

describe('Pressbyrån SE connector', () => {
  it('parses magazine-webshop subscription and single-issue rows with online channel metadata', () => {
    const rows = parsePressbyranSeMagazineProductHtml(ALLAS_HTML, 'https://webshop.pressbyran.se/sv/familj/ovrigt-familj/allas', RETRIEVED_AT);

    assert.equal(rows.length, 5);
    assert.deepEqual(rows.map((row) => [row.subscriptionTerm, row.issueLabel, row.price, row.is_subscription_price]), [
      ['Tillsvidareprenumeration', null, 44.9, true],
      ['Helår (52 nummer)', null, 2334.8, true],
      ['Halvår (26 nummer)', null, 1167.4, true],
      ['Kvartal (13 nummer)', null, 583.7, true],
      [null, 'Lösnummer #21, 2026', 44.9, false]
    ]);

    const [subscription] = rows;
    assert.equal(subscription.country, 'SE');
    assert.equal(subscription.currency, 'SEK');
    assert.equal(subscription.chain, 'pressbyran-se');
    assert.equal(subscription.channel, 'online');
    assert.equal(subscription.format, 'magazine_webshop');
    assert.equal(subscription.category, 'magazine');
    assert.equal(subscription.shippingFeeFromSek, 26);
    assert.equal(subscription.is_member_price, false);
    assert.equal(subscription.is_coupon_price, false);
    assert.equal(subscription.is_clearance, false);
    assert.equal(subscription.multi_buy, null);
    assert.equal(subscription.sourceUrl, 'https://webshop.pressbyran.se/sv/familj/ovrigt-familj/allas');
    assert.equal(subscription.retrievedAt, RETRIEVED_AT);
  });

  it('emits the Pressbyrån Kompis app coupon/member fika promotion fields', () => {
    const row = pressbyranSeKompisFikaPromotionRow(RETRIEVED_AT);

    assert.equal(row.is_member_price, true);
    assert.equal(row.is_coupon_price, true);
    assert.equal(row.is_subscription_price, false);
    assert.equal(row.membershipProgram, 'Pressbyrån Kompis');
    assert.equal(row.promotion, 'Kompisfika');
    assert.equal(row.discountPercent, 50);
    assert.equal(row.schedule, 'tisdagar 15:00-16:00');
    assert.equal(row.channel, 'store');
    assert.equal(row.format, 'pressbyran');
    assert.equal(row.price, null);
  });

  it('emits separate store and delivery rows for the verified half-price glass campaign', () => {
    const rows = pressbyranSeHalfPriceGlassPromotionRows(RETRIEVED_AT);

    assert.deepEqual(rows.map((row) => row.channel), ['store', 'delivery']);
    for (const row of rows) {
      assert.equal(row.category, 'ice_cream');
      assert.equal(row.discountPercent, 50);
      assert.equal(row.promotion, 'Halva priset på all glass');
      assert.equal(row.is_member_price, false);
      assert.equal(row.is_coupon_price, false);
      assert.equal(row.is_subscription_price, false);
      assert.equal(row.price, 10);
      assert.equal(row.priceText, '10,00 SEK vid ordinarie pris 20,00 SEK');
    }
    assert.deepEqual(rows[1]?.deliveryPartners, ['Wolt', 'Foodora', 'Uber Eats']);
  });
});
