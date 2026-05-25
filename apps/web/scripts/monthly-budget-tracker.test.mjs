import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('monthly grocery budget tracker', () => {
  it('renders category budget progress on the savings dashboard from meal budget helpers', async () => {
    const [route, helper, card] = await Promise.all([
      read('src/app/savings-dashboard/page.tsx'),
      read('src/lib/meal-budgets.ts'),
      read('src/components/budget-progress-card.tsx')
    ]);

    assert.match(route, /monthlyGroceryBudgetTracker/);
    assert.match(route, /buildMonthlyGroceryBudgetTracker/);
    assert.match(route, /Monthly household budget tracker/);
    assert.match(route, /Category budget progress/);
    assert.match(route, /Actual category receipts are not inferred/);
    assert.match(route, /BudgetProgressCard/);
    assert.match(helper, /MonthlyBudgetCategoryInput/);
    assert.match(helper, /MonthlyBudgetCategoryProgress/);
    assert.match(helper, /status: percentUsed >= 1 \? 'over' : percentUsed >= 0\.85 \? 'watch' : 'under'/);
    assert.match(card, /Monthly limit/);
    assert.match(card, /Remaining/);
    assert.match(card, /style=\{\{ width: progressWidth \}\}/);
  });
});
