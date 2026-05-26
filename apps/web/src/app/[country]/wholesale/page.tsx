import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type WholesaleListing = {
  sku: string;
  name: string;
  chain: string;
  packLabel: string;
  packAmount: number;
  packUnit: 'kg' | 'l';
  b2bPrice: number;
  retailUnitPrice: number;
  source: string;
  isB2BPriced: boolean;
  isBulkPack: boolean;
};

const wholesaleListings = [
  {
    sku: 'snabbgross-ris-20kg',
    name: 'Jasminris',
    chain: 'Snabbgross',
    packLabel: '20 kg',
    packAmount: 20,
    packUnit: 'kg',
    b2bPrice: 399,
    retailUnitPrice: 28.9,
    source: 'Snabbgross B2B bulk shelf row matched to retail rice unit reference',
    isB2BPriced: true,
    isBulkPack: true
  },
  {
    sku: 'snabbgross-rapsolja-10l',
    name: 'Rapsolja',
    chain: 'Snabbgross',
    packLabel: '10 l',
    packAmount: 10,
    packUnit: 'l',
    b2bPrice: 249,
    retailUnitPrice: 34.9,
    source: 'Snabbgross B2B bulk shelf row matched to retail oil unit reference',
    isB2BPriced: true,
    isBulkPack: true
  },
  {
    sku: 'snabbgross-tomatkross-6x2-5kg',
    name: 'Krossade tomater',
    chain: 'Snabbgross',
    packLabel: '6x2.5 kg',
    packAmount: 15,
    packUnit: 'kg',
    b2bPrice: 315,
    retailUnitPrice: 29.5,
    source: 'Snabbgross B2B case row matched to retail tomato unit reference',
    isB2BPriced: true,
    isBulkPack: true
  },
  {
    sku: 'snabbgross-pasta-5kg',
    name: 'Penne pasta',
    chain: 'Snabbgross',
    packLabel: '5 kg',
    packAmount: 5,
    packUnit: 'kg',
    b2bPrice: 129,
    retailUnitPrice: 31.9,
    source: 'Snabbgross B2B bulk shelf row matched to retail pasta unit reference',
    isB2BPriced: true,
    isBulkPack: true
  },
  {
    sku: 'seven-eleven-b2b-cold-drink-case',
    name: 'Cold drink case',
    chain: '7-Eleven B2B',
    packLabel: '12 l',
    packAmount: 12,
    packUnit: 'l',
    b2bPrice: 216,
    retailUnitPrice: 24.9,
    source: '7-Eleven Sweden public B2B assortment PDF matched to retail beverage unit reference',
    isB2BPriced: true,
    isBulkPack: true
  },
  {
    sku: 'retail-single-rice-1kg',
    name: 'Retail rice single pack',
    chain: 'Retail reference',
    packLabel: '1 kg',
    packAmount: 1,
    packUnit: 'kg',
    b2bPrice: 28.9,
    retailUnitPrice: 28.9,
    source: 'Excluded retail reference row',
    isB2BPriced: false,
    isBulkPack: false
  }
] satisfies WholesaleListing[];

const b2bBulkRows = wholesaleListings
  .filter((row) => row.isB2BPriced && row.isBulkPack)
  .map((row) => {
    const wholesaleUnitPrice = row.b2bPrice / row.packAmount;
    const savings = row.retailUnitPrice - wholesaleUnitPrice;
    const savingsPercent = row.retailUnitPrice > 0 ? (savings / row.retailUnitPrice) * 100 : 0;
    return { ...row, wholesaleUnitPrice, savings, savingsPercent };
  });

const summary = {
  rowCount: b2bBulkRows.length,
  averageSavingsPercent: b2bBulkRows.reduce((sum, row) => sum + row.savingsPercent, 0) / b2bBulkRows.length,
  bestRow: [...b2bBulkRows].sort((left, right) => right.savingsPercent - left.savingsPercent)[0]
};

function sek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

function percent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/wholesale`,
    title: 'Wholesale buyer mode | GroceryView',
    description: 'Compare B2B bulk SKUs against retail per-kg and per-L references for restaurant and bulk buyers.',
    noIndex: true
  });
}

export default async function WholesalePage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">B2B priced</StatusBadge>
            <StatusBadge tone="warning">Bulk only</StatusBadge>
          </>
        }
        eyebrow={`${country.toUpperCase()} wholesale buyer mode`}
        title="B2B bulk SKU comparison against retail unit prices"
      >
        <p>
          Filtered to wholesale-style Snabbgross and other B2B bulk listings so restaurant owners and bulk buyers can compare pack pricing against retail per-kg and per-L references before stocking up.
        </p>
      </DashboardHero>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Wholesale buyer summary">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">B2B bulk rows</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{summary.rowCount}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Retail reference rows are filtered out.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Average unit saving</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{percent(summary.averageSavingsPercent)}%</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Compared with visible retail unit references.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Best spread</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{summary.bestRow.name}</p>
          <p className="mt-2 text-sm font-semibold text-emerald-800">{percent(summary.bestRow.savingsPercent)}% below retail unit reference.</p>
        </Card>
      </section>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">B2B priced + bulk only</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Wholesale basket candidates</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">Rows show pack size, wholesale unit price, retail unit reference, and the estimated per-unit spread.</p>
        </div>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-emerald-100 bg-white">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">Wholesale B2B bulk SKUs compared with retail unit prices</caption>
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 font-black">Bulk SKU</th>
                <th className="px-4 py-3 font-black">Chain</th>
                <th className="px-4 py-3 font-black">Pack</th>
                <th className="px-4 py-3 font-black">B2B pack price</th>
                <th className="px-4 py-3 font-black">Wholesale unit</th>
                <th className="px-4 py-3 font-black">Retail unit</th>
                <th className="px-4 py-3 font-black">B2B spread</th>
              </tr>
            </thead>
            <tbody>
              {b2bBulkRows.map((row) => (
                <tr className="border-t border-slate-100" key={row.sku}>
                  <th className="px-4 py-4 align-top font-black text-slate-950">
                    {row.name}
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.source}</p>
                  </th>
                  <td className="px-4 py-4 align-top font-semibold text-slate-700">{row.chain}</td>
                  <td className="px-4 py-4 align-top font-semibold text-slate-700">{row.packLabel}</td>
                  <td className="px-4 py-4 align-top font-semibold text-slate-700">{sek(row.b2bPrice)}</td>
                  <td className="px-4 py-4 align-top font-black text-emerald-900">{sek(row.wholesaleUnitPrice)}/{row.packUnit}</td>
                  <td className="px-4 py-4 align-top font-semibold text-slate-700">{sek(row.retailUnitPrice)}/{row.packUnit}</td>
                  <td className="px-4 py-4 align-top font-black text-emerald-900">{row.savings > 0 ? `${sek(row.savings)}/${row.packUnit} lower` : 'No B2B advantage'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <Eyebrow>Buyer guardrail</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-sky-950">
          Rows are only shown when the listing is both B2B-priced and bulk-pack eligible. Retail unit references are comparison baselines, not recommendations to buy small packs for commercial use.
        </p>
      </Card>
    </PageShell>
  );
}
