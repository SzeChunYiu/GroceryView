import Link from 'next/link';
import { Card, Eyebrow } from '@/components/data-ui';

export type ProductHeaderPrimaryEvidence =
  | {
      mode: 'chain';
      lowestPriceLabel: string;
      lowestChain: string;
      highestPriceLabel: string;
      spreadLabel: string;
    }
  | {
      mode: 'openprices';
      medianPriceLabel: string;
      observationCount: number;
      lastObservedAt: string;
      priceMinLabel: string;
      priceMaxLabel: string;
    };

export type ProductHeaderProps = {
  kindLabel: string;
  name: string;
  subtitle: string;
  image?: string | null;
  primaryEvidence: ProductHeaderPrimaryEvidence;
  sourceFields: {
    code: string;
    categoryLabel: string;
    sourceLabel: string;
  };
  freshnessBadge: {
    sourceName: string;
    caveat: string;
    evidenceRoute: string;
    freshnessLabel: string;
    coverageLabel: string;
    confidenceBadge: string;
  };
};

export function ProductHeader({ kindLabel, name, subtitle, image, primaryEvidence, sourceFields, freshnessBadge }: ProductHeaderProps) {
  return (
    <>
      <Eyebrow>{kindLabel}</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{name}</h1>
      <p className="mt-3 text-lg text-slate-700">{subtitle}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          {image ? (
            <img
              alt={name}
              className="mb-5 aspect-square w-full rounded-[2rem] border border-slate-100 bg-slate-50 object-contain p-4 shadow-inner"
              decoding="async"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={image}
            />
          ) : (
            <div className="mb-5 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              Product image not reported by the current verified source.
            </div>
          )}
          <h2 className="text-2xl font-black">Primary price evidence</h2>
          {primaryEvidence.mode === 'chain' ? (
            <div className="mt-4 grid gap-3">
              <p className="text-5xl font-black text-emerald-800">{primaryEvidence.lowestPriceLabel}</p>
              <p className="font-semibold text-slate-700">Lowest chain: {primaryEvidence.lowestChain}. Highest observed chain price: {primaryEvidence.highestPriceLabel}.</p>
              <p className="rounded-2xl bg-amber-50 p-4 font-black text-amber-950">Comparable spread: {primaryEvidence.spreadLabel}. This is chain-wide catalogue evidence, not per-branch shelf evidence.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-5xl font-black text-emerald-800">{primaryEvidence.medianPriceLabel}</p>
              <p className="font-semibold text-slate-700">Observed {primaryEvidence.observationCount} time(s); latest observation {primaryEvidence.lastObservedAt}.</p>
              <p className="rounded-2xl bg-amber-50 p-4 font-black text-amber-950">Range: {primaryEvidence.priceMinLabel} to {primaryEvidence.priceMaxLabel}. Community OpenPrices data is displayed with explicit count and date.</p>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-2xl font-black">Source fields</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Code</dt><dd>{sourceFields.code}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Category</dt><dd>{sourceFields.categoryLabel}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Source</dt><dd>{sourceFields.sourceLabel}</dd></div>
          </dl>
        </Card>
      </div>
      <Card className="mt-6 border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Data freshness badge</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{freshnessBadge.sourceName}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{freshnessBadge.caveat}</p>
          </div>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={freshnessBadge.evidenceRoute}>
            Check source route
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">Freshness: {freshnessBadge.freshnessLabel}</p>
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">Coverage: {freshnessBadge.coverageLabel}</p>
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">Confidence: {freshnessBadge.confidenceBadge}</p>
        </div>
      </Card>
    </>
  );
}
