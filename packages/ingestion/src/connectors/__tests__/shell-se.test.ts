import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseShellSePricingQuirks } from '../shell-se.js';

const retrievedAt = '2026-05-25T12:00:00.000Z';

describe('Shell SE pricing quirk study connector', () => {
  it('emits only source-backed Shell/St1 pricing quirks', () => {
    const rows = parseShellSePricingQuirks({
      retrievedAt,
      homeHtml: 'Samtliga Shellstationer i Sverige har nu skyltats om till St1. I Sverige har vi skyltat om 188 stationer.',
      privateCardHtml: 'St1 Mobility appen ger dig 15 rabatt/liter på Shell och unika erbjudanden och rabatter i PLOQ och Välkommen in! butikerna.',
      listPricesHtml: 'Företagskund Listpriser lätt yrkestrafik Välkommen att läsa mer på St1.se',
      truckDieselHtml: 'Genom att sätta ett fiktivt literpris till 1 kr/liter ... Kvittot visar aktuellt pumppris, liter och totalbelopp.'
    });

    assert.equal(rows.length, 4);
    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.is_coupon_price, true);
    assert.equal(rows[0]?.price, 0.15);
    assert.equal(rows[0]?.format, 'st1_rebranded_shell');
    assert.equal(rows[0]?.store_id, 'se:national-rebranded-shell');
    assert.equal(rows.find((row) => row.channel === 'b2b')?.out_of_scope_for_consumer_connector, true);
    assert.match(rows.find((row) => row.display_price_note)?.display_price_note ?? '', /1 kr\/liter/);
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_clearance || row.multi_buy), false);
  });

  it('fails closed when required primary-source evidence is absent', () => {
    assert.throws(() => parseShellSePricingQuirks({ retrievedAt, homeHtml: '', privateCardHtml: '', listPricesHtml: '', truckDieselHtml: '' }), /missing evidence/);
  });
});
