import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type WholesaleRow = {
  productName: string;
  buyerMode: 'B2B' | 'bulk';
  wholesaleStore: string;
  wholesaleUnitPrice: number;
  retailStore: string;
  retailUnitPrice: number;
  unit: 'kg' | 'L';
  minPack: string;
};

const wholesaleRows: WholesaleRow[] = [
  { productName: 'Pasta penne 5 kg', buyerMode: 'bulk', wholesaleStore: 'Snabbgross', wholesaleUnitPrice: 18.9, retailStore: 'Retail basket', retailUnitPrice: 27.8, unit: 'kg', minPack: '5 kg case' },
  { productName: 'Rapsolja 10 L', buyerMode: 'B2B', wholesaleStore: 'Snabbgross', wholesaleUnitPrice: 28.5, retailStore: 'Retail basket', retailUnitPrice: 39.9, unit: 'L', minPack: '10 L can' },
  { productName: 'Krossade tomater 6 x 2.5 kg', buyerMode: 'bulk', wholesaleStore: 'Restaurant wholesaler', wholesaleUnitPrice: 16.4, retailStore: 'Retail basket', retailUnitPrice: 23.2, unit: 'kg', minPack: '15 kg tray' }
];

function formatMoney(value: number, country: string) {
  return new Intl.NumberFormat(country === 'no' ? 'nb-NO' : 'sv-SE', {
    currency: country === 'no' ? 'NOK' : 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function savingsPercent(row: WholesaleRow) {
  return Math.round(((row.retailUnitPrice - row.wholesaleUnitPrice) / row.retailUnitPrice) * 100);
}

export default async function WholesalePage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} wholesale buyer mode</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">B2B and bulk SKU comparison</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Filter to B2B-priced and bulk listings such as Snabbgross, then compare per-kg and per-L prices against retail-sized grocery products.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Wholesale rows</p>
          <p className="mt-2 text-5xl font-black text-emerald-950">{wholesaleRows.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Best unit saving</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{Math.max(...wholesaleRows.map(savingsPercent))}%</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Filters</p>
          <p className="mt-2 text-2xl font-black text-slate-950">B2B · bulk · Snabbgross</p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Per-unit wholesale comparison</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">Rows show minimum pack size and compare wholesale unit price to the retail-equivalent basket.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Wholesale</th>
                <th className="px-5 py-3">Retail</th>
                <th className="px-5 py-3">Saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {wholesaleRows.map((row) => (
                <tr className="align-top" key={row.productName}>
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950">{row.productName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Minimum pack: {row.minPack}</p>
                  </td>
                  <td className="px-5 py-4 font-black text-slate-700">{row.buyerMode}</td>
                  <td className="px-5 py-4"><span className="font-black text-emerald-800">{formatMoney(row.wholesaleUnitPrice, country)}/{row.unit}</span><span className="block text-xs text-slate-500">{row.wholesaleStore}</span></td>
                  <td className="px-5 py-4"><span className="font-black text-slate-950">{formatMoney(row.retailUnitPrice, country)}/{row.unit}</span><span className="block text-xs text-slate-500">{row.retailStore}</span></td>
                  <td className="px-5 py-4 font-black text-emerald-800">{savingsPercent(row)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
