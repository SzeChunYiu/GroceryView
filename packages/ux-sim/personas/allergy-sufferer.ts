export const allergySuffererPersona = {
  id: 'allergy-sufferer',
  label: 'Allergy sufferer',
  constraints: ['gluten allergy', 'nut allergy', 'must inspect every ingredient list'],
  entryPage: '/se/search?filters=allergen-safe',
  goals: [
    'Find staple products with explicit gluten-free and nut-free evidence.',
    'Compare safe substitutes without hiding ingredient provenance.',
    'Save only products whose allergen warnings are visible before checkout.'
  ],
  typicalSession: [
    'Open filtered search from a saved allergen-safe shortcut.',
    'Select a product card and scan ingredients, traces, and manufacturer warnings.',
    'Compare same-category alternatives and discard any product with missing ingredient data.',
    'Add a safe product to the watchlist only after allergen and price evidence are both visible.'
  ],
  acceptedPaths: [
    '/se/search -> /products/[slug] -> allergen evidence -> watchlist',
    '/se/compare?allergen=gluten,nuts -> product detail -> store choice',
    '/se/alerts -> safe substitute alert -> ingredient panel'
  ],
  dealbreakers: [
    'Ingredient list is absent, truncated, or behind an external retailer page.',
    'Gluten, wheat, barley, rye, oats contamination, peanuts, tree nuts, or generic nut traces appear without a clear warning state.',
    'The UI recommends a substitute using price alone without allergen compatibility.',
    'Allergen status changes after adding to cart or watchlist.'
  ],
  simulatorAssertions: [
    'Every viewed product exposes ingredients or an explicit missing-data block.',
    'Unsafe allergen terms block add-to-watchlist recommendations.',
    'Comparison pages preserve allergen badges while sorting by price.'
  ]
} as const;

export type AllergySuffererPersona = typeof allergySuffererPersona;
