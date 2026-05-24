export type UxTaskStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  frictionSignals: string[];
};

export type UxTaskScript = {
  id: string;
  title: string;
  personaScope: 'all-personas';
  successCriteria: string[];
  steps: UxTaskStep[];
};

export const buildWeeklyBasketTask: UxTaskScript = {
  id: 'build-weekly-basket',
  title: 'Build a weekly grocery basket',
  personaScope: 'all-personas',
  successCriteria: [
    'Persona can find a weekly basket or list-building entry point without search engine help.',
    'Persona can add at least five common grocery items or accept a starter basket.',
    'Persona can compare price/coverage signals before treating the basket as ready.',
    'Persona can save, share, or continue shopping from the completed basket.'
  ],
  steps: [
    {
      id: 'open-basket-entry',
      instruction: 'Start from the home page and look for a way to create or view a weekly basket.',
      expectedAffordance: 'Visible navigation item, card, or CTA labelled Weekly basket, Basket, Shopping list, or Meal planner.',
      acceptableVariations: ['Bottom navigation basket tab on mobile', 'Homepage task card', 'Search result that routes to a basket/list page'],
      frictionSignals: ['Persona uses browser back repeatedly', 'Persona searches for unrelated terms', 'CTA wording sounds like checkout instead of planning']
    },
    {
      id: 'seed-common-items',
      instruction: 'Add or accept common weekly items such as milk, oats, coffee, fruit, and frozen vegetables.',
      expectedAffordance: 'Starter basket, add-item input, import dialog, or category picker that confirms each item was added.',
      acceptableVariations: ['Bulk paste one item per line', 'Suggested staples chips', 'Meal-plan generated ingredient list'],
      frictionSignals: ['No confirmation after add', 'Duplicate items appear without warning', 'Quantity/unit cannot be understood']
    },
    {
      id: 'review-price-context',
      instruction: 'Review the basket price context before deciding it is ready.',
      expectedAffordance: 'Total, cost-per-portion, deal score, source coverage, or cheapest-store comparison visible near the basket.',
      acceptableVariations: ['Per-item price rows', 'Store coverage card', 'Savings or budget drift summary'],
      frictionSignals: ['Price context is below the fold with no cue', 'Coverage caveat missing', 'Persona cannot tell whether prices are estimates']
    },
    {
      id: 'adjust-one-item',
      instruction: 'Change one item based on price or availability feedback.',
      expectedAffordance: 'Remove, swap, quantity edit, or alternative product affordance available on each row.',
      acceptableVariations: ['Smart swap suggestion', 'Checkbox row action', 'Quantity steppers', 'Replace item search'],
      frictionSignals: ['Only destructive clear-all action exists', 'Swap loses the original item context', 'Quantity edits do not update totals']
    },
    {
      id: 'complete-and-preserve',
      instruction: 'Finish the basket and make sure it can be used later or shared with a household member.',
      expectedAffordance: 'Save, share, copy, export, or persistent localStorage state with clear completion feedback.',
      acceptableVariations: ['Read-only share link', 'Saved browser state', 'Printable/copyable list', 'Continue shopping CTA'],
      frictionSignals: ['No success message', 'Share link lacks expiry/status', 'Persona is unsure whether changes persisted']
    }
  ]
};

export default buildWeeklyBasketTask;
