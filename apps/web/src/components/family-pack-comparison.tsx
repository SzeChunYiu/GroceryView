import Link from 'next/link';
import type { FamilyPackComparison } from '@/lib/family-pack';

type FamilyPackComparisonPanelProps = {
  comparisons: FamilyPackComparison[];
  emptyDetail: string;
  intro: string;
  title: string;
};

function verdictTone(comparison: FamilyPackComparison) {
  if (comparison.verdict === 'bulk_cheaper') return 'bg-emerald-100 text-emerald-950';
  return 'bg-rose-100 text-rose-950';
}

export function FamilyPackComparisonPanel({ comparisons, emptyDetail, intro, title }: Readonly<FamilyPackComparisonPanelProps>) {
  return (
    <section className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800">Family pack math</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{intro}</p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-cyan-950 shadow-sm">
          {comparisons.length} comparable row{comparisons.length === 1 ? '' : 's'}
        </p>
      </div>

      {comparisons.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {comparisons.map((comparison) => (
            <article className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm" key={`${comparison.baseline.slug}-${comparison.bulk.slug}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{comparison.categoryLabel} · {comparison.storageLabel}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{comparison.bulk.productName}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{comparison.bulk.brand} · {comparison.bulk.packageLabel}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${verdictTone(comparison)}`}>
                  {comparison.verdictLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link className="rounded-2xl bg-slate-50 p-3 transition hover:bg-cyan-50" href={`/products/${comparison.baseline.slug}`}>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Smaller benchmark</p>
                  <p className="mt-1 font-black text-slate-950">{comparison.baseline.productName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{comparison.baseline.packageSizeLabel} · {comparison.baseline.priceLabel}</p>
                  <p className="mt-2 text-sm font-black text-slate-950">{comparison.baseline.unitPriceLabel}</p>
                </Link>
                <Link className="rounded-2xl bg-cyan-50 p-3 transition hover:bg-cyan-100" href={`/products/${comparison.bulk.slug}`}>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-800">Family/bulk candidate</p>
                  <p className="mt-1 font-black text-slate-950">{comparison.bulk.productName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{comparison.bulk.packageSizeLabel} · {comparison.bulk.priceLabel}</p>
                  <p className="mt-2 text-sm font-black text-cyan-950">{comparison.bulk.unitPriceLabel}</p>
                </Link>
              </div>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p className="rounded-xl bg-white p-3 font-black text-slate-950">{comparison.unitPriceDeltaLabel}</p>
                <p className="rounded-xl bg-white p-3 font-black text-slate-950">{comparison.totalSpendDeltaLabel}</p>
              </div>
              {comparison.largerPackWarningLabel ? (
                <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black leading-6 text-rose-950">
                  {comparison.largerPackWarningLabel}
                </p>
              ) : null}
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">{comparison.storageDetail}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                {comparison.confidenceLabel} {comparison.sourceLabel}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-cyan-200 bg-white/80 p-4 text-sm font-bold text-cyan-950">{emptyDetail}</p>
      )}
    </section>
  );
}
