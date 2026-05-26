import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseShellSePricingQuirks } from '../shell-se.js';

const retrievedAt = '2026-05-25T12:00:00.000Z';

describe('Shell SE pricing quirk study connector', () => {
  it('emits only source-backed Shell/St1 pricing quirks', () => {
    const rows = parseShellSePricingQuirks({
      retrievedAt,
      homeHtml: 'The station network in Sweden has been rebranded and is now operated by another company.',
      st1HomeHtml:
        'Vi gör cirka 1000 priskontroller dagligen och prissättningen på våra stationer utgår från världsmarknadspriser och den lokala konkurrensen.',
      privateCardHtml: 'St1 Mobility appen ger dig 15 rabatt/liter på Shell och unika erbjudanden och rabatter i PLOQ och Välkommen in! butikerna.',
      mobilityHtml: 'Mat & dryck - en del av våra app-unika erbjudanden. Stanna gärna på PLOQ/ Välkommen in!',
      bonustianHtml: '15 liter ger 1 Bonustia (värd 10 kr), 30 liter ger 2 Bonustior (värd 20 kr) och 45 liter ger 3 Bonustior (värd 30 kr). Max 3 Bonustior.',
      businessCardHtml: 'St1 Business-kort har ingen årsavgift och 450 Tankbara ställen.',
      listPricesHtml: 'Listpriser för lätt trafik. Aktuella listpriser för St1 Business-kort vid tankning på St1s stationer i Sverige.',
      truckDieselHtml: 'Vi tillämpar veckolistpris minus eventuell rabatt. Vid tankning visar dieselpumpen ett fiktivt pris på 1 kr/liter. Kvittot visar korrekt pris.'
    });

    assert.equal(rows.length, 8);
    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.is_coupon_price, true);
    assert.equal(rows[0]?.price, 0.15);
    assert.equal(rows[0]?.format, 'st1_rebranded_shell');
    assert.equal(rows[0]?.store_id, 'se:national-rebranded-shell');
    const bonustian = rows.find((row) => row.product.includes('Bonustian'));
    assert.equal(bonustian?.price, 10);
    assert.equal(bonustian?.multi_buy, '15l=10kr_voucher;30l=20kr_vouchers;45l=30kr_vouchers');
    assert.equal(rows.some((row) => row.product.includes('dynamic pump pricing') && row.channel === 'store'), true);
    assert.equal(rows.some((row) => row.product.includes('app-only PLOQ') && row.is_coupon_price), true);
    assert.equal(rows.find((row) => row.channel === 'b2b')?.out_of_scope_for_consumer_connector, true);
    assert.match(rows.find((row) => row.display_price_note)?.display_price_note ?? '', /1 kr\/liter/);
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_clearance), false);
  });

  it('fails closed when required primary-source evidence is absent', () => {
    assert.throws(
      () =>
        parseShellSePricingQuirks({
          retrievedAt,
          homeHtml: '',
          st1HomeHtml: '',
          privateCardHtml: '',
          mobilityHtml: '',
          bonustianHtml: '',
          businessCardHtml: '',
          listPricesHtml: '',
          truckDieselHtml: ''
        }),
      /missing evidence/
    );
  });
});
