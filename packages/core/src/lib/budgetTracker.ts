export type BudgetTrackerSpendItem = {
  label: string;
  amount: number;
  source: 'receipt' | 'basket';
};

export type BudgetTrackerSwap = {
  from: string;
  to: string;
  savings: number;
};

export type BudgetTrackerResult = {
  monthly_budget: number;
  spend_to_date: number;
  basket_estimate: number;
  remaining_budget: number;
  progress_percent: number;
  recommended_swaps: BudgetTrackerSwap[];
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildBudgetTracker(input: {
  monthlyBudget: number;
  receipts?: BudgetTrackerSpendItem[];
  basket?: BudgetTrackerSpendItem[];
  swaps?: BudgetTrackerSwap[];
}): BudgetTrackerResult {
  const monthlyBudget = Math.max(0, input.monthlyBudget);
  const receipts = input.receipts ?? [];
  const basket = input.basket ?? [];
  const receiptSpend = receipts.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const basketEstimate = basket.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const spendToDate = receiptSpend + basketEstimate;
  const remainingBudget = monthlyBudget - spendToDate;
  const progressPercent = monthlyBudget > 0 ? Math.min(999, Math.round((spendToDate / monthlyBudget) * 100)) : 0;

  return {
    monthly_budget: money(monthlyBudget),
    spend_to_date: money(spendToDate),
    basket_estimate: money(basketEstimate),
    remaining_budget: money(remainingBudget),
    progress_percent: progressPercent,
    recommended_swaps: (input.swaps ?? [])
      .filter((swap) => swap.savings > 0)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 3)
  };
}
