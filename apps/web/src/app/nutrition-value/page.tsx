import Link from 'next/link';
import { rankNutritionPerKrona } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { healthMacroOptimizer, highProteinDealFinder, nutritionPerKrona, nutritionPerKronaInputs } from '@/lib/demo-data';
import { healthVerifiedLabelFilters } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Record<string, string | string[] | undefined>;
type HealthGoal = 'high-protein' | 'low-calorie' | 'vegan' | 'keyhole';

const healthGoalOptions: Array<{ goal: HealthGoal; label: string; detail: string }> = [
  { goal: 'high-protein', label: 'High protein', detail: 'Sort by protein grams per 10 SEK.' },
  { goal: 'low-calorie', label: 'Low calorie', detail: 'Sort by lower calories per 10 SEK while preserving price evidence.' },
  { goal: 'vegan', label: 'Vegan', detail: 'Show only explicit vegan label or package-text evidence.' },
  { goal: 'keyhole', label: 'Keyhole', detail: 'Show only verified Keyhole label or package-text evidence.' }
];

export function generateMetadata() {
  return routeMetadata('/nutrition-value');
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectedHealthGoal(value: string | undefined): HealthGoal {
  return healthGoalOptions.some((option) => option.goal === value) ? value as HealthGoal : 'high-protein';
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export default async function NutritionValuePage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  const selectedGoal = selectedHealthGoal(paramValue(params.goal));
  const nutritionRows = rankNutritionPerKrona(nutritionPerKronaInputs, nutritionPerKrona.metric).map((row) => ({
    ...row,
    source: nutritionPerKronaInputs.find((input) => input.productId === row.productId)?.source ?? 'visible product row'
  }));
  const labelGoal = selectedGoal === 'vegan'
    ? healthVerifiedLabelFilters.find((filter) => filter.id === 'vegan')
    : selectedGoal === 'keyhole'
      ? healthVerifiedLabelFilters.find((filter) => filter.id === 'keyhole')
      : null;
  const goalMacroRows = [...healthMacroOptimizer.rows]
    .filter((row) => {
      if (selectedGoal === 'vegan') return /vegan|vegansk/i.test(`${row.name} ${row.source}`);
      if (selectedGoal === 'keyhole') return false;
      return true;
    })
    .sort((left, right) => {
      if (selectedGoal === 'low-calorie') return left.caloriesPer10Sek - right.caloriesPer10Sek || right.proteinPer10Sek - left.proteinPer10Sek;
      return right.proteinPer10Sek - left.proteinPer10Sek || left.caloriesPer10Sek - right.caloriesPer10Sek;
    });
  const missingNutritionCoverage = Math.max(0, nutritionPerKrona.coverage.visibleProducts - nutritionPerKrona.coverage.labelledProducts);
  const confidenceLevel = ['high', 'medium', 'low'].includes(nutritionPerKrona.coverage.confidence)
    ? nutritionPerKrona.coverage.confidence as 'high' | 'medium' | 'low'
    : 'low';
  const independentAlternatives = nutritionRows.flatMap((row) => {
    const alternative = nutritionRows.find((candidate) => (
      candidate.productId !== row.productId
      && candidate.price <= row.price
      && candidate.valuePer10Sek >= row.valuePer10Sek * 0.65
      && candidate.sugarPerPackage <= Math.max(row.sugarPerPackage, 2)
      && !candidate.saltWarning
    ));
    if (!alternative) return [];

    return [{
      from: row,
      to: alternative,
      reason: `${alternative.name} is backed by the same price + package-nutrition inputs, costs ${formatSek(alternative.price)} vs ${formatSek(row.price)}, and avoids the salt-warning flag while preserving protein value.`
    }];
  }).slice(0, 3);

  if (nutritionRows.length === 0) {
    return (
      <PageShell>
        <Eyebrow>Nutrition per krona</Eyebrow>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Best protein value per 10 SEK</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
          This route uses the real rankNutritionPerKrona core ranking on visible product rows that also have package nutrition-label fixtures. Products without label coverage are excluded instead of estimated.
        </p>

        <Card className="mt-6 border-dashed border-slate-300 bg-slate-50 text-center">
          <p className="text-4xl" aria-hidden="true">🥗</p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">No nutrition value rows yet</h2>
          <p className="mt-2 font-semibold text-slate-700">Add visible products, deal rows, and store coverage to unlock protein-per-krona rankings.</p>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Eyebrow>Nutrition per krona</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Best protein value per 10 SEK</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route uses the real rankNutritionPerKrona core ranking on visible product rows that also have package nutrition-label fixtures. Products without label coverage are excluded instead of estimated.
      </p>

      <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Health and fitness optimization goals">
        {healthGoalOptions.map((option) => (
          <Link
            className={`rounded-2xl border p-4 shadow-sm ${selectedGoal === option.goal ? 'border-emerald-700 bg-emerald-900 text-white' : 'border-slate-200 bg-white text-slate-950 hover:border-emerald-700'}`}
            href={`/nutrition-value?goal=${option.goal}`}
            key={option.goal}
          >
            <p className="text-sm font-black">{option.label}</p>
            <p className={`mt-2 text-xs font-semibold leading-5 ${selectedGoal === option.goal ? 'text-emerald-50' : 'text-slate-600'}`}>{option.detail}</p>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Ranked labels</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{nutritionPerKrona.coverage.labelledProducts}</p>
          <p className="mt-3 font-semibold text-slate-700">of {nutritionPerKrona.coverage.visibleProducts} visible products have nutrition-label coverage.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Metric</p>
          <p className="mt-2 text-5xl font-black text-slate-950">Protein</p>
          <p className="mt-3 font-semibold text-slate-700">Ranked as grams per 10 SEK using current visible price rows.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Confidence</p>
          <div className="mt-3">
            <ConfidenceBadge
              level={confidenceLevel}
              label={`${nutritionPerKrona.coverage.confidence} confidence`}
              sampleSize={nutritionRows.length}
            />
          </div>
          <p className="mt-3 font-semibold text-slate-700">{nutritionPerKrona.coverage.caveat}</p>
        </Card>
      </div>

      <Card className="mt-6 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Selected goal · {selectedGoal}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Goal-ranked food value</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              Macro rows require both visible price and package nutrition evidence. Label goals require explicit vegan or Keyhole evidence before any product appears.
            </p>
          </div>
          <p className="rounded-2xl bg-white px-4 py-3 text-right text-sm font-black text-indigo-950 shadow-sm">
            {missingNutritionCoverage.toLocaleString('sv-SE')} visible products missing nutrition coverage
          </p>
        </div>

        {goalMacroRows.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {goalMacroRows.slice(0, 4).map((row) => (
              <div className="rounded-2xl bg-white p-4 shadow-sm" key={`${selectedGoal}-${row.productId}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{row.source}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{row.name}</h3>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-950">{row.proteinPer10Sek.toFixed(2)}g protein / 10 SEK</p>
                  <p className="rounded-xl bg-blue-50 p-3 font-black text-blue-950">{row.caloriesPer10Sek.toFixed(0)} kcal / 10 SEK</p>
                  <p className="rounded-xl bg-violet-50 p-3 font-black text-violet-950">{row.fiberPer10Sek.toFixed(2)}g fiber / 10 SEK</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-indigo-950">
            No macro-ranked rows clear this goal because GroceryView does not infer nutrition facts or vegan/Keyhole status from product names alone.
          </p>
        )}

        {labelGoal ? (
          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">Verified label fallback</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{labelGoal.label}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{labelGoal.healthUse}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {labelGoal.products.map((product) => (
                <Link className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-sm hover:border-indigo-700" href={`/products/${product.slug}`} key={product.slug}>
                  <span className="block font-black text-slate-950">{product.productName}</span>
                  <span className="mt-1 block font-semibold text-slate-700">{product.lowestChain} · {formatSek(product.lowestPrice)}</span>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{labelGoal.caveat}</p>
          </div>
        ) : null}
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-800">Score explainer</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">How nutrition value is scored</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-950">
              The score is a value metric, not a health diagnosis: protein grams per package divided by the visible price, normalized to grams per 10 SEK. Sugar and salt are shown as caution factors, but GroceryView does not provide medical, allergy, weight-loss, pregnancy, or disease-specific advice.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">
            <p className="font-black text-slate-950">Independence disclosure</p>
            <p className="mt-2 leading-6">Recommendations are ranked from GroceryView source rows only. Retailers and brands cannot buy placement, override score factors, or hide a lower-priced alternative.</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Protein value leaderboard</h2>
        <div className="mt-4 space-y-3">
          {nutritionRows.map((row, index) => (
            <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${row.productId}`} key={row.productId}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">#{index + 1}</p>
                  <p className="text-xl font-black text-slate-950">{row.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{row.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-800">{row.valuePer10Sek.toFixed(2)}g</p>
                  <p className="text-sm font-semibold text-slate-600">protein / 10 SEK · price {formatSek(row.price)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Calories: {row.nutritionPerPackage.calories}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Sugar: {row.sugarPerPackage}g</p>
                <p className={`rounded-2xl p-3 font-semibold ${row.saltWarning ? 'bg-amber-50 text-amber-950' : 'bg-emerald-50 text-emerald-950'}`}>{row.saltWarning ? 'Salt warning' : 'No salt warning'}</p>
              </div>
              <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-950">
                Score factors: protein {row.nutritionPerPackage.proteinGrams}g ÷ price {formatSek(row.price)} × 10 SEK = {row.valuePer10Sek.toFixed(2)}g. Limitations: package label fixtures and visible price rows only; sugar/salt cautions do not replace medical advice.
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50/70">
        <h2 className="text-2xl font-black text-violet-950">Independent better alternatives</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-violet-900">
          Alternatives appear only when both products have price and package-nutrition evidence. If no backed alternative clears the gates, GroceryView withholds the recommendation.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {independentAlternatives.map((recommendation) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={`${recommendation.from.productId}-${recommendation.to.productId}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Instead of {recommendation.from.name}</p>
              <Link className="mt-2 block text-lg font-black text-slate-950 underline decoration-violet-300 underline-offset-4" href={`/products/${recommendation.to.productId}`}>
                {recommendation.to.name}
              </Link>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{recommendation.reason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-teal-200 bg-teal-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-800">Health & fitness filters</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Organic, Keyhole & vegan filters</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              These filters are built from verified Axfood label fields and explicit package text before a product is shown. They are not a medical claim, and the result is not inferred from browsing, profiles, or unstated ingredient guesses.
            </p>
          </div>
          <p className="rounded-2xl bg-white px-4 py-3 text-right text-sm font-black text-teal-950 shadow-sm">
            {healthVerifiedLabelFilters.reduce((sum, filter) => sum + filter.verifiedProductCount, 0).toLocaleString('sv-SE')} verifiedProductCount rows
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {healthVerifiedLabelFilters.map((filter) => (
            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm" key={filter.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">{filter.swedishQuery}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{filter.label}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{filter.healthUse}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p className="rounded-2xl bg-teal-50 p-3 font-black text-teal-950">verifiedProductCount {filter.verifiedProductCount}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-black text-slate-950">{filter.chainCount} chains</p>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">evidenceLabels</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{filter.evidenceLabels.join(', ') || 'explicit product text'}</p>
              <div className="mt-3 space-y-2">
                {filter.products.map((product) => (
                  <Link className="block rounded-2xl bg-teal-50 p-3 text-sm hover:bg-teal-100" href={`/products/${product.slug}`} key={product.slug}>
                    <span className="block font-black text-slate-950">{product.productName}</span>
                    <span className="mt-1 block font-semibold text-slate-700">{product.lowestChain} · {formatSek(product.lowestPrice)} · spread {product.spreadPct.toFixed(1)}%</span>
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-teal-950">{filter.guardrail}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{filter.caveat}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">{highProteinDealFinder.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">High-protein deal finder</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Ranks current deal rows only after rankDealOpportunities and rankNutritionPerKrona agree they clear the deal-score and protein-per-krona thresholds. The board uses visible deal rows and package nutrition labels; missing labels stay out.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">minProteinPer10Sek</p>
            <p className="text-3xl font-black text-emerald-950">{highProteinDealFinder.minProteinPer10Sek}g</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {highProteinDealFinder.rows.map((row) => (
            <Link className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm hover:border-emerald-700" href={`/products/${row.productId}`} key={`${row.productId}-${row.storeId}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{row.trainingUse}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{row.storeName} · {formatSek(row.currentPrice)}</p>
                </div>
                <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-950">dealScore {row.dealScore}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <p className="rounded-2xl bg-emerald-50 p-3 font-semibold text-emerald-950">proteinPer10Sek {row.proteinPer10Sek.toFixed(2)}g</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold text-slate-700">Drop {formatSek(row.priceDrop)}</p>
                <p className={`rounded-2xl p-3 font-semibold ${row.saltWarning ? 'bg-amber-50 text-amber-950' : 'bg-emerald-50 text-emerald-950'}`}>{row.saltWarning ? 'Salt warning' : 'Salt ok'}</p>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{row.source}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-emerald-950">{highProteinDealFinder.coverage.caveat}</p>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">{healthMacroOptimizer.persona}</p>
            <h2 className="mt-2 text-2xl font-black">Macro optimizer</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-700">{healthMacroOptimizer.coverage.caveat}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">topProtein</p>
            <p className="text-lg font-black text-emerald-950">{healthMacroOptimizer.topProtein?.name}</p>
            <p className="mt-1 text-xs font-semibold text-emerald-800">topFiber: {healthMacroOptimizer.topFiber?.name}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {healthMacroOptimizer.macroTargets.map((target) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={target.metric}>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">macroTargets · {target.metric}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{target.valuePer10Sek.toFixed(2)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{target.target}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{target.topProductId}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          {healthMacroOptimizer.rows.map((row) => (
            <div className="grid gap-3 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[1.4fr_1fr_1fr_1fr]" key={row.productId}>
              <div>
                <p className="font-black text-slate-950">{row.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{row.source}</p>
              </div>
              <p className="font-semibold text-slate-700">Protein {row.proteinPer10Sek.toFixed(2)}g / 10 SEK</p>
              <p className="font-semibold text-slate-700">Fiber {row.fiberPer10Sek.toFixed(2)}g / 10 SEK</p>
              <p className="font-semibold text-slate-700">Calories {row.caloriesPer10Sek.toFixed(0)} / 10 SEK</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
