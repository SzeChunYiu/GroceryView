export const crossBorderShopperPersona = {
  id: 'cross-border-shopper-no-se',
  name: 'Cross-border shopper near the Norway/Sweden border',
  homeRegion: 'NO/SE border corridor',
  budgetProfile: 'currency_arbitrage',
  primaryOptimization: 'total basket cost after FX, tolls, fuel, and detour time',
  typicalSession: {
    entryPage: '/se/products?currency=NOK&origin=no-border',
    goals: [
      'Compare Swedish shelf prices against Norwegian equivalents after SEK/NOK conversion',
      'Find basket-level savings that still beat fuel, toll, and detour costs',
      'Prioritize border-adjacent stores with verified opening hours and current price freshness'
    ],
    acceptedPaths: [
      '/se/products -> switch currency to NOK -> filter border stores -> compare unit price',
      '/compare -> build cross-border basket -> apply FX and trip costs -> save route',
      '/stores -> choose border-adjacent store -> confirm opening hours -> open matching product list'
    ],
    dealbreakers: [
      'Prices shown only in SEK with no exchange-rate timestamp or conversion caveat',
      'Basket savings ignore fuel, tolls, ferry, or detour cost',
      'Recommendations require stores far from the border without warning',
      'Freshness or availability is stale for perishable products before a long drive'
    ]
  },
  simulatorAssertions: [
    'Every accepted basket exposes SEK, NOK, exchange-rate timestamp, and trip-cost assumptions.',
    'Route or store recommendations keep detour distance visible before ranking savings.',
    'Cross-border savings copy never claims customs, tax, or availability certainty without explicit evidence.'
  ]
} as const;

export type CrossBorderShopperPersona = typeof crossBorderShopperPersona;
