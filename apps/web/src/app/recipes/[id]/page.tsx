import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { studentDealRecipes } from '@/lib/demo-data';
import { formatSek } from '@/lib/verified-data';

function recipeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const recipePages = studentDealRecipes.recipes.map((recipe) => ({
  ...recipe,
  id: recipeSlug(recipe.title)
}));

export function generateStaticParams() {
  return recipePages.map((recipe) => ({ id: recipe.id }));
}

function shoppingListHref(recipe: (typeof recipePages)[number]) {
  const items = recipe.ingredients
    .filter((ingredient): ingredient is NonNullable<(typeof recipe.ingredients)[number]> => Boolean(ingredient))
    .map((ingredient) => ({
      detail: `${recipe.title} ingredient with store comparison: ${ingredient.source}`,
      id: `recipe-${recipe.id}-${ingredient.productId}`,
      matchedProductName: ingredient.name,
      matchedProductSlug: ingredient.productId,
      name: ingredient.name,
      productId: ingredient.productId,
      quantity: '1 item',
      storeComparison: `${ingredient.source} · ${formatSek(ingredient.price)}`
    }));

  return `/list?recipe=${encodeURIComponent(JSON.stringify(items))}`;
}

export default async function RecipePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const recipe = recipePages.find((candidate) => candidate.id === id);
  if (!recipe) notFound();
  const ingredients = recipe.ingredients.filter((ingredient): ingredient is NonNullable<(typeof recipe.ingredients)[number]> => Boolean(ingredient));
  const total = ingredients.reduce((sum, ingredient) => sum + ingredient.price, 0);

  return (
    <PageShell>
      <Eyebrow>Recipe</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{recipe.title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        {studentDealRecipes.persona} recipe built from visible grocery price rows. Ingredients can be added to the shopping list with store comparison notes intact.
      </p>
      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Shopping list import</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add every ingredient with store comparison</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
              {ingredients.length} ingredient{ingredients.length === 1 ? '' : 's'} total {formatSek(total)} across the visible deal rows for this recipe.
            </p>
          </div>
          <Link className="inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href={shoppingListHref(recipe)}>
            Add all to list
          </Link>
        </div>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Cook steps</p>
          <ol className="mt-4 space-y-3">
            {recipe.cookSteps.map((step, index) => (
              <li className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700" key={step}>
                <span className="mr-2 font-black text-slate-950">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Ingredients</p>
          <div className="mt-4 grid gap-3">
            {ingredients.map((ingredient) => (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" key={ingredient.productId}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{ingredient.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{ingredient.source}</p>
                  </div>
                  <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-900">{formatSek(ingredient.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{studentDealRecipes.coverage.caveat}</p>
    </PageShell>
  );
}
