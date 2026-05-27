import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSt1SePricingQuirks } from '../st1-fuel.js';

const retrievedAt = '2026-05-25T12:00:00.000Z';

describe('ST1 SE pricing quirk study connector', () => {
  it('emits only source-backed ST1 pricing quirks', () => {
    const rows = parseSt1SePricingQuirks({
      retrievedAt,
      listPriceHtml: 'Listpriserna gäller oavsett var du tankar och betalar med kortet i Sverige. Din eventuella rabatt gäller alltid mot aktuellt listpris.',
      truckListPriceHtml: 'Vid tankning med St1 Business-kort för tung trafik visar dieselpumpen på St1 Truck ett fiktivt pris på 1 kr/liter. Kvittot visar korrekt pris.',
      lowPriceHtml: 'Varje dag varierar priset på bensinstationer runt om i Sverige. Detta beror på konkurrensen mellan de olika bolagen på orten. Lite drygt 300 prisspioner spanar på och rapporterar drivmedelspriserna på den lokala marknaden till oss på St1.',
      mobilityHtml: 'St1 Mobility ger dig också unika erbjudanden från vägens godaste matdestinationer PLOQ och Välkommen in!',
      evChargingPricesHtml: 'Mullsjö Ladda bilen blixtsnabbt på St1 i Mullsjö Pris: 2,99 kr/kWh Arvika Ladda bilen blixtsnabbt på St1 i Arvika Pris: 5,79 kr/kWh'
    });

    assert.equal(rows.length, 6);
    assert.equal(rows.find((row) => row.product.includes('Business list-price'))?.is_member_price, true);
    assert.equal(rows.find((row) => row.store_id === 'se:local-market-fuel')?.region, 'se-local-market');
    assert.match(rows.find((row) => row.display_price_note)?.display_price_note ?? '', /1 kr\/liter/);
    assert.equal(rows.find((row) => row.channel === 'app')?.is_coupon_price, true);
    assert.equal(rows.find((row) => row.store_id === 'se:st1-ev:mullsjo')?.price, 2.99);
    assert.equal(rows.find((row) => row.store_id === 'se:st1-ev:arvika')?.price, 5.79);
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_clearance || row.multi_buy), false);
  });

  it('fails closed when required primary-source evidence is absent', () => {
    assert.throws(() => parseSt1SePricingQuirks({
      retrievedAt,
      listPriceHtml: '',
      truckListPriceHtml: '',
      lowPriceHtml: '',
      mobilityHtml: '',
      evChargingPricesHtml: ''
    }), /missing evidence/);
  });
});
