import Link from 'next/link';
import { CategorySuggestionList } from '@/components/category-filter';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { buildDemoHouseholdCategorySignals, defaultHouseholdId, getHouseholdCategoryScore, rankCategoriesByPurchaseHistory } from '@/lib/personalization';
import { pricedProducts } from '@/lib/openprices-products';
import { buildCategoryScopedSearchSuggestions } from '@/lib/search-suggest';
import { CategoryTrendingShelves } from '@/app/page-sections/trending';
import { buildCategoryTrendingShelves } from '@/lib/grocery-index-widget';
import { categorySummaries, dietaryScenarioFilters, formatPct, formatSek, immigrantAisleFinder, sustainableBrandFilter } from '@/lib/verified-data';
import { publicCatalogueRevalidateSeconds, routeMetadata } from '@/lib/seo';

export const revalidate = publicCatalogueRevalidateSeconds;

export function generateMetadata() {
  return routeMetadata('/categories');
}

export default function CategoriesIndexPage() {
  const householdSignals = buildDemoHouseholdCategorySignals(categorySummaries);
  const personalizedCategories = rankCategoriesByPurchaseHistory(categorySummaries, defaultHouseholdId, householdSignals);
  const categorySuggestionProducts = [
    ...axfoodProducts.map((product) => ({ name: product.name, brand: product.brand, category: product.category })),
    ...pricedProducts.map((product) => ({ name: product.name, brand: product.brands, category: product.category }))
  ];
  const categorySuggestionGroups = personalizedCategories.slice(0, 4).map((category) => ({
    category,
    suggestions: buildCategoryScopedSearchSuggestions(category.slug, categorySuggestionProducts, category.label)
  }));
  const categoryShelves = buildCategoryTrendingShelves();

  return (
    <PageShell>
      <Eyebrow>Categories</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Category coverage from verified product rows</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Search categories are ranked for {defaultHouseholdId} using historical conversions and clicks so high-intent aisles appear first.
      </p>
      <Card className="mt-6 border-sky-200 bg-sky-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Category-scoped autocomplete</p>
        <h2 className="mt-2 text-2xl font-black">Suggestions stay inside the active category</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Category browsing now seeds autocomplete from products and popular brands in that aisle so shoppers narrow discovery instead of restarting a global search.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {categorySuggestionGroups.map(({ category, suggestions }) => (
            <section className="rounded-2xl bg-white p-4" key={category.slug}>
              <p className="font-black text-slate-950">{category.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{category.openPriceRows + category.chainRows} scoped rows</p>
              <CategorySuggestionList label="Popular brand and product suggestions" suggestions={suggestions} />
            </section>
          ))}
        </div>
      </Card>

      <CategoryTrendingShelves shelves={categoryShelves} />
      <Card className="mt-6 border-orange-200 bg-orange-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-800">Immigrants / new arrivals</p>
        <h2 className="mt-2 text-2xl font-black">Halal, kosher & ethnic aisle finder</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          These aisle entry points map dietaryTags to verifiedCategorySlug values and keep certification as a package-label or store-confirmation step, not an inferred claim.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {immigrantAisleFinder.map((aisle) => (
            <Link className="rounded-2xl border border-orange-200 bg-white p-4 hover:border-orange-700" href={`/categories/${aisle.verifiedCategorySlug}`} key={aisle.label}>
              <p className="font-black text-slate-950">{aisle.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">verifiedCategorySlug: {aisle.verifiedCategorySlug}</p>
              <p className="mt-2 text-sm font-bold text-orange-900">dietaryTags: {aisle.dietaryTags.join(', ')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{aisle.caveat}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Dietary scenario filters</p>
        <h2 className="mt-2 text-2xl font-black">Swedish dietary filters from verified label evidence</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Scenario filters for glutenfri, laktosfri, vegan, and KRAV/eko products are built from Axfood label fields and explicit product text, not inferred from browsing, profiles, or unverified substitutions.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dietaryScenarioFilters.map((scenario) => (
            <Link className="rounded-2xl border border-emerald-200 bg-white p-4 hover:border-emerald-700" href={scenario.sampleProductSlug ? `/products/${scenario.sampleProductSlug}` : `/categories/${scenario.categorySlug}`} key={scenario.id}>
              <p className="font-black text-slate-950">{scenario.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{scenario.verifiedProductCount.toLocaleString('sv-SE')} verified rows · {scenario.chainCount} chains</p>
              <p className="mt-2 text-sm font-bold text-emerald-900">Query: {scenario.swedishQuery}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Sample: {scenario.sampleProductName}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{scenario.evidenceLabels.join(', ') || 'text evidence'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{scenario.caveat}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">{sustainableBrandFilter.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Sustainable-brand filter</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          This filter uses verified label evidence from Axfood rows plus OpenFoodFacts metadata. It is not a carbon claim: products without explicit evidenceLabels are withheld, and no lifecycle impact is inferred from brand names.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sustainableBrandFilter.rows.map((row) => (
            <Link className="rounded-2xl border border-lime-200 bg-white p-4 hover:border-lime-700" href={`/products/${row.slug}`} key={row.slug}>
              <p className="font-black text-slate-950">{row.productName}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · {row.lowestChain} · {formatSek(row.lowestPrice)}</p>
              <p className="mt-2 text-sm font-bold text-lime-900">filterScore {row.filterScore} · spread {formatPct(row.spreadPct)}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">evidenceLabels</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{row.evidenceLabels.join(', ')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{row.guardrail}</p>
            </Link>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
          {sustainableBrandFilter.guardrails.map((guardrail) => (
            <li key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personalizedCategories.map((category) => (
          <Link href={`/categories/${category.slug}`} key={category.slug}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-emerald-700">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">History score {getHouseholdCategoryScore(category.slug, defaultHouseholdId, householdSignals)}</p>
              <h2 className="mt-2 text-2xl font-black">{category.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.openPriceRows} OpenPrices rows and {category.chainRows} Axfood rows.</p>
              <div className="mt-4 flex justify-between gap-3 text-sm font-black"><span>{formatSek(category.medianPrice)}</span><span>{formatPct(category.strongestSpread)} max spread</span></div>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
