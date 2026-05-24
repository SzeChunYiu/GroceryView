export const studentPersona = {
  id: 'student-lund-low-budget',
  label: 'Student in Lund',
  location: 'Lund, SE',
  age: 20,
  budgetSensitivity: 'very_high',
  shoppingPattern: 'late_evening',
  entryPage: '/se/deals',
  goals: [
    'Find the largest absolute kr saved before leaving for a late shop.',
    'Compare cheap staples across nearby chains and choose the lowest basket total.',
    'Prioritize student-friendly offers that do not require bulk spending beyond the weekly budget.'
  ],
  acceptedPaths: [
    '/se/deals -> sort by kr saved -> product detail -> store map',
    '/se/compare -> add staple basket -> choose cheapest chain',
    '/se/rescue -> filter pickup tonight -> open store pickup details'
  ],
  dealbreakers: [
    'Savings shown only as a percent without absolute kronor saved.',
    'Promos require a member account or minimum spend that is not visible up front.',
    'Store pickup window closes before late-evening shopping is possible.',
    'Basket comparison hides transport distance or availability caveats.'
  ],
  simulatorHints: {
    primaryMetric: 'absolute_kr_saved',
    secondaryMetric: 'late_pickup_available',
    maxComfortableBasketSek: 350,
    preferredSessionLengthMinutes: 8,
    requiresTransparentMembershipTerms: true
  }
} as const;

export default studentPersona;
