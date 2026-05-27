import { benchmarkMenuItems, summarizeMenuBenchmark, type MenuBenchmarkInput, type MenuBenchmarkRow } from '@/lib/menu-benchmark';
import { routeMetadata } from '@/lib/seo';
import { snapshot } from '@/lib/verified-data';
import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';

const sampleMenu = `Pesto pasta, 149 SEK
- 110 g pasta
- 35 g pesto
- 18 g grated cheese

Open sandwich, 69 SEK
- 80 g bread
- 45 g hummus
- 60 g cucumber`;

const demoMenuItems = [
  {
    id: 'pesto-pasta',
    dishName: 'Pesto pasta',
    menuPrice: 149,
    ingredients: [
      {
        label: 'Pasta',
        quantity: 110,
        unit: 'g',
        matchedProductName: 'Garant pasta 500g',
        matchedStoreName: 'Willys',
        packagePrice: 12.2,
        packageQuantity: 500,
        packageUnit: 'g',
        confidence: 0.8
      },
      {
        label: 'Pesto',
        quantity: 35,
        unit: 'g',
        matchedProductName: 'Pesto di basilico',
        matchedStoreName: 'OpenPrices SEK observation',
        packagePrice: 24.9,
        packageQuantity: 185,
        packageUnit: 'g',
        confidence: 0.72
      },
      {
        label: 'Grated cheese',
        quantity: 18,
        unit: 'g',
        matchedProductName: 'Observed hard cheese benchmark',
        matchedStoreName: 'Axfood matched chain rows',
        packagePrice: 35.9,
        packageQuantity: 150,
        packageUnit: 'g',
        confidence: 0.64
      }
    ]
  },
  {
    id: 'open-sandwich',
    dishName: 'Open sandwich',
    menuPrice: 69,
    ingredients: [
      {
        label: 'Bread',
        quantity: 80,
        unit: 'g',
        matchedProductName: 'Observed sliced bread',
        matchedStoreName: 'OpenPrices SEK observation',
        packagePrice: 29.9,
        packageQuantity: 500,
        packageUnit: 'g',
        confidence: 0.7
      },
      {
        label: 'Hummus',
        quantity: 45,
        unit: 'g',
        matchedProductName: 'Hummus original',
        matchedStoreName: 'OpenPrices SEK observation',
        packagePrice: 28.9,
        packageQuantity: 200,
        packageUnit: 'g',
        confidence: 0.82
      },
      {
        label: 'Cucumber',
        quantity: 60,
        unit: 'g',
        matchedProductName: 'Observed cucumber benchmark',
        matchedStoreName: 'Axfood produce rows',
        packagePrice: 18.9,
        packageQuantity: 1000,
        packageUnit: 'g',
        confidence: 0.66
      }
    ]
  },
  {
    id: 'staff-lunch-bowl',
    dishName: 'Staff lunch bowl',
    menuPrice: 72,
    ingredients: [
      {
        label: 'Rice',
        quantity: 170,
        unit: 'g',
        matchedProductName: 'Long grain rice 1kg',
        matchedStoreName: 'Willys',
        packagePrice: 31.04,
        packageQuantity: 1000,
        packageUnit: 'g',
        confidence: 0.78
      },
      {
        label: 'Plant nuggets',
        quantity: 140,
        unit: 'g',
        matchedProductName: 'Krispiga nuggets',
        matchedStoreName: 'OpenPrices SEK observation',
        packagePrice: 38.9,
        packageQuantity: 250,
        packageUnit: 'g',
        confidence: 0.68
      },
      {
        label: 'Vegetables',
        quantity: 180,
        unit: 'g',
        matchedProductName: 'Frozen wok vegetables',
        matchedStoreName: 'OpenPrices SEK observation',
        packagePrice: 24.9,
        packageQuantity: 500,
        packageUnit: 'g',
        confidence: 0.62
      }
    ]
  }
] satisfies MenuBenchmarkInput[];

const benchmarkRows = benchmarkMenuItems(demoMenuItems);
const summary = summarizeMenuBenchmark(benchmarkRows);

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
}

