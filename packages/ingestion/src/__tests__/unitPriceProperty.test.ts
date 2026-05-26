import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normaliseUnitPrice } from '../unit-price.js';

type LocaleCase = {
  locale: 'SE' | 'NO' | 'IS';
  decimal: '.' | ',';
  currency: 'SEK' | 'NOK' | 'ISK';
};

type UnitCase = {
  rawUnit: string;
  comparableUnit: 'kg' | 'l' | 'piece';
  divisor: number;
};

const localeCases: LocaleCase[] = [
  { locale: 'SE', decimal: ',', currency: 'SEK' },
  { locale: 'NO', decimal: ',', currency: 'NOK' },
  { locale: 'IS', decimal: '.', currency: 'ISK' }
];

const unitCases: UnitCase[] = [
  { rawUnit: 'g', comparableUnit: 'kg', divisor: 0.001 },
  { rawUnit: 'kg', comparableUnit: 'kg', divisor: 1 },
  { rawUnit: 'ml', comparableUnit: 'l', divisor: 0.001 },
  { rawUnit: 'cl', comparableUnit: 'l', divisor: 0.01 },
  { rawUnit: 'l', comparableUnit: 'l', divisor: 1 },
  { rawUnit: 'st', comparableUnit: 'piece', divisor: 1 },
  { rawUnit: 'pcs', comparableUnit: 'piece', divisor: 1 }
];

const productNames = [
  'Kaffe mörkrost',
  'Økologisk melk',
  'Skyr jarðarber',
  'Tandkräm fluor',
  'Pasta fusilli'
];

function round4(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function decimalText(value: number, decimal: LocaleCase['decimal']) {
  return value.toFixed(value % 1 === 0 ? 0 : 2).replace('.', decimal);
}

function generatedProductCases() {
  const cases: Array<{
    locale: LocaleCase;
    productName: string;
    price: number;
    quantityText: string;
    expectedUnit: UnitCase['comparableUnit'];
    expectedUnitPrice: number;
    sourceLabel: string;
  }> = [];

  localeCases.forEach((locale, localeIndex) => {
    productNames.forEach((productName, productIndex) => {
      unitCases.forEach((unitCase, unitIndex) => {
        const amount = unitCase.rawUnit === 'g' || unitCase.rawUnit === 'ml'
          ? 100 + ((productIndex + 1) * (unitIndex + 2) * 25)
          : 1 + ((productIndex + localeIndex + unitIndex) % 4) * 0.25;
        const price = round4(8 + localeIndex * 11 + productIndex * 3.75 + unitIndex * 1.2);
        const quantityText = `${decimalText(amount, locale.decimal)} ${unitCase.rawUnit}`;

        cases.push({
          locale,
          productName,
          price,
          quantityText,
          expectedUnit: unitCase.comparableUnit,
          expectedUnitPrice: round4(price / (amount * unitCase.divisor)),
          sourceLabel: `${productName} ${quantityText} ${price.toFixed(2)} ${locale.currency}`
        });
      });
    });
  });

  return cases;
}

describe('unit price normalization property coverage', () => {
  it('normalizes generated Nordic package sizes without zero division or unit drift', () => {
    for (const propertyCase of generatedProductCases()) {
      const normalized = normaliseUnitPrice(propertyCase.price, propertyCase.quantityText);

      assert.equal(normalized.comparableUnit, propertyCase.expectedUnit, propertyCase.sourceLabel);
      assert.equal(normalized.unitPrice, propertyCase.expectedUnitPrice, propertyCase.sourceLabel);
      assert.equal(Number.isFinite(normalized.unitPrice), true, propertyCase.sourceLabel);
      assert.equal(normalized.unitPrice > 0, true, propertyCase.sourceLabel);
    }
  });

  it('keeps multipack and decimal edge cases shrunk to readable failures', () => {
    assert.deepEqual(normaliseUnitPrice(30, '2x250 g'), { unitPrice: 60, comparableUnit: 'kg' });
    assert.deepEqual(normaliseUnitPrice(30, '2×0,5 l'), { unitPrice: 30, comparableUnit: 'l' });
    assert.deepEqual(normaliseUnitPrice(24, '12 st'), { unitPrice: 2, comparableUnit: 'piece' });
  });

  it('rejects generated zero and negative quantity shrinks instead of dividing by zero', () => {
    const invalidQuantities = ['0 g', '0,00 ml', '2x0 g', '-1 kg', '0 st'];

    for (const quantityText of invalidQuantities) {
      assert.throws(
        () => normaliseUnitPrice(10, quantityText),
        /quantity must be positive|Unsupported quantity string/,
        quantityText
      );
    }
  });
});
