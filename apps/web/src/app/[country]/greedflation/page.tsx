import { detectGreedflation } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const demoFlags = detectGreedflation({
  rows: [
    { chainId: 'willys', productId: 'coffee', retailStart: 49.9, retailEnd: 59.9, supplierCostProxyStart: 40, supplierCostProxyEnd: 43 },
    { chainId: 'hemkop', productId: 'milk', retailStart: 17.9, retailEnd: 18.9, supplierCostProxyStart: 16.4, supplierCostProxyEnd: 17.2 }
  ]
});

export default function GreedflationPage() {
  return (
    <PageShell>
      <Eyebrow>Margin trend screen</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Greedflation detector</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Transparent screen for chains/products where retail prices grew faster than supplier-cost proxies. This is not an accusation; it is a review queue.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {demoFlags.map((flag) => (
          <Card key={`${flag.chainId}-${flag.productId}`} className={flag.flagged ? 'border-rose-200 bg-rose-50' : ''}>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{flag.chainId}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{flag.productId}</h2>
            <p className="mt-3 text-sm font-semibold text-slate-700">Retail {flag.retailChangePercent}% · proxy {flag.supplierCostProxyChangePercent}%</p>
            <p className={flag.flagged ? 'mt-2 text-3xl font-black text-rose-700' : 'mt-2 text-3xl font-black text-emerald-800'}>
              Excess margin trend {flag.excessMarginTrendPercent}%
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black">Methodology</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          excessMarginTrendPercent = retail price change % minus supplier-cost proxy change %. Default flag threshold is 5 percentage points; invalid starting values are not inferred.
        </p>
      </Card>
    </PageShell>
  );
}
