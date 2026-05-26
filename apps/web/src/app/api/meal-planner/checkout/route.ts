import { NextResponse, type NextRequest } from 'next/server';
import { buildMealPlanShoppingListExport, mealPlanShoppingListHref, type MealBudgetIngredient, type MealBudgetPlan } from '@/lib/meal-budgets';

type MealPlannerCheckoutIngredient = {
  category?: unknown;
  name?: unknown;
  price?: unknown;
  productId?: unknown;
  source?: unknown;
};

type MealPlannerCheckoutRequest = {
  day?: unknown;
  ingredients?: unknown;
  mealTitle?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseIngredientJson(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeIngredients(value: unknown): MealBudgetIngredient[] {
  return parseIngredientJson(value)
    .filter((ingredient): ingredient is MealPlannerCheckoutIngredient => ingredient !== null && typeof ingredient === 'object')
    .flatMap((ingredient): MealBudgetIngredient[] => {
      const name = cleanString(ingredient.name);
      const category = cleanString(ingredient.category);
      if (!name || !category) return [];

      return [{
        category,
        name,
        price: typeof ingredient.price === 'number' && Number.isFinite(ingredient.price) ? Math.max(0, ingredient.price) : 0,
        productId: cleanString(ingredient.productId) || undefined,
        source: cleanString(ingredient.source) || undefined
      }];
    });
}

async function readCheckoutRequest(request: NextRequest): Promise<MealPlannerCheckoutRequest> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}));
  }

  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return {
    day: form.get('day'),
    ingredients: form.get('ingredients'),
    mealTitle: form.get('mealTitle')
  };
}

export async function POST(request: NextRequest) {
  const body = await readCheckoutRequest(request);
  const mealTitle = cleanString(body.mealTitle);
  const day = cleanString(body.day);
  const ingredients = normalizeIngredients(body.ingredients);

  if (!mealTitle) {
    return NextResponse.json({ error: 'mealTitle is required to build a shopping list checkout.' }, { status: 400 });
  }

  if (ingredients.length === 0) {
    return NextResponse.json({ error: 'At least one meal ingredient is required.' }, { status: 400 });
  }

  const plan: MealBudgetPlan = {
    ingredients,
    title: day ? `${day}: ${mealTitle}` : mealTitle
  };
  const exportPayload = buildMealPlanShoppingListExport([plan], plan.title);

  return NextResponse.json({
    day: day || null,
    listHref: mealPlanShoppingListHref([plan], plan.title),
    mealTitle,
    selectedProducts: exportPayload.items.map((item) => ({
      category: item.category,
      detail: item.detail,
      name: item.name,
      productId: item.productId ?? null,
      quantityEstimate: item.quantity
    })),
    source: exportPayload.source,
    status: 'ready'
  }, { status: 201 });
}
