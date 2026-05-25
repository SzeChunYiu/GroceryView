export const firstTimeVisitorPersona = {
  id: 'first-time-visitor',
  name: 'First-time visitor',
  accountState: 'anonymous',
  entryPage: '/',
  goals: [
    'Understand what GroceryView does before creating an account.',
    'Search for a familiar grocery item and confirm prices look source-backed.',
    'Try onboarding prompts only after seeing clear value from comparison, deals, or lists.'
  ],
  acceptedPaths: [
    '/ -> read value proposition -> search for a staple product',
    '/products -> open product detail -> compare chain price evidence',
    '/deals -> inspect a deal explanation -> continue as guest',
    '/list -> preview list benefits -> defer sign-up until save/share is needed'
  ],
  dealbreakers: [
    'Account wall appears before search, product detail, or deal evidence is visible.',
    'Onboarding asks for location, email, or preferences without explaining why.',
    'Prices or recommendations lack source, freshness, or confidence labels.',
    'Guest session loses selected filters when navigating between product and deal pages.'
  ],
  typicalSession: {
    entryPage: '/',
    steps: [
      'Lands on the home page from search or a shared deal link.',
      'Skims the first screen for country, currency, and retailer coverage.',
      'Runs one anonymous product search for a familiar staple.',
      'Opens a product or deal card to inspect price evidence and freshness.',
      'Tests an onboarding prompt only if it explains saved lists, alerts, or local store relevance.'
    ],
    successCriteria: [
      'Can complete first search without an account.',
      'Understands why GroceryView is trustworthy within two page transitions.',
      'Sees a clear reason to sign up without being forced.'
    ]
  }
} as const;

export type FirstTimeVisitorPersona = typeof firstTimeVisitorPersona;

export default firstTimeVisitorPersona;
