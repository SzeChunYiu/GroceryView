import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { osmStores } from '@/lib/osm-stores';
import { pricedProducts } from '@/lib/openprices-products';
import { sourceCoverage, snapshot } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

const supportedCountries = [
  { slug: 'sweden', name: 'Sweden', marketLabel: 'Sweden', hasVerifiedCoverage: true },
  { slug: 'norway', name: 'Norway', marketLabel: 'Norway', hasVerifiedCoverage: false },
  { slug: 'denmark', name: 'Denmark', marketLabel: 'Denmark', hasVerifiedCoverage: false },
  { slug: 'finland', name: 'Finland', marketLabel: 'Finland', hasVerifiedCoverage: false },
  { slug: 'iceland', name: 'Iceland', marketLabel: 'Iceland', hasVerifiedCoverage: false }
] as const;

type SupportedCountry = (typeof supportedCountries)[number];
type ChainConfidence = {
  chain: string;
  confidence: 'High' | 'Medium' | 'Low';
  evidenceRows: number;
  skuCount: number;
  caveat: string;
};

function findCountry(slug: string): SupportedCountry | undefined {
  return supportedCountries.find((country) => country.slug === slug.toLowerCase());
}

function chainLabel(slug: string) {
  if (slug === 'willys') return 'Willys';
  if (slug === 'hemkop') return 'Hemkop';
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function confidenceForSkuCount(skuCount: number): ChainConfidence['confidence'] {
  if (skuCount >= 100) return 'High';
  if (skuCount >= 25) return 'Medium';
  return 'Low';
}

function buildSwedenChainConfidence(): ChainConfidence[] {
  const chains = axfoodProducts.reduce<Record<string, { evidenceRows: number; skus: Set<string> }>>((ledger, product) => {
    Object.entries(product.chains).forEach(([chain, price]) => {
      if (typeof price.price !== 'number' || price.price <= 0) return;
      const row = ledger[chain] ?? { evidenceRows: 0, skus: new Set<string>() };
      row.evidenceRows += 1;
      row.skus.add(product.code || product.slug);
      ledger[chain] = row;
    });
    return ledger;
  }, {});

  return Object.entries(chains)
    .map(([chain, row]) => ({
      chain: chainLabel(chain),
      confidence: confidenceForSkuCount(row.skus.size),
      evidenceRows: row.evidenceRows,
      skuCount: row.skus.size,
      caveat: 'Chain-wide catalogue evidence only; not a per-store shelf-price or availability claim.'
    }))
    .sort((left, right) => right.skuCount - left.skuCount || left.chain.localeCompare(right.chain, 'sv'));
}

function latestSourceFreshness() {
  return sourceCoverage
    .map((source) => source.freshness)
    .filter((freshness) => /^\d{4}-\d{2}-\d{2}/.test(freshness))
    .sort()
    .at(-1) ?? snapshot.retrievedLabel;
}

function buildCountryCoverage(country: SupportedCountry) {
  if (!country.hasVerifiedCoverage) {
    return {
      chainCount: 0,
      storeCount: 0,
      skuCount: 0,
      lastUpdate: 'No verified country feed yet',
      chainConfidence: [] as ChainConfidence[],
      summary: `We track 0 chains, 0 stores, 0 skus in ${country.marketLabel}. Last update: no verified country feed yet.`
    };
  }

  const chainConfidence = buildSwedenChainConfidence();
  const skuCount = new Set([
    ...axfoodProducts.map((product) => product.code || product.slug),
    ...pricedProducts.map((product) => product.code || product.slug)
  ]).size;
  const lastUpdate = latestSourceFreshness();

  return {
    chainCount: chainConfidence.length,
    storeCount: osmStores.length,
    skuCount,
    lastUpdate,
    chainConfidence,
    summary: `We track ${chainConfidence.length.toLocaleString('sv-SE')} chains, ${osmStores.length.toLocaleString('sv-SE')} stores, ${skuCount.toLocaleString('sv-SE')} skus in ${country.marketLabel}. Last update: ${lastUpdate}.`
  };
}

export function generateStaticParams() {
  return supportedCountries.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const entry = findCountry(country);
  if (!entry) notFound();

  return routeMetadata({
    path: `/${entry.slug}/coverage`,
    title: `${entry.name} grocery coverage | GroceryView`,
    description: `Honest GroceryView public coverage counts for ${entry.name}: tracked chains, stores, SKUs, latest source update, and chain confidence caveats.`
  });
}

export const dynamic = 'force-static';

export default async function CountryCoveragePage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const entry = findCountry(country);
  if (!entry) notFound();

  const coverage = buildCountryCoverage(entry);

  return (
    <PageShell>
      <Eyebrow>Country coverage</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{entry.name} public coverage</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{coverage.summary}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Tracked chains" value={coverage.chainCount.toLocaleString('sv-SE')} />
        <Metric label="Tracked stores" value={coverage.storeCount.toLocaleString('sv-SE')} />
        <Metric label="Tracked skus" value={coverage.skuCount.toLocaleString('sv-SE')} />
        <Metric label="Last update" value={coverage.lastUpdate} />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Confidence per chain</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confidence is based only on verified catalogue evidence rows currently present for this country. Empty countries stay empty instead of inheriting Sweden coverage.
            </p>
          </div>
          <p className="text-sm font-black text-slate-600">No fabricated country coverage</p>
        </div>

        <div className="mt-5 divide-y divide-slate-200">
          {coverage.chainConfidence.length > 0 ? coverage.chainConfidence.map((chain) => (
            <div className="grid gap-4 py-5 lg:grid-cols-[1fr_8rem_8rem_8rem]" key={chain.chain}>
              <div>
                <p className="font-black text-slate-950">{chain.chain}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{chain.caveat}</p>
              </div>
              <Readout label="Confidence" value={chain.confidence} />
              <Readout label="SKUs" value={chain.skuCount.toLocaleString('sv-SE')} />
              <Readout label="Rows" value={chain.evidenceRows.toLocaleString('sv-SE')} />
            </div>
          )) : (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
              No verified chain coverage rows are currently published for {entry.marketLabel}.
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
        <p className="mt-2 text-sm leading-6 text-amber-950">
          This public page reports source-backed counts only. It does not claim live shelf prices, complete national coverage, inventory, delivery availability, or store-level price parity unless those rows exist in a verified feed.
        </p>
      </Card>

      {entry.hasVerifiedCoverage ? (
        <div className="mt-6">
          <SourceCoverage />
        </div>
      ) : null}
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value}</p>
    </Card>
  );
}

function Readout({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-emerald-800">{value}</p>
    </div>
  );
}
