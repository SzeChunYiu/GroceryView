export const studentPersona = {
  id: 'student-lund-low-budget',
  name: 'Student in Lund',
  age: 20,
  city: 'Lund',
  budgetProfile: 'low_budget',
  shoppingPattern: 'late_evening',
  primaryOptimization: 'absolute_kr_saved',
  typicalSession: {
    entryPage: '/catalogue-savings?city=lund',
    goals: [
      'Find the largest absolute SEK savings for tonight or tomorrow',
      'Build a small basket that stays under a fixed weekly budget',
      'Prefer stores reachable by bike or late public transport'
    ],
    acceptedPaths: [
      '/catalogue-savings -> filter by Lund -> sort by kr saved',
      '/compare -> add staple items -> choose cheapest basket',
      '/stores -> check late opening hours -> open product deals'
    ],
    dealbreakers: [
      'Savings shown only as percentages without SEK amount',
      'No late opening-hour signal',
      'Deals require a car trip or a large bulk purchase',
      'Hidden member requirements at checkout'
    ]
  },
  simulatorAssertions: [
    'Student sessions start from Lund-scoped savings or a route that preserves the Lund city filter.',
    'Deal rankings expose absolute SEK saved before percentage discounts.',
    'Late opening hours, bikeability, or public-transport viability stay visible before a deal is accepted.'
  ]
} as const;

export type StudentPersona = typeof studentPersona;
