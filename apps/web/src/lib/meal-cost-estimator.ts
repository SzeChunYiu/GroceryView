type MealCostCandidate = {
  estimatedCost: number;
  estimatedCostPerServing: number;
};

export type WeeklyMealBudgetEnvelope = {
  weeklyBudget: number;
  committedSpend: number;
  plannedMealSpend: number;
  reservePercent: number;
  maxMealCost: number;
};

export type MealBudgetGuardrail = {
  status: 'in_envelope' | 'demoted';
  adaptiveMaxMealCost: number;
  remainingBeforeMeal: number;
  remainingAfterMeal: number;
  overEnvelopeBy: number;
  reason: string;
};

export type MealBudgetGuardrailResult<T extends MealCostCandidate> = {
  envelope: WeeklyMealBudgetEnvelope & {
    reserveAmount: number;
    adaptiveMaxMealCost: number;
    remainingBeforeMeal: number;
  };
  visibleMeals: Array<T & { budgetGuardrail: MealBudgetGuardrail }>;
  demotedMeals: Array<T & { budgetGuardrail: MealBudgetGuardrail }>;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function assertFiniteMoney(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number`);
  }
}

export function applyAdaptiveMealBudgetGuardrails<T extends MealCostCandidate>(
  meals: T[],
  envelope: WeeklyMealBudgetEnvelope
): MealBudgetGuardrailResult<T> {
  assertFiniteMoney(envelope.weeklyBudget, 'weeklyBudget');
  assertFiniteMoney(envelope.committedSpend, 'committedSpend');
  assertFiniteMoney(envelope.plannedMealSpend, 'plannedMealSpend');
  assertFiniteMoney(envelope.reservePercent, 'reservePercent');
  assertFiniteMoney(envelope.maxMealCost, 'maxMealCost');

  const reserveAmount = roundMoney(envelope.weeklyBudget * envelope.reservePercent);
  const remainingBeforeMeal = roundMoney(envelope.weeklyBudget - envelope.committedSpend - envelope.plannedMealSpend - reserveAmount);
  const adaptiveMaxMealCost = roundMoney(Math.max(0, Math.min(envelope.maxMealCost, remainingBeforeMeal)));
  const visibleMeals: Array<T & { budgetGuardrail: MealBudgetGuardrail }> = [];
  const demotedMeals: Array<T & { budgetGuardrail: MealBudgetGuardrail }> = [];

  for (const meal of meals) {
    const remainingAfterMeal = roundMoney(remainingBeforeMeal - meal.estimatedCost);
    const overEnvelopeBy = roundMoney(Math.max(0, meal.estimatedCost - adaptiveMaxMealCost));
    const inEnvelope = overEnvelopeBy === 0;
    const budgetGuardrail: MealBudgetGuardrail = {
      status: inEnvelope ? 'in_envelope' : 'demoted',
      adaptiveMaxMealCost,
      remainingBeforeMeal,
      remainingAfterMeal,
      overEnvelopeBy,
      reason: inEnvelope
        ? 'Fits the current weekly meal budget envelope after committed spend and reserve.'
        : 'Demoted because this recipe would exceed the current weekly meal budget envelope.'
    };

    if (inEnvelope) {
      visibleMeals.push({ ...meal, budgetGuardrail });
    } else {
      demotedMeals.push({ ...meal, budgetGuardrail });
    }
  }

  return {
    envelope: {
      ...envelope,
      reserveAmount,
      adaptiveMaxMealCost,
      remainingBeforeMeal
    },
    visibleMeals,
    demotedMeals
  };
}
