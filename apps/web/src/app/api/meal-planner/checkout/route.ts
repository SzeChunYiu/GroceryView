import { NextResponse } from 'next/server';
import { dealBasedMeals, familyMealPlannerFromDeals, freezerBatchCookPlanner, studentDealRecipes } from '@/lib/demo-data';

type MealIngredient = {
  productId: string;
  name: string;
  category: 'protein' | 'pantry' | 'vegetables';
  price: number;
  dealScore: number;
  source: string;
};

type MealPlanCandidate = {
  mealId: string;
  planType: string;
  dayLabel: string;
  title: string;
  servings: number;
  estimatedCost: number;
  ingredients: MealIngredient[];
};

const gramsPerServingByCategory: Record<MealIngredient['category'], number> = {
  protein: 150,
  pantry: 90,
  vegetables: 125
};

function slugPart(value: string) {
  return value.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mealCandidates(): MealPlanCandidate[] {
  return [
    ...dealBasedMeals.suggestions.map((meal) => ({
      mealId: `deal:${slugPart(meal.title)}`,
      planType: 'deal-based',
      dayLabel: meal.title,
      title: meal.title,
      servings: dealBasedMeals.servings,
      estimatedCost: meal.estimatedCost,
      ingredients: meal.ingredients as MealIngredient[]
    })),
    ...studentDealRecipes.recipes.map((meal) => ({
      mealId: `student:${slugPart(meal.title)}`,
      planType: 'student',
      dayLabel: meal.title,
      title: meal.title,
      servings: studentDealRecipes.servings,
      estimatedCost: meal.estimatedCost,
      ingredients: meal.ingredients as MealIngredient[]
    })),
    ...familyMealPlannerFromDeals.meals.map((meal) => ({
      mealId: `family:${slugPart(meal.weeknightSlot)}`,
      planType: 'family-weeknight',
      dayLabel: meal.weeknightSlot,
      title: meal.title,
      servings: familyMealPlannerFromDeals.servings,
      estimatedCost: meal.estimatedCost,
      ingredients: meal.ingredients as MealIngredient[]
    })),
    ...freezerBatchCookPlanner.meals.map((meal) => ({
      mealId: `freezer:${slugPart(meal.title)}`,
      planType: 'freezer-batch',
      dayLabel: meal.title,
      title: meal.title,
      servings: freezerBatchCookPlanner.servings,
      estimatedCost: meal.estimatedCost,
      ingredients: meal.ingredients as MealIngredient[]
    }))
  ];
}

function packageGramsFromName(name: string) {
  const normalized = name.toLowerCase().replace(',', '.');
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return match[2] === 'kg' ? amount * 1000 : amount;
}

function checkoutItemFor(ingredient: MealIngredient, servings: number) {
  const estimatedGrams = Math.round(gramsPerServingByCategory[ingredient.category] * servings);
  const packageGrams = packageGramsFromName(ingredient.name);
  const estimatedPackages = packageGrams ? Math.max(1, Math.ceil(estimatedGrams / packageGrams)) : 1;
  return {
    productId: ingredient.productId,
    productName: ingredient.name,
    category: ingredient.category,
    quantityEstimate: {
      servings,
      gramsPerServing: gramsPerServingByCategory[ingredient.category],
      estimatedGrams,
      packageGrams,
      estimatedPackages,
      label: packageGrams
        ? `${estimatedGrams} g for ${servings} servings · buy ${estimatedPackages} pack(s)`
        : `${estimatedGrams} g for ${servings} servings · package size not parsed`
    },
    selectedProduct: {
      price: ingredient.price,
      dealScore: ingredient.dealScore,
      source: ingredient.source
    }
  };
}

function checkoutPayloadFor(meal: MealPlanCandidate) {
  const items = meal.ingredients.map((ingredient) => checkoutItemFor(ingredient, meal.servings));
  return {
    mealId: meal.mealId,
    planType: meal.planType,
    dayLabel: meal.dayLabel,
    title: meal.title,
    servings: meal.servings,
    selectedProducts: items,
    itemCount: items.length,
    estimatedCartTotal: items.reduce((sum, item) => sum + item.selectedProduct.price * item.quantityEstimate.estimatedPackages, 0),
    mealEstimatedCost: meal.estimatedCost,
    caveat: 'Autopopulate uses visible meal-plan deal rows and category portion rules only; pantry staples, allergens, household stock, and live availability are not inferred.'
  };
}

async function mealIdFromRequest(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({})) as { mealId?: unknown; dayLabel?: unknown };
    return typeof body.mealId === 'string' ? body.mealId : typeof body.dayLabel === 'string' ? body.dayLabel : '';
  }
  const form = await request.formData().catch(() => null);
  const value = form?.get('mealId') ?? form?.get('dayLabel');
  return typeof value === 'string' ? value : '';
}

export function GET() {
  return NextResponse.json({
    availableMealDays: mealCandidates().map((meal) => ({
      mealId: meal.mealId,
      planType: meal.planType,
      dayLabel: meal.dayLabel,
      title: meal.title,
      servings: meal.servings,
      ingredientCount: meal.ingredients.length
    }))
  });
}

export async function POST(request: Request) {
  const mealId = (await mealIdFromRequest(request)).trim();
  const candidates = mealCandidates();
  const meal = candidates.find((candidate) => candidate.mealId === mealId || candidate.dayLabel === mealId || candidate.title === mealId);

  if (!meal) {
    return NextResponse.json({
      error: 'meal_plan_day_not_found',
      requestedMealId: mealId,
      availableMealIds: candidates.map((candidate) => candidate.mealId)
    }, { status: 404 });
  }

  return NextResponse.json(checkoutPayloadFor(meal));
}
