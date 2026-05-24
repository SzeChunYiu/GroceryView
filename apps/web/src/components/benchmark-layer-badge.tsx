import type { BenchmarkPriceLayer } from '@groceryview/core';

const layerCopy: Record<BenchmarkPriceLayer, { label: string; className: string }> = {
  consumer_index: { label: 'consumer index', className: 'bg-blue-50 text-blue-900 ring-blue-200' },
  retail_observation: { label: 'retail observation', className: 'bg-emerald-50 text-emerald-900 ring-emerald-200' },
  regulated_reference: { label: 'regulated reference', className: 'bg-purple-50 text-purple-900 ring-purple-200' },
  upstream_agriculture: { label: 'upstream agriculture', className: 'bg-amber-50 text-amber-900 ring-amber-200' },
  energy_context: { label: 'energy context', className: 'bg-orange-50 text-orange-900 ring-orange-200' },
};

export function BenchmarkLayerBadge({ layer }: { layer: BenchmarkPriceLayer }) {
  const copy = layerCopy[layer];
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ring-1 ${copy.className}`}>{copy.label}</span>;
}
