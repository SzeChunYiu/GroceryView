import { dealBasedMealInputs } from './demo-data';

export type CartAssistantInput = {
  budget: number;
  dietaryTags: string[];
  householdSize: number;
  mealIdeas: string[];
};

const vegetarianNeedles = ['tofu', 'kikärtor', 'spaghetti', 'tomat', 'gurka'];

function isVegetarianCandidate(name: string) {
  const normalized = name.toLocaleLowerCase('sv-SE');
  return vegetarianNeedles.some((needle) => normalized.includes(needle));
}

function clampPositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(8, Math.round(value)));
}

function priceConfidence(source: string) {
  if (/visible/i.test(source) && /row/i.test(source)) return 'medium' as const;
  return 'low' as const;
}

export function buildCartAssistantPlan(input: CartAssistantInput) {
  const householdSize = clampPositiveInteger(input.householdSize, 2);
  const budget = Number.isFinite(input.budget) ? Math.max(0, input.budget) : 500;
  const wantsVegetarian = input.dietaryTags.some((tag) => /vegetarian|vego|veggie|plant/i.test(tag));
  const candidates = dealBasedMealInputs.filter((product) => !wantsVegetarian || isVegetarianCandidate(product.name));
  const targetServings = householdSize * Math.max(1, input.mealIdeas.length || 3);
  let runningTotal = 0;

  const items = candidates.map((product) => {
    const quantity = Math.max(1, Math.ceil(targetServings / 6));
    const lineTotal = product.price * quantity;
    const included = runningTotal + lineTotal <= budget;
    if (included) runningTotal += lineTotal;

    return {
      productId: product.productId,
      name: product.name,
      category: product.category,
      quantity,
      unitPrice: product.price,
      lineTotal,
      included,
      confidence: priceConfidence(product.source),
      source: product.source
    };
  });

  const includedItems = items.filter((item) => item.included);
  const blockedItems = items.filter((item) => !item.included).map((item) => ({
    productId: item.productId,
    name: item.name,
    reason: `Blocked because ${item.lineTotal.toFixed(2)} kr would exceed the ${budget.toFixed(0)} kr budget.`
  }));

  return {
    budget,
    dietaryTags: input.dietaryTags,
    householdSize,
    mealIdeas: input.mealIdeas,
    targetServings,
    items: includedItems,
    blockedItems,
    total: runningTotal,
    remaining: budget - runningTotal,
    coverage: {
      confidence: includedItems.length >= 4 ? 'medium' as const : 'low' as const,
      pricedItems: includedItems.length,
      candidateItems: candidates.length,
      caveat: 'Assistant suggestions are grounded in existing dealBasedMealInputs product rows only; it does not call a model, infer missing prices, or save anything before confirmation.'
    }
  };
}