function statusClassName(status: MenuBenchmarkRow['status']) {
  if (status === 'priced-high-vs-cost') return 'border-amber-200 bg-amber-50 text-amber-950';
  if (status === 'priced-low-vs-cost') return 'border-rose-200 bg-rose-50 text-rose-950';
  return 'border-emerald-200 bg-emerald-50 text-emerald-950';
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/restaurants/menu-benchmark`,
    title: 'Restaurant menu pricing benchmark | GroceryView',
    description: 'Upload or paste a restaurant menu and benchmark dish prices against observed grocery ingredient costs.',
    noIndex: true
  });
}

export default function RestaurantMenuBenchmarkPage() {
  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">Ingredient-cost estimate</StatusBadge>
            <StatusBadge tone="warning">Operator review</StatusBadge>
          </>
        }
        eyebrow="Restaurant menu benchmark"
        title="Flag menu prices that sit far from observed ingredient cost"
      >
        <p>
          Restaurants can upload or paste menu text, then GroceryView estimates dish-level ingredient cost from observed grocery rows and flags dishes priced unusually high or low against food-cost bands. Matches stay reviewable instead of treating ambiguous ingredients as facts.
        </p>
      </DashboardHero>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <label className="block text-sm font-black text-slate-950" htmlFor="menu-text">
            Menu text
            <textarea className="mt-2 min-h-56 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800" defaultValue={sampleMenu} id="menu-text" name="menu-text" />
          </label>
          <div className="grid content-start gap-3">
            <label className="block text-sm font-black text-slate-950" htmlFor="menu-file">
              Menu file
              <input className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-800 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-900 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" id="menu-file" name="menu-file" type="file" accept=".csv,.txt,.pdf,image/*" />
            </label>
            <p className="rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-emerald-950">
              Static preview mode: pasted/uploaded menus can hydrate the same benchmark contract from OCR or CSV parsing. This page renders verified sample rows now and keeps unmatched ingredients visible for review.
            </p>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Menu benchmark summary">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Dishes parsed</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{summary.dishCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Average food cost</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{formatPercent(summary.averageFoodCostPercent)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">High vs cost</p>
          <p className="mt-2 text-3xl font-black text-amber-800">{summary.highVsCostCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Low vs cost</p>
          <p className="mt-2 text-3xl font-black text-rose-800">{summary.lowVsCostCount}</p>
        </Card>
      </section>

      <div className="mt-6 grid gap-5">
        {benchmarkRows.map((row) => (
          <Card className="overflow-hidden" key={row.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Eyebrow>Dish benchmark</Eyebrow>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{row.dishName}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Menu price {formatSek(row.menuPrice)} - estimated ingredient cost {formatSek(row.ingredientCost)} - markup {row.markupMultiple.toFixed(1)}x
                </p>
              </div>
              <span className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${statusClassName(row.status)}`}>
                {row.statusLabel}
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-600">Food-cost ratio</p>
                <p className="mt-2 text-4xl font-black text-slate-950">{formatPercent(row.foodCostPercent)}%</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{row.confidenceLabel}; 18-42% is treated as the launch benchmark band.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Ingredient</th>
                      <th className="px-3 py-2">Observed match</th>
                      <th className="px-3 py-2">Portion cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {row.ingredients.map((ingredient) => (
                      <tr key={`${row.id}-${ingredient.label}`}>
                        <td className="px-3 py-3 align-top">
                          <p className="font-black text-slate-950">{ingredient.label}</p>
                          <p className="text-xs font-semibold text-slate-500">{ingredient.quantity} {ingredient.unit}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-slate-950">{ingredient.matchedProductName}</p>
                          <p className="text-xs font-semibold text-slate-500">{ingredient.matchedStoreName} - confidence {formatPercent(ingredient.confidence * 100)}%</p>
                        </td>
                        <td className="px-3 py-3 align-top font-black text-emerald-800">{formatSek(ingredient.estimatedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <Eyebrow>Evidence limits</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-sky-950">
          Ingredient estimates use observed grocery price rows from {snapshot.retrievedLabel}; they do not include restaurant labor, rent, waste, VAT handling, delivery-app commission, or negotiated wholesale pricing. The benchmark flags review candidates, not final profitability judgments.
        </p>
      </Card>
    </PageShell>
  );
}
