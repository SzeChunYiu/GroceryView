import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMMODITIES } from '@groceryview/catalog';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { commodityComparisonReports, commodityPriceObservations, formatSek } from '@/lib/verified-data';

type ClassPageProps = Readonly<{ params: Promise<{ country: string; slug: string }> }>;

const countryNames: Record<string, string> = {
  se: 'Sweden',
  sv: 'Sweden',
  en: 'Sweden'
};

function originLabel(countryCode: string | undefined) {
  if (!countryCode) return 'origin not reported';
  if (countryCode === 'SE') return 'from Sweden';
  return `from ${countryCode}`;
}

function certificationLabel(isOrganic: boolean | undefined) {
  return isOrganic ? 'KRAV / organic evidence' : 'conventional or certification not reported';
}

function variantLabel(value: string | undefined) {
  return value?.trim() || 'variant not reported';
}

function classForSlug(slug: string) {
  return COMMODITIES.find((commodity) => commodity.slug === slug);
}

export function generateStaticParams() {
  return COMMODITIES.map((commodity) => ({ country: 'se', slug: commodity.slug }));
}

export async function generateMetadata({ params }: ClassPageProps) {
  const { slug, country } = await params;
  const commodity = classForSlug(slug);
  if (!commodity) return { title: 'Fresh class not found | GroceryView' };
  const market = countryNames[country] ?? country.toUpperCase();
  return {
    title: `${commodity.nameSv} class prices in ${market} | GroceryView`,
    description: `Fresh product class detail for ${commodity.nameSv}, including canonical listings, current chain prices, and origin/certification breakdowns.`
  };
}

export default async function FreshClassPage({ params }: ClassPageProps) {
  const { country, slug } = await params;
  const commodity = classForSlug(slug);
  if (!commodity) notFound();

  const comparison = commodityComparisonReports.find((report) => report.commodityId === commodity.slug);
  const observations = commodityPriceObservations
    .filter((observation) => observation.commodityId === commodity.slug)
    .sort((left, right) => left.unitPrice - right.unitPrice || left.productName.localeCompare(right.productName, 'sv'));
  const canonicals = [...new Map(observations.map((observation) => [observation.productId, observation])).values()];
  const breakdownRows = observations.map((observation) => ({
    ...observation,
    certification: certificationLabel(observation.isOrganic),
    origin: originLabel(observation.originCountry),
    applesToOrangesKey: `${certificationLabel(observation.isOrganic)} · ${originLabel(observation.originCountry)}`
  }));
  const breakdownGroups = [...new Set(breakdownRows.map((row) => row.applesToOrangesKey))];
  const hasMixedOriginOrCert = breakdownGroups.length > 1;

  return (
    <PageShell>
      <Eyebrow>Fresh class · {countryNames[country] ?? country.toUpperCase()}</Eyebrow>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950">{commodity.nameSv}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Canonical fresh class page for {commodity.nameEn.toLowerCase()} listings. Prices are compared only on current kr/{commodity.comparableUnit} evidence and keep origin/certification differences visible.
          </p>
        </div>
        <Link className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href="/compare">
          Back to compare
        </Link>
      </div>

      <Card className="mt-6 border-lime-200 bg-lime-50/70">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-800">Canonical listings</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{canonicals.length}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-800">Chains priced</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{comparison?.coverage.chainCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-800">Current low</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(comparison?.cheapestChain?.unitPrice)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-800">Unit</p>
            <p className="mt-2 text-3xl font-black text-slate-950">kr/{commodity.comparableUnit}</p>
          </div>
        </div>
      </Card>

      {hasMixedOriginOrCert ? (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <h2 className="text-2xl font-black text-amber-950">Apples-vs-oranges warning</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
            This class mixes {breakdownGroups.join(' versus ')}. GroceryView lists the rows together for discovery, but the cheapest price is not a like-for-like claim when origin or certification differs.
          </p>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-2xl font-black text-slate-950">Canonicals in this class</h2>
          <div className="mt-4 grid gap-3">
            {canonicals.length > 0 ? canonicals.map((row) => (
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-700" href={`/products/${row.productId}`} key={row.productId}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{variantLabel(row.variant)}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{row.productName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{certificationLabel(row.isOrganic)} · {originLabel(row.originCountry)} · confidence {row.sourceConfidence.toFixed(2)}</p>
              </Link>
            )) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">No current canonical listings clear this class yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-slate-950">Current price across chains</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Chain</th>
                  <th className="p-3">Listing</th>
                  <th className="p-3">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(comparison?.rows ?? []).map((row) => (
                  <tr key={`${row.chainId}-${row.productId}`}>
                    <td className="p-3 font-black">#{row.rank}</td>
                    <td className="p-3 font-bold">{row.chainName}</td>
                    <td className="p-3 text-slate-700">{row.productName}</td>
                    <td className="p-3 font-black text-emerald-800">{formatSek(row.unitPrice)}/{row.comparableUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">{comparison?.confidenceLabel ?? 'No price comparison clears confidence for this class.'}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Origin and certification breakdown</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="p-3">Origin / cert</th>
                <th className="p-3">Chain</th>
                <th className="p-3">Canonical</th>
                <th className="p-3">Current price</th>
                <th className="p-3">Disclosure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {breakdownRows.map((row) => (
                <tr key={`${row.chainId}-${row.productId}-${row.unitPrice}`}>
                  <td className="p-3 font-black">{row.certification}; {row.origin}</td>
                  <td className="p-3 font-bold">{row.chainName}</td>
                  <td className="p-3 text-slate-700">{row.productName}</td>
                  <td className="p-3 font-black text-emerald-800">{formatSek(row.unitPrice)}/{row.comparableUnit}</td>
                  <td className="p-3 text-xs font-semibold text-slate-500">{hasMixedOriginOrCert ? 'Compare within matching origin/cert when possible.' : 'Same reported origin/cert bucket for visible rows.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
