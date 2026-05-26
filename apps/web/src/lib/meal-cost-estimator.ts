export type MealCostEstimate = {
  estimatedCost: number;
  estimatedCostPerServing?: number;
  title: string;
};

export type MealBudgetGuardrailStatus = 'within_budget' | 'demoted' | 'hidden';

export type GuardrailedMeal<T extends MealCostEstimate> = T & {
  budgetGuardrail: {
    remainingAfterMeal: number;
    reason: string;
    reserveTarget: number;
    status: MealBudgetGuardrailStatus;
  };
};

export type MealBudgetGuardrailInput<T extends MealCostEstimate> = {
  currentWeeklySpend: number;
  meals: T[];
  reservePercent?: number;
  weeklyBudgetEnvelope: number;
};

export type MealBudgetGuardrailResult<T extends MealCostEstimate> = {
  demotedMeals: GuardrailedMeal<T>[];
  hiddenMeals: GuardrailedMeal<T>[];
  recommendedMeals: GuardrailedMeal<T>[];
  summary: {
    currentWeeklySpend: number;
    demotedCount: number;
    hiddenCount: number;
    remainingBeforeMeal: number;
    reserveTarget: number;
    weeklyBudgetEnvelope: number;
  };
};

function safeMoney(value: number) {
  return Math.max(0, Number.isFinite(value) ? Number(value.toFixed(2)) : 0);
}

export function applyAdaptiveMealBudgetGuardrails<T extends MealCostEstimate>({
  currentWeeklySpend,
  meals,
  reservePercent = 0.15,
  weeklyBudgetEnvelope
}: MealBudgetGuardrailInput<T>): MealBudgetGuardrailResult<T> {
  const safeWeeklyBudgetEnvelope = safeMoney(weeklyBudgetEnvelope);
  const safeCurrentWeeklySpend = safeMoney(currentWeeklySpend);
  const remainingBeforeMeal = safeMoney(safeWeeklyBudgetEnvelope - safeCurrentWeeklySpend);
  const reserveTarget = safeMoney(safeWeeklyBudgetEnvelope * Math.max(0, Math.min(reservePercent, 0.5)));

  const guardrailedMeals = meals.map((meal) => {
    const estimatedCost = safeMoney(meal.estimatedCost);
    const remainingAfterMeal = safeMoney(remainingBeforeMeal - estimatedCost);
    const status: MealBudgetGuardrailStatus = estimatedCost > remainingBeforeMeal
      ? 'hidden'
      : remainingAfterMeal < reserveTarget
        ? 'demoted'
        : 'within_budget';
    const reason = status === 'hidden'
      ? `Hidden because ${meal.title} would exceed the current weekly budget envelope.`
      : status === 'demoted'
        ? `Demoted because ${meal.title} leaves less than the weekly reserve target.`
        : `Recommended because ${meal.title} stays inside the weekly budget envelope and reserve target.`;

    return {
      ...meal,
      budgetGuardrail: {
        remainingAfterMeal,
        reason,
        reserveTarget,
        status
      }
    };
  });

  const recommendedMeals = guardrailedMeals
    .filter((meal) => meal.budgetGuardrail.status === 'within_budget')
    .sort((left, right) => left.estimatedCost - right.estimatedCost || left.title.localeCompare(right.title, 'sv-SE'));
  const demotedMeals = guardrailedMeals
    .filter((meal) => meal.budgetGuardrail.status === 'demoted')
    .sort((left, right) => left.budgetGuardrail.remainingAfterMeal - right.budgetGuardrail.remainingAfterMeal || left.title.localeCompare(right.title, 'sv-SE'));
  const hiddenMeals = guardrailedMeals
    .filter((meal) => meal.budgetGuardrail.status === 'hidden')
    .sort((left, right) => right.estimatedCost - left.estimatedCost || left.title.localeCompare(right.title, 'sv-SE'));

  return {
    demotedMeals,
    hiddenMeals,
    recommendedMeals,
    summary: {
      currentWeeklySpend: safeCurrentWeeklySpend,
      demotedCount: demotedMeals.length,
      hiddenCount: hiddenMeals.length,
      remainingBeforeMeal,
      reserveTarget,
      weeklyBudgetEnvelope: safeWeeklyBudgetEnvelope
    }
  };
}
