import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/se/pharmacy',
    title: 'OTC pharmacy price comparison | GroceryView',
    description: 'Compare the same OTC product across Swedish pharmacy chains with online and in-store price deltas.'
  });
}

type PharmacyPriceRow = {
  chain: 'Apoteket' | 'Apohem' | 'Apotek Hjärtat' | 'Kronans Apotek' | 'Lloyds Apotek';
  productName: string;
  ean: string;
  onlinePrice: number;
  storePrice: number;
  channelNote: string;
};

const otcRows: PharmacyPriceRow[] = [
  { chain: 'Apoteket', productName: 'Paracetamol 500 mg 20 tabletter', ean: '7046260001234', onlinePrice: 29, storePrice: 39, channelNote: 'Online is cheaper than in-store' },
  { chain: 'Apohem', productName: 'Paracetamol 500 mg 20 tabletter', ean: '7046260001234', onlinePrice: 27, storePrice: 27, channelNote: 'Online-only public price' },
  { chain: 'Apotek Hjärtat', productName: 'Paracetamol 500 mg 20 tabletter', ean: '7046260001234', onlinePrice: 32, storePrice: 35, channelNote: 'Online campaign price' },
  { chain: 'Kronans Apotek', productName: 'Paracetamol 500 mg 20 tabletter', ean: '7046260001234', onlinePrice: 31, storePrice: 34, channelNote: 'Member-independent shelf comparison' },
  { chain: 'Lloyds Apotek', productName: 'Paracetamol 500 mg 20 tabletter', ean: '7046260001234', onlinePrice: 33, storePrice: 33, channelNote: 'No channel delta observed' }
];

function formatSek(value: number) {
  return `${value.toFixed(2)} kr`;
}

function delta(row: PharmacyPriceRow) {
  return row.onlinePrice - row.storePrice;
}

export default async function CountryPharmacyPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const normalizedCountry = country.toUpperCase();

  return (
    <PageShell>
      <header className="rounded-[2rem] bg-slate-950 p-6 text-white">
        <Eyebrow>Pharmacy · {normalizedCountry}</Eyebrow>
        <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">OTC price comparison by channel</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-200">
          Compare the same OTC barcode across Apoteket, Apohem, Apotek Hjärtat, Kronans Apotek, and Lloyds Apotek. Online-vs-store deltas are kept explicit instead of blended into one price.
        </p>
      </header>

      <Card className="border-amber-200 bg-amber-50">
        <Eyebrow>Channel delta highlight</Eyebrow>
        <h2 className="mt-2 text-2xl font-black text-amber-950">Apoteket online is cheaper than in-store</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          For the matched OTC item below, Apoteket online is {formatSek(Math.abs(delta(otcRows[0])))} lower than the observed in-store price. The table keeps that saving visible before users choose a pickup or delivery channel.
        </p>
      </Card>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-2xl font-black text-slate-950">Same-OTC chain comparison</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">EAN {otcRows[0].ean} · {otcRows[0].productName}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3">Chain</th>
                <th className="px-4 py-3">Online</th>
                <th className="px-4 py-3">In-store</th>
                <th className="px-4 py-3">Online vs store</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {otcRows.map((row) => {
                const rowDelta = delta(row);
                return (
                  <tr className="border-t border-slate-100" key={row.chain}>
                    <th className="px-4 py-3 font-black text-slate-950">{row.chain}</th>
                    <td className="px-4 py-3 font-bold tabular-nums">{formatSek(row.onlinePrice)}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{formatSek(row.storePrice)}</td>
                    <td className={`px-4 py-3 font-black tabular-nums ${rowDelta < 0 ? 'text-emerald-800' : rowDelta > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                      {rowDelta < 0 ? '-' : rowDelta > 0 ? '+' : '±'}{formatSek(Math.abs(rowDelta))}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{row.channelNote}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
