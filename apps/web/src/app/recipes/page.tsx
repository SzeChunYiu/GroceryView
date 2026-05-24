'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type RecipeTag = {
  id: string;
  name: string;
  description: string;
};

type RecipeTaggedItem = {
  id: string;
  productId: string;
  name: string;
  category: string;
  amountHint: string;
  tagIds: string[];
};

const recipeTags: RecipeTag[] = [
  {
    id: 'pasta-carbonara',
    name: 'Pasta Carbonara',
    description: 'Creamy pasta for one-pan dinner planning with visible pantry and protein rows.'
  },
  {
    id: 'tomato-pesto-bowl',
    name: 'Tomato Pesto Bowl',
    description: 'Vegetable-forward bowl using pantry staples and fresh produce from visible deals.'
  },
  {
    id: 'quick-fish-rice',
    name: 'Quick Fish Rice',
    description: 'Fast weeknight plate with fish protein and fresh vegetable balance.'
  }
];

const initialTaggedItems: RecipeTaggedItem[] = [
  {
    id: 'item-spaghetti',
    productId: 'barilla-spaghetti-1kg',
    name: 'Barilla Spaghetti 1kg',
    category: 'Pantry',
    amountHint: '0.6 kg per serving',
    tagIds: ['pasta-carbonara', 'tomato-pesto-bowl']
  },
  {
    id: 'item-kikartor',
    productId: 'zeta-kikartor-380g',
    name: 'Zeta Kikärtor 380g',
    category: 'Pantry',
    amountHint: '2–3 portions',
    tagIds: ['tomato-pesto-bowl', 'quick-fish-rice']
  },
  {
    id: 'item-tofu',
    productId: 'garant-ekologisk-tofu-270g',
    name: 'Garant Ekologisk Tofu 270g',
    category: 'Protein',
    amountHint: '1 pack per 2 servings',
    tagIds: ['tomato-pesto-bowl', 'quick-fish-rice']
  },
  {
    id: 'item-kyckling',
    productId: 'kronfagel-kycklingfile-1kg',
    name: 'Kronfågel Kycklingfilé 1kg',
    category: 'Protein',
    amountHint: '250–300 g',
    tagIds: ['pasta-carbonara', 'quick-fish-rice']
  },
  {
    id: 'item-tomater',
    productId: 'garant-korsbarstomater-250g',
    name: 'Garant Körsbärstomater 250g',
    category: 'Vegetables',
    amountHint: '1–2 cups',
    tagIds: ['pasta-carbonara', 'tomato-pesto-bowl']
  },
  {
    id: 'item-gurka',
    productId: 'garant-gurka-300g',
    name: 'Garant Gurka 300g',
    category: 'Vegetables',
    amountHint: '2 cups',
    tagIds: ['quick-fish-rice']
  }
];

function formatSection(items: number) {
  return `${items} ${items === 1 ? 'ingredient' : 'ingredients'}`;
}

function currency(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(value);
}

export function generateMetadata() {
  return routeMetadata({
    path: '/recipes',
    title: 'Recipe ingredient tags | GroceryView',
    description: 'Tag ingredients with recipe names like "Pasta Carbonara" and build recipe-based shopping lists directly from visible grocery rows.'
  });
}

export default function RecipesPage() {
  const [items, setItems] = useState(initialTaggedItems);
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(() => {
    if (activeTagIds.size === 0) return items;

    return items.filter((item) => item.tagIds.some((tagId) => activeTagIds.has(tagId)));
  }, [items, activeTagIds]);

  const selectedTagLabel = useMemo(() => {
    if (activeTagIds.size === 0) return 'all recipe ideas';

    const selectedNames = recipeTags.filter((tag) => activeTagIds.has(tag.id)).map((tag) => tag.name);
    return selectedNames.join(' + ');
  }, [activeTagIds]);

  function toggleTagFilter(tagId: string) {
    const next = new Set(activeTagIds);
    if (next.has(tagId)) {
      next.delete(tagId);
    } else {
      next.add(tagId);
    }
    setActiveTagIds(next);
  }

  function toggleItemTag(itemId: string, tagId: string) {
    setItems((current) =>
      current.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              tagIds: item.tagIds.includes(tagId)
                ? item.tagIds.filter((id) => id !== tagId)
                : [...item.tagIds, tagId].sort()
            }
      )
    );
  }

  const itemsByTag = useMemo(() => {
    const map = new Map<string, RecipeTaggedItem[]>();
    for (const tag of recipeTags) {
      const entries = items.filter((item) => item.tagIds.includes(tag.id));
      if (entries.length > 0) map.set(tag.id, entries);
    }
    return map;
  }, [items]);

  const shoppingCoverage = selectedItems.length;
  const estimateRange = `${currency(80)}–${currency(180)}`;

  return (
    <PageShell>
      <Eyebrow>Recipe shopping lists</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Build recipes from tagged ingredients</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page lets shoppers tag visible ingredients with recipe names and then build a recipe-based shopping list instantly.
      </p>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Tag model</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Tags drive recipe filtering and list output</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Each ingredient row stores one or more recipe tags (for example <span className="font-black">pasta carbonara</span>) and shoppers can combine multiple tags into a single list.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {recipeTags.map((tag) => {
            const active = activeTagIds.has(tag.id);
            return (
              <button
                className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${
                  active ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-900'
                }`}
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                type="button"
              >
                {tag.name}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">Active recipe filter: {selectedTagLabel}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Recipe list builder</p>
          <p className="mt-2 text-sm font-black text-slate-950">{formatSection(shoppingCoverage)} in scope</p>
          <p className="mt-2 text-sm text-slate-700">Estimated cost envelope: {estimateRange} for mixed two-person batches.</p>
          <div className="mt-3 space-y-3">
            {selectedItems.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">No ingredients match the current recipe filter yet.</p>
            ) : (
              selectedItems.map((item) => (
                <div className="rounded-2xl border border-slate-200 p-3" key={item.id}>
                  <Link className="font-black text-slate-950 hover:text-violet-900" href={`/products/${item.productId}`}>
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.category} · {item.amountHint}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    Tags: {item.tagIds.length === 0 ? 'None' : item.tagIds.map((tagId) => recipeTags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(', ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Tag maintenance</p>
          <p className="mt-2 text-sm font-black text-slate-950">Attach or detach tags per ingredient</p>
          <p className="mt-1 text-sm text-slate-700">Change an ingredient&apos;s recipe membership and the recipe list updates instantly.</p>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={`${item.id}-edit`}>
                <p className="font-black text-slate-950">{item.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recipeTags.map((tag) => {
                    const assigned = item.tagIds.includes(tag.id);
                    return (
                      <label className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-xs font-black text-slate-700" key={`${item.id}-${tag.id}`}>
                        <input
                          checked={assigned}
                          className="h-3.5 w-3.5 accent-violet-700"
                          type="checkbox"
                          onChange={() => toggleItemTag(item.id, tag.id)}
                        />
                        {tag.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Recipe coverage</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Tagged recipes by route</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {recipeTags.map((tag) => (
            <div className="rounded-2xl border border-emerald-200 bg-white p-4" key={`${tag.id}-coverage`}>
              <p className="font-black text-slate-950">{tag.name}</p>
              <p className="mt-1 text-sm text-slate-700">{tag.description}</p>
              <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-900">
                {itemsByTag.get(tag.id)?.length ?? 0} linked ingredient{(itemsByTag.get(tag.id)?.length ?? 0) === 1 ? '' : 's'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
