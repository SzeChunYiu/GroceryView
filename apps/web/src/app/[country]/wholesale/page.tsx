import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const wholesaleRows = [
  { sku: 'snabbgross-ris-20kg', name: 'Jasminris 20 kg', chain: 'Snabbgross', pack: '20 kg', b2bPrice: 399, retailUnit: 28.9 },
  { sku: 'snabbgross-rapsolja-10l', name: 'Rapsolja 10 L', chain: 'Snabbgross', pack: '10 L', b2bPrice: 249, retailUnit: 34.9 },
  { sku: 'snabbgross-tomatkross-6x2-5kg', name: 'Krossade tomater 6 × 2,5 kg', chain: 'Snabbgross', pack: '15 kg', b2bPrice: 315, retailUnit: 29.5 },
  { sku: 'snabbgross-pasta-5kg', name: 'Penne pasta 5 kg', chain: 'Snabbgross', pack: '5 kg', b2bPrice: 129, retailUnit: 31.9 }
];

function packUnits(pack: string) {
  const match = pack.match(/([\d,.]+)\s*(kg|l)/i);
  if (!match) return { amount: 1, unit: 'unit' };
  return { amount: Number(match[1].replace(',', '.')), unit: match[2].toLowerCase() };
}

function sek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

export function generateMetadata({ params }: { params: { country: string } }) {
  return routeMetadata(`/${params.country}/wholesale`);
}

export default function WholesalePage({ params }: Readonly<{ params: { country: string } }>) {
  const rows = wholesaleRows.map((row) => {
    const units = packUnits(row.pack);
    const wholesaleUnit = row.b2bPrice / units.amount;
    const savings = row.retailUnit - wholesaleUnit;
    return { ...row, unit: units.unit, wholesaleUnit, savings };
  });

  return (
    <PageShell>
      <Eyebrow>{params.country.toUpperCase()} wholesale buyer mode</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">B2B bulk SKU comparison</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Filtered to wholesale-style Snabbgross and bulk listings so buyers can compare B2B pack pricing against retail per-kg/per-L references.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
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
                <th className="px-4 py-3 font-black">Wholesale unit</th>
                <th className="px-4 py-3 font-black">Retail unit</th>
                <th className="px-4 py-3 font-black">B2B spread</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-slate-100" key={row.sku}>
                  <th className="px-4 py-4 font-black text-slate-950">{row.name}</th>
                  <td className="px-4 py-4 font-semibold text-slate-700">{row.chain}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{row.pack}</td>
                  <td className="px-4 py-4 font-black text-emerald-900">{sek(row.wholesaleUnit)}/{row.unit}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{sek(row.retailUnit)}/{row.unit}</td>
                  <td className="px-4 py-4 font-black text-emerald-900">{row.savings > 0 ? `${sek(row.savings)}/${row.unit} lower` : 'No B2B advantage'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
