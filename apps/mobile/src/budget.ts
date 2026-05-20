import { planMobileOfflineMutation, type MobileOfflineMutation } from './offlineMutations.js';

export type MobileBudgetSummary = {
  weeklyBudget: number;
  monthlyBudget: number;
  estimatedBasketTotal: number;
  weeklyRemainingAfterEstimate: number;
  weeklyStatus: 'under' | 'over';
};

export type MobileBudgetReviewInput = {
  userId: string;
  now: string;
  budget: MobileBudgetSummary;
  pendingReceiptImpact?: number;
  pendingBasketDelta?: number;
  proposedWeeklyBudget?: number;
  networkOnline: boolean;
};

export type MobileBudgetReviewPlan = {
  route: '/budget';
  status: 'ready' | 'near_limit' | 'over_budget' | 'needs_budget';
  userId: string;
  summary: {
    weeklyBudget: number;
    monthlyBudget: number;
    plannedSpend: number;
    projectedSpend: number;
    remainingAfterPending: number;
    utilizationPercent: number;
    pendingImpact: number;
  };
  blockers: Array<'weekly_budget_required' | 'network_required_for_immediate_budget_sync'>;
  actions: Array<'set_weekly_budget' | 'review_basket' | 'review_receipts' | 'save_budget' | 'queue_budget_update' | 'sync_when_online'>;
  budgetMutation: MobileOfflineMutation | null;
};

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function requireIsoDate(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO date.`);
  return value;
}

function requireMoney(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be zero or positive.`);
  return Math.round(value * 100) / 100;
}

export function buildMobileBudgetReviewPlan(input: MobileBudgetReviewInput): MobileBudgetReviewPlan {
  const userId = requireNonEmpty(input.userId, 'userId');
  requireIsoDate(input.now, 'now');

  const weeklyBudget = requireMoney(input.budget.weeklyBudget, 'weeklyBudget');
  const monthlyBudget = requireMoney(input.budget.monthlyBudget, 'monthlyBudget');
  const plannedSpend = requireMoney(input.budget.estimatedBasketTotal, 'estimatedBasketTotal');
  const pendingImpact = Math.round(((input.pendingReceiptImpact ?? 0) + (input.pendingBasketDelta ?? 0)) * 100) / 100;
  if (!Number.isFinite(pendingImpact)) throw new Error('pendingImpact must be finite.');

  const projectedSpend = Math.round((plannedSpend + pendingImpact) * 100) / 100;
  const remainingAfterPending = Math.round((weeklyBudget - projectedSpend) * 100) / 100;
  const utilizationPercent = weeklyBudget === 0 ? 0 : Math.round((projectedSpend / weeklyBudget) * 10_000) / 100;
  const blockers: MobileBudgetReviewPlan['blockers'] = [];
  const actions: MobileBudgetReviewPlan['actions'] = [];

  if (weeklyBudget === 0) {
    blockers.push('weekly_budget_required');
    actions.push('set_weekly_budget');
  }

  if (pendingImpact > 0) actions.push('review_receipts');
  if (weeklyBudget > 0 && remainingAfterPending < 0) actions.push('review_basket');

  let budgetMutation: MobileOfflineMutation | null = null;
  if (input.proposedWeeklyBudget !== undefined) {
    const proposedWeeklyBudget = requireMoney(input.proposedWeeklyBudget, 'proposedWeeklyBudget');
    if (!input.networkOnline) {
      blockers.push('network_required_for_immediate_budget_sync');
      actions.push('queue_budget_update', 'sync_when_online');
    } else {
      actions.push('save_budget');
    }
    budgetMutation = planMobileOfflineMutation({
      id: `budget-set:${userId}:${input.now}`,
      userId,
      type: 'budget_set_weekly',
      payload: { weeklyBudget: proposedWeeklyBudget },
      createdAt: input.now
    });
  }

  return {
    route: '/budget',
    status: weeklyBudget === 0 ? 'needs_budget' : remainingAfterPending < 0 ? 'over_budget' : utilizationPercent >= 90 ? 'near_limit' : 'ready',
    userId,
    summary: {
      weeklyBudget,
      monthlyBudget,
      plannedSpend,
      projectedSpend,
      remainingAfterPending,
      utilizationPercent,
      pendingImpact
    },
    blockers,
    actions,
    budgetMutation
  };
}

export function selectMobileBudgetMilestones(plan: MobileBudgetReviewPlan): Array<{
  key: 'planned' | 'pending' | 'remaining';
  label: string;
  value: number;
  tone: 'positive' | 'warning' | 'neutral';
}> {
  return [
    { key: 'planned', label: 'Planned basket', value: plan.summary.plannedSpend, tone: plan.summary.utilizationPercent >= 90 ? 'warning' : 'neutral' },
    { key: 'pending', label: 'Pending changes', value: plan.summary.pendingImpact, tone: plan.summary.pendingImpact > 0 ? 'warning' : 'neutral' },
    { key: 'remaining', label: 'After pending', value: plan.summary.remainingAfterPending, tone: plan.summary.remainingAfterPending >= 0 ? 'positive' : 'warning' }
  ];
}
