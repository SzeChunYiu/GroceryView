import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { osmStores } from '@/lib/osm-stores';
import { sourceCoverage } from '@/lib/verified-data';

type PageParams = { country: string; chain: string };

const chainLabels: Record<string, string> = {
  willys: 'Willys',
  hemkop: 'Hemköp',
  ica: 'ICA',
  coop: 'Coop',
  lidl: 'Lidl',
  'city-gross': 'City Gross',
  tempo: 'Tempo'
};
const axfoodChainKeys: Record<string, 'willys' | 'hemkop'> = { willys: 'willys', hemkop: 'hemkop' };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function chainLabelFor(slug: string) {
  return chainLabels[normalize(slug)];
}

function storesForChain(label: string) {
  const needle = normalize(label);
  return osmStores.filter((store) => normalize(store.brand || store.name).includes(needle));
}

function skuRowsForChain(slug: string) {
  const key = axfoodChainKeys[normalize(slug)];
  return key ? axfoodProducts.filter((product) => typeof product.chains[key]?.price === 'number') : [];
}

export function generateStaticParams() {
  return Object.keys(chainLabels).map((chain) => ({ country: 'se', chain }));
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { chain } = await params;
  const label = chainLabelFor(chain) ?? chain;
  return {
    title: `${label} data confidence | GroceryView`,
    description: `Public data-confidence report for ${label}: last observed date, stores, SKUs, freshness, and audit findings.`
  };
}

export default async function ChainConfidencePage({ params }: { params: Promise<PageParams> }) {
  const { country, chain } = await params;
  if (!['se', 'sv', 'sweden'].includes(normalize(country))) notFound();
  const chainLabel = chainLabelFor(chain);
  if (!chainLabel) notFound();

  const stores = storesForChain(chainLabel);
  const skuRows = skuRowsForChain(chain);
  const axfoodSource = sourceCoverage.find((source) => source.name === 'Axfood chain price snapshot');
  const storeSource = sourceCoverage.find((source) => source.name === 'Sweden store directory');
  const latestStoreDate = stores.map((store) => store.retrievedDate).sort().at(-1);
  const lastObservedAt = skuRows.length > 0 ? axfoodSource?.freshness ?? 'Not reported' : latestStoreDate ?? 'Not reported';
  const ingestionFreshness = skuRows.length > 0 ? axfoodSource?.freshness ?? 'Not reported' : storeSource?.freshness ?? 'Not reported';
  const categoriesCovered = new Set(skuRows.map((product) => product.category)).size;
  const auditFindings = [
    skuRows.length > 0
      ? `${skuRows.length.toLocaleString('sv-SE')} chain-wide catalogue SKUs have a ${chainLabel} row; branch shelf prices are not inferred.`
      : `No chain-wide SKU price rows are bundled for ${chainLabel}; only store-directory coverage is shown.`,
    `${stores.length.toLocaleString('sv-SE')} ${chainLabel} store rows come from OSM location data and stay separate from price claims.`,
    `Ingestion freshness is reported as ${ingestionFreshness}; stale or missing rows remain visible rather than filled.`,
    'Audit boundary: no synthetic store, SKU, inventory, or checkout-total claims are generated from gaps.'
  ];

  return (
    <PageShell>
      <Eyebrow>Data confidence</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{chainLabel} public data-confidence report</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Maximum transparency for {chainLabel}: last_observed_at, stores covered, SKUs covered, ingestion freshness, and audit findings are shown as separate evidence rows.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="last_observed_at" value={lastObservedAt} />
        <Metric label="stores covered" value={stores.length.toLocaleString('sv-SE')} />
        <Metric label="SKUs covered" value={skuRows.length.toLocaleString('sv-SE')} />
        <Metric label="ingestion freshness" value={ingestionFreshness} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-emerald-200 bg-emerald-50">
          <h2 className="text-2xl font-black tracking-tight text-emerald-950">Coverage ledger</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Country route" value={country.toUpperCase()} />
            <Row label="Chain" value={chainLabel} />
            <Row label="Categories covered" value={categoriesCovered.toLocaleString('sv-SE')} />
            <Row label="Price source" value={skuRows.length > 0 ? axfoodSource?.source ?? 'Axfood source not reported' : 'No bundled price source for this chain'} />
            <Row label="Store source" value={storeSource?.source ?? 'OpenStreetMap store directory'} />
          </dl>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <h2 className="text-2xl font-black tracking-tight text-amber-950">Audit findings</h2>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-950">
            {auditFindings.map((finding) => <li key={finding}>• {finding}</li>)}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
    </Card>
  );
}

function Row({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-slate-950">{value}</dd>
    </div>
  );
}
