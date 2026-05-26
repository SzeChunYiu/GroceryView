import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPer100gUnitPriceLabel,
  formatSourceUnitPriceText,
  formatUnitPriceLabel,
  normalizeUnitPriceDisplayUnit,
  unknownUnitPriceLabel
} from '../src/lib/unit-price-formatting.js';

describe('unit price formatting', () => {
  it('normalizes grocery comparable units to one Swedish jämförpris shape', () => {
    assert.equal(formatUnitPriceLabel(12.3, 'kg'), '12,30 kr/kg');
    assert.equal(formatUnitPriceLabel(4.5, 'kr/l'), '4,50 kr/l');
    assert.equal(formatUnitPriceLabel(2, 'piece'), '2,00 kr/st');
    assert.equal(formatUnitPriceLabel(0.89, '100g'), '0,89 kr/100 g');
  });

  it('has explicit unknown states for missing or unsupported unit prices', () => {
    assert.equal(unknownUnitPriceLabel, 'Jämförpris saknas');
    assert.equal(formatUnitPriceLabel(null, 'kg'), unknownUnitPriceLabel);
    assert.equal(formatUnitPriceLabel(Number.NaN, 'kg'), unknownUnitPriceLabel);
    assert.equal(formatUnitPriceLabel(12.3, ''), unknownUnitPriceLabel);
    assert.equal(normalizeUnitPriceDisplayUnit('unknown'), null);
  });

  it('supports per-100g labels without inventing source values', () => {
    assert.equal(formatPer100gUnitPriceLabel(19.9), '1,99 kr/100 g');
    assert.equal(formatPer100gUnitPriceLabel(null), unknownUnitPriceLabel);
  });

  it('normalizes source compare-price snippets for cards and deal tables', () => {
    assert.equal(formatSourceUnitPriceText('Jämförpris 17.11 SEK', 'kg'), '17,11 kr/kg');
    assert.equal(formatSourceUnitPriceText('0,89 kr / 100 g'), '0,89 kr/100 g');
    assert.equal(formatSourceUnitPriceText('', 'kg'), unknownUnitPriceLabel);
  });

  it('property-checks Nordic currency and locale variants without currency flips', () => {
    const locales = [
      { locale: 'sv-SE', currency: 'SEK', currencyPattern: /kr\/(?:kg|l|st|100 g)$/ },
      { locale: 'nb-NO', currency: 'NOK', currencyPattern: /kr\/(?:kg|l|st|100 g)$/ },
      { locale: 'is-IS', currency: 'ISK', currencyPattern: /kr\.\/(?:kg|l|st|100 g)$/ }
    ];
    const sourceLabels = [
      ['Jämförpris 17,11 SEK', 'kg'],
      ['Sammenligningspris 42.50 NOK per liter', 'l'],
      ['Einingarverð 8 ISK / stk', 'st'],
      ['0,89 kr / 100 g', '100 g']
    ];

    for (const { locale, currency, currencyPattern } of locales) {
      for (const [sourceLabel, unit] of sourceLabels) {
        const formatted = formatSourceUnitPriceText(sourceLabel, unit, { locale, currency });

        assert.match(formatted, currencyPattern, `${sourceLabel} should stay in ${currency}`);
        assert.notEqual(formatted, unknownUnitPriceLabel, `${sourceLabel} should keep a parseable unit-price label`);
      }
    }

    assert.equal(
      formatSourceUnitPriceText('original shelf label unavailable', 'kg', { unknownLabel: 'original shelf label unavailable' }),
      'original shelf label unavailable'
    );
  });
});
