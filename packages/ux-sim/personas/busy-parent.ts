export type PersonaSessionPath = {
  readonly id: string;
  readonly description: string;
  readonly requiredSignals: readonly string[];
};

export type PersonaDealbreaker = {
  readonly id: string;
  readonly description: string;
  readonly severity: 'warning' | 'hard-stop';
};

export type UxSimulatorPersona = {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly household: string;
  readonly constraints: readonly string[];
  readonly typicalSession: {
    readonly entryPage: string;
    readonly timeBudgetMinutes: number;
    readonly goals: readonly string[];
    readonly acceptedPaths: readonly PersonaSessionPath[];
    readonly dealbreakers: readonly PersonaDealbreaker[];
  };
};

export const busyParentPersona: UxSimulatorPersona = {
  id: 'busy-parent-stockholm',
  name: 'Busy parent',
  location: 'Stockholm, Sweden',
  household: 'Two adults and two school-age kids',
  constraints: [
    'Plans weekday dinners around school pickup, activities, and a short evening cooking window.',
    'Compares nearby grocery options before committing to one shopping stop.',
    'Has a 15-minute maximum session budget and abandons flows that require account setup before value is visible.',
  ],
  typicalSession: {
    entryPage: '/stockholm/deals',
    timeBudgetMinutes: 15,
    goals: [
      'Find affordable weekday dinner ingredients that can feed two adults and two kids.',
      'Confirm whether a nearby store has the needed staples before leaving home.',
      'Prefer familiar products, kid-safe substitutions, and clear total-basket savings over single-item bargains.',
    ],
    acceptedPaths: [
      {
        id: 'deal-to-list',
        description: 'Starts from local deals, filters to family staples, and adds matching items to a reusable shopping list.',
        requiredSignals: ['nearby-store', 'current-price', 'basket-total', 'list-add-confirmation'],
      },
      {
        id: 'recipe-to-basket',
        description: 'Chooses a simple weekday meal idea and lets GroceryView translate it into a store-specific basket.',
        requiredSignals: ['serves-four', 'prep-time-under-30', 'substitution-options', 'store-availability'],
      },
      {
        id: 'store-check',
        description: 'Opens a preferred Stockholm store page to verify price, stock confidence, and travel practicality.',
        requiredSignals: ['store-distance', 'fresh-price-evidence', 'stock-confidence', 'opening-hours'],
      },
    ],
    dealbreakers: [
      {
        id: 'slow-first-answer',
        description: 'No credible meal or basket option appears within the first two minutes.',
        severity: 'hard-stop',
      },
      {
        id: 'unclear-family-fit',
        description: 'Deals do not indicate serving size, child-friendly substitutions, or whether staples are enough for a family dinner.',
        severity: 'warning',
      },
      {
        id: 'hidden-price-confidence',
        description: 'The flow hides when prices were observed or whether availability is uncertain.',
        severity: 'hard-stop',
      },
      {
        id: 'forced-auth-before-list',
        description: 'Requires sign-in before the parent can compare stores or draft a shopping list.',
        severity: 'hard-stop',
      },
    ],
  },
};

export default busyParentPersona;
