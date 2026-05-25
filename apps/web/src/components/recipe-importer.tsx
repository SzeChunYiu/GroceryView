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

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function numericCandidatePrice(candidate: RecipeProductCandidate) {
  return typeof candidate.price === 'number' && Number.isFinite(candidate.price) ? candidate.price : null;
}

function recipeBasketPayload(items: RecipeProductMatch[]) {
  return encodeURIComponent(JSON.stringify({
    source: 'recipe-importer',
    items: items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantityText || 'recipe quantity',
      price: item.price
    }))
  }));
}

export function RecipeImporter({ candidates }: RecipeImporterProps) {
  const [recipeText, setRecipeText] = useState(sampleRecipeText);
  const [shoppingList, setShoppingList] = useState<RecipeProductMatch[]>(() => suggestRecipeProductMatches(parseRecipeIngredients(sampleRecipeText), candidates));
  const parsedIngredients = useMemo(() => parseRecipeIngredients(recipeText), [recipeText]);
  const suggestedMatches = useMemo(() => suggestRecipeProductMatches(parsedIngredients, candidates), [parsedIngredients, candidates]);
  const pricedItems = shoppingList.filter((item) => item.price !== null);
  const basketTotal = pricedItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const perServingCost = basketTotal / 4;
  const missingMappingCount = shoppingList.filter((item) => item.matchScore <= 0).length;
  const storeTotals = [...shoppingList.reduce((ledger, item) => {
    if (item.price === null) return ledger;
    const current = ledger.get(item.storeLabel) ?? { storeLabel: item.storeLabel, total: 0, items: 0 };
    current.total += item.price;
    current.items += 1;
    ledger.set(item.storeLabel, current);
    return ledger;
  }, new Map<string, { storeLabel: string; total: number; items: number }>()).values()]
    .sort((left, right) => right.items - left.items || left.total - right.total);
  const recipeBasket = recipeBasketPayload(shoppingList);
  const substitutionRows = shoppingList
    .map((item) => {
      const firstToken = item.normalizedName.toLocaleLowerCase('sv-SE').split(/\s+/)[0] ?? '';
      const cheaper = candidates
        .filter((candidate) => firstToken.length > 2 && candidate.name.toLocaleLowerCase('sv-SE').includes(firstToken))
        .map((candidate) => ({ candidate, price: numericCandidatePrice(candidate) }))
        .filter((candidate): candidate is { candidate: RecipeProductCandidate; price: number } => candidate.price !== null && item.price !== null && candidate.price < item.price && (candidate.candidate.productId ?? candidate.candidate.slug) !== item.productId)
        .sort((left, right) => left.price - right.price)[0];
      return cheaper ? { ingredient: item.normalizedName, productName: cheaper.candidate.name, savings: (item.price ?? 0) - cheaper.price } : null;
    })
    .filter((row): row is { ingredient: string; productName: string; savings: number } => Boolean(row))
    .slice(0, 3);

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
          <div className="mt-4 grid gap-3 rounded-3xl border border-lime-200 bg-white/80 p-4 sm:grid-cols-3">
            <p>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Basket total</span>
              <span className="mt-1 block text-2xl font-black text-lime-900">{pricedItems.length === shoppingList.length ? formatSek(basketTotal) : 'partial'}</span>
            </p>
            <p>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Per serving</span>
              <span className="mt-1 block text-2xl font-black text-lime-900">{pricedItems.length > 0 ? formatSek(perServingCost) : 'blocked'}</span>
            </p>
            <p>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mapping confidence</span>
              <span className="mt-1 block text-sm font-black text-slate-950">{shoppingList.length - missingMappingCount}/{shoppingList.length} named matches</span>
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded-full bg-lime-700 px-4 py-2 text-xs font-black text-white hover:bg-lime-800" href={`/weekly-basket?recipeBasket=${recipeBasket}#meal-plan-ingredient-basket`}>
              Save recipe basket
            </Link>
            <Link className="rounded-full bg-white px-4 py-2 text-xs font-black text-lime-900 ring-1 ring-lime-200 hover:ring-lime-500" href={`/watchlist?recipeBasket=${recipeBasket}`}>
              Add to watchlist
            </Link>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">Cheapest-chain options</p>
              {storeTotals.length > 0 ? storeTotals.slice(0, 3).map((store) => (
                <p className="mt-2 text-sm font-bold text-slate-700" key={store.storeLabel}>{store.storeLabel}: {formatSek(store.total)} · {store.items}/{shoppingList.length} items</p>
              )) : <p className="mt-2 text-sm font-semibold text-slate-600">No complete priced chain option yet.</p>}
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">Substitutions</p>
              {substitutionRows.length > 0 ? substitutionRows.map((row) => (
                <p className="mt-2 text-sm font-bold text-slate-700" key={`${row.ingredient}-${row.productName}`}>{row.ingredient}: {row.productName} saves {formatSek(row.savings)}</p>
              )) : <p className="mt-2 text-sm font-semibold text-slate-600">No cheaper same-ingredient priced substitute found.</p>}
            </div>
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
                  <span>{item.nutritionPerKronaLabel ?? 'nutrition-per-krona unavailable'}</span>
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
