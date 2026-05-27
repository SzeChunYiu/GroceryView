import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyAdaptiveMealBudgetGuardrails } from '../src/lib/meal-cost-estimator';

describe('applyAdaptiveMealBudgetGuardrails', () => {
  it('recommends, demotes, and hides generated meals against the weekly budget envelope', () => {
    const result = applyAdaptiveMealBudgetGuardrails({
      currentWeeklySpend: 360,
      weeklyBudgetEnvelope: 500,
      reservePercent: 0.15,
      meals: [
        { title: 'Bean tacos', estimatedCost: 45, estimatedCostPerServing: 11.25 },
        { title: 'Chicken pasta', estimatedCost: 80, estimatedCostPerServing: 20 },
        { title: 'Salmon tray bake', estimatedCost: 160, estimatedCostPerServing: 40 }
      ]
    });

    assert.deepEqual(result.recommendedMeals.map((meal) => meal.title), ['Bean tacos']);
    assert.deepEqual(result.demotedMeals.map((meal) => meal.title), ['Chicken pasta']);
    assert.deepEqual(result.hiddenMeals.map((meal) => meal.title), ['Salmon tray bake']);
    assert.equal(result.summary.remainingBeforeMeal, 140);
    assert.equal(result.summary.reserveTarget, 75);
    assert.match(result.hiddenMeals[0]?.budgetGuardrail.reason ?? '', /would exceed the current weekly budget envelope/);
  });
});
