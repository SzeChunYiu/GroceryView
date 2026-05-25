export const GENERATED_CAPABILITY_SOURCE = 'generated dbSiteCompareStoreCapabilities';
export const FALLBACK_CAPABILITY_SOURCE = 'fallback compare chain order';

function latestEvidenceDate(capabilities) {
  const dates = capabilities
    .map((capability) => capability.evidenceUpdatedAt)
    .filter((value) => typeof value === 'string' && value.length > 0)
    .sort();
  return dates.at(-1) ?? null;
}

export function buildCompareNoChainState({ activeFilters = [], chainOrder, generatedCapabilities = [], missingProductIds = [] }) {
  const generatedByChain = new Map(generatedCapabilities.map((capability) => [capability.chainId, capability]));
  const selectedChainIds = activeFilters.length > 0 ? activeFilters : chainOrder.map((chain) => chain.id);
  const selectedSet = new Set(selectedChainIds);
  const capabilities = chainOrder
    .filter((chain) => selectedSet.has(chain.id))
    .map((chain) => {
      const generated = generatedByChain.get(chain.id);
      if (generated) {
        return {
          chainId: chain.id,
          chainName: chain.label,
          coupon: Boolean(generated.coupon),
          delivery: Boolean(generated.delivery),
          pickup: Boolean(generated.pickup),
          evidenceLabel: generated.evidenceLabel,
          evidenceUpdatedAt: generated.evidenceUpdatedAt,
          capabilitySource: GENERATED_CAPABILITY_SOURCE
        };
      }

      return {
        chainId: chain.id,
        chainName: chain.label,
        coupon: false,
        delivery: false,
        pickup: false,
        evidenceLabel: 'No generated dbSiteCompareStoreCapabilities row; keep chain visible with explicit fallback capability flags.',
        evidenceUpdatedAt: null,
        capabilitySource: FALLBACK_CAPABILITY_SOURCE
      };
    });
  const generatedCount = capabilities.filter((capability) => capability.capabilitySource === GENERATED_CAPABILITY_SOURCE).length;

  return {
    activeFilters: selectedChainIds,
    capabilities,
    capabilitySource: generatedCount === 0
      ? FALLBACK_CAPABILITY_SOURCE
      : generatedCount === capabilities.length ? GENERATED_CAPABILITY_SOURCE : 'mixed generated dbSiteCompareStoreCapabilities + fallback compare chain order',
    evidenceUpdatedAt: latestEvidenceDate(capabilities),
    missingProductIds,
    missingIdGuardrail: missingProductIds.length > 0
      ? 'Missing product ids stay listed and are not inferred from chain capability data.'
      : 'No missing product ids; add ?products= to render comparison rows.'
  };
}
