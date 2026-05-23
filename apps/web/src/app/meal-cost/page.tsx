import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { mealCostBreakdown } from '@/lib/demo-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/meal-cost');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function MealCostPage() {
  const { summary } = mealCostBreakdown;
  return (
    <PageShell>
      <Eyebrow>{mealCostBreakdown.persona}</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Ingredient-level meal costing</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView calls calculateMealCostBreakdown with real ingredient offer rows, package sizes, and serving counts to show exact cost per meal and per serving. Missing chains are excluded instead of estimated.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Meal total</p>
          <p className="mt-2 text-5xl font-black text-emerald-950">{formatSek(summary.totalCost)}</p>
          <p className="mt-3 font-semibold text-emerald-900">{summary.title} for {summary.servings} servings.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Per serving</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(summary.costPerServing)}</p>
          <p className="mt-3 font-semibold text-slate-700">costPerServing is derived from ingredient quantities, never a hand-entered estimate.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Cheapest chain</p>
          <p className="mt-2 text-5xl font-black capitalize text-slate-950">{summary.cheapestChain?.chainId ?? 'blocked'}</p>
          <p className="mt-3 font-semibold text-slate-700">
            cheapestChain covers {summary.cheapestChain?.coveredIngredients ?? 0}/{summary.coverage.ingredientCount} ingredients from confidence-cleared offers.
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Per-ingredient cost breakdown</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Each ingredientCost is prorated from the selected product package price and the recipe quantity needed.</p>
          </div>
          <p className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-950">{summary.status}</p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {summary.breakdown.map((row) => (
            <Link className="grid gap-3 py-4 transition hover:bg-emerald-50 md:grid-cols-[1fr_auto_auto]" href={`/products/${row.selectedProductId}`} key={row.ingredientId}>
              <div>
                <p className="font-black text-slate-950">{row.label}</p>
                <p className="text-sm font-semibold text-slate-700">{row.productName} · {row.storeName}</p>
                <p className="text-sm text-slate-600">{row.quantityNeeded} {row.unit} from {row.packageQuantity} {row.packageUnit} package · {row.source}</p>
              </div>
              <p className="font-black text-emerald-800">ingredientCost {formatSek(row.ingredientCost)}</p>
              <p className="text-sm font-semibold text-slate-600">confidence {formatPct(row.confidence)}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <h2 className="text-2xl font-black text-blue-950">Cheapest complete-chain evidence</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-900">{summary.confidenceLabel}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summary.chainOptions.map((chain) => (
            <div className="rounded-2xl bg-white/90 p-4" key={chain.chainId}>
              <p className="text-lg font-black capitalize text-slate-950">{chain.chainId}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{chain.coveredIngredients}/{chain.ingredientCount} ingredients · {formatPct(chain.coverageShare)} coverage</p>
              <p className="mt-2 text-2xl font-black text-blue-800">{chain.eligible ? formatSek(chain.totalCost) : 'blocked'}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{chain.storeNames.join(', ') || 'No complete store evidence'}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-blue-900">{mealCostBreakdown.coverage.caveat}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
