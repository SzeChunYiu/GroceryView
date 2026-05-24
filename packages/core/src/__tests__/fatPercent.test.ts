import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractFatPercent } from '../index.js';

describe('extractFatPercent', () => {
  it('parses Swedish fat percent labels', () => {
    assert.deepEqual(extractFatPercent('Nötfärs 17% fett 500g'), {
      fat_percent: 17,
      kind: 'single',
      raw: '17% fett'
    });
  });

  it('parses ranges as midpoint and tags them', () => {
    assert.deepEqual(extractFatPercent('Blandfärs 10-15% 1kg'), {
      fat_percent: 12.5,
      kind: 'range',
      raw: '10-15%',
      min: 10,
      max: 15
    });
  });

  it('parses decimal dairy percentages', () => {
    assert.deepEqual(extractFatPercent('Standardmjölk 3.0% 1 liter'), {
      fat_percent: 3,
      kind: 'single',
      raw: '3.0%'
    });
  });

  it('supports comma decimals and explicit fat prefix', () => {
    assert.deepEqual(extractFatPercent('Grädde fett: 36,5%'), {
      fat_percent: 36.5,
      kind: 'single',
      raw: 'fett: 36,5%'
    });
  });

  it('returns null when no percentage is present', () => {
    assert.equal(extractFatPercent('Ekologisk mjölk 1 liter'), null);
  });
});
