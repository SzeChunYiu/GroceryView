export const powerUserPersona = {
  id: 'power-user-advanced-filters',
  name: 'Power user',
  expertise: 'advanced GroceryView shopper and comparison-tuner',
  entryPage: '/products?origin=SE&dietary=glutenfree&chain=willys&chain=hemkop&inStockOnly=true&minConfidence=0.75',
  goals: [
    'Combine every advanced filter before trusting product rankings.',
    'Use keyboard navigation to move from search, filters, results, comparison, and basket without pointer-only traps.',
    'Audit source confidence, unit price, origin, dietary labels, stock, and chain coverage before saving or sharing a result.'
  ],
  advancedFilters: {
    categories: ['pantry', 'dairy', 'produce'],
    chains: ['willys', 'hemkop', 'ica', 'coop'],
    dietary: ['glutenfree', 'laktosfree', 'vegan'],
    originCountries: ['SE', 'FI', 'DK'],
    priceRange: { minUnitSek: 5, maxUnitSek: 90 },
    requireInStock: true,
    minimumConfidence: 0.75,
    sortModes: ['unit-price', 'confidence', 'savings', 'freshness']
  },
  typicalSession: {
    entryPage: '/products?origin=SE&dietary=glutenfree&chain=willys&chain=hemkop&inStockOnly=true&minConfidence=0.75',
    steps: [
      'Opens products with saved URL filters already applied.',
      'Tabs through search, advanced filter drawer, origin chips, chain filters, and sort controls.',
      'Narrows by category, dietary evidence, origin, chain, unit-price range, stock, and confidence.',
      'Opens the top three results in comparison mode and inspects source freshness.',
      'Adds the cheapest verified candidate to basket, then saves or shares the filtered URL.'
    ]
  },
  acceptedPaths: [
    '/products -> keyboard open advanced filters -> apply all filters -> sort by unit price -> open product detail',
    '/search -> use autocomplete with arrow keys -> preserve filters in URL -> compare matched products',
    '/compare -> inspect confidence and unit math -> add verified product to basket without modal interruption',
    '/basket -> review per-chain totals -> share filtered basket URL with all selected constraints preserved'
  ],
  keyboardExpectations: [
    'Every filter chip, drawer trigger, result card, and comparison action is reachable by Tab and has a visible focus state.',
    'Arrow keys work in autocomplete/listbox surfaces without stealing focus from form fields.',
    'Escape closes drawers or popovers without clearing selected filters.',
    'Enter or Space activates focused chips and buttons exactly once.'
  ],
  dealbreakers: [
    'Pop-ups, interstitials, or newsletter prompts interrupt filtering, comparison, or keyboard navigation.',
    'Advanced filters reset when the URL changes, search is submitted, or a result is opened.',
    'Any filter control is pointer-only, lacks focus visibility, or traps focus inside a drawer.',
    'Recommendations hide source confidence, unit-price math, stock status, or selected filter evidence.',
    'A saved or shared URL drops chain, origin, diet, confidence, or price-range constraints.'
  ],
  simulatorAssertions: [
    'The final URL preserves every selected advanced filter.',
    'No blocking pop-up appears before the user completes comparison or basket save.',
    'Keyboard-only traversal can reach search, filter drawer, result list, comparison, and basket actions.',
    'Every accepted recommendation shows source confidence, freshness, and unit-price evidence.'
  ]
} as const;

export type PowerUserPersona = typeof powerUserPersona;
export default powerUserPersona;
