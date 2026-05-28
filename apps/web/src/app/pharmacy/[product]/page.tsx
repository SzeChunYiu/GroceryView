import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell, SourceCitation } from '@/components/data-ui';
import { buildPharmacyDomainSearchView, buildPharmacyProductDetail } from '@/lib/pharmacy-domain';
import { routeMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return buildPharmacyDomainSearchView().cards.slice(0, 20).map((card) => ({ product: card.ean }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ product: string }> }>) {
  const { product } = await params;
  const detail = buildPharmacyProductDetail(product);
  if (!detail) return routeMetadata('/pharmacy');

  return routeMetadata({
    path: `/pharmacy/${detail.ean}`,
    title: `${detail.name} exact EAN OTC comparison | GroceryView`,
    description: `Compare public OTC catalog rows for exact EAN ${detail.ean} with safety boundaries, freshness, and no medical advice.`,
    noIndex: true
  });
}

export default async function PharmacyProductDetailPage({ params }: Readonly<{ params: Promise<{ product: string }> }>) {
  const { product } = await params;
  const detail = buildPharmacyProductDetail(product);
  if (!detail) notFound();

  return (
    <PageShell>
      <Eyebrow>Pharmacy OTC detail</Eyebrow>
      <p className="mt-3 text-sm font-black text-sky-900">Exact EAN comparison only</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{detail.name}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page compares public OTC catalog rows for EAN {detail.ean}. It is price evidence only: No prescription medicine, No medical advice, no suitability recommendation, and no stock claim unless source exists.
      </p>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Safety boundary</p>
            <h2 className="mt-2 text-2xl font-black text-sky-950">OTC public catalog evidence</h2>
            <ul className="mt-3 grid gap-2 text-sm font-bold text-sky-950 md:grid-cols-2">
              {detail.safetyBoundary.map((item) => <li className="rounded-2xl bg-white/80 p-3" key={item}>{item}</li>)}
            </ul>
          </div>
          <Link className="rounded-full bg-sky-900 px-4 py-2 text-sm font-black text-white" data-gv-event="pharmacy_otc_alert_set" href={`/watchlist?domain=pharmacy&ean=${detail.ean}`}>
            Set exact EAN target
          </Link>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Exact EAN comparison</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Public catalog rows for {detail.ean}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Cheapest row is {detail.rows[0]?.priceLabel ?? 'not available'}; spread across visible exact-EAN rows is {detail.priceSpread.toFixed(2)} SEK.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={`/search?domain=pharmacy&ean=${detail.ean}`}>
            Open in pharmacy search
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {detail.rows.map((row) => (
            <a className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" href={row.productUrl} key={`${row.chain}-${detail.ean}`} rel="noreferrer" target="_blank">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{row.chainLabel}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{row.priceLabel}</p>
              <p className="mt-2 text-sm font-bold text-slate-700">Retrieved {row.retrievedAt} · {row.sourceLabel}</p>
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-black text-amber-950">{row.stockBoundary}</p>
            </a>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <SourceCitation
          confidenceLabel={`${detail.rows.length} exact EAN public OTC rows; no prescription, stock, or advice claim`}
          connectorRun="Apohem + Apotek Hjärtat public catalog capture"
          href="/data-sources"
          observedAt={detail.rows[0]?.retrievedAt}
          sourceLabel="Public OTC catalog evidence"
        />
      </div>
    </PageShell>
  );
}
