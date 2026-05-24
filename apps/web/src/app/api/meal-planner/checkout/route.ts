import { NextResponse } from 'next/server';
import { dealBasedMeals, familyMealPlannerFromDeals, freezerBatchCookPlanner, studentDealRecipes } from '@/lib/demo-data';
import type { MealBudgetIngredient } from '@/lib/meal-budgets';

export const dynamic = 'force-dynamic';

type MealPlanCheckoutSource = 'deal-suggestion' | 'student-recipe' | 'family-weeknight' | 'freezer-batch';

type MealPlanCheckoutMeal = {
  id: string;
  label: string;
  source: MealPlanCheckoutSource;
  title: string;
  servings: number;
  ingredients: MealBudgetIngredient[];
};

type CheckoutLine = {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  quantityLabel: string;
  estimatedNeed: string;
  packageSize: string;
  packageSizeGrams: number | null;
  unitPrice: number;
  estimatedLineCost: number;
  source: string;
  confidence: 'high' | 'medium';
};

const GRAMS_PER_SERVING_BY_CATEGORY: Record<string, number> = {
  pantry: 90,
  protein: 150,
  vegetables: 125
};

function compactIngredients(ingredients: Array<MealBudgetIngredient | null | undefined>): MealBudgetIngredient[] {
  return ingredients.filter((ingredient): ingredient is MealBudgetIngredient => Boolean(ingredient));
}

function buildMealPlanCheckoutMeals(): MealPlanCheckoutMeal[] {
  return [
    ...dealBasedMeals.suggestions.map((meal, index) => ({
      id: `deal-${index}`,
      label: `Deal plan ${index + 1}`,
      source: 'deal-suggestion' as const,
      title: meal.title,
      servings: dealBasedMeals.servings,
      ingredients: compactIngredients(meal.ingredients)
    })),
    ...studentDealRecipes.recipes.map((meal, index) => ({
      id: `student-${index}`,
      label: `Student day ${index + 1}`,
      source: 'student-recipe' as const,
      title: meal.title,
      servings: studentDealRecipes.servings,
      ingredients: compactIngredients(meal.ingredients)
    })),
    ...familyMealPlannerFromDeals.meals.map((meal, index) => ({
      id: `family-${index}`,
      label: meal.weeknightSlot,
      source: 'family-weeknight' as const,
      title: meal.title,
      servings: familyMealPlannerFromDeals.servings,
      ingredients: compactIngredients(meal.ingredients)
    })),
    ...freezerBatchCookPlanner.meals.map((meal, index) => ({
      id: `freezer-${index}`,
      label: `Batch cook ${index + 1}`,
      source: 'freezer-batch' as const,
      title: meal.title,
      servings: freezerBatchCookPlanner.servings,
      ingredients: compactIngredients(meal.ingredients)
    }))
  ];
}

function gramsNeeded(category: string, servings: number) {
  return (GRAMS_PER_SERVING_BY_CATEGORY[category] ?? 100) * servings;
}

function parsePackageSizeGrams(productName: string) {
  const normalized = productName.toLocaleLowerCase('sv-SE').replace(',', '.');
  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kg\b/);
  if (kgMatch) return Math.round(Number(kgMatch[1]) * 1000);
  const gramMatch = normalized.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (gramMatch) return Math.round(Number(gramMatch[1]));
  return null;
}

function quantityLabel(quantity: number, packageSizeGrams: number | null) {
  const packageLabel = quantity === 1 ? 'pack' : 'packs';
  if (!packageSizeGrams) return `${quantity} ${packageLabel}`;
  if (packageSizeGrams >= 1000 && packageSizeGrams % 1000 === 0) return `${quantity} × ${packageSizeGrams / 1000} kg`;
  return `${quantity} × ${packageSizeGrams} g`;
}

function checkoutLineForIngredient(ingredient: MealBudgetIngredient, servings: number): CheckoutLine {
  const packageSizeGrams = parsePackageSizeGrams(ingredient.name);
  const targetGrams = gramsNeeded(ingredient.category, servings);
  const quantity = packageSizeGrams ? Math.max(1, Math.ceil(targetGrams / packageSizeGrams)) : 1;
  const estimatedLineCost = Number((quantity * ingredient.price).toFixed(2));

  return {
    productId: ingredient.productId ?? ingredient.name.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9]+/g, '-'),
    productName: ingredient.name,
    category: ingredient.category,
    quantity,
    quantityLabel: quantityLabel(quantity, packageSizeGrams),
    estimatedNeed: `${targetGrams} g for ${servings} serving${servings === 1 ? '' : 's'}`,
    packageSize: packageSizeGrams ? `${packageSizeGrams} g parsed from product name` : 'pack size unavailable; defaulted to one item',
    packageSizeGrams,
    unitPrice: ingredient.price,
    estimatedLineCost,
    source: ingredient.source ?? 'visible deal row',
    confidence: packageSizeGrams ? 'high' : 'medium'
  };
}

async function requestBody(request: Request): Promise<{ dayId: string }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({})) as { dayId?: unknown };
    return { dayId: typeof body.dayId === 'string' ? body.dayId : '' };
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const dayId = formData.get('dayId');
    return { dayId: typeof dayId === 'string' ? dayId : '' };
  }

  return { dayId: '' };
}

function availableMealsPayload(meals = buildMealPlanCheckoutMeals()) {
  return meals.map((meal) => ({
    id: meal.id,
    label: meal.label,
    source: meal.source,
    title: meal.title,
    servings: meal.servings,
    ingredientCount: meal.ingredients.length
  }));
}

export async function GET() {
  return NextResponse.json({
    days: availableMealsPayload(),
    action: 'POST dayId to draft a shopping-list selection with quantity estimates',
    guardrails: [
      'This endpoint returns a shopping-list draft only; it does not write to an account list.',
      'No retailer checkout, payment, delivery slot, or stock reservation is attempted.'
    ]
  });
}

export async function POST(request: Request) {
  const meals = buildMealPlanCheckoutMeals();
  const { dayId } = await requestBody(request);
  const meal = meals.find((candidate) => candidate.id === dayId);

  if (!meal) {
    return NextResponse.json(
      {
        error: 'unknown_meal_plan_day',
        dayId,
        availableDays: availableMealsPayload(meals)
      },
      { status: 404 }
    );
  }

  const selectedProducts = meal.ingredients.map((ingredient) => checkoutLineForIngredient(ingredient, meal.servings));
  const estimatedTotal = Number(selectedProducts.reduce((sum, line) => sum + line.estimatedLineCost, 0).toFixed(2));

  return NextResponse.json({
    dayId: meal.id,
    label: meal.label,
    source: meal.source,
    title: meal.title,
    servings: meal.servings,
    selectedProducts,
    selectedProductCount: selectedProducts.length,
    estimatedTotal,
    currency: 'SEK',
    nextAction: 'Review quantities, then add the draft lines to the signed-in shopping list.',
    guardrails: [
      'Quantity estimates are package-count planning aids derived from visible meal ingredients and parsed pack sizes.',
      'This is not a retailer checkout, payment, delivery booking, stock promise, or automatic account mutation.',
      'Missing pack sizes default to one item and remain marked medium confidence.'
    ]
  });
}
