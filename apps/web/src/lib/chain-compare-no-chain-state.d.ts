import type { CompareChainId, ChainCompareNoChainState } from './chain-compare';

type CompareChainOrderEntry = { id: CompareChainId; label: string };

export function buildCompareNoChainState(input: {
  activeFilters?: CompareChainId[];
  chainOrder: readonly CompareChainOrderEntry[];
  generatedCapabilities?: readonly Record<string, unknown>[];
  missingProductIds?: string[];
}): ChainCompareNoChainState;

export const GENERATED_CAPABILITY_SOURCE: string;
export const FALLBACK_CAPABILITY_SOURCE: string;
