export type IcelandLaunchSourceStatus = 'verified_reference' | 'needs_access_review' | 'blocked_until_connector';

export type IcelandLaunchSource = {
  id: string;
  label: string;
  url: string;
  status: IcelandLaunchSourceStatus;
  evidence: string;
  launchUse: string;
};

export type IcelandCompetitorSignal = {
  name: string;
  format: 'institutional comparator' | 'consumer app' | 'retailer surface';
  strength: string;
  gap: string;
  groceryViewWedge: string;
};

export type IcelandLaunchPhase = {
  phase: string;
  objective: string;
  exitCriteria: string[];
};

export type IcelandLaunchCandidate = {
  title: string;
  evidenceSourceIds: string[];
  evidence: string;
  requiredProofBeforeTicket: string;
};

export const icelandLaunchSources: IcelandLaunchSource[] = [
  {
    id: 'iceland-review-verdgattin',
    label: 'Iceland Review on Verdgattin',
    url: 'https://www.icelandreview.com/news/society/website-for-comparing-grocery-prices-launches-in-iceland/',
    status: 'verified_reference',
    evidence:
      'Iceland Review reported Verdgattin as a grocery price comparison website with roughly 80 food staples, daily price updates, and chain coverage for Bonus, Kronan, and Netto.',
    launchUse:
      'Defines the institutional 80-staple comparator GroceryView must treat as the parity baseline, not as an open data feed.'
  },
  {
    id: 'asi-price-monitoring',
    label: 'ASÍ Verðlagseftirlit',
    url: 'https://verdlagseftirlit.is/',
    status: 'needs_access_review',
    evidence:
      'The ASÍ price-monitoring site exposes product search, kilo-price views, analysis, and barcode scanning entry points.',
    launchUse:
      'Review source permissions and public data boundaries before any ingestion or user-facing claim depends on this surface.'
  },
  {
    id: 'nappid',
    label: 'Nappið',
    url: 'https://napp.is/',
    status: 'needs_access_review',
    evidence:
      'Nappið describes itself as the ASÍ price-monitoring app for viewing product prices across stores and submitting photos when prices changed or are missing.',
    launchUse:
      'Treat as a mobile-first competitor and a signal that barcode/photo contribution is familiar to Iceland shoppers.'
  },
  {
    id: 'bonus',
    label: 'Bónus',
    url: 'https://bonus.is/',
    status: 'blocked_until_connector',
    evidence: 'Referenced by the Verdgattin report as one of the three major Iceland grocery chains in the daily 80-staple comparator.',
    launchUse: 'Discount benchmark chain for Reykjavik parity checks.'
  },
  {
    id: 'kronan',
    label: 'Krónan',
    url: 'https://kronan.is/',
    status: 'blocked_until_connector',
    evidence: 'Referenced by the Verdgattin report as one of the three major Iceland grocery chains in the daily 80-staple comparator.',
    launchUse: 'Discount benchmark chain and likely ecommerce/access-review target.'
  },
  {
    id: 'netto',
    label: 'Nettó',
    url: 'https://netto.is/',
    status: 'blocked_until_connector',
    evidence: 'Referenced by the Verdgattin report as one of the three major Iceland grocery chains in the daily 80-staple comparator.',
    launchUse: 'Discount benchmark chain for parity against the public comparator.'
  },
  {
    id: 'hagkaup',
    label: 'Hagkaup',
    url: 'https://hagkaup.is/',
    status: 'blocked_until_connector',
    evidence: 'Existing GroceryView Iceland starter-basket planning marks Hagkaup as the premium benchmark chain.',
    launchUse: 'Premium benchmark candidate once source access and product matching are reviewed.'
  },
  {
    id: 'samkaup',
    label: 'Prís / Kjörbúðin / Samkaup',
    url: 'https://samkaup.is/',
    status: 'blocked_until_connector',
    evidence: 'Samkaup group banners are in launch scope but are not covered by the Verdgattin three-chain parity baseline.',
    launchUse: 'Expansion candidate after Reykjavik parity and source access review.'
  }
];

export const icelandCompetitorTeardown: IcelandCompetitorSignal[] = [
  {
    name: 'Verðgáttin / institutional 80-staple comparator',
    format: 'institutional comparator',
    strength: 'Clear public mental model: a small staple basket, major-chain comparison, daily refresh, and price-history expectation.',
    gap: 'Narrow shopping workflow. It answers what an official staple costs but does not become a broader planning terminal.',
    groceryViewWedge:
      'Build an Iceland terminal UX that starts with the same 80-staple parity discipline, then adds filters, freshness, source status, and routeable chain/category views.'
  },
  {
    name: 'ASÍ Verðlagseftirlit and Nappið',
    format: 'consumer app',
    strength: 'Product search, kilo-price comparison, barcode scanning, and photo submissions create a consumer contribution loop.',
    gap: 'The app pattern is useful for lookup and correction, but less useful for comparing launch readiness, chain coverage, and source confidence.',
    groceryViewWedge:
      'Expose claim boundaries, source readiness, and observation freshness in the web terminal before asking users to trust any Iceland price claim.'
  },
  {
    name: 'Retailer web and app surfaces',
    format: 'retailer surface',
    strength: 'Retailers can provide richer assortment, promotions, and delivery context than a fixed comparator.',
    gap: 'Each source needs separate permission, freshness, matching, and availability checks before aggregation.',
    groceryViewWedge:
      'Treat retailer data as connector-backed evidence, not as scraped assumptions; launch only categories and chains with verified observations.'
  }
];

