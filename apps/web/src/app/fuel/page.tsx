import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { multiVerticalDomainFoundation } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/fuel');
}

function DomainFoundation({ domainSlug }: Readonly<{ domainSlug: 'fuel' }>) {
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === domainSlug)!;
  return (
    <PageShell>
      <Eyebrow>{domain.label} foundation</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Fuel price terminal foundation</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The fuel/pharmacy domain model is wired at catalog and schema level, but GroceryView does not render fuel prices until a fuel connector or trusted station report writes domain=fuel observations.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-4xl font-black text-slate-950">No fuel price observations yet</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{domain.claimBoundary}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Seed grades</p>
          <p className="mt-2 text-5xl font-black text-indigo-900">{domain.seedItemCount}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Fuel grade matching uses litres, not grocery EANs.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Observation table</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{domain.observationsTable}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">domain=fuel is required before map or history claims appear.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Supported fuel item model</h2>
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

export default function FuelPage() {
  return <DomainFoundation domainSlug="fuel" />;
}
