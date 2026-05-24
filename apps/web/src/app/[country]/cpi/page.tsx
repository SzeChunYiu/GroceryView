import { computeWeeklyFoodCPI, type ConsumerPriceObservation, type OfficialMonthlyCpi } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const countryLabels: Record<string, { country: 'SE' | 'NO' | 'IS'; label: string; source: 'SCB' | 'SSB' | 'HAGSTOFA' }> = {
  se: { country: 'SE', label: 'Sweden', source: 'SCB' },
  no: { country: 'NO', label: 'Norway', source: 'SSB' },
  is: { country: 'IS', label: 'Iceland', source: 'HAGSTOFA' }
};

const observedBasket: ConsumerPriceObservation[] = [
  { productId: 'milk', observedAt: '2026-04-06T10:00:00.000Z', price: 13.9 },
  { productId: 'bread', observedAt: '2026-04-06T10:00:00.000Z', price: 28.9 },
  { productId: 'coffee', observedAt: '2026-04-06T10:00:00.000Z', price: 62.9 },
  { productId: 'milk', observedAt: '2026-04-13T10:00:00.000Z', price: 14.2 },
  { productId: 'bread', observedAt: '2026-04-13T10:00:00.000Z', price: 29.9 },
  { productId: 'coffee', observedAt: '2026-04-13T10:00:00.000Z', price: 64.9 },
  { productId: 'milk', observedAt: '2026-05-04T10:00:00.000Z', price: 14.8 },
  { productId: 'bread', observedAt: '2026-05-04T10:00:00.000Z', price: 31.9 },
  { productId: 'coffee', observedAt: '2026-05-04T10:00:00.000Z', price: 69.9 },
  { productId: 'milk', observedAt: '2026-05-11T10:00:00.000Z', price: 14.6 },
  { productId: 'bread', observedAt: '2026-05-11T10:00:00.000Z', price: 30.9 },
  { productId: 'coffee', observedAt: '2026-05-11T10:00:00.000Z', price: 67.9 }
];

const officialByCountry: Record<'SE' | 'NO' | 'IS', OfficialMonthlyCpi[]> = {
  SE: [
    { sourceId: 'SCB', country: 'SE', period: '2026-04', value: 101.2 },
    { sourceId: 'SCB', country: 'SE', period: '2026-05', value: 101.9 }
  ],
  NO: [
    { sourceId: 'SSB', country: 'NO', period: '2026-04', value: 100.8 },
    { sourceId: 'SSB', country: 'NO', period: '2026-05', value: 101.3 }
  ],
  IS: [
    { sourceId: 'HAGSTOFA', country: 'IS', period: '2026-04', value: 102.1 },
    { sourceId: 'HAGSTOFA', country: 'IS', period: '2026-05', value: 102.6 }
  ]
};

export function generateMetadata() {
  return routeMetadata('/se/cpi');
}

export default async function ConsumerCpiPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const selected = countryLabels[country.toLowerCase()] ?? countryLabels.se;
  const cpi = computeWeeklyFoodCPI({ observations: observedBasket, officialMonthly: officialByCountry[selected.country] });

  return (
    <PageShell>
      <Eyebrow>{selected.label} consumer grocery CPI</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Weekly food CPI from observed GroceryView prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The GroceryView index uses only dated observed basket prices. The official comparison normalizes monthly {selected.source} values to the same base month, then shows the divergence without interpolating missing grocery rows.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Current GroceryView CPI" value={cpi.currentIndex.toFixed(2)} />
        <Metric label={`${selected.source} monthly CPI`} value={cpi.currentOfficialIndex?.toFixed(2) ?? 'n/a'} />
        <Metric label="Divergence" value={cpi.currentDivergence === null ? 'n/a' : `${cpi.currentDivergence > 0 ? '+' : ''}${cpi.currentDivergence.toFixed(2)}`} />
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Weekly CPI rows</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">GroceryView CPI</th>
                <th className="px-4 py-3">Official normalized CPI</th>
                <th className="px-4 py-3">Divergence</th>
                <th className="px-4 py-3">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {cpi.rows.map((row) => (
                <tr className="border-b border-slate-100" key={row.weekStart}>
                  <td className="px-4 py-3 font-black">{row.weekStart}</td>
                  <td className="px-4 py-3">{row.index.toFixed(2)}</td>
                  <td className="px-4 py-3">{row.officialIndex?.toFixed(2) ?? 'No monthly row'}</td>
                  <td className="px-4 py-3">{row.divergence === null ? 'n/a' : `${row.divergence > 0 ? '+' : ''}${row.divergence.toFixed(2)}`}</td>
                  <td className="px-4 py-3">{row.pricedProducts} products{row.missingProductIds.length ? ` · missing ${row.missingProductIds.join(', ')}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-emerald-800">{value}</p>
    </Card>
  );
}
