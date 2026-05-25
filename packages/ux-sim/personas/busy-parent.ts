export const busyParentPersona = {
  id: 'busy-parent-stockholm-weeknight',
  name: 'Busy parent',
  city: 'Stockholm',
  household: {
    children: 2,
    weekdayMealPlanning: true
  },
  sessionBudgetMinutes: 15,
  primaryOptimization: 'fast_weeknight_family_meals',
  typicalSession: {
    entryPage: '/meal-planner?city=stockholm&time=weekday',
    goals: [
      'Plan two kid-friendly weekday dinners before the next commute leg.',
      'Keep the family basket close to budget while avoiding extra store stops.',
      'Turn discounted staples into a short shopping list that can be finished in one trip.'
    ],
    acceptedPaths: [
      '/meal-planner -> choose 30-minute family dinners -> add ingredients to list',
      '/weekly-basket -> compare family staples -> keep the cheapest complete store option',
      '/list -> reorder by store layout -> remove non-essential items before checkout'
    ],
    dealbreakers: [
      'Meal ideas take more than 15 minutes to turn into a list.',
      'Recommendations require visiting multiple stores with kids after work.',
      'Savings hide missing prices, loyalty requirements, or unavailable staple items.',
      'Recipes do not expose child-friendly substitutions or prep-time constraints.'
    ]
  },
  simulatorAssertions: [
    'The first accepted path reaches a shopping list within the 15-minute session budget.',
    'Meal-planning copy keeps Stockholm availability and price freshness visible.',
    'Basket recommendations show whether the family can complete the shop at one store.'
  ]
} as const;

export type BusyParentPersona = typeof busyParentPersona;

export default busyParentPersona;
