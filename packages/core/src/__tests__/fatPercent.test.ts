import { describe, expect, it } from 'vitest';
import { extractFatPercent } from '../lib/extractors/fatPercent.js';

describe('extractFatPercent', () => {
  it('parses Swedish fat text', () => {
    expect(extractFatPercent('Nötfärs 17% fett')).toEqual({
      fat_percent: 17,
      isRange: false,
      raw: '17% fett'
    });
  });

  it('parses range fat percentages as midpoint and tags range', () => {
    expect(extractFatPercent('Blandfärs 10-15%')).toEqual({
      fat_percent: 12.5,
      isRange: true,
      raw: '10-15%'
    });
  });

  it('parses decimal milk percentages', () => {
    expect(extractFatPercent('Mjölk 3.0%')).toEqual({
      fat_percent: 3,
      isRange: false,
      raw: '3.0%'
    });
  });

  it('parses comma decimals and object input', () => {
    expect(extractFatPercent({ title: 'Filmjölk', description: 'fett 1,5%' })?.fat_percent).toBe(1.5);
  });

  it('returns undefined when no percentage is present', () => {
    expect(extractFatPercent('Ekologiska bananer')).toBeUndefined();
  });
});
