export type UxTaskStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  frictionLog: string;
};

export type UxTaskScript = {
  id: string;
  title: string;
  goal: string;
  personas: string[];
  startUrl: string;
  successCriteria: string[];
  steps: UxTaskStep[];
};

export const findCheapestMilkTask: UxTaskScript = {
  id: 'find-cheapest-milk',
  title: 'Find the cheapest milk',
  goal: 'User identifies the lowest verified current milk price and can name the store/chain that offers it.',
  personas: ['budget-planner', 'mobile-shopper', 'accessibility-keyboard', 'new-user'],
  startUrl: '/',
  successCriteria: [
    'A milk product or milk category result is found without external search.',
    'The user can compare at least two current milk prices.',
    'The cheapest price and store/chain are visible with source confidence or freshness context.',
    'The simulator logs any unclear labels, dead ends, or missing recovery paths as friction.'
  ],
  steps: [
    {
      id: 'start-search',
      instruction: 'From the home page, look for a way to search or browse products and enter “milk”.',
      expectedAffordance: 'Search input, products link, category link, or prominent compare/deals CTA that leads to milk results.',
      acceptableVariations: ['Use /products search', 'Open categories then dairy/milk', 'Use a global navigation search if present'],
      frictionLog: 'Log if the first screen has no clear product-search or browse affordance.'
    },
    {
      id: 'narrow-to-milk',
      instruction: 'Narrow results to milk or dairy milk only.',
      expectedAffordance: 'Visible result labels, category chips, filters, or product cards that distinguish milk from non-milk items.',
      acceptableVariations: ['Select dairy category', 'Use search result text matching “mjölk” or “milk”', 'Open a likely milk product detail page'],
      frictionLog: 'Log ambiguity between milk, oat drink, and unrelated dairy products.'
    },
    {
      id: 'compare-prices',
      instruction: 'Compare current prices across stores/chains for the selected milk item.',
      expectedAffordance: 'Price rows, chain comparison table, cheapest-store badge, or product detail price evidence.',
      acceptableVariations: ['Use product detail price cards', 'Use compare page/table', 'Use chain-index evidence if it shows item-level milk prices'],
      frictionLog: 'Log if prices are hidden behind methodology, stale, or not comparable by unit.'
    },
    {
      id: 'verify-cheapest',
      instruction: 'Identify the cheapest available milk price and the store/chain offering it.',
      expectedAffordance: 'A clearly labeled lowest price, store/chain name, and SEK/unit text.',
      acceptableVariations: ['Cheapest badge', 'Sorted ascending price list', 'Manual comparison from visible rows'],
      frictionLog: 'Log if the cheapest claim lacks source, date, store, or unit context.'
    },
    {
      id: 'recover-if-not-found',
      instruction: 'If no milk result appears, recover using navigation or help text instead of abandoning the task.',
      expectedAffordance: 'No-results guidance, clear filters reset, category fallback, or link back to product browse.',
      acceptableVariations: ['Clear search', 'Try Swedish “mjölk”', 'Open dairy category'],
      frictionLog: 'Log missing no-results recovery copy or dead-end routes.'
    }
  ]
};

export default findCheapestMilkTask;