export const icelandLaunchPhases: IcelandLaunchPhase[] = [
  {
    phase: '0. Evidence and access audit',
    objective: 'Lock the source map before publishing product, chain, or cheapest-store claims.',
    exitCriteria: [
      'Document permission/readiness for ASÍ, Nappið, Verdgattin references, and each retailer surface.',
      'Keep all Iceland prices hidden until live observations include source URL, timestamp, chain, and product match confidence.',
      'Preserve a no-ticket rule until a source or feature candidate has evidence strong enough for implementation.'
    ]
  },
  {
    phase: '1. 80-staple parity',
    objective: 'Match the public comparator mental model without claiming institutional data access.',
    exitCriteria: [
      'Map the Reykjavik starter basket to roughly 80 staple targets across dairy, bread, produce, meat/fish, pantry, and hygiene.',
      'Prioritize Bonus, Kronan, and Netto because the public Verdgattin reference anchors those three chains.',
      'Show source readiness and missing-chain states instead of fabricated ISK values.'
    ]
  },
  {
    phase: '2. Terminal UX wedge',
    objective: 'Win on workflow after parity: filters, freshness, claim boundaries, chain/category navigation, and source confidence.',
    exitCriteria: [
      'Every visible Iceland claim has source evidence and a freshness label.',
      'Retailer expansion to Hagkaup and Samkaup banners is gated by connector readiness.',
      'The launch page can explain why GroceryView is useful even when institutional comparators already exist.'
    ]
  }
];

export const icelandLaunchCandidates: IcelandLaunchCandidate[] = [
  {
    title: 'ASÍ and Nappið access review',
    evidenceSourceIds: ['asi-price-monitoring', 'nappid'],
    evidence: 'ASÍ exposes public price-monitoring entry points and Nappið describes store comparison plus user photo submissions.',
    requiredProofBeforeTicket:
      'Confirm permitted data access, attribution requirements, and whether any API/export exists; do not open an implementation ticket from this plan alone.'
  },
  {
    title: 'Bonus / Kronan / Netto Reykjavik parity connectors',
    evidenceSourceIds: ['iceland-review-verdgattin', 'bonus', 'kronan', 'netto'],
    evidence: 'The public comparator baseline is roughly 80 staples across Bonus, Kronan, and Netto with daily updates.',
    requiredProofBeforeTicket:
      'Capture connector feasibility and sample observations for all three chains before creating any source ticket.'
  },
  {
    title: 'Hagkaup and Samkaup expansion review',
    evidenceSourceIds: ['hagkaup', 'samkaup'],
    evidence: 'These chains are launch-scope candidates but are not proven by the three-chain Verdgattin parity reference.',
    requiredProofBeforeTicket:
      'Verify retailer surface coverage, product availability, and pricing terms before converting expansion into source work.'
  },
  {
    title: 'Iceland terminal UX experiment',
    evidenceSourceIds: ['iceland-review-verdgattin', 'asi-price-monitoring', 'nappid'],
    evidence: 'The market already has staple comparison and app lookup patterns, so the wedge must be workflow depth and claim transparency.',
    requiredProofBeforeTicket:
      'Prototype against verified sample observations only; do not create a feature ticket until parity-source data is available.'
  }
];

export const icelandLaunchGuardrails = [
  'No fabricated ISK prices, cheapest-chain labels, or national coverage claims.',
  'No source/feature tickets should be opened from this plan until the listed proof gates are met.',
  'Retailer names in launch scope are planning targets until connector readiness is proven.',
  'The terminal UX is the preferred wedge, but only after the institutional 80-staple comparator is matched as a trust baseline.'
] as const;

export function buildIcelandLaunchPlanSummary() {
  return {
    sourceCount: icelandLaunchSources.length,
    verifiedReferenceCount: icelandLaunchSources.filter((source) => source.status === 'verified_reference').length,
    accessReviewCount: icelandLaunchSources.filter((source) => source.status === 'needs_access_review').length,
    blockedConnectorCount: icelandLaunchSources.filter((source) => source.status === 'blocked_until_connector').length,
    candidateCount: icelandLaunchCandidates.length,
    wedge: 'Terminal UX over a standalone institutional 80-staple comparator'
  };
}
