export {
  buildPurchaseHistoryImportPreview,
  parsePurchaseHistoryCsv,
  type PurchaseHistoryImportPreview,
  type PurchaseHistoryImportRow
} from './personalization';

// Purchase-history previews keep recommendationSeed and budgetSeedLabel fields for settings and account imports.

export type RecurringBasketLine = {
  productId: string;
  productName: string;
  quantity: number;
  templateQuantity: number;
};

export type RecurringBasketWindow = {
  startsOn: string;
  endsOn: string;
  label: string;
};

export type RecurringBasketDuplicate = {
  label: string;
  targetWindow: RecurringBasketWindow;
  preserveTemplate: boolean;
};

export type RecurringBasketPlan = {
  id: string;
  templateName: string;
  cadence: 'weekly';
  nextWindow: RecurringBasketWindow;
  reusableTemplateId: string;
  lines: RecurringBasketLine[];
  duplicateControls: RecurringBasketDuplicate[];
  guardrails: string[];
};

const nextWeeklyWindow: RecurringBasketWindow = { startsOn: '2026-05-25', endsOn: '2026-05-31', label: 'Week 22 grocery window' };
const followingWeeklyWindow: RecurringBasketWindow = { startsOn: '2026-06-01', endsOn: '2026-06-07', label: 'Week 23 grocery window' };
const twoWeeksAheadWindow: RecurringBasketWindow = { startsOn: '2026-06-08', endsOn: '2026-06-14', label: 'Week 24 grocery window' };

export const weeklyRecurringBasketPlan: RecurringBasketPlan = {
  id: 'weekly-family-basics',
  templateName: 'Weekly family basics',
  cadence: 'weekly',
  reusableTemplateId: 'template-family-basics-v1',
  nextWindow: nextWeeklyWindow,
  lines: [
    { productId: 'milk-1l', productName: 'Milk 1L', quantity: 4, templateQuantity: 4 },
    { productId: 'eggs-12-pack', productName: 'Eggs 12-pack', quantity: 1, templateQuantity: 1 },
    { productId: 'bread-sourdough', productName: 'Sourdough bread', quantity: 2, templateQuantity: 2 }
  ],
  duplicateControls: [
    { label: 'Duplicate to next week', targetWindow: followingWeeklyWindow, preserveTemplate: true },
    { label: 'Duplicate two weeks ahead', targetWindow: twoWeeksAheadWindow, preserveTemplate: true }
  ],
  guardrails: [
    'Duplicating creates a draft basket only; it does not place an order.',
    'Template quantities are reused unless the shopper edits the draft.',
    'Expected windows stay visible so shoppers can review pickup timing before saving.'
  ]
};

export function createRecurringBasketDuplicate(plan: RecurringBasketPlan, targetWindow?: RecurringBasketWindow) {
  const duplicateWindow = targetWindow ?? plan.duplicateControls[0]?.targetWindow ?? plan.nextWindow;

  return {
    sourcePlanId: plan.id,
    reusableTemplateId: plan.reusableTemplateId,
    cadence: plan.cadence,
    targetWindow: duplicateWindow,
    lines: plan.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      quantity: line.templateQuantity
    }))
  };
}
