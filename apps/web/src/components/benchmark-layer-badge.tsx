import type { BenchmarkPriceLayer } from '@groceryview/core';

const layerMeta = {
  consumer_index: {
    label: 'consumer index',
    className: 'border-sky-200 bg-sky-50 text-sky-900'
  },
  retail_observation: {
    label: 'retail observation',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900'
  },
  regulated_reference: {
    label: 'regulated reference',
    className: 'border-violet-200 bg-violet-50 text-violet-900'
  },
  upstream_agriculture: {
    label: 'upstream agriculture',
    className: 'border-amber-200 bg-amber-50 text-amber-950'
  },
  energy_context: {
    label: 'energy context',
    className: 'border-orange-200 bg-orange-50 text-orange-900'
  }
} satisfies Record<BenchmarkPriceLayer, { label: string; className: string }>;

export function layerLabel(layer: BenchmarkPriceLayer): string {
  return layerMeta[layer].label;
}

export function BenchmarkLayerBadge({ layer }: Readonly<{ layer: BenchmarkPriceLayer }>) {
  const meta = layerMeta[layer];
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${meta.className}`}>
      {meta.label}
    </span>
  );
}
