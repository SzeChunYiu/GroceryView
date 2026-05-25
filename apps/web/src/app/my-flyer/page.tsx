import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { getCachedMyFlyerPayload, myFlyerAlgorithms, myFlyerCountries, type MyFlyerAlgorithm, type MyFlyerCountry } from '@/lib/my-flyer';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/my-flyer',
    title: 'Authenticated MyFlyer digest | GroceryView',
    description: 'View a server-rendered personalized flyer digest snapshot with ranking controls, source labels, and delivery surface affordances.'
  });
}

type SearchParams = {
  algorithm?: string | string[];
  country?: string | string[];
  limit?: string | string[];
  user_id?: string | string[];
};

const defaultSearchParams: SearchParams = {};

const deliverySurfaces = [
  { label: 'Email', detail: 'Scheduled digest uses this snapshot id, unsubscribe policy, and quiet hours.' },
  { label: 'PWA push', detail: 'Ready alert points back to the already-ranked snapshot instead of re-ranking client-side.' },
  { label: 'Print', detail: 'Printer-friendly surface keeps source labels, validity windows, and membership badges.' },
  { label: 'PDF', detail: 'Frozen PDF export preserves generated timestamp and source caveats.' },
  { label: 'Share link', detail: 'Permission-scoped link avoids leaking private preferences while retaining ranked rows.' }
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeAlgorithm(value: string | undefined): MyFlyerAlgorithm {
  return myFlyerAlgorithms.includes(value as MyFlyerAlgorithm) ? value as MyFlyerAlgorithm : 'watchlist_first';
}

function safeCountry(value: string | undefined): MyFlyerCountry {
  return myFlyerCountries.includes(value as MyFlyerCountry) ? value as MyFlyerCountry : 'se';
}

function safeLimit(value: string | undefined) {
  const parsed = Number(value ?? 10);
  return Number.isFinite(parsed) ? Math.min(24, Math.max(4, Math.round(parsed))) : 10;
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeZone: 'Europe/Stockholm' }).format(new Date(value));
}

export default async function MyFlyerPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = await (searchParams ?? Promise.resolve(defaultSearchParams));
  const algorithm = safeAlgorithm(first(params.algorithm));
  const country = safeCountry(first(params.country));
  const limit = safeLimit(first(params.limit));
  const userId = first(params.user_id)?.trim() || 'signed-in-preview';
  const { payload, cacheStatus } = getCachedMyFlyerPayload({ algorithm, country, limit, userId });

  return (
    <PageShell>
      <Eyebrow>Authenticated MyFlyer</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Server-rendered weekly flyer digest</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        /my-flyer renders the account-bound digest snapshot on the server. Ranking controls are URL-driven links, so email, push, print, PDF, and share surfaces reuse the same generated rows instead of re-ranking in the browser.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <Metric label="Snapshot rows" value={payload.rows.length.toLocaleString('sv-SE')} />
        <Metric label="Source offers" value={payload.source.offerCount.toLocaleString('sv-SE')} />
        <Metric label="Cache" value={cacheStatus} />
        <Metric label="Week ends" value={formatDate(payload.week.endsOn)} />
      </div>

      <Card className="mt-6 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">Ranking controls</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Choose a server ranker</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Active ranker: {algorithm}. Snapshot key {payload.cache.key}; generated {payload.generatedAt}. The selected ranker is applied before render and before delivery jobs receive the snapshot id.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-950 shadow-sm">User {payload.userId}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {myFlyerAlgorithms.map((ranker) => (
            <Link className={ranker === algorithm ? 'rounded-full bg-indigo-900 px-4 py-2 text-sm font-black text-white' : 'rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900'} href={`/my-flyer?algorithm=${ranker}&country=${country}&limit=${limit}&user_id=${encodeURIComponent(userId)}`} key={ranker}>
              {ranker.replaceAll('_', ' ')}
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-tight">Ranked digest rows</h2>
          <div className="mt-4 grid gap-3">
            {payload.rows.map((row) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.offer.offerId}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">#{row.rank} · {row.offer.chain} · {row.offer.storeName}</p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{row.offer.productName}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{row.offer.category} · valid {formatDate(row.offer.validFrom)}–{formatDate(row.offer.validThrough)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-800">{formatSek(row.offer.offerPrice)}</p>
                    <p className="text-sm font-bold text-slate-600">Save {formatSek(row.offer.savings)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700 md:grid-cols-3">
                  <p className="rounded-xl bg-white p-3">Score {row.personalizedScore}</p>
                  <p className="rounded-xl bg-white p-3">Confidence {Math.round(row.offer.confidence * 100)}%</p>
                  <p className="rounded-xl bg-white p-3">Source run {row.offer.sourceRunId}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-indigo-900">
                  {row.explanation.map((explanation) => <span className="rounded-full bg-indigo-50 px-3 py-1" key={explanation}>{explanation}</span>)}
                </div>
                <a className="mt-3 inline-flex text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={row.offer.sourceUrl}>Source label and URL</a>
              </article>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/70">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Delivery surfaces</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Same snapshot everywhere</h2>
            <div className="mt-4 grid gap-3">
              {deliverySurfaces.map((surface) => (
                <section className="rounded-2xl bg-white p-4" key={surface.label}>
                  <p className="font-black text-slate-950">{surface.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{surface.detail}</p>
                </section>
              ))}
            </div>
          </Card>
          <Card className="border-amber-200 bg-amber-50/70">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-800">Source guardrails</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-amber-950">
              {payload.source.guardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
    </Card>
  );
}
