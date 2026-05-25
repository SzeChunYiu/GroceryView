export const restaurantOwnerPersona = {
  id: 'restaurant-owner-wholesale',
  name: 'Restaurant owner',
  businessType: 'small_restaurant',
  procurementPattern: 'weekly_wholesale_restock',
  primaryOptimization: 'cost_per_portion',
  typicalSession: {
    entryPage: '/wholesale?chain=snabbgross',
    goals: [
      'Compare wholesale and retail unit prices for high-volume ingredients',
      'Estimate cost per portion before committing to bulk purchases',
      'Check whether Snabbgross or nearby retail chains have the best verified price for staples'
    ],
    acceptedPaths: [
      '/wholesale -> filter Snabbgross -> compare per-kg or per-litre prices',
      '/recipe-cost -> enter menu item ingredients -> review cost per portion',
      '/compare -> add bulk and retail alternatives -> choose the lowest viable ingredient cost'
    ],
    dealbreakers: [
      'Bulk listings hide pack size, unit price, or VAT assumptions',
      'Cost-per-portion math cannot be traced back to ingredient quantities',
      'Wholesale-only availability is mixed with consumer retail rows without a clear label',
      'Recommendations ignore storage limits, minimum order sizes, or freshness risk'
    ]
  },
  simulatorAssertions: [
    'Wholesale rows expose chain, package size, unit price, and evidence freshness.',
    'Cost-per-portion outputs show ingredient quantity assumptions and source prices.',
    'Snabbgross or other B2B-only recommendations are visibly labelled before selection.'
  ]
} as const;

export type RestaurantOwnerPersona = typeof restaurantOwnerPersona;
