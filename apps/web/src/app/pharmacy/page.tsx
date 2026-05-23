import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatSek, multiVerticalDomainFoundation, pharmacyOtcEvidenceBoard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/pharmacy');
}

function DomainFoundation({ domainSlug }: Readonly<{ domainSlug: 'pharmacy' }>) {
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === domainSlug)!;
  return (
    <PageShell>
      <Eyebrow>{domain.label} foundation</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Pharmacy OTC price foundation</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The fuel/pharmacy domain model is wired at catalog and schema level, but GroceryView does not render pharmacy-chain comparisons until an OTC connector writes domain=pharmacy observations. The board below is public OTC evidence from OpenPrices + OpenBeautyFacts, not a pharmacy-chain comparison. Prescription medicine stays excluded.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-4xl font-black text-slate-950">No domain=pharmacy connector observations yet</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{domain.claimBoundary}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">OTC item models</p>
          <p className="mt-2 text-5xl font-black text-indigo-900">{domain.seedItemCount}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">OTC, supplement, and health/beauty EANs only.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Observation table</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{domain.observationsTable}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">domain=pharmacy is required before alert or history claims appear.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Supported pharmacy item model</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {domain.seedItems.map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
              <p className="font-black text-slate-950">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{item.id} · kr/{item.comparableUnit} · {item.matchKey}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{domain.locationStrategy}</p>
      </Card>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>{pharmacyOtcEvidenceBoard.source}</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-indigo-950">OTC price evidence from public observations</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              These EAN-coded OTC, suncare, supplement, and health/beauty items already have public SEK observations. They prove the item model can render prices, but they are not a pharmacy-chain comparison and they do not include medical, prescription, stock, or advice claims.
            </p>
          </div>
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-indigo-950 shadow-sm">
            {pharmacyOtcEvidenceBoard.productCount} OTC candidates · {pharmacyOtcEvidenceBoard.observationCount} observations
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pharmacyOtcEvidenceBoard.rows.map((row) => (
            <Link className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm hover:border-indigo-700" data-pharmacy-otc-evidence={row.slug} href={`/products/${row.slug}`} key={row.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{row.evidence}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · EAN {row.code}</p>
              <p className="mt-3 text-2xl font-black text-indigo-950">{formatSek(row.priceMedian)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Range {formatSek(row.priceMin)}–{formatSek(row.priceMax)} · {row.observationCount} observations</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.confidence} · last {row.lastObservedAt}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {pharmacyOtcEvidenceBoard.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-indigo-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-950">
          No prescription medicine. No medical advice. No cheapest-pharmacy claim until domain=pharmacy connector observations land.
        </p>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Claim boundary</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-amber-950">
          {domain.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
        </ul>
        <Link className="mt-4 inline-block text-sm font-black text-amber-950 underline decoration-amber-300 underline-offset-4" href="/data-sources">
          Audit domain source coverage
        </Link>
      </Card>
    </PageShell>
  );
}

export default function PharmacyPage() {
  return <DomainFoundation domainSlug="pharmacy" />;
}
