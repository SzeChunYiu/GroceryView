import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { latestMethodologyChangelogEntry, methodologyChangelogEntries } from '@/lib/methodology-changelog';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/methodology-changelog');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(new Date(value));
}

export default function MethodologyChangelogPage() {
  const latest = latestMethodologyChangelogEntry();

  return (
    <PageShell>
      <Eyebrow>Trust changelog</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">Data and methodology changes</h1>
      <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-700">
        Significant changes to data sources, matching rules, index methodology, deal scoring, and market coverage are published here from a structured changelog. Each entry names affected routes, confidence, freshness, and evidence files.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Latest change</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">{latest.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{latest.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          {latest.affectedRoutes.map((route) => (
            <Link className="rounded-full bg-white px-3 py-2 text-emerald-900 shadow-sm" href={route} key={route}>
              {route}
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4">
        {methodologyChangelogEntries.map((entry) => (
          <Card className="scroll-mt-24" key={entry.id}>
            <article id={entry.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{entry.changeType.replace('_', ' ')} · {formatDate(entry.changedAt)}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">{entry.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{entry.summary}</p>
                </div>
                <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={entry.source.href}>
                  {entry.source.label}
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Confidence</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{entry.confidence}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Freshness</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{entry.freshnessLabel}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-black text-slate-950">Affected routes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.affectedRoutes.map((route) => (
                      <Link className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900" href={route} key={`${entry.id}-${route}`}>
                        {route}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">Evidence</p>
                  <ul className="mt-2 grid gap-2 text-xs font-semibold text-slate-600">
                    {entry.evidence.map((path) => (
                      <li className="rounded-xl bg-slate-50 p-2 font-mono" key={`${entry.id}-${path}`}>{path}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
