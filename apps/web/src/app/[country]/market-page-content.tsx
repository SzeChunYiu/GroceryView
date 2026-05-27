import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import {
  marketCityPreviews,
  marketCountries,
  marketCountryForSlug,
  marketPath,
  marketSectionForSlug,
  marketSections,
  readinessLabel,
  type MarketSectionSlug
} from '@/lib/market-routing';

type MarketPageKind = 'landing' | MarketSectionSlug;

export function generateCountryParams() {
  return marketCountries.map((country) => ({ country: country.slug }));
}

export function generateCityParams() {
  return marketCityPreviews.map((city) => ({ country: city.country, city: city.slug }));
}

function statusTone(readiness: string): 'success' | 'warning' {
  return readiness === 'live' ? 'success' : 'warning';
}

export async function MarketCountryPage({ params, kind }: Readonly<{ params: Promise<{ country: string }>; kind: MarketPageKind }>) {
  const { country } = await params;
  const entry = marketCountryForSlug(country);
  if (!entry) notFound();

  const section = kind === 'landing' ? null : marketSectionForSlug(kind);
  if (kind !== 'landing' && !section) notFound();
  const isLive = entry.readiness === 'live';

  return (
    <PageShell>
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>{entry.nativeLabel} market</Eyebrow>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {entry.label} {section ? section.title : 'grocery market preview'}
            </h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-700">
              {section ? section.previewCopy : entry.summary}
            </p>
          </div>
          <StatusBadge tone={statusTone(entry.readiness)}>{readinessLabel(entry.readiness)}</StatusBadge>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Market" value={entry.label} detail={`${entry.currency} context`} />
        <Metric label="Verified price rows" value={isLive ? 'Sweden feed' : '0'} detail={isLive ? 'Use live Swedish pages' : 'No borrowed rankings'} />
        <Metric label="SEO state" value={entry.readiness} detail="Canonical and hreflang isolated by market" />
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">Market routes</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          These links keep users in the selected country context. Preview markets show readiness and waitlist copy instead of fabricating prices.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {marketSections.map((marketSection) => (
            <Link className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50" href={marketPath(entry.slug, marketSection.slug)} key={marketSection.slug}>
              <p className="text-sm font-black text-slate-950">{marketSection.label}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{marketSection.previewCopy}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">City preview pages</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {marketCityPreviews.filter((city) => city.country === entry.slug).map((city) => (
            <Link className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300" href={`/${entry.slug}/cities/${city.slug}`} key={city.slug}>
              <p className="font-black text-slate-950">{city.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{city.summary}</p>
            </Link>
          ))}
        </div>
      </Card>

      {!isLive ? (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <h2 className="text-2xl font-black tracking-tight text-amber-950">Preview boundary</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
            {entry.label} pages are crawlable for launch preparation, but rankings, cheapest-chain claims, inventory, and deal cards remain hidden until verified rows exist for this market.
          </p>
        </Card>
      ) : null}
    </PageShell>
  );
}

export async function MarketCityPage({ params }: Readonly<{ params: Promise<{ country: string; city: string }> }>) {
  const { country, city } = await params;
  const entry = marketCountryForSlug(country);
  const cityEntry = marketCityPreviews.find((candidate) => candidate.country === country && candidate.slug === city);
  if (!entry || !cityEntry) notFound();

  return (
    <PageShell>
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <Eyebrow>{entry.nativeLabel} city</Eyebrow>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{cityEntry.label} grocery price preview</h1>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-700">{cityEntry.summary}</p>
        <div className="mt-4">
          <StatusBadge tone={statusTone(cityEntry.readiness)}>{readinessLabel(cityEntry.readiness)}</StatusBadge>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="City price rows" value={cityEntry.readiness === 'live' ? 'Sweden feed' : '0'} detail="No borrowed city rankings" />
        <Metric label="Market" value={entry.label} detail={entry.currency} />
        <Metric label="Canonical state" value={cityEntry.readiness} detail="City path is market-specific" />
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          This city page is ready for SEO and user navigation, but it does not display cheapest baskets, local deals, or store-level availability until verified city rows are available.
        </p>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </Card>
  );
}
