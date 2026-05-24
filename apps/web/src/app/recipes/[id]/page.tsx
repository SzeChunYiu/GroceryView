'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { appendRecipeIngredientsToStoredList, type RecipeListIngredientInput } from '@/hooks/useList';

type RecipeIngredient = RecipeListIngredientInput & {
  bestPriceSek: number;
  bestStore: string;
  comparison: Array<{ priceSek: number; priceType: string; store: string }>;
};

type Recipe = {
  id: string;
  title: string;
  servings: number;
  summary: string;
  ingredients: RecipeIngredient[];
};

const recipes: Recipe[] = [
  {
    id: 'budget-pasta-night',
    title: 'Budget pasta night',
    servings: 4,
    summary: 'Browse the recipe, add all ingredients to your shopping list, and see the cheapest visible store row for each ingredient before you shop.',
    ingredients: [
      {
        id: 'barilla-spaghetti-1kg',
        name: 'Spaghetti',
        quantity: '1 kg pack',
        recipeId: 'budget-pasta-night',
        recipeTitle: 'Budget pasta night',
        matchedProductName: 'Barilla Spaghetti 1kg',
        matchedProductSlug: 'barilla-spaghetti-1kg',
        bestStore: 'City Gross Stockholm',
        bestPriceSek: 27.9,
        comparison: [
          { store: 'City Gross Stockholm', priceSek: 27.9, priceType: 'online' },
          { store: 'Hemköp Stockholm', priceSek: 31.9, priceType: 'shelf' }
        ]
      },
      {
        id: 'felix-ketchup-1kg',
        name: 'Tomato base',
        quantity: '1 bottle',
        recipeId: 'budget-pasta-night',
        recipeTitle: 'Budget pasta night',
        matchedProductName: 'Felix Tomatketchup 1kg',
        matchedProductSlug: 'felix-ketchup-1kg',
        bestStore: 'Hemköp Stockholm',
        bestPriceSek: 32,
        comparison: [
          { store: 'Hemköp Stockholm', priceSek: 32, priceType: 'weekly deal' },
          { store: 'ICA Nära Sergels Torg', priceSek: 36.9, priceType: 'shelf' }
        ]
      },
      {
        id: 'zeta-olivolja-classico-500ml',
        name: 'Olive oil',
        quantity: '500 ml bottle',
        recipeId: 'budget-pasta-night',
        recipeTitle: 'Budget pasta night',
        matchedProductName: 'Zeta Olivolja Classico 500ml',
        matchedProductSlug: 'zeta-olivolja-classico-500ml',
        bestStore: 'Coop Swedenborgsgatan',
        bestPriceSek: 79.9,
        comparison: [
          { store: 'Coop Swedenborgsgatan', priceSek: 79.9, priceType: 'member promo' },
          { store: 'Willys Odenplan', priceSek: 84.9, priceType: 'shelf' }
        ]
      }
    ]
  }
];

function formatSek(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)} SEK`;
}

export default function RecipePage() {
  const params = useParams<{ id: string }>();
  const recipe = recipes.find((item) => item.id === params.id);
  const [message, setMessage] = useState('');
  const totalBestPrice = useMemo(() => recipe?.ingredients.reduce((sum, ingredient) => sum + ingredient.bestPriceSek, 0) ?? 0, [recipe]);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
        <AppNav />
        <main className="mx-auto w-full max-w-3xl px-4 py-10">
          <h1 className="text-3xl font-black">Recipe not found</h1>
          <p className="mt-3 text-slate-700">This recipe is not available yet.</p>
          <Link className="mt-5 inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href="/meal-planner">Back to meal planner</Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const addAllToList = () => {
    const result = appendRecipeIngredientsToStoredList(recipe.ingredients);
    setMessage(result.addedCount > 0
      ? `${result.addedCount} recipe ingredients added to your shopping list.`
      : 'All recipe ingredients are already on your shopping list.');
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Recipe-to-list</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">{recipe.title}</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{recipe.summary}</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Best visible basket</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{formatSek(totalBestPrice)}</p>
            <p className="text-sm font-semibold text-slate-600">{recipe.ingredients.length} ingredients · {recipe.servings} servings</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-900">Add all to list</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-sky-950">Adds every ingredient as a shopping-list item and preserves the matched product slug for store comparison.</p>
          </div>
          <button className="rounded-full bg-sky-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-sky-800" onClick={addAllToList} type="button">
            Add all to list
          </button>
        </div>
        {message ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950" role="status">{message} <Link className="underline" href="/list">Open list</Link></p> : null}

        <section className="mt-6 grid gap-4">
          {recipe.ingredients.map((ingredient) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={ingredient.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{ingredient.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{ingredient.quantity} · matchedProductSlug: {ingredient.matchedProductSlug}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Cheapest visible row</p>
                  <p className="text-xl font-black text-emerald-950">{formatSek(ingredient.bestPriceSek)}</p>
                  <p className="text-sm font-semibold text-emerald-900">{ingredient.bestStore}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {ingredient.comparison.map((row) => (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3" key={`${ingredient.id}-${row.store}`}>
                    <p className="font-black text-slate-900">{row.store}</p>
                    <p className="text-sm font-semibold text-slate-600">{formatSek(row.priceSek)} · {row.priceType}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
