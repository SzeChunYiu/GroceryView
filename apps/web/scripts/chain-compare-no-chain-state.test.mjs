import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FALLBACK_CAPABILITY_SOURCE,
  GENERATED_CAPABILITY_SOURCE,
  buildCompareNoChainState
} from '../src/lib/chain-compare-no-chain-state.js';

const chainOrder = [
  { id: 'ica', label: 'ICA' },
  { id: 'willys', label: 'Willys' },
  { id: 'coop', label: 'Coop' }
];

describe('chain compare no-chain state', () => {
  it('uses generated dbSiteCompareStoreCapabilities rows when injected and preserves missing-id guardrails', () => {
    const state = buildCompareNoChainState({
      activeFilters: ['willys', 'coop'],
      chainOrder,
      generatedCapabilities: [{
        chainId: 'willys',
        coupon: true,
        delivery: true,
        pickup: false,
        evidenceLabel: '11200 product rows · 46905 coupon/offer rows',
        evidenceUpdatedAt: '2026-05-25T08:05:40.816Z'
      }],
      missingProductIds: ['missing-sku']
    });

    assert.deepEqual(state.activeFilters, ['willys', 'coop']);
    assert.equal(state.evidenceUpdatedAt, '2026-05-25T08:05:40.816Z');
    assert.equal(state.capabilitySource, 'mixed generated dbSiteCompareStoreCapabilities + fallback compare chain order');
    assert.deepEqual(state.missingProductIds, ['missing-sku']);
    assert.match(state.missingIdGuardrail, /not inferred/);
    assert.equal(state.capabilities[0].chainId, 'willys');
    assert.equal(state.capabilities[0].capabilitySource, GENERATED_CAPABILITY_SOURCE);
    assert.equal(state.capabilities[0].coupon, true);
    assert.equal(state.capabilities[0].delivery, true);
    assert.equal(state.capabilities[0].pickup, false);
    assert.equal(state.capabilities[1].chainId, 'coop');
    assert.equal(state.capabilities[1].capabilitySource, FALLBACK_CAPABILITY_SOURCE);
    assert.equal(state.capabilities[1].evidenceUpdatedAt, null);
  });

  it('falls back to all compare chains when no generated capability fixture or active filter is present', () => {
    const state = buildCompareNoChainState({ chainOrder });

    assert.deepEqual(state.activeFilters, ['ica', 'willys', 'coop']);
    assert.equal(state.evidenceUpdatedAt, null);
    assert.equal(state.capabilitySource, FALLBACK_CAPABILITY_SOURCE);
    assert.equal(state.capabilities.length, 3);
    assert.equal(state.capabilities.every((capability) => capability.capabilitySource === FALLBACK_CAPABILITY_SOURCE), true);
    assert.match(state.missingIdGuardrail, /add \?products=/);
  });
});
