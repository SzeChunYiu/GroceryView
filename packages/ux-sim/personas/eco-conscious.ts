export const ecoConsciousPersona = {
  id: 'eco-conscious',
  name: 'Eco-conscious shopper',
  entryPage: '/products?dietary=vegan&label=krav',
  goals: [
    'Filter product discovery by low carbon score before price sorting.',
    'Prefer KRAV, EU-ekologisk, and low-impact store-brand alternatives.',
    'Build a basket that keeps price increases visible without trading away sustainability.'
  ],
  filters: {
    carbonScore: { max: 40, required: true },
    labels: ['KRAV', 'EU-ekologisk'],
    requireVerifiedEvidence: true
  },
  acceptedPaths: [
    '/products -> apply KRAV label -> sort by carbon score -> compare unit price',
    '/compare -> pick lower-carbon matched chain row -> add to basket',
    '/stores -> choose nearby store with the same low-carbon option in stock'
  ],
  dealbreakers: [
    'No carbon score or sustainability evidence shown on a recommendation.',
    'KRAV filter returns products without verified label evidence.',
    'A cheaper substitution increases carbon score without a warning.'
  ],
  simulatorAssertions: [
    'Every accepted recommendation exposes carbonScore and labels.',
    'KRAV-filtered sessions never silently fall back to unlabeled products.',
    'Deal messaging explains when price savings conflict with sustainability goals.'
  ]
} as const;

export default ecoConsciousPersona;
