import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { formatPct, sourceCoverage, storeBrandLedger, storeFormatCoverage } from '@/lib/verified-data';
import { publicCatalogueRevalidateSeconds, routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/store-coverage');
}

export const dynamic = 'force-static';
export const revalidate = publicCatalogueRevalidateSeconds;

const storeSource = sourceCoverage.find((source) => source.name === 'Sweden store directory');

export default function StoreCoveragePage() {
  const brandStores = storeBrandLedger.reduce((sum, brand) => sum + brand.stores, 0);
  const formatStores = storeFormatCoverage.reduce((sum, format) => sum + format.stores, 0);
  const bestAddressedFormat = [...storeFormatCoverage].sort((a, b) => b.addressCoverage - a.addressCoverage)[0];

  return (
    <PageShell>
      <Eyebrow>Store coverage</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">OSM store coverage without inferred prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Store coverage is rendered from the generated Sweden-wide OpenStreetMap extract. The page groups verified locations by brand and format so coverage gaps are visible without turning coordinates into branch-level price claims.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Source rows" value={storeSource?.rows.toLocaleString('sv-SE') ?? 'Not reported'} />
        <Metric label="Brand ledger stores" value={brandStores.toLocaleString('sv-SE')} />
        <Metric label="Format ledger stores" value={formatStores.toLocaleString('sv-SE')} />
        <Metric label="Best address coverage" value={bestAddressedFormat ? formatPct(bestAddressedFormat.addressCoverage * 100) : 'Not reported'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Brand ledger</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Brand rows show the largest verified location groups, their district spread, store formats, and address coverage.
              </p>
            </div>
            <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/stores">
              Browse stores
            </Link>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {storeBrandLedger.map((brand) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto_auto]"
                href={`/stores/${brand.sampleSlug}`}
                key={brand.brand}
              >
                <div>
                  <p className="font-black text-slate-950">{brand.brand}</p>
                  <p className="text-sm text-slate-600">
                    {brand.districts.toLocaleString('sv-SE')} districts · {brand.formats.join(', ') || 'format not reported'}
                  </p>
                </div>
                <p className="font-black text-emerald-800">{brand.stores.toLocaleString('sv-SE')} stores</p>
                <p className="text-sm font-semibold text-slate-700">{formatPct(brand.addressCoverage * 100)} addressed</p>
                <p className="text-sm font-semibold text-slate-600">OSM {brand.latestRetrieved}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-tight">Format coverage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            OSM shop formats are grouped separately from brands to show how much of each physical-store format has address and district metadata.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {storeFormatCoverage.map((format) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
                href={`/stores/${format.sampleSlug}`}
                key={format.format}
              >
                <div>
                  <p className="font-black text-slate-950">{format.format}</p>
                  <p className="text-sm text-slate-600">
                    {format.brands.toLocaleString('sv-SE')} brands · {format.districts.toLocaleString('sv-SE')} districts
                  </p>
                </div>
                <p className="font-black text-emerald-800">{format.stores.toLocaleString('sv-SE')} stores</p>
                <p className="text-sm font-semibold text-slate-700">{formatPct(format.addressCoverage * 100)} addressed</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SourceCoverage />
      </div>
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
