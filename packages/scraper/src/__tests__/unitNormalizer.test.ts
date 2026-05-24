import { normalizeUnitQuantity } from '../unitNormalizer.js';

type Matcher<T> = {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toThrow(expected?: RegExp | string): void;
};

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare function expect<T>(actual: T): Matcher<T>;
declare function expect(actual: () => unknown): Matcher<() => unknown>;

describe('normalizeUnitQuantity', () => {
  it('normalizes grams to kilograms', () => {
    expect(normalizeUnitQuantity(500, 'g')).toEqual({ quantity: 0.5, unit: 'kg' });
    expect(normalizeUnitQuantity(1250, 'grams')).toEqual({ quantity: 1.25, unit: 'kg' });
  });

  it('normalizes milliliters to liters', () => {
    expect(normalizeUnitQuantity(750, 'ml')).toEqual({ quantity: 0.75, unit: 'l' });
    expect(normalizeUnitQuantity(1500, 'millilitres')).toEqual({ quantity: 1.5, unit: 'l' });
  });

  it('normalizes per-pack quantities to per-unit quantities', () => {
    expect(normalizeUnitQuantity(1, 'pack', { unitsPerPack: 6 })).toEqual({ quantity: 6, unit: 'unit' });
    expect(normalizeUnitQuantity(0.5, 'per-pack', { unitsPerPack: 10 })).toEqual({ quantity: 5, unit: 'unit' });
  });

  it('keeps fractional quantities stable after conversion', () => {
    expect(normalizeUnitQuantity(333.3, 'g')).toEqual({ quantity: 0.3333, unit: 'kg' });
    expect(normalizeUnitQuantity(12.5, 'ml')).toEqual({ quantity: 0.0125, unit: 'l' });
  });

  it('rejects unsupported units and invalid pack sizes', () => {
    expect(() => normalizeUnitQuantity(1, 'oz')).toThrow(/unsupported unit/);
    expect(() => normalizeUnitQuantity(1, 'pack')).toThrow(/unitsPerPack/);
    expect(() => normalizeUnitQuantity(1, 'pack', { unitsPerPack: 0 })).toThrow(/unitsPerPack/);
  });
});
