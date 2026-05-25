import { describe, expect, it } from 'vitest';
import { extractFatPercent } from '../extractors/fatPercent.js';

describe('extractFatPercent', () => {
  it('extracts explicit Swedish fat percentages', () => {
    expect(extractFatPercent('Nötfärs 17% fett')).toMatchObject({ fatPercent: 17, isRange: false });
  });

  it('uses the midpoint for fat percentage ranges', () => {
    expect(extractFatPercent('Blandfärs 10-15%')).toMatchObject({ fatPercent: 12.5, isRange: true });
  });

  it('accepts decimal milk percentages with dairy context', () => {
    expect(extractFatPercent({ title: 'Mjölk 3.0%', description: 'färsk dairy milk' })).toMatchObject({ fatPercent: 3, isRange: false });
  });

  it('rejects unrelated percentages without fat context', () => {
    expect(extractFatPercent('Kaffe rabatt 20%')).toMatchObject({ fatPercent: null });
  });
});
