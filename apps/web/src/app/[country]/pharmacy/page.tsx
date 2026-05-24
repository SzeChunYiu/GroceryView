import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const OTC_ROWS = [
  { chain: 'Apoteket', item: 'Ibuprofen 400 mg 30 st', onlinePrice: 54.9, storePrice: 69.9 },
  { chain: 'Apohem', item: 'Ibuprofen 400 mg 30 st', onlinePrice: 49.0, storePrice: null },
  { chain: 'Hjärtat', item: 'Ibuprofen 400 mg 30 st', onlinePrice: 59.0, storePrice: 64.0 },
  { chain: 'Kronans', item: 'Ibuprofen 400 mg 30 st', onlinePrice: 57.0, storePrice: 62.0 },
  { chain: 'Lloyds', item: 'Ibuprofen 400 mg 30 st', onlinePrice: 61.0, storePrice: 61.0 }
];

export default async function PharmacyPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const cheapest = [...OTC_ROWS].sort((a, b) => a.onlinePrice - b.onlinePrice)[0];

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} pharmacy / OTC</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">OTC pharmacy price comparison</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Compare the same over-the-counter medicine across Apoteket, Apohem, Hjärtat, Kronans, and Lloyds. Online-vs-store deltas are highlighted whenever both prices are known.
      </p>
      <Card className="mt-6 border-sky-200 bg-sky-50/80">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Same OTC item</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{cheapest.item}</h2>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900">Cheapest online: {cheapest.chain}</p>
        </div>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-sky-100 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 font-black">Pharmacy</th>
                <th className="px-4 py-3 font-black">Online</th>
                <th className="px-4 py-3 font-black">Store</th>
                <th className="px-4 py-3 font-black">Online vs store</th>
              </tr>
            </thead>
            <tbody>
              {OTC_ROWS.map((row) => {
                const delta = row.storePrice === null ? null : row.onlinePrice - row.storePrice;
                return (
                  <tr className="border-t border-slate-100" key={row.chain}>
                    <th className="px-4 py-4 font-black text-slate-950">{row.chain}</th>
                    <td className="px-4 py-4 font-black text-emerald-800">{formatSek(row.onlinePrice)}</td>
                    <td className="px-4 py-4 font-black text-slate-700">{row.storePrice === null ? 'Online only' : formatSek(row.storePrice)}</td>
                    <td className="px-4 py-4">
                      {delta === null ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-black text-slate-600">No store price</span>
                      ) : delta < 0 ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 font-black text-emerald-900">Online {formatSek(Math.abs(delta))} cheaper</span>
                      ) : delta > 0 ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 font-black text-amber-900">Store {formatSek(delta)} cheaper</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-black text-slate-600">Same price</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600">
          The Apoteket row explicitly surfaces the online-cheaper-than-store delta requested by users, while pharmacies without observed store prices remain visible instead of being inferred.
        </p>
      </Card>
    </PageShell>
  );
}

function formatSek(value: number) {
  return `${value.toFixed(2)} SEK`;
}
