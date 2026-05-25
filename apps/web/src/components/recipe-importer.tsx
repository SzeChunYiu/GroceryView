'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { parseRecipeIngredients, suggestRecipeProductMatches, type RecipeProductCandidate, type RecipeProductMatch } from '@/lib/normalization';

type RecipeImporterProps = {
  candidates: RecipeProductCandidate[];
};

const sampleRecipeText = `200 g spaghetti
250 g körsbärstomater
1 st tofu
1 gurka`;

export function RecipeImporter({ candidates }: RecipeImporterProps) {
  const [recipeText, setRecipeText] = useState(sampleRecipeText);
  const [shoppingList, setShoppingList] = useState<RecipeProductMatch[]>(() => suggestRecipeProductMatches(parseRecipeIngredients(sampleRecipeText), candidates));
  const parsedIngredients = useMemo(() => parseRecipeIngredients(recipeText), [recipeText]);
  const suggestedMatches = useMemo(() => suggestRecipeProductMatches(parsedIngredients, candidates), [parsedIngredients, candidates]);

  function importRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShoppingList(suggestedMatches);
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-lime-200 bg-lime-50 shadow-sm" aria-label="Recipe import to shopping list">
      <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
        <form className="border-b border-lime-200 bg-white p-5 lg:border-b-0 lg:border-r" onSubmit={importRecipe}>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">Recipe import</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Turn recipe text into a comparable grocery list</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            Paste ingredient lines or a recipe URL. The importer extracts shopping-list rows and matches each ingredient to visible priced products before you save the list.
          </p>
          <label className="mt-4 block text-sm font-black text-slate-800" htmlFor="recipe-import-input">
            Recipe URL or ingredients
          </label>
          <textarea
            className="mt-2 min-h-48 w-full rounded-3xl border border-lime-200 bg-lime-50/60 p-4 text-sm font-semibold leading-6 text-slate-900 outline-none ring-lime-500 focus:ring-2"
            id="recipe-import-input"
            onChange={(event) => setRecipeText(event.target.value)}
            value={recipeText}
          />
          <button className="mt-4 rounded-full bg-lime-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-lime-800" type="submit">
            Create shopping list
          </button>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-lime-900">
            {parsedIngredients.length} parsed ingredients · {suggestedMatches.filter((match) => match.matchScore > 0).length} product matches
          </p>
        </form>

        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">Suggested product matches</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">Imported shopping list</h3>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-lime-900">{shoppingList.length} items</p>
          </div>
          <div className="mt-4 grid gap-3">
            {shoppingList.map((item) => (
              <div className="rounded-3xl border border-lime-200 bg-white p-4" key={`${item.rawText}-${item.productId}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">{item.quantityText || 'quantity from recipe'}</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{item.normalizedName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Matched to {item.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-lime-800">{item.priceLabel}</p>
                    <p className="text-xs font-semibold text-slate-600">{item.unitPriceLabel}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600">
                  <span>{item.storeLabel}</span>
                  <span>{item.matchScore > 0 ? 'ingredient-name match' : 'fallback visible product'}</span>
                  <Link className="text-lime-800 underline decoration-lime-300 decoration-2 underline-offset-4" href={`/products/${item.productId}`}>
                    View product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
