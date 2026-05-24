export const allergySuffererPersona = {
  id: 'allergy-sufferer',
  label: 'Allergy sufferer',
  constraints: ['gluten allergy', 'nut allergy', 'scans every ingredient list'],
  entryPage: '/search?diet=gluten-free&exclude=nuts',
  goals: [
    'Find safe gluten-free staples without nut traces.',
    'Compare prices only after allergen status is visible.',
    'Save trusted products to a repeatable safe shopping list.'
  ],
  acceptedPaths: [
    'Search or scan a product and immediately see gluten/nut warnings.',
    'Open product detail to review ingredients, may-contain notes, and source confidence.',
    'Filter deals to safe products before adding them to basket or watchlist.'
  ],
  dealbreakers: [
    'Ingredient list hidden behind extra taps or missing source date.',
    'Nut/gluten warnings inferred without explicit caveat.',
    'Deal cards ranking unsafe products above allergen-safe alternatives.'
  ],
  typicalSession: [
    'Starts from allergen-filtered search.',
    'Checks three candidate products ingredient-by-ingredient.',
    'Rejects products with unknown may-contain status.',
    'Adds verified-safe item to shopping list and watches price drops.'
  ]
} as const;

export type AllergySuffererPersona = typeof allergySuffererPersona;
