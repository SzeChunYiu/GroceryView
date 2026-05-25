import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  attachNorwayStoreOperator,
  findNorwayCanonicalChain,
  matchNorwayCanonicalChain,
  NORWAY_CANONICAL_CHAINS
} from '../index.js';

describe('Norway chain taxonomy', () => {
  it('declares canonical grocery, variety, and online operators for Norway launch', () => {
    const ids = NORWAY_CANONICAL_CHAINS.map((chain) => chain.id);

    assert.deepEqual(ids, [
      'kiwi',
      'rema-1000',
      'meny',
      'coop-extra',
      'coop-obs',
      'coop-mega',
      'coop-prix',
      'joker',
      'spar',
      'bunnpris',
      'oda',
      'europris',
      'normal-no'
    ]);
    assert.equal(findNorwayCanonicalChain('kiwi')?.operatorGroupId, 'norgesgruppen');
    assert.equal(findNorwayCanonicalChain('coop-obs')?.storeFormat, 'hypermarket');
    assert.equal(findNorwayCanonicalChain('oda')?.channel, 'online');
    assert.equal(findNorwayCanonicalChain('normal-no')?.retailerType, 'variety');
  });

  it('matches noisy store names to canonical operator records', () => {
    assert.equal(matchNorwayCanonicalChain(['REMA 1000 Grunerlokka'])?.id, 'rema-1000');
    assert.equal(matchNorwayCanonicalChain(['Coop Extra Carl Berner'])?.id, 'coop-extra');
    assert.equal(matchNorwayCanonicalChain(['Eurospar Tromsdalen'])?.id, 'spar');
    assert.equal(matchNorwayCanonicalChain(['NORMAL Storo'])?.id, 'normal-no');
  });

  it('attaches store observations with review state for ambiguous or incomplete mappings', () => {
    const clear = attachNorwayStoreOperator({
      name: 'KIWI Torshov',
      brand: 'KIWI',
      municipality: 'Oslo',
      latitude: 59.936,
      longitude: 10.769
    });
    const ambiguous = attachNorwayStoreOperator({
      name: 'Coop Marked',
      brand: 'Coop',
      municipality: 'Bergen',
      latitude: 60.39,
      longitude: 5.32
    });
    const missingLocation = attachNorwayStoreOperator({ name: 'Bunnpris Sentrum', brand: 'Bunnpris' });

    assert.equal(clear.canonicalChainId, 'kiwi');
    assert.equal(clear.operatorGroupId, 'norgesgruppen');
    assert.equal(clear.review.status, 'clear');
    assert.equal(ambiguous.operatorGroupId, null);
    assert.ok(ambiguous.review.reasons.includes('canonical_chain_unmatched'));
    assert.equal(missingLocation.canonicalChainId, 'bunnpris');
    assert.ok(missingLocation.review.reasons.includes('municipality_missing'));
    assert.ok(missingLocation.review.reasons.includes('physical_coordinates_missing'));
  });
});
