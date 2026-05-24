import { PageShell } from '@/components/data-ui';
import { recommendRecipesFromPantry, type PantryItem } from '../../../../../packages/core/src/types/pantry';

const pantry: PantryItem[] = [
  { productId: 'rice', name: 'Rice', quantity: 2, unit: 'kg' },
  { productId: 'beans', name: 'Beans', quantity: 3, unit: 'cans' },
  { productId: 'tomato', name: 'Crushed tomatoes', quantity: 1, unit: 'can' }
];

const recommendations = recommendRecipesFromPantry(pantry, [
  { recipeId: 'bean-rice-bowl', title: 'Bean rice bowl', needs: [{ productId: 'rice', name: 'Rice', quantity: 1, unit: 'kg' }, { productId: 'beans', name: 'Beans', quantity: 1, unit: 'can' }] },
  { recipeId: 'tomato-pasta', title: 'Tomato pasta', needs: [{ productId: 'tomato', name: 'Crushed tomatoes', quantity: 1, unit: 'can' }, { productId: 'pasta', name: 'Pasta', quantity: 1, unit: 'pack' }] }
]);

export default function PantryPage() {
  return (
    <PageShell>
      <section className="rounded-3xl border border-emerald-200 bg-white p-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Pantry tracker</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">What you have at home</h1>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {pantry.map((item) => <div className="rounded-2xl bg-slate-50 p-4 font-bold" key={item.productId}>{item.name}: {item.quantity} {item.unit}</div>)}
        </div>
        <h2 className="mt-6 text-2xl font-black">Meal planner matches</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recommendations.map((recipe) => (
            <div className="rounded-2xl border border-slate-200 p-4" key={recipe.recipeId}>
              <p className="text-xl font-black">{recipe.title}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Covered by pantry: {recipe.coveredByPantry.map((item) => item.name).join(', ') || 'none'}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-800">Cheap fills: {recipe.cheapFills.map((item) => item.name).join(', ') || 'none needed'}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
