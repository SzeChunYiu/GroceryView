import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  majorSwedishGroceryChainSeeds,
  majorSwedishGroceryChainSeedSlugs
} from '../seed/retailers.js';

describe('major Swedish grocery chain seed metadata', () => {
  it('defines the ticket-required chains in stable comparison order', () => {
    assert.deepEqual(majorSwedishGroceryChainSeedSlugs, ['ica', 'coop', 'willys', 'hemkop', 'lidl', 'netto']);
    assert.deepEqual(
      majorSwedishGroceryChainSeeds.map((chain) => chain.comparisonOrder),
      [1, 2, 3, 4, 5, 6]
    );
  });

  it('keeps display metadata ready for comparison surfaces', () => {
    for (const chain of majorSwedishGroceryChainSeeds) {
      assert.equal(chain.countryCode, 'SE');
      assert.match(chain.websiteUrl, /^https:\/\/.+\/$/);
      assert.equal(chain.logo, `/retailers/${chain.slug}.svg`);
      assert.match(chain.name, /\S/);
    }

    const netto = majorSwedishGroceryChainSeeds.find((chain) => chain.slug === 'netto');
    assert.equal(netto?.status, 'legacy_acquired_by_coop');
    assert.match(netto?.notes ?? '', /Coop/i);
  });
});
