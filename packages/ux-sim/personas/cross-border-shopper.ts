export type UxSimulatorPersonaSession = {
  id: string;
  name: string;
  summary: string;
  entryPage: string;
  context: string[];
  goals: string[];
  acceptedPaths: string[];
  dealbreakers: string[];
  successSignals: string[];
};

export const crossBorderShopperPersona: UxSimulatorPersonaSession = {
  id: 'cross-border-shopper',
  name: 'Cross-border shopper',
  summary: 'Lives near the Norway/Sweden border and checks whether currency arbitrage, fuel, tolls, and detour time make a cross-border grocery trip worthwhile.',
  entryPage: '/se/weekly-basket?persona=cross-border-shopper',
  context: [
    'Home base is within a short drive of the NO/SE border, so both Swedish SEK prices and Norwegian NOK alternatives are realistic options.',
    'Plans weekly staples before leaving home and needs confidence that exchange-rate gains are not erased by fuel, tolls, or out-of-stock items.',
    'Usually compares one full basket rather than a single product because border trips only make sense when several staples are cheaper together.'
  ],
  goals: [
    'Convert the same basket into SEK and NOK using the current exchange-rate assumption shown in the UI.',
    'Find the cheapest reachable store or chain after adding route detour cost, fuel cost, and any known toll/fee estimate.',
    'Identify the products driving the arbitrage so the shopper can remove weak items before committing to the trip.',
    'Save or share the border-trip basket with a timestamped price and currency caveat.'
  ],
  acceptedPaths: [
    'Starts on the weekly basket optimizer, switches country/currency, then opens the route or store map to check travel-adjusted savings.',
    'Uses unit-price comparison for meat, dairy, pantry, and household staples, then filters out products with low source confidence.',
    'Accepts a recommendation when the UI shows basket savings, exchange-rate timestamp, route cost, store distance, and missing-price coverage on one screen.',
    'Falls back to watchlist alerts if the cross-border saving is below the trip threshold today.'
  ],
  dealbreakers: [
    'Prices are mixed across currencies without a visible exchange-rate timestamp or conversion direction.',
    'The recommended trip ignores fuel, toll, ferry, parking, or detour cost when claiming a saving.',
    'A basket winner depends on missing or stale prices without clear confidence labels.',
    'The flow hides customs/quantity caveats for alcohol, tobacco, or other regulated items.',
    'Store pages do not expose opening hours or distance before the shopper starts driving.'
  ],
  successSignals: [
    'Shows net savings after route cost in both SEK and NOK.',
    'Explains which items create most of the currency arbitrage.',
    'Keeps low-confidence rows out of the final recommendation unless the user explicitly includes them.',
    'Offers a no-trip outcome when the calculated saving is too small.'
  ]
};

export default crossBorderShopperPersona;
