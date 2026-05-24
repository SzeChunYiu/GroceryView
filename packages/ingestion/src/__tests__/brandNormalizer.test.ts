import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeBrand } from '../brandNormalizer.js';

describe('normalizeBrand', () => {
  it('normalizes known aliases to canonical brands', () => {
    assert.equal(normalizeBrand('Arla Foods'), 'Arla');
    assert.equal(normalizeBrand('ICA Nära'), 'ICA');
    assert.equal(normalizeBrand('ICA NARA'), 'ICA');
    assert.equal(normalizeBrand('ICA  Basic'), 'ICA');
  });

  it('returns canonical brands unchanged', () => {
    assert.equal(normalizeBrand('Arla'), 'Arla');
    assert.equal(normalizeBrand('ICA'), 'ICA');
  });

  it('returns undefined for empty input and preserves unknown brands', () => {
    assert.equal(normalizeBrand(undefined), undefined);
    assert.equal(normalizeBrand('   '), undefined);
    assert.equal(normalizeBrand('Kungsörnen'), 'Kungsörnen');
  });
});
