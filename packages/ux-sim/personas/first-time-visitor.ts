export type UxSimPersona = {
  id: string;
  label: string;
  accountState: 'anonymous' | 'signed_in';
  entryPage: string;
  goals: string[];
  acceptedPaths: string[];
  dealbreakers: string[];
  typicalSession: Array<{
    step: string;
    intent: string;
    successSignal: string;
  }>;
};

export const firstTimeVisitorPersona: UxSimPersona = {
  id: 'first-time-visitor',
  label: 'First-time visitor',
  accountState: 'anonymous',
  entryPage: '/',
  goals: [
    'Understand GroceryView without creating an account.',
    'Compare a familiar product or basket quickly.',
    'See why prices and deal claims are trustworthy.',
    'Find a low-friction onboarding path only after value is clear.'
  ],
  acceptedPaths: [
    '/',
    '/products',
    '/compare',
    '/stores',
    '/data-sources',
    '/login'
  ],
  dealbreakers: [
    'Account wall before browsing public prices or examples.',
    'Unclear source, freshness, or confidence labels.',
    'Onboarding copy that assumes prior grocery list setup.',
    'Dead ends after viewing a sample comparison.',
    'Any write action that silently creates anonymous private data.'
  ],
  typicalSession: [
    {
      step: 'land',
      intent: 'Scan the homepage for the product promise and public proof.',
      successSignal: 'Can reach examples, products, and source caveats without signing in.'
    },
    {
      step: 'browse-products',
      intent: 'Open a recognizable product and inspect current price evidence.',
      successSignal: 'Product page shows source, freshness, and missing-data labels.'
    },
    {
      step: 'compare',
      intent: 'Try a sample comparison to decide whether the service is useful.',
      successSignal: 'Comparison explains chain gaps and links to supporting data sources.'
    },
    {
      step: 'onboard',
      intent: 'Choose whether to sign in after seeing concrete savings or alerts.',
      successSignal: 'Login invitation is optional, contextual, and explains the benefit.'
    }
  ]
};

export default firstTimeVisitorPersona;
