"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type RecipeIngredientMapping = {
  ingredient: string;
  amount: string;
  unit: string;
  mappedProductId: string;
};

type RecipeUpload = {
  id: string;
  title: string;
  ingredientsText: string;
  instructions: string;
  ingredientMappings: RecipeIngredientMapping[];
  createdAt: string;
};

const defaultMapping: RecipeIngredientMapping = {
  ingredient: '',
  amount: '',
  unit: '',
  mappedProductId: ''
};

export default function AdminRecipeUploadPage() {
  const [title, setTitle] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [mappings, setMappings] = useState<RecipeIngredientMapping[]>([defaultMapping]);
  const [recipes, setRecipes] = useState<RecipeUpload[]>([]);
  const [message, setMessage] = useState('Load existing recipe uploads to preview the catalog catalogue.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      const response = await fetch('/api/admin/recipes');
      if (!response.ok) throw new Error(`Failed to load recipes: ${response.statusText}`);
      const payload = (await response.json()) as { recipes: RecipeUpload[] };
      setRecipes(payload.recipes ?? []);
      setMessage('');
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  function updateMapping(index: number, key: keyof RecipeIngredientMapping, value: string) {
    setMappings((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function addMappingRow() {
    setMappings((previous) => [...previous, defaultMapping]);
  }

  function removeMappingRow(index: number) {
    setMappings((previous) => previous.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle('');
    setIngredientsText('');
    setInstructions('');
    setMappings([defaultMapping]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const ingredientMappings = mappings
        .filter(
          (item) =>
            item.ingredient.trim() || item.amount.trim() || item.unit.trim() || item.mappedProductId.trim()
        )
        .map((item) => ({
          ingredient: item.ingredient.trim(),
          amount: item.amount.trim(),
          unit: item.unit.trim(),
          mappedProductId: item.mappedProductId.trim()
        }));

      const response = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          ingredientsText,
          instructions,
          ingredientMappings
        })
      });

      if (!response.ok) {
        const messageText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText}${messageText ? ` (${messageText})` : ''}`);
      }

      const recipe = (await response.json()) as RecipeUpload;
      setRecipes((previous) => [recipe, ...previous]);
      resetForm();
      setMessage('Recipe uploaded to the demo catalog.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-3xl font-black">Admin recipe upload</h1>

      <section className="rounded-lg border border-market-ink/10 bg-white p-4">
        <p className="text-sm text-market-ink/65">Use this form to add recipe seeds that map ingredients to products.</p>
        <form onSubmit={handleSubmit} className="mt-3 grid gap-4">
          <label className="grid gap-1 text-sm">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="rounded border border-market-ink/20 p-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Ingredients
            <textarea
              value={ingredientsText}
              onChange={(event) => setIngredientsText(event.target.value)}
              required
              rows={4}
              className="rounded border border-market-ink/20 p-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Instructions
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={4}
              className="rounded border border-market-ink/20 p-2"
            />
          </label>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black">Ingredient to product mapping</h2>
              <button type="button" className="rounded border px-3 py-1" onClick={addMappingRow}>
                Add ingredient mapping
              </button>
            </div>

            {mappings.map((mapping, index) => (
              <fieldset key={`${mapping.ingredient}-${index}`} className="grid gap-2 rounded border border-market-ink/10 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                  <label className="grid gap-1 text-sm">
                    Ingredient
                    <input
                      value={mapping.ingredient}
                      onChange={(event) => updateMapping(index, 'ingredient', event.target.value)}
                      className="rounded border border-market-ink/20 p-2"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Amount
                    <input
                      value={mapping.amount}
                      onChange={(event) => updateMapping(index, 'amount', event.target.value)}
                      className="rounded border border-market-ink/20 p-2"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Unit
                    <input
                      value={mapping.unit}
                      onChange={(event) => updateMapping(index, 'unit', event.target.value)}
                      className="rounded border border-market-ink/20 p-2"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Product ID
                    <input
                      value={mapping.mappedProductId}
                      onChange={(event) => updateMapping(index, 'mappedProductId', event.target.value)}
                      className="rounded border border-market-ink/20 p-2"
                      required
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeMappingRow(index)}
                    className="h-fit self-end rounded border border-red-300 px-3 py-2 text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </fieldset>
            ))}
          </div>

          <button disabled={submitting} type="submit" className="rounded bg-market-mint px-4 py-2 font-black text-black">
            {submitting ? 'Saving…' : 'Upload recipe'}
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-black">Uploaded recipes</h2>
        {message ? <p className="text-sm">{message}</p> : null}
        <div className="grid gap-3">
          {recipes.length === 0 ? (
            <p className="text-sm text-market-ink/65">No recipe uploads yet.</p>
          ) : (
            recipes.map((recipe) => (
              <article key={recipe.id} className="rounded-lg border border-market-ink/10 bg-white p-4">
                <h3 className="text-lg font-black">{recipe.title}</h3>
                <p className="mt-1 text-sm text-market-ink/65">Created at {new Date(recipe.createdAt).toLocaleString()}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-market-ink/75">{recipe.ingredientsText}</p>
                <ul className="mt-3 grid gap-1 text-sm">
                  {recipe.ingredientMappings.map((mapping) => (
                    <li key={`${mapping.ingredient}-${mapping.mappedProductId}`}>
                      <span className="font-bold">{mapping.ingredient}</span>{' '}
                      <span className="text-market-ink/60">
                        {mapping.amount} {mapping.unit} → <Link href={`/products/${mapping.mappedProductId}`}>{mapping.mappedProductId}</Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
