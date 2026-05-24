export type TaskScriptStep = {
  readonly id: string;
  readonly instruction: string;
  readonly expectedAffordance: string;
  readonly acceptableVariations: readonly string[];
  readonly frictionToLog: readonly string[];
};

export type UxTaskScript = {
  readonly id: string;
  readonly title: string;
  readonly personaScope: 'all-personas';
  readonly successCriteria: readonly string[];
  readonly steps: readonly TaskScriptStep[];
};

export const findOrganicEggsNearbyTask: UxTaskScript = {
  id: 'find-organic-eggs-nearby',
  title: 'Find organic eggs nearby',
  personaScope: 'all-personas',
  successCriteria: [
    'The user identifies at least one nearby store with organic eggs.',
    'The user can compare price, pack size, and freshness of the price evidence.',
    'The user can decide whether to visit, save, or switch to a nearby alternative without leaving the flow.',
  ],
  steps: [
    {
      id: 'start-local-search',
      instruction: 'Open GroceryView and start from the location-aware discovery or search entry point.',
      expectedAffordance: 'A visible search box, category shortcut, or nearby deals module that accepts an egg query.',
      acceptableVariations: [
        'The app asks for Stockholm-area location confirmation before showing results.',
        'The user starts from a map, store page, or deals page if search remains available.',
      ],
      frictionToLog: ['hidden-search', 'location-required-without-explanation', 'no-nearby-context'],
    },
    {
      id: 'query-organic-eggs',
      instruction: 'Search for organic eggs using natural language such as "organic eggs" or the Swedish equivalent "ekologiska ägg".',
      expectedAffordance: 'Autocomplete or results recognize both English and Swedish wording for organic eggs.',
      acceptableVariations: [
        'Results include a corrected category match for eggs with an organic filter applied.',
        'The UI offers a product category suggestion before showing product rows.',
      ],
      frictionToLog: ['no-swedish-synonym', 'irrelevant-results', 'requires-exact-product-name'],
    },
    {
      id: 'apply-organic-filter',
      instruction: 'Confirm that results are limited to organic eggs or apply the organic/certification filter manually.',
      expectedAffordance: 'An organic, KRAV, EU organic, or certification filter is visible and reflected in the result chips.',
      acceptableVariations: [
        'Organic status is shown as a product badge instead of a filter chip.',
        'The app groups organic matches above conventional eggs with a clear label.',
      ],
      frictionToLog: ['missing-organic-filter', 'unclear-certification', 'filter-not-persistent'],
    },
    {
      id: 'compare-nearby-options',
      instruction: 'Compare at least two nearby store options by distance, price, pack size, and unit price.',
      expectedAffordance: 'Product rows show store name, distance or area, current price, pack size, unit price, and last-observed freshness.',
      acceptableVariations: [
        'A map/list split view shows distance while product cards show price details.',
        'Only one nearby option is available if the UI clearly explains the limited result set.',
      ],
      frictionToLog: ['missing-unit-price', 'stale-price-hidden', 'distance-not-shown', 'pack-size-ambiguous'],
    },
    {
      id: 'inspect-best-match',
      instruction: 'Open the best matching organic egg result and verify availability confidence before deciding.',
      expectedAffordance: 'A details view or expandable row exposes price evidence, availability confidence, and store-specific context.',
      acceptableVariations: [
        'Availability is unknown if the UI labels it clearly and offers a fallback store.',
        'The user can inspect evidence inline without navigating to a separate page.',
      ],
      frictionToLog: ['availability-unclear', 'evidence-buried', 'back-navigation-loss'],
    },
    {
      id: 'complete-decision',
      instruction: 'Save the item, add it to a shopping list, or choose the store route for the selected organic eggs.',
      expectedAffordance: 'A primary action supports saving, list add, or store visit planning from the selected result.',
      acceptableVariations: [
        'The task completes with a copied store/product note if list features are unavailable.',
        'The user chooses a conventional-egg fallback only after an explicit no-organic-nearby message.',
      ],
      frictionToLog: ['no-completion-action', 'forced-account-creation', 'selected-result-lost'],
    },
  ],
};

export default findOrganicEggsNearbyTask;
