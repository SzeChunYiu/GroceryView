import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMobileBudgetReviewPlan, selectMobileBudgetMilestones } from '../budget.js';

const budget = {
  weeklyBudget: 800,
  monthlyBudget: 3200,
  estimatedBasketTotal: 540,
  weeklyRemainingAfterEstimate: 260,
  weeklyStatus: 'under' as const
};

describe('mobile budget review plan', () => {
  it('summarizes the budget route when planned and pending spend are under budget', () => {
    const plan = buildMobileBudgetReviewPlan({
      userId: ' Shopper-1 ',
      now: '2026-05-20T10:00:00.000Z',
      budget,
      pendingReceiptImpact: 42.25,
      pendingBasketDelta: 17.75,
      networkOnline: true
    });

    assert.equal(plan.route, '/budget');
    assert.equal(plan.status, 'ready');
    assert.equal(plan.userId, 'Shopper-1');
    assert.deepEqual(plan.summary, {
      weeklyBudget: 800,
      monthlyBudget: 3200,
      plannedSpend: 540,
      projectedSpend: 600,
      remainingAfterPending: 200,
      utilizationPercent: 75,
      pendingImpact: 60
    });
    assert.deepEqual(plan.actions, ['review_receipts']);
    assert.equal(plan.budgetMutation, null);
    assert.deepEqual(selectMobileBudgetMilestones(plan), [
      { key: 'planned', label: 'Planned basket', value: 540, tone: 'neutral' },
      { key: 'pending', label: 'Pending changes', value: 60, tone: 'warning' },
      { key: 'remaining', label: 'After pending', value: 200, tone: 'positive' }
    ]);
  });

  it('marks the route near limit or over budget from projected pending spend', () => {
    const nearLimit = buildMobileBudgetReviewPlan({
      userId: 'shopper-1',
      now: '2026-05-20T10:00:00.000Z',
      budget,
      pendingReceiptImpact: 190,
      networkOnline: true
    });
    assert.equal(nearLimit.status, 'near_limit');
    assert.equal(nearLimit.summary.utilizationPercent, 91.25);

    const overBudget = buildMobileBudgetReviewPlan({
      userId: 'shopper-1',
      now: '2026-05-20T10:00:00.000Z',
      budget,
      pendingReceiptImpact: 300,
      networkOnline: true
    });
    assert.equal(overBudget.status, 'over_budget');
    assert.deepEqual(overBudget.actions, ['review_receipts', 'review_basket']);
    assert.equal(selectMobileBudgetMilestones(overBudget)[2].tone, 'warning');
  });

  it('plans budget update mutations for online and offline saves', () => {
    const online = buildMobileBudgetReviewPlan({
      userId: 'shopper-1',
      now: '2026-05-20T10:00:00.000Z',
      budget,
      proposedWeeklyBudget: 900,
      networkOnline: true
    });

    assert.deepEqual(online.actions, ['save_budget']);
    assert.deepEqual(online.blockers, []);
    assert.equal(online.budgetMutation?.type, 'budget_set_weekly');
    assert.deepEqual(online.budgetMutation?.payload, { weeklyBudget: 900 });
    assert.deepEqual(online.budgetMutation?.invalidates, ['today', 'budget']);

    const offline = buildMobileBudgetReviewPlan({
      userId: 'shopper-1',
      now: '2026-05-20T10:00:00.000Z',
      budget,
      proposedWeeklyBudget: 950,
      networkOnline: false
    });

    assert.deepEqual(offline.blockers, ['network_required_for_immediate_budget_sync']);
    assert.deepEqual(offline.actions, ['queue_budget_update', 'sync_when_online']);
    assert.equal(offline.budgetMutation?.sensitiveLocalOnly, false);
  });

  it('fails closed for missing budgets and unsafe inputs', () => {
    const missingBudget = buildMobileBudgetReviewPlan({
      userId: 'shopper-1',
      now: '2026-05-20T10:00:00.000Z',
      budget: { ...budget, weeklyBudget: 0 },
      networkOnline: true
    });
    assert.equal(missingBudget.status, 'needs_budget');
    assert.deepEqual(missingBudget.blockers, ['weekly_budget_required']);
    assert.deepEqual(missingBudget.actions, ['set_weekly_budget']);

    assert.throws(
      () => buildMobileBudgetReviewPlan({ userId: ' ', now: '2026-05-20T10:00:00.000Z', budget, networkOnline: true }),
      /userId is required/
    );
    assert.throws(
      () => buildMobileBudgetReviewPlan({ userId: 'shopper-1', now: 'bad-date', budget, networkOnline: true }),
      /now must be an ISO date/
    );
    assert.throws(
      () => buildMobileBudgetReviewPlan({ userId: 'shopper-1', now: '2026-05-20T10:00:00.000Z', budget: { ...budget, estimatedBasketTotal: -1 }, networkOnline: true }),
      /estimatedBasketTotal must be zero or positive/
    );
  });
});
