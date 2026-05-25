import { detectGreedflationSignals, greedflationMethodology } from '@groceryview/core/src/lib/greedflation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const demoRetailPrices = [
  { chainId: 'willys', productId: 'oats-1kg', price: 18.9, observedAt: '2026-01-01' },
  { chainId: 'willys', productId: 'oats-1kg', price: 23.9, observedAt: '2026-05-01' },
  { chainId: 'hemkop', productId: 'oats-1kg', price: 20.9, observedAt: '2026-01-01' },
  { chainId: 'hemkop', productId: 'oats-1kg', price: 24.5, observedAt: '2026-05-01' },
  { chainId: 'coop', productId: 'milk-1l', price: 14.9, observedAt: '2026-01-01' },
  { chainId: 'coop', productId: 'milk-1l', price: 18.5, observedAt: '2026-05-01' },
  { chainId: 'ica', productId: 'pasta-500g', price: 13.9, observedAt: '2026-01-01' },
  { chainId: 'ica', productId: 'pasta-500g', price: 15.4, observedAt: '2026-05-01' }
] as const;

const demoSupplierCosts = [
  { productId: 'oats-1kg', proxyId: 'grain-index', proxyLabel: 'Nordic oat wholesale proxy', cost: 9.4, observedAt: '2026-01-01' },
  { productId: 'oats-1kg', proxyId: 'grain-index', proxyLabel: 'Nordic oat wholesale proxy', cost: 10.1, observedAt: '2026-05-01' },
  { productId: 'milk-1l', proxyId: 'dairy-index', proxyLabel: 'Farm-gate dairy proxy', cost: 8.1, observedAt: '2026-01-01' },
  { productId: 'milk-1l', proxyId: 'dairy-index', proxyLabel: 'Farm-gate dairy proxy', cost: 8.7, observedAt: '2026-05-01' },
  { productId: 'pasta-500g', proxyId: 'durum-index', proxyLabel: 'Durum wheat proxy', cost: 6.8, observedAt: '2026-01-01' },
  { productId: 'pasta-500g', proxyId: 'durum-index', proxyLabel: 'Durum wheat proxy', cost: 7.4, observedAt: '2026-05-01' }
] as const;

const productLabels: Record<string, string> = {
  'milk-1l': 'Milk 1L',
  'oats-1kg': 'Oats 1kg',
  'pasta-500g': 'Pasta 500g'
};

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/greedflation`,
    title: 'Greedflation margin trend detector | GroceryView',
    description: 'Transparent audit page for retail price growth that outpaces supplier-cost proxies, with methodology caveats and non-accusatory chain/product flags.'
  });
}

export default async function GreedflationPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const marketLabel = country.replace(/-/g, ' ');
  const signals = detectGreedflationSignals({
    retailPrices: demoRetailPrices,
    supplierCosts: demoSupplierCosts,
    thresholdSpreadPercent: 5
  });

  return (
    <PageShell>
      <Eyebrow>Margin trend audit</Eyebrow>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Greedflation detector for {marketLabel}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Flags chains and products where retail shelf prices rose faster than supplier-cost proxies. Every flag is transparent and non-accusatory: it is a margin-trend lead for review, not proof of wrongdoing.
          </p>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Flagged leads</p>
          <p className="mt-2 text-4xl font-black text-amber-950">{signals.length}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">Threshold: retail growth at least 5 percentage points above supplier proxy growth.</p>
        </Card>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Greedflation detector flags">
        {signals.map((signal) => (
          <Card className="border-rose-200 bg-white" key={`${signal.chainId}-${signal.productId}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">{signal.chainId}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{productLabels[signal.productId] ?? signal.productId}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-700">{signal.proxyLabel} · {signal.evidenceWindow}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <p className="rounded-2xl bg-rose-50 p-3 font-black text-rose-950">Retail {formatPercent(signal.retailGrowthPercent)}</p>
              <p className="rounded-2xl bg-slate-50 p-3 font-black text-slate-950">Cost {formatPercent(signal.supplierGrowthPercent)}</p>
              <p className="rounded-2xl bg-amber-50 p-3 font-black text-amber-950">Spread {formatPercent(signal.unexplainedSpreadPercent)}</p>
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
              Retail moved {formatMoney(signal.retailStartPrice)} → {formatMoney(signal.retailEndPrice)} while proxy cost moved {formatMoney(signal.supplierStartCost)} → {formatMoney(signal.supplierEndCost)}.
            </p>
          </Card>
        ))}
      </section>

      <Card className="mt-6 border-slate-200 bg-slate-950 text-white">
        <h2 className="text-2xl font-black">Transparent methodology</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-200">
          {greedflationMethodology.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-200">
          Caveat: supplier-cost proxies are directional inputs. The detector intentionally withholds accusations because taxes, freight, energy, waste, contracts, promotions, and assortment mix can all alter margins.
        </p>
      </Card>
    </PageShell>
  );
}
