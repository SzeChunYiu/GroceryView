import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractFatPercent } from '../lib/extractors/fatPercent.js';

describe('extractFatPercent', () => {
  it('parses explicit fett percentages', () => {
    assert.deepEqual(extractFatPercent('Nötfärs 17% fett 500g'), {
      fat_percent: 17,
      source: '17% fett',
      kind: 'single'
    });
  });

  it('parses fat percentage ranges as midpoint and tags as range', () => {
    assert.deepEqual(extractFatPercent('Blandfärs fetthalt 10-15% 1kg'), {
      fat_percent: 12.5,
      source: 'fetthalt 10-15%',
      kind: 'range',
      min: 10,
      max: 15
    });
  });

  it('parses decimal dairy percentages', () => {
    assert.deepEqual(extractFatPercent('Standardmjölk 3.0% 1l'), {
      fat_percent: 3,
      source: '3.0%',
      kind: 'single'
    });
  });

  it('supports decimal comma and reversed fat context', () => {
    assert.equal(extractFatPercent('Havredryck fett 1,5%')?.fat_percent, 1.5);
  });
});
