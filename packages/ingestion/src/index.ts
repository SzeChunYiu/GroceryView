import { createHash } from 'node:crypto';

export type SourceType =
  | 'official_api'
  | 'retailer_online_page'
  | 'receipt_scan'
  | 'shelf_photo'
  | 'flyer_campaign'
  | 'manual_user_report'
  | 'estimated';

const SOURCE_CONFIDENCE: Record<SourceType, number> = {
  official_api: 0.95,
  retailer_online_page: 0.85,
  receipt_scan: 0.8,
  shelf_photo: 0.75,
  flyer_campaign: 0.7,
  manual_user_report: 0.5,
  estimated: 0.25
};

export function confidenceForSource(sourceType: SourceType): number {
  return SOURCE_CONFIDENCE[sourceType];
}

export type RobotsTxtStatus = 'allow' | 'disallow' | 'unknown' | 'not_applicable';
export type LegalReviewStatus = 'approved' | 'pending' | 'rejected';
export type RetailerChainId = 'ica' | 'willys' | 'coop' | 'hemkop' | 'lidl' | 'city_gross';
export type RetailerSourceSurface = 'store_locator' | 'online_product' | 'weekly_offer' | 'flyer' | 'member_offer';
export type RobotsPolicy = {
  robotsUrl: string;
  status: RobotsTxtStatus;
  crawlDelaySeconds?: number;
  visitTimeUtc?: string;
  disallowedPaths: string[];
  checkedAt: string;
};

export type RetailerSourceRegistryEntry = {
  chainId: RetailerChainId;
  displayName: string;
  ownerGroup?: string;
  surfaces: RetailerSourceSurface[];
  sourceUrls: string[];
  robotsPolicy: RobotsPolicy;
  legalReviewStatus: LegalReviewStatus;
  stubOnly: boolean;
};

export type RetailerPolicySurface =
  | 'store_locator'
  | 'offer'
  | 'product'
  | 'search'
  | 'basket'
  | 'account'
  | 'member'
  | 'app_api';

export type RetailerSourcePolicyLabel =
  | 'allowed'
  | 'fixture_review'
  | 'manual_review'
  | 'blocked'
  | 'stub_only';

export type RetailerRobotsPolicyMatrixEntry = {
  chainId: RetailerChainId;
  surface: RetailerPolicySurface;
  policy: RetailerSourcePolicyLabel;
  canFetch: boolean;
  robotsUrl: string;
  robotsTxtStatus: RobotsTxtStatus;
  checkedAt: string;
  crawlDelaySeconds?: number;
  disallowedPathMatches: string[];
  legalReviewStatus: LegalReviewStatus;
  requiredActions: string[];
};

export type RetailerSurfacePolicyInput = {
  chainId: RetailerChainId;
  surface: RetailerPolicySurface;
};

export type StoreLocatorSourceSurface = 'store_locator' | 'store_detail' | 'regional_locator';
export type StoreIdentifierStatus = 'resolved' | 'fixture_local' | 'unresolved';
export type StoreLocatorConfidenceReason =
  | 'official_locator'
  | 'rendered_html'
  | 'app_rendered'
  | 'coordinate_missing'
  | 'hours_missing'
  | 'special_hours_unknown'
  | 'identifier_unresolved';

export type StoreOpeningHoursInterval = {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  opens: string;
  closes: string;
};

export type StoreLocatorFixture = {
  fixtureId: string;
  chainId: RetailerChainId;
  sourceUrl: string;
  sourceSurface: StoreLocatorSourceSurface;
  sourceRegion: 'stockholm' | 'stockholm_county' | 'coop_ostra' | 'unknown';
  capturedAt: string;
  rawSnapshotRef: string;
  contentDigest: string;
  storeId: string;
  storeIdentifierStatus: StoreIdentifierStatus;
  storeName: string;
  address: string;
  coordinates?: { latitude: number; longitude: number };
  openingHours: StoreOpeningHoursInterval[];
  specialHoursUnknown: boolean;
  services: string[];
  status: 'open' | 'temporarily_closed' | 'planned' | 'unknown';
  confidence: number;
  confidenceReasons: StoreLocatorConfidenceReason[];
  legalReviewStatus: LegalReviewStatus;
};

export type StoreLocatorFixtureValidation = {
  status: 'valid' | 'invalid';
  chainIds: RetailerChainId[];
  issues: string[];
};

export type OfferSelectorArtifactFormat = 'server_html' | 'next_data' | 'pdf_flyer' | 'nuxt_html' | 'react_shell';
export type OfferSelectorFieldName =
  | 'offer_id'
  | 'product_title'
  | 'brand_or_preamble'
  | 'package_size'
  | 'comparison_price_text'
  | 'offer_price_text'
  | 'ordinary_price_text'
  | 'image_url'
  | 'category'
  | 'campaign_week'
  | 'member_only_label'
  | 'max_purchase_text';
export type OfferSelectorValueKind = 'text' | 'number' | 'url' | 'date_range' | 'boolean';
export type OfferSelectorReviewFlag =
  | 'requires_store_selection'
  | 'requires_authentication'
  | 'member_only_or_personalized'
  | 'client_hydrated_only'
  | 'pdf_only'
  | 'ambiguous_price_text'
  | 'ordinary_price_claim_present'
  | 'third_party_or_search_snippet'
  | 'skeleton_or_error_state';

export type OfferSelectorEvidence = {
  evidenceId: string;
  selector: string;
  description: string;
  sourceLocation: OfferSelectorArtifactFormat;
};

export type OfferSelectorCandidateField = {
  field: OfferSelectorFieldName;
  valueKind: OfferSelectorValueKind;
  selectorEvidenceId: string;
  candidateOnly: true;
};

export type OfferSelectorFixture = {
  fixtureId: string;
  chainId: RetailerChainId;
  sourceUrl: string;
  artifactFormat: OfferSelectorArtifactFormat;
  pageMarker: string;
  capturedAt: string;
  rawSnapshotRef: string;
  contentDigest: string;
  robotsPolicyRef: string;
  sourcePolicy: RetailerSourcePolicyLabel;
  selectorEvidence: OfferSelectorEvidence[];
  candidateFields: OfferSelectorCandidateField[];
  reviewFlags: OfferSelectorReviewFlag[];
  emitsOfferFacts: false;
};

export type OfferSelectorFixtureValidation = {
  status: 'valid' | 'invalid';
  chainIds: RetailerChainId[];
  issues: string[];
};

export type FlyerSourceFormat = 'weekly_offer_html' | 'store_offer_html' | 'digital_flyer' | 'member_offer' | 'app_offer' | 'app_rendered_offer_html';
export type FlyerSourcePlanInput = {
  chainId: RetailerChainId;
  sourceUrl: string;
  format: FlyerSourceFormat;
  retrievedAt: string;
  storeId?: string;
  retailerStoreKey?: string;
  requiresStoreSelection?: boolean;
  requiresAuthentication?: boolean;
  memberOnly?: boolean;
  rawSnapshotRef?: string;
  contentHash?: string;
  parserVersion?: string;
};

export type FlyerSourcePlan = {
  chainId: RetailerChainId;
  sourceUrl: string;
  sourceHost: string;
  format: FlyerSourceFormat;
  retrievedAt: string;
  storeId?: string;
  retailerStoreKey?: string;
  requiresStoreSelection: boolean;
  requiresAuthentication: boolean;
  memberOnly: boolean;
  rawSnapshotRef: string | null;
  contentHash: string | null;
  parserVersion: string;
  robotsPolicy: RobotsPolicy;
  legalReviewStatus: LegalReviewStatus;
  emitsProductFacts: false;
};
export type OfficialSourceKind = 'price_index' | 'taxonomy';
export type OfficialSourceLicense = 'CC0' | 'CC_BY_4_0' | 'OFFICIAL_STATISTICS_TERMS_PENDING';
export type OfficialBaselineSource = {
  id: string;
  authority: 'SCB' | 'Jordbruksverket' | 'Eurostat' | 'Livsmedelsverket';
  name: string;
  kind: OfficialSourceKind;
  datasetUrl: string;
  apiUrl?: string;
  license: OfficialSourceLicense;
  requiresAttribution: boolean;
  attribution?: string;
  categoryScope: string;
  canGenerateStorePrices: false;
  canGenerateSkuPrices: false;
};

export type RetailerSourceAccessInput = {
  chainId: string;
  sourceType: Extract<SourceType, 'official_api' | 'retailer_online_page' | 'flyer_campaign'>;
  robotsTxtStatus: RobotsTxtStatus;
  legalReviewStatus: LegalReviewStatus;
  hasDataAgreement: boolean;
};

export type RetailerSourceAccessPlan = {
  status: 'allowed' | 'blocked';
  chainId: string;
  sourceType: RetailerSourceAccessInput['sourceType'];
  reason: string;
  requiredActions: string[];
};

const ROBOTS_CHECKED_AT = '2026-05-20T00:00:00.000Z';

const RETAILER_ROBOTS_BASE: Record<
  RetailerChainId,
  {
    robotsUrl: string;
    crawlDelaySeconds?: number;
    disallowedPaths: Partial<Record<RetailerPolicySurface, string[]>>;
  }
> = {
  ica: {
    robotsUrl: 'https://www.ica.se/robots.txt',
    disallowedPaths: {
      product: ['/templates/ajaxresponse.aspx', '/butiker/*/*/*/*/*'],
      search: ['/templates/ajaxresponse.aspx']
    }
  },
  willys: {
    robotsUrl: 'https://www.willys.se/robots.txt',
    crawlDelaySeconds: 10,
    disallowedPaths: {
      search: ['/sok'],
      basket: ['/varukorg', '/kassa/'],
      account: ['/mitt-konto/', '/mina-kop/', '/mina-listor/', '/delad-lista/'],
      member: ['/minavanligastevaror'],
      product: ['/o/']
    }
  },
  coop: {
    robotsUrl: 'https://www.coop.se/robots.txt',
    disallowedPaths: {
      search: ['/handla/sok/*', '/globalt-sok'],
      basket: ['/handla/betalning', '/handla/kassa'],
      account: ['/mitt-coop', '/default-login'],
      member: ['/mitt-coop']
    }
  },
  hemkop: {
    robotsUrl: 'https://www.hemkop.se/robots.txt',
    crawlDelaySeconds: 10,
    disallowedPaths: {
      search: ['/*?q=', '/*?sort='],
      basket: ['/varukorg', '/kassa/'],
      account: ['/mina-sidor/', '/min-order/'],
      product: ['/o/', '/dev-info', '/beta/']
    }
  },
  lidl: {
    robotsUrl: 'https://www.lidl.se/robots.txt',
    disallowedPaths: {
      search: ['/q/search?id=*'],
      product: ['/1*', '/2*', '/3*', '/4*', '/5*', '/6*', '/7*', '/8*', '/9*']
    }
  },
  city_gross: {
    robotsUrl: 'https://www.citygross.se/robots.txt',
    disallowedPaths: {
      search: ['/loop54/'],
      account: ['/mina-sidor/']
    }
  }
};

const POLICY_SURFACES: RetailerPolicySurface[] = [
  'store_locator',
  'offer',
  'product',
  'search',
  'basket',
  'account',
  'member',
  'app_api'
];

function policyForSurface(surface: RetailerPolicySurface, disallowedPathMatches: string[]): RetailerSourcePolicyLabel {
  if (surface === 'app_api') return 'stub_only';
  if (surface === 'basket' || surface === 'account' || surface === 'member') return 'blocked';
  if (surface === 'search' && disallowedPathMatches.length > 0) return 'blocked';
  if (surface === 'store_locator' || surface === 'offer') return 'fixture_review';
  return 'manual_review';
}

function requiredActionsForPolicy(policy: RetailerSourcePolicyLabel, crawlDelaySeconds: number | undefined): string[] {
  const actions: string[] = [];
  if (policy === 'fixture_review') actions.push('fixture_review_required', 'legal_review_approval_required');
  if (policy === 'manual_review') actions.push('manual_review_required');
  if (policy === 'blocked') actions.push('source_surface_blocked');
  if (policy === 'stub_only') actions.push('stub_only_no_network_fetch');
  if ((policy === 'fixture_review' || policy === 'manual_review' || policy === 'allowed') && crawlDelaySeconds !== undefined) {
    actions.push(`crawl_delay_${crawlDelaySeconds}s_required`);
  }
  return actions;
}

function buildRetailerRobotsPolicyMatrix(): RetailerRobotsPolicyMatrixEntry[] {
  return (Object.keys(RETAILER_ROBOTS_BASE) as RetailerChainId[]).flatMap((chainId) => {
    const base = RETAILER_ROBOTS_BASE[chainId];
    return POLICY_SURFACES.map((surface) => {
      const disallowedPathMatches = base.disallowedPaths[surface] ?? [];
      const policy = policyForSurface(surface, disallowedPathMatches);
      const legalReviewStatus: LegalReviewStatus = policy === 'allowed' ? 'approved' : policy === 'blocked' ? 'rejected' : 'pending';
      return {
        chainId,
        surface,
        policy,
        canFetch: policy === 'allowed',
        robotsUrl: base.robotsUrl,
        robotsTxtStatus: disallowedPathMatches.length > 0 ? 'disallow' : 'allow',
        checkedAt: ROBOTS_CHECKED_AT,
        crawlDelaySeconds: base.crawlDelaySeconds,
        disallowedPathMatches,
        legalReviewStatus,
        requiredActions: requiredActionsForPolicy(policy, base.crawlDelaySeconds)
      };
    });
  });
}

export const retailerRobotsPolicyMatrix: RetailerRobotsPolicyMatrixEntry[] = buildRetailerRobotsPolicyMatrix();

export function planRetailerSurfacePolicy(input: RetailerSurfacePolicyInput): RetailerRobotsPolicyMatrixEntry {
  const entry = retailerRobotsPolicyMatrix.find((candidate) => candidate.chainId === input.chainId && candidate.surface === input.surface);
  if (!entry) throw new Error(`No retailer source policy for ${input.chainId}:${input.surface}.`);
  return {
    ...entry,
    disallowedPathMatches: [...entry.disallowedPathMatches],
    requiredActions: [...entry.requiredActions]
  };
}

export type RetailerConnectorHealthStatus = 'pass' | 'fail' | 'not_run';

export type RetailerConnectorReadinessInput = {
  requiredChains: RetailerChainId[];
  connectors: Array<{
    chainId: RetailerChainId;
    sourceType: RetailerSourceAccessInput['sourceType'];
    configured: boolean;
    credentialsPresent: boolean;
    healthStatus: RetailerConnectorHealthStatus;
    robotsTxtStatus: RobotsTxtStatus;
    legalReviewStatus: LegalReviewStatus;
    hasDataAgreement: boolean;
  }>;
};

export type RetailerConnectorReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

export function planRetailerSourceAccess(input: RetailerSourceAccessInput): RetailerSourceAccessPlan {
  if (!input.chainId.trim()) throw new Error('chainId is required.');

  if (input.sourceType === 'official_api') {
    const requiredActions: string[] = [];
    if (input.legalReviewStatus !== 'approved') requiredActions.push('legal_review_approval_required');
    if (!input.hasDataAgreement) requiredActions.push('data_agreement_required');
    return requiredActions.length === 0
      ? {
          status: 'allowed',
          chainId: input.chainId,
          sourceType: input.sourceType,
          reason: 'Official API access has legal approval and a data agreement.',
          requiredActions
        }
      : {
          status: 'blocked',
          chainId: input.chainId,
          sourceType: input.sourceType,
          reason: 'Official API ingestion requires legal approval and a data agreement.',
          requiredActions
        };
  }

  if (input.sourceType === 'retailer_online_page') {
    const requiredActions: string[] = [];
    if (input.robotsTxtStatus !== 'allow') requiredActions.push('robots_txt_allow_required');
    if (input.legalReviewStatus !== 'approved') requiredActions.push('legal_review_approval_required');
    return requiredActions.length === 0
      ? {
          status: 'allowed',
          chainId: input.chainId,
          sourceType: input.sourceType,
          reason: 'Retailer page ingestion has robots.txt allow and approved legal review.',
          requiredActions
        }
      : {
          status: 'blocked',
          chainId: input.chainId,
          sourceType: input.sourceType,
          reason: 'Retailer page ingestion requires robots.txt allow and approved legal review.',
          requiredActions
        };
  }

  const requiredActions = input.legalReviewStatus === 'approved' ? [] : ['legal_review_approval_required'];
  return requiredActions.length === 0
    ? {
        status: 'allowed',
        chainId: input.chainId,
        sourceType: input.sourceType,
        reason: 'Flyer campaign ingestion has approved legal review.',
        requiredActions
      }
    : {
        status: 'blocked',
        chainId: input.chainId,
        sourceType: input.sourceType,
        reason: 'Flyer campaign ingestion requires approved legal review.',
        requiredActions
	      };
	}

export const stockholmStoreLocatorFixtures: StoreLocatorFixture[] = [
  {
    fixtureId: 'ica-stockholm-oppettider-sergels-torg',
    chainId: 'ica',
    sourceUrl: 'https://www.ica.se/butiker/oppettider/stockholm/',
    sourceSurface: 'store_locator',
    sourceRegion: 'stockholm',
    capturedAt: '2026-05-20T09:30:00.000Z',
    rawSnapshotRef: 'fixtures/store-locators/ica/stockholm-oppettider.html',
    contentDigest: 'sha256:fixture-ica-stockholm-oppettider',
    storeId: 'ica-stockholm-sergels-torg',
    storeIdentifierStatus: 'fixture_local',
    storeName: 'ICA Nara Sergels Torg',
    address: 'T-Centralen, Stockholm',
    openingHours: [],
    specialHoursUnknown: true,
    services: ['opening_hours', 'store_services'],
    status: 'unknown',
    confidence: 0.72,
    confidenceReasons: ['official_locator', 'rendered_html', 'hours_missing', 'special_hours_unknown', 'identifier_unresolved'],
    legalReviewStatus: 'approved'
  },
  {
    fixtureId: 'willys-stockholm-odenplan-placeholder',
    chainId: 'willys',
    sourceUrl: 'https://www.willys.se/butik',
    sourceSurface: 'store_locator',
    sourceRegion: 'stockholm',
    capturedAt: '2026-05-20T09:30:00.000Z',
    rawSnapshotRef: 'fixtures/store-locators/willys/stockholm-search.html',
    contentDigest: 'sha256:fixture-willys-stockholm-search',
    storeId: 'willys-odenplan',
    storeIdentifierStatus: 'fixture_local',
    storeName: 'Willys Odenplan',
    address: 'Odenplan, Stockholm',
    openingHours: [],
    specialHoursUnknown: true,
    services: ['store_locator'],
    status: 'unknown',
    confidence: 0.6,
    confidenceReasons: ['official_locator', 'app_rendered', 'hours_missing', 'special_hours_unknown', 'identifier_unresolved'],
    legalReviewStatus: 'pending'
  },
  {
    fixtureId: 'coop-ostra-swedenborgsgatan',
    chainId: 'coop',
    sourceUrl: 'https://coopostra.se/butiker/',
    sourceSurface: 'regional_locator',
    sourceRegion: 'coop_ostra',
    capturedAt: '2026-05-20T09:30:00.000Z',
    rawSnapshotRef: 'fixtures/store-locators/coop/coop-ostra-butiker.html',
    contentDigest: 'sha256:fixture-coop-ostra-butiker',
    storeId: 'coop-stockholm-swedenborgsgatan',
    storeIdentifierStatus: 'fixture_local',
    storeName: 'Coop Swedenborgsgatan',
    address: 'Swedenborgsgatan 21, 118 27 Stockholm',
    openingHours: [],
    specialHoursUnknown: true,
    services: ['regional_locator'],
    status: 'unknown',
    confidence: 0.7,
    confidenceReasons: ['official_locator', 'rendered_html', 'hours_missing', 'special_hours_unknown', 'identifier_unresolved'],
    legalReviewStatus: 'approved'
  },
  {
    fixtureId: 'hemkop-stockholm-butik-sok',
    chainId: 'hemkop',
    sourceUrl: 'https://www.hemkop.se/butik-sok',
    sourceSurface: 'store_locator',
    sourceRegion: 'stockholm',
    capturedAt: '2026-05-20T09:30:00.000Z',
    rawSnapshotRef: 'fixtures/store-locators/hemkop/butik-sok-stockholm.html',
    contentDigest: 'sha256:fixture-hemkop-butik-sok-stockholm',
    storeId: 'hemkop-stockholm-search-result',
    storeIdentifierStatus: 'unresolved',
    storeName: 'Hemkop Stockholm locator result',
    address: 'Stockholm',
    openingHours: [],
    specialHoursUnknown: true,
    services: ['store_locator'],
    status: 'unknown',
    confidence: 0.58,
    confidenceReasons: ['official_locator', 'app_rendered', 'hours_missing', 'special_hours_unknown', 'identifier_unresolved'],
    legalReviewStatus: 'pending'
  },
  {
    fixtureId: 'lidl-stockholm-sveavagen-59',
    chainId: 'lidl',
    sourceUrl: 'https://www.lidl.se/s/sv-SE/butiker/stockholm/',
    sourceSurface: 'store_locator',
    sourceRegion: 'stockholm',
    capturedAt: '2026-05-20T09:30:00.000Z',
    rawSnapshotRef: 'fixtures/store-locators/lidl/stockholm.html',
    contentDigest: 'sha256:fixture-lidl-stockholm',
    storeId: 'lidl-stockholm-sveavagen-59',
    storeIdentifierStatus: 'fixture_local',
    storeName: 'Lidl Sveavagen',
    address: 'Sveavagen 59, 113 59 Stockholm',
    openingHours: [],
    specialHoursUnknown: true,
    services: ['store_locator', 'favorite_store'],
    status: 'open',
    confidence: 0.82,
    confidenceReasons: ['official_locator', 'rendered_html', 'hours_missing', 'special_hours_unknown', 'identifier_unresolved'],
    legalReviewStatus: 'approved'
  },
  {
    fixtureId: 'citygross-stockholm-official-placeholder',
    chainId: 'city_gross',
    sourceUrl: 'https://www.citygross.se/',
    sourceSurface: 'store_locator',
    sourceRegion: 'stockholm_county',
    capturedAt: '2026-05-20T09:30:00.000Z',
    rawSnapshotRef: 'fixtures/store-locators/city-gross/stockholm-county.html',
    contentDigest: 'sha256:fixture-citygross-stockholm-county',
    storeId: 'citygross-stockholm-county-unresolved',
    storeIdentifierStatus: 'unresolved',
    storeName: 'City Gross Stockholm county locator result',
    address: 'Stockholm County',
    openingHours: [],
    specialHoursUnknown: true,
    services: ['store_locator'],
    status: 'unknown',
    confidence: 0.45,
    confidenceReasons: ['official_locator', 'app_rendered', 'hours_missing', 'special_hours_unknown', 'identifier_unresolved'],
    legalReviewStatus: 'pending'
  }
];

export const offerSelectorFixtures: OfferSelectorFixture[] = [
  {
    fixtureId: 'ica-kvantum-kista-offer-html',
    chainId: 'ica',
    sourceUrl: 'https://www.ica.se/erbjudanden/ica-kvantum-kista-1004587/',
    artifactFormat: 'server_html',
    pageMarker: 'meta[name="pageType"][content="OfferPage"]',
    capturedAt: '2026-05-20T18:05:00.000Z',
    rawSnapshotRef: 'fixtures/offer-selectors/ica/kvantum-kista-offers.html',
    contentDigest: 'sha256:fixture-ica-kvantum-kista-offers',
    robotsPolicyRef: 'ica:offer',
    sourcePolicy: 'fixture_review',
    selectorEvidence: [
      {
        evidenceId: 'ica-data-promotion-card',
        selector: '[data-promotion-id][data-promotion-name]',
        description: 'Rendered store offer cards expose promotion identifiers and names in server HTML.',
        sourceLocation: 'server_html'
      },
      {
        evidenceId: 'ica-price-splash',
        selector: '.price-splash .sr-only',
        description: 'Accessible price splash text carries candidate offer price text.',
        sourceLocation: 'server_html'
      }
    ],
    candidateFields: [
      { field: 'offer_id', valueKind: 'text', selectorEvidenceId: 'ica-data-promotion-card', candidateOnly: true },
      { field: 'product_title', valueKind: 'text', selectorEvidenceId: 'ica-data-promotion-card', candidateOnly: true },
      { field: 'offer_price_text', valueKind: 'text', selectorEvidenceId: 'ica-price-splash', candidateOnly: true }
    ],
    reviewFlags: ['ordinary_price_claim_present', 'ambiguous_price_text'],
    emitsOfferFacts: false
  },
  {
    fixtureId: 'willys-erbjudanden-ehandel-next-data',
    chainId: 'willys',
    sourceUrl: 'https://www.willys.se/erbjudanden/ehandel',
    artifactFormat: 'next_data',
    pageMarker: '__NEXT_DATA__.page=/erbjudanden/[mode]',
    capturedAt: '2026-05-20T18:05:00.000Z',
    rawSnapshotRef: 'fixtures/offer-selectors/willys/erbjudanden-ehandel.html',
    contentDigest: 'sha256:fixture-willys-erbjudanden-ehandel',
    robotsPolicyRef: 'willys:offer',
    sourcePolicy: 'fixture_review',
    selectorEvidence: [
      {
        evidenceId: 'willys-next-mode',
        selector: 'script#__NEXT_DATA__',
        description: 'Next data records the e-commerce offer route and mode but not reviewed offer rows.',
        sourceLocation: 'next_data'
      }
    ],
    candidateFields: [],
    reviewFlags: ['requires_store_selection', 'client_hydrated_only'],
    emitsOfferFacts: false
  },
  {
    fixtureId: 'coop-daglivs-weekly-pdf',
    chainId: 'coop',
    sourceUrl: 'https://dr.coop.se/Butik/Coop-Daglivs?c=2026-19',
    artifactFormat: 'pdf_flyer',
    pageMarker: 'content-type: application/pdf',
    capturedAt: '2026-05-20T18:05:00.000Z',
    rawSnapshotRef: 'fixtures/offer-selectors/coop/daglivs-2026-19.pdf',
    contentDigest: 'sha256:fixture-coop-daglivs-2026-19',
    robotsPolicyRef: 'coop:offer',
    sourcePolicy: 'fixture_review',
    selectorEvidence: [
      {
        evidenceId: 'coop-pdf-content-type',
        selector: 'response.headers.content-type',
        description: 'Weekly offer artifact is a PDF and needs PDF-specific review before extraction.',
        sourceLocation: 'pdf_flyer'
      }
    ],
    candidateFields: [{ field: 'campaign_week', valueKind: 'text', selectorEvidenceId: 'coop-pdf-content-type', candidateOnly: true }],
    reviewFlags: ['pdf_only'],
    emitsOfferFacts: false
  },
  {
    fixtureId: 'hemkop-erbjudanden-next-data',
    chainId: 'hemkop',
    sourceUrl: 'https://www.hemkop.se/erbjudanden',
    artifactFormat: 'next_data',
    pageMarker: '__NEXT_DATA__.page=/erbjudanden',
    capturedAt: '2026-05-20T18:05:00.000Z',
    rawSnapshotRef: 'fixtures/offer-selectors/hemkop/erbjudanden.html',
    contentDigest: 'sha256:fixture-hemkop-erbjudanden',
    robotsPolicyRef: 'hemkop:offer',
    sourcePolicy: 'fixture_review',
    selectorEvidence: [
      {
        evidenceId: 'hemkop-next-cms-fallback',
        selector: 'script#__NEXT_DATA__',
        description: 'Next data records CMS fallback and weekly flyer component namespaces, not reviewed offer rows.',
        sourceLocation: 'next_data'
      }
    ],
    candidateFields: [],
    reviewFlags: ['requires_store_selection', 'client_hydrated_only'],
    emitsOfferFacts: false
  },
  {
    fixtureId: 'lidl-public-campaign-html',
    chainId: 'lidl',
    sourceUrl: 'https://www.lidl.se/c/',
    artifactFormat: 'nuxt_html',
    pageMarker: 'script[type="application/ld+json"]',
    capturedAt: '2026-05-20T18:05:00.000Z',
    rawSnapshotRef: 'fixtures/offer-selectors/lidl/public-campaign.html',
    contentDigest: 'sha256:fixture-lidl-public-campaign',
    robotsPolicyRef: 'lidl:offer',
    sourcePolicy: 'fixture_review',
    selectorEvidence: [
      {
        evidenceId: 'lidl-jsonld',
        selector: 'script[type="application/ld+json"]',
        description: 'Public page exposes structured page metadata alongside campaign HTML.',
        sourceLocation: 'nuxt_html'
      },
      {
        evidenceId: 'lidl-campaign-copy',
        selector: '[class*="campaign"], [class*="offer"]',
        description: 'Campaign copy and price tokens are present but need duplicate and member-offer review.',
        sourceLocation: 'nuxt_html'
      }
    ],
    candidateFields: [
      { field: 'product_title', valueKind: 'text', selectorEvidenceId: 'lidl-campaign-copy', candidateOnly: true },
      { field: 'offer_price_text', valueKind: 'text', selectorEvidenceId: 'lidl-campaign-copy', candidateOnly: true }
    ],
    reviewFlags: ['ambiguous_price_text', 'member_only_or_personalized'],
    emitsOfferFacts: false
  },
  {
    fixtureId: 'citygross-weekly-react-shell',
    chainId: 'city_gross',
    sourceUrl: 'https://www.citygross.se/matvaror/veckans-erbjudande',
    artifactFormat: 'react_shell',
    pageMarker: 'window.SERVER_DATA',
    capturedAt: '2026-05-20T18:05:00.000Z',
    rawSnapshotRef: 'fixtures/offer-selectors/city-gross/veckans-erbjudande.html',
    contentDigest: 'sha256:fixture-citygross-weekly-shell',
    robotsPolicyRef: 'city_gross:offer',
    sourcePolicy: 'fixture_review',
    selectorEvidence: [
      {
        evidenceId: 'citygross-shell-state',
        selector: 'window.SERVER_DATA',
        description: 'Initial shell state appears before store selection and must not be treated as offer rows.',
        sourceLocation: 'react_shell'
      }
    ],
    candidateFields: [],
    reviewFlags: ['requires_store_selection', 'client_hydrated_only', 'skeleton_or_error_state'],
    emitsOfferFacts: false
  }
];

export function validateStoreLocatorFixtures(fixtures: StoreLocatorFixture[]): StoreLocatorFixtureValidation {
  const issues: string[] = [];
  const requiredChains: RetailerChainId[] = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
  const chainIds = [...new Set(fixtures.map((fixture) => fixture.chainId))].sort() as RetailerChainId[];
  for (const chainId of requiredChains) {
    if (!chainIds.includes(chainId)) issues.push(`missing_chain:${chainId}`);
  }
  for (const fixture of fixtures) {
    if (!fixture.sourceUrl.startsWith('https://')) issues.push(`invalid_source_url:${fixture.fixtureId}`);
    if (!fixture.rawSnapshotRef) issues.push(`missing_raw_snapshot_ref:${fixture.fixtureId}`);
    if (!fixture.contentDigest.startsWith('sha256:')) issues.push(`missing_content_digest:${fixture.fixtureId}`);
    if (!fixture.capturedAt || Number.isNaN(Date.parse(fixture.capturedAt))) issues.push(`invalid_captured_at:${fixture.fixtureId}`);
    if (fixture.storeIdentifierStatus !== 'resolved' && !fixture.confidenceReasons.includes('identifier_unresolved')) {
      issues.push(`missing_identifier_reason:${fixture.fixtureId}`);
    }
    if (fixture.openingHours.length === 0 && !fixture.confidenceReasons.includes('hours_missing')) {
      issues.push(`missing_hours_reason:${fixture.fixtureId}`);
    }
    if (fixture.specialHoursUnknown && !fixture.confidenceReasons.includes('special_hours_unknown')) {
      issues.push(`missing_special_hours_reason:${fixture.fixtureId}`);
    }
    if (fixture.confidence < 0 || fixture.confidence > 1) issues.push(`invalid_confidence:${fixture.fixtureId}`);
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    chainIds,
    issues
  };
}

export function locatorFixturesCanAffectDealScore(): false {
  return false;
}

export function validateOfferSelectorFixtures(fixtures: OfferSelectorFixture[]): OfferSelectorFixtureValidation {
  const issues: string[] = [];
  const requiredChains: RetailerChainId[] = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
  const chainIds = [...new Set(fixtures.map((fixture) => fixture.chainId))].sort() as RetailerChainId[];

  for (const chainId of requiredChains) {
    if (!chainIds.includes(chainId)) issues.push(`missing_chain:${chainId}`);
  }

  for (const fixture of fixtures) {
    if (!fixture.sourceUrl.startsWith('https://')) issues.push(`invalid_source_url:${fixture.fixtureId}`);
    if (!fixture.rawSnapshotRef.startsWith('fixtures/offer-selectors/')) issues.push(`invalid_raw_snapshot_ref:${fixture.fixtureId}`);
    if (!fixture.contentDigest.startsWith('sha256:')) issues.push(`missing_content_digest:${fixture.fixtureId}`);
    if (!fixture.pageMarker.trim()) issues.push(`missing_page_marker:${fixture.fixtureId}`);
    if (fixture.robotsPolicyRef !== `${fixture.chainId}:offer`) issues.push(`invalid_robots_policy_ref:${fixture.fixtureId}`);
    if (Number.isNaN(Date.parse(fixture.capturedAt))) issues.push(`invalid_captured_at:${fixture.fixtureId}`);
    if (fixture.emitsOfferFacts !== false) issues.push(`emits_offer_facts:${fixture.fixtureId}`);

    const evidenceIds = new Set(fixture.selectorEvidence.map((evidence) => evidence.evidenceId));
    if (evidenceIds.size !== fixture.selectorEvidence.length) issues.push(`duplicate_selector_evidence:${fixture.fixtureId}`);
    for (const evidence of fixture.selectorEvidence) {
      if (!evidence.selector.trim()) issues.push(`missing_selector:${fixture.fixtureId}:${evidence.evidenceId}`);
      if (!evidence.description.trim()) issues.push(`missing_selector_description:${fixture.fixtureId}:${evidence.evidenceId}`);
      if (evidence.sourceLocation !== fixture.artifactFormat) issues.push(`evidence_format_mismatch:${fixture.fixtureId}:${evidence.evidenceId}`);
    }
    for (const field of fixture.candidateFields) {
      if (!field.candidateOnly) issues.push(`non_candidate_field:${fixture.fixtureId}:${field.field}`);
      if (!evidenceIds.has(field.selectorEvidenceId)) issues.push(`missing_field_evidence:${fixture.fixtureId}:${field.field}`);
    }
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    chainIds,
    issues
  };
}

export function offerSelectorFixturesCanEmitOfferFacts(): false {
  return false;
}

export type RetailerConnectorKind = 'official_api' | 'retailer_online_page' | 'flyer_campaign';

export type RetailerConnectorPlanInput = RetailerSourceAccessInput & {
  connectorId: string;
  requestedAt: string;
  endpointUrl?: string;
  parserVersion: string;
  previousRunKeys?: string[];
};

export type RetailerConnectorRunPlan = {
  status: 'ready' | 'blocked' | 'duplicate';
  connectorId: string;
  chainId: string;
  sourceType: RetailerConnectorKind;
  runKey: string;
  sourceRunId: string;
  provenance: {
    sourceType: RetailerConnectorKind;
    sourceUrl?: string;
    capturedAt: string;
    parserVersion: string;
  };
  requiredActions: string[];
};

function stableKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

export function planRetailerConnectorRun(input: RetailerConnectorPlanInput): RetailerConnectorRunPlan {
  if (!input.connectorId.trim()) throw new Error('connectorId is required.');
  if (!input.parserVersion.trim()) throw new Error('parserVersion is required.');
  if (Number.isNaN(Date.parse(input.requestedAt))) throw new Error('requestedAt must be an ISO date.');

  const access = planRetailerSourceAccess(input);
  const datePart = input.requestedAt.slice(0, 10);
  const runKey = [
    stableKeyPart(input.chainId),
    stableKeyPart(input.sourceType),
    stableKeyPart(input.connectorId),
    datePart
  ].join(':');
  const sourceRunId = `source-run:${runKey}`;

  const base = {
    connectorId: input.connectorId,
    chainId: input.chainId,
    sourceType: input.sourceType,
    runKey,
    sourceRunId,
    provenance: {
      sourceType: input.sourceType,
      sourceUrl: input.endpointUrl,
      capturedAt: input.requestedAt,
      parserVersion: input.parserVersion
    },
    requiredActions: access.requiredActions
  };

  if (access.status === 'blocked') return { ...base, status: 'blocked' };
  if ((input.previousRunKeys ?? []).includes(runKey)) {
    return { ...base, status: 'duplicate', requiredActions: ['skip_duplicate_connector_run'] };
  }
  return { ...base, status: 'ready' };
}


export type RetailerConnectorFetchResult = {
  statusCode: number;
  body: string;
  contentType?: string;
  retrievedAt?: string;
  sourceUrl?: string;
  rawSnapshotRef: string;
  contentHash?: string;
};

export type RetailerConnectorSnapshot = {
  statusCode: number;
  body: string;
  contentType: string | null;
  retrievedAt: string;
  sourceUrl: string;
  rawSnapshotRef: string;
  contentHash: string;
};

export type RetailerConnectorParsedProduct = Omit<
  RetailerProductInput,
  'sourceType' | 'observedAt' | 'parserVersion' | 'rawSnapshotRef' | 'sourceRunId' | 'chainId' | 'sourceUrl'
> & Partial<Pick<RetailerProductInput, 'sourceType' | 'observedAt' | 'parserVersion' | 'rawSnapshotRef' | 'sourceRunId' | 'chainId' | 'sourceUrl'>>;

export type RetailerConnectorFetcher = (plan: RetailerConnectorRunPlan) => RetailerConnectorFetchResult | Promise<RetailerConnectorFetchResult>;
export type RetailerConnectorParser = (snapshot: RetailerConnectorSnapshot, plan: RetailerConnectorRunPlan) => RetailerConnectorParsedProduct[] | Promise<RetailerConnectorParsedProduct[]>;

export type RetailerConnectorRunInput = RetailerConnectorPlanInput & {
  fetcher: RetailerConnectorFetcher;
  parser: RetailerConnectorParser;
};

export type RetailerConnectorRunResult = {
  status: 'completed' | 'blocked' | 'duplicate' | 'failed';
  plan: RetailerConnectorRunPlan;
  snapshot: RetailerConnectorSnapshot | null;
  ingestion: IngestionBatchPlan;
  fetchAttempted: boolean;
  parserAttempted: boolean;
  acceptedCount: number;
  rejectedCount: number;
  requiredActions: string[];
  error?: string;
};

export type ConnectorFetchResponse = {
  status: number;
  text(): Promise<string>;
  headers: { get(name: string): string | null };
};

export type ConnectorFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<ConnectorFetchResponse>;

export type FetchRetailerConnectorSnapshotOptions = {
  fetchImpl?: ConnectorFetch;
  headers?: Record<string, string>;
  retrievedAt?: string;
  rawSnapshotRefPrefix?: string;
};

const emptyIngestionBatch = (): IngestionBatchPlan => ({ accepted: [], rejected: [] });
const isIsoDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

function contentHashFor(body: string): string {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function normalizeSnapshot(fetchResult: RetailerConnectorFetchResult, plan: RetailerConnectorRunPlan): RetailerConnectorSnapshot {
  if (fetchResult.statusCode < 200 || fetchResult.statusCode >= 300) throw new Error(`connector fetch returned HTTP ${fetchResult.statusCode}.`);
  if (!fetchResult.rawSnapshotRef.trim()) throw new Error('rawSnapshotRef is required for connector snapshots.');

  const retrievedAt = fetchResult.retrievedAt ?? plan.provenance.capturedAt;
  if (!isIsoDate(retrievedAt)) throw new Error('retrievedAt must be an ISO date.');

  const sourceUrl = fetchResult.sourceUrl ?? plan.provenance.sourceUrl;
  if (!sourceUrl?.trim()) throw new Error('sourceUrl is required for connector snapshots.');

  return {
    statusCode: fetchResult.statusCode,
    body: fetchResult.body,
    contentType: fetchResult.contentType ?? null,
    retrievedAt,
    sourceUrl,
    rawSnapshotRef: fetchResult.rawSnapshotRef,
    contentHash: fetchResult.contentHash ?? contentHashFor(fetchResult.body)
  };
}

function normalizeParsedProduct(row: RetailerConnectorParsedProduct, plan: RetailerConnectorRunPlan, snapshot: RetailerConnectorSnapshot): RetailerProductInput {
  return {
    ...row,
    sourceType: row.sourceType ?? plan.sourceType,
    observedAt: row.observedAt ?? snapshot.retrievedAt,
    parserVersion: row.parserVersion ?? plan.provenance.parserVersion,
    rawSnapshotRef: row.rawSnapshotRef ?? snapshot.rawSnapshotRef,
    sourceRunId: row.sourceRunId ?? plan.sourceRunId,
    chainId: row.chainId ?? plan.chainId,
    sourceUrl: row.sourceUrl ?? snapshot.sourceUrl
  };
}

export async function fetchRetailerConnectorSnapshot(
  plan: RetailerConnectorRunPlan,
  options: FetchRetailerConnectorSnapshotOptions = {}
): Promise<RetailerConnectorFetchResult> {
  if (plan.status !== 'ready') throw new Error('fetchRetailerConnectorSnapshot requires a ready connector plan.');
  if (!plan.provenance.sourceUrl?.trim()) throw new Error('sourceUrl is required to fetch a connector snapshot.');

  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as ConnectorFetch | undefined);
  if (!fetchImpl) throw new Error('fetch implementation is required to fetch a connector snapshot.');

  const response = await fetchImpl(plan.provenance.sourceUrl, { headers: options.headers });
  const body = await response.text();
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const contentHash = contentHashFor(body);
  const refHash = contentHash.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const rawSnapshotRef = `${options.rawSnapshotRefPrefix ?? 'raw://connector-snapshots'}/${stableKeyPart(plan.sourceRunId)}/${refHash}`;

  return {
    statusCode: response.status,
    body,
    contentType: response.headers.get('content-type') ?? undefined,
    retrievedAt,
    sourceUrl: plan.provenance.sourceUrl,
    rawSnapshotRef,
    contentHash
  };
}

export async function runRetailerConnector(input: RetailerConnectorRunInput): Promise<RetailerConnectorRunResult> {
  const plan = planRetailerConnectorRun(input);
  const baseResult = {
    plan,
    snapshot: null,
    ingestion: emptyIngestionBatch(),
    fetchAttempted: false,
    parserAttempted: false,
    acceptedCount: 0,
    rejectedCount: 0
  };

  if (plan.status === 'blocked') return { ...baseResult, status: 'blocked', requiredActions: plan.requiredActions };
  if (plan.status === 'duplicate') return { ...baseResult, status: 'duplicate', requiredActions: plan.requiredActions };
  if (!plan.provenance.sourceUrl?.trim()) {
    return { ...baseResult, status: 'blocked', requiredActions: [...plan.requiredActions, 'endpoint_url_required'] };
  }

  let snapshot: RetailerConnectorSnapshot | null = null;
  let fetchAttempted = false;
  let parserAttempted = false;

  try {
    fetchAttempted = true;
    snapshot = normalizeSnapshot(await input.fetcher(plan), plan);
    const currentSnapshot = snapshot;
    parserAttempted = true;
    const parsed = await input.parser(currentSnapshot, plan);
    const ingestion = planIngestionBatch(parsed.map((row) => normalizeParsedProduct(row, plan, currentSnapshot)));
    const requiredActions = ingestion.rejected.length > 0 ? ['review_rejected_connector_records'] : [];

    return {
      status: ingestion.accepted.length > 0 || ingestion.rejected.length === 0 ? 'completed' : 'failed',
      plan,
      snapshot,
      ingestion,
      fetchAttempted,
      parserAttempted,
      acceptedCount: ingestion.accepted.length,
      rejectedCount: ingestion.rejected.length,
      requiredActions,
      error: ingestion.accepted.length === 0 && ingestion.rejected.length > 0 ? 'Every parsed connector record was rejected.' : undefined
    };
  } catch (error) {
    return {
      status: 'failed',
      plan,
      snapshot,
      ingestion: emptyIngestionBatch(),
      fetchAttempted,
      parserAttempted,
      acceptedCount: 0,
      rejectedCount: 0,
      requiredActions: ['investigate_connector_run_failure'],
      error: error instanceof Error ? error.message : 'Unknown connector run error.'
    };
  }
}


function recordFrom(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${path}.${key} must be a non-empty string.`);
  return value.trim();
}

function optionalString(record: Record<string, unknown>, key: string, path: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${path}.${key} must be a string.`);
  return value.trim();
}

function requiredNumber(record: Record<string, unknown>, key: string, path: string): number {
  const value = record[key];
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) throw new Error(`${path}.${key} must be a finite number.`);
  return parsed;
}

function optionalNumber(record: Record<string, unknown>, key: string, path: string): number | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) throw new Error(`${path}.${key} must be a finite number.`);
  return parsed;
}

function optionalBoolean(record: Record<string, unknown>, key: string, path: string): boolean | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) return value.toLowerCase() === 'true';
  throw new Error(`${path}.${key} must be a boolean.`);
}

export function parseRetailerProductJsonSnapshot(snapshot: RetailerConnectorSnapshot): RetailerConnectorParsedProduct[] {
  let payload: unknown;
  try {
    payload = JSON.parse(snapshot.body) as unknown;
  } catch (error) {
    throw new Error(`connector snapshot body must be valid JSON: ${error instanceof Error ? error.message : 'unknown parse error'}`);
  }

  const items = Array.isArray(payload) ? payload : recordFrom(payload, 'payload').items;
  if (!Array.isArray(items)) throw new Error('payload.items must be an array, or the snapshot body must be an array.');

  return items.map((item, index) => {
    const path = `items[${index}]`;
    const record = recordFrom(item, path);
    return {
      storeId: optionalString(record, 'storeId', path),
      retailerProductId: optionalString(record, 'retailerProductId', path),
      rawName: requiredString(record, 'rawName', path),
      canonicalName: requiredString(record, 'canonicalName', path),
      productId: requiredString(record, 'productId', path),
      categoryId: requiredString(record, 'categoryId', path),
      brand: optionalString(record, 'brand', path),
      packageSize: requiredNumber(record, 'packageSize', path),
      packageUnit: requiredString(record, 'packageUnit', path),
      price: requiredNumber(record, 'price', path),
      regularPrice: optionalNumber(record, 'regularPrice', path),
      promoText: optionalString(record, 'promoText', path),
      memberOnly: optionalBoolean(record, 'memberOnly', path),
      observedAt: optionalString(record, 'observedAt', path),
      sourceUrl: optionalString(record, 'sourceUrl', path)
    };
  });
}

export type OpenPricesConnectorUrlInput = {
  baseUrl?: string;
  currency?: string;
  countryCode?: string;
  size?: number;
  orderBy?: string;
};

export function buildOpenPricesConnectorUrl(input: OpenPricesConnectorUrlInput = {}): string {
  const url = new URL(input.baseUrl ?? 'https://prices.openfoodfacts.org/api/v1/prices');
  const size = input.size ?? 20;
  if (!Number.isInteger(size) || size < 1 || size > 100) throw new Error('Open Prices size must be an integer between 1 and 100.');
  url.searchParams.set('currency', input.currency ?? 'SEK');
  url.searchParams.set('size', String(size));
  url.searchParams.set('location__osm_address_country_code', input.countryCode ?? 'SE');
  url.searchParams.set('order_by', input.orderBy ?? '-date');
  return url.toString();
}

function dateToObservedAt(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`;
  if (isIsoDate(value)) return new Date(value).toISOString();
  return fallback;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function quantityFromOpenPricesProduct(product: Record<string, unknown>): { packageSize: number; packageUnit: string } | null {
  const quantityValue = product.product_quantity;
  const quantityUnit = firstString(product.product_quantity_unit);
  if (Number.isFinite(typeof quantityValue === 'number' ? quantityValue : Number(quantityValue)) && quantityUnit) {
    return { packageSize: Number(quantityValue), packageUnit: quantityUnit };
  }

  const quantity = firstString(product.quantity);
  const match = quantity?.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|piece|pcs|roll|diaper)\b/i);
  if (!match) return null;
  return { packageSize: Number(match[1].replace(',', '.')), packageUnit: match[2].toLowerCase() };
}

function categoryIdFromTags(value: unknown): string {
  const tags = Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : [];
  const selected = [...tags].reverse().find((tag) => tag.startsWith('en:')) ?? tags.at(-1) ?? 'open-prices';
  return stableKeyPart(selected.replace(/^[a-z]{2}:/, ''));
}

function chainIdFromOpenPricesLocation(location: Record<string, unknown> | null): string {
  if (!location) return 'open-prices';
  return stableKeyPart(firstString(location.osm_brand, location.osm_name, location.osm_tag_value) ?? 'open-prices');
}

function storeIdFromOpenPricesLocation(location: Record<string, unknown> | null, row: Record<string, unknown>): string | undefined {
  const locationId = location?.id ?? row.location_id ?? row.location_osm_id;
  if (locationId === undefined || locationId === null || locationId === '') return undefined;
  return `open-prices-location-${stableKeyPart(String(locationId))}`;
}

export function parseOpenPricesSnapshot(snapshot: RetailerConnectorSnapshot): RetailerConnectorParsedProduct[] {
  let payload: unknown;
  try {
    payload = JSON.parse(snapshot.body) as unknown;
  } catch (error) {
    throw new Error(`Open Prices snapshot body must be valid JSON: ${error instanceof Error ? error.message : 'unknown parse error'}`);
  }

  const items = Array.isArray(payload) ? payload : recordFrom(payload, 'payload').items;
  if (!Array.isArray(items)) throw new Error('Open Prices payload.items must be an array, or the snapshot body must be an array.');

  const products: RetailerConnectorParsedProduct[] = [];
  for (const item of items) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (row.currency !== 'SEK') continue;

    const product = typeof row.product === 'object' && row.product !== null && !Array.isArray(row.product)
      ? row.product as Record<string, unknown>
      : {};
    const location = typeof row.location === 'object' && row.location !== null && !Array.isArray(row.location)
      ? row.location as Record<string, unknown>
      : null;
    const code = firstString(row.product_code, product.code);
    const name = firstString(row.product_name, product.product_name);
    const price = typeof row.price === 'number' ? row.price : Number(row.price);
    const quantity = quantityFromOpenPricesProduct(product);
    if (!code || !name || !Number.isFinite(price) || !quantity) continue;

    const regularPrice = typeof row.price_without_discount === 'number' ? row.price_without_discount : Number(row.price_without_discount);
    const isDiscounted = row.price_is_discounted === true && Number.isFinite(regularPrice) && regularPrice > price;
    const priceId = row.id === undefined || row.id === null ? code : String(row.id);
    const brand = firstString(product.brands)?.split(',').map((part) => part.trim()).find(Boolean);

    products.push({
      sourceType: 'official_api',
      observedAt: dateToObservedAt(row.date, snapshot.retrievedAt),
      chainId: chainIdFromOpenPricesLocation(location),
      storeId: storeIdFromOpenPricesLocation(location, row),
      retailerProductId: `open-prices-price-${stableKeyPart(priceId)}`,
      rawName: name,
      canonicalName: name,
      productId: `off-${stableKeyPart(code)}`,
      categoryId: categoryIdFromTags(product.categories_tags),
      brand,
      packageSize: quantity.packageSize,
      packageUnit: quantity.packageUnit,
      price,
      regularPrice: isDiscounted ? regularPrice : undefined,
      promoText: isDiscounted ? 'Open Prices discounted price' : undefined,
      memberOnly: false,
      sourceUrl: snapshot.sourceUrl
    });
  }

  if (products.length === 0) throw new Error('Open Prices snapshot contained no usable SEK product price rows.');
  return products;
}

export type UnitInput = {
  price: number;
  packageSize: number;
  packageUnit: string;
};

export type UnitPrice = {
  unitPrice: number;
  comparableUnit: string;
};

const round4 = (value: number): number => Math.round((value + Number.EPSILON) * 10000) / 10000;

export function normalizeUnitPrice(input: UnitInput): UnitPrice {
  if (input.price < 0) throw new Error('price must be non-negative.');
  if (input.packageSize <= 0) throw new Error('packageSize must be positive.');
  const unit = input.packageUnit.toLowerCase();
  if (unit === 'g' || unit === 'gram') return { unitPrice: round4(input.price / (input.packageSize / 1000)), comparableUnit: 'kg' };
  if (unit === 'kg') return { unitPrice: round4(input.price / input.packageSize), comparableUnit: 'kg' };
  if (unit === 'ml') return { unitPrice: round4(input.price / (input.packageSize / 1000)), comparableUnit: 'l' };
  if (unit === 'l' || unit === 'liter') return { unitPrice: round4(input.price / input.packageSize), comparableUnit: 'l' };
  if (unit === 'piece' || unit === 'pcs' || unit === 'roll' || unit === 'diaper') return { unitPrice: round4(input.price / input.packageSize), comparableUnit: unit };
  throw new Error(`Unsupported package unit: ${input.packageUnit}`);
}

export type RetailerProductInput = {
  sourceType: SourceType;
  observedAt: string;
  parserVersion: string;
  rawSnapshotRef: string;
  sourceRunId?: string;
  chainId: string;
  storeId?: string;
  retailerProductId?: string;
  rawName: string;
  canonicalName: string;
  productId: string;
  categoryId: string;
  brand?: string;
  packageSize: number;
  packageUnit: string;
  price: number;
  regularPrice?: number;
  promoText?: string;
  memberOnly?: boolean;
  sourceUrl?: string;
};

export type PriceType =
  | 'online'
  | 'flyer'
  | 'member'
  | 'in_store'
  | 'receipt'
  | 'shelf_photo'
  | 'manual'
  | 'estimated';

export type PriceProvenance = {
  sourceType: SourceType;
  sourceUrl?: string;
  observedAt: string;
  parserVersion: string;
  rawSnapshotRef: string;
  sourceRunId?: string;
};

export type IngestedProduct = {
  id: string;
  canonicalName: string;
  brand?: string;
  categoryId: string;
  packageSize: number;
  packageUnit: string;
  comparableUnit: string;
};

export type IngestedAlias = {
  rawName: string;
  sourceType: SourceType;
  matchedProductId: string;
  matchConfidence: number;
  reviewedByHuman: boolean;
};

export type IngestedPriceObservation = {
  productId: string;
  retailerProductId?: string;
  storeId?: string;
  chainId: string;
  observedAt: string;
  price: number;
  unitPrice: number;
  currency: 'SEK';
  regularPrice?: number;
  promoPrice?: number;
  memberPrice?: number;
  promoType?: string;
  priceType: PriceType;
  sourceType: SourceType;
  sourceUrl?: string;
  parserVersion: string;
  rawSnapshotRef: string;
  sourceRunId?: string;
  provenance: PriceProvenance;
  confidenceScore: number;
  isOnlinePrice: boolean;
  isInstorePrice: boolean;
};

export type IngestedPromotionObservation = {
  productId: string;
  chainId: string;
  storeId?: string;
  promoPrice: number;
  regularPriceClaimed?: number;
  promoText: string;
  memberOnly: boolean;
  priceType: PriceType;
  sourceType: SourceType;
  provenance: PriceProvenance;
  confidenceScore: number;
};

export type IngestionOutput = {
  product: IngestedProduct;
  alias: IngestedAlias;
  priceObservation: IngestedPriceObservation;
  promotionObservation: IngestedPromotionObservation | null;
};

function validateInput(input: RetailerProductInput): void {
  if (!input.rawName.trim()) throw new Error('rawName is required.');
  if (!input.canonicalName.trim()) throw new Error('canonicalName is required.');
  if (!input.productId.trim()) throw new Error('productId is required.');
  if (!input.categoryId.trim()) throw new Error('categoryId is required.');
  if (!input.chainId.trim()) throw new Error('chainId is required.');
  if (!input.parserVersion.trim()) throw new Error('parserVersion is required.');
  if (!input.rawSnapshotRef.trim()) throw new Error('rawSnapshotRef is required.');
  if (Number.isNaN(Date.parse(input.observedAt))) throw new Error('observedAt must be an ISO date.');
}

function priceTypeForSource(input: RetailerProductInput, hasPromotion: boolean): PriceType {
  if (input.sourceType === 'estimated') return 'estimated';
  if (input.sourceType === 'receipt_scan') return 'receipt';
  if (input.sourceType === 'shelf_photo') return 'shelf_photo';
  if (input.sourceType === 'manual_user_report') return 'manual';
  if (input.sourceType === 'flyer_campaign') return input.memberOnly ? 'member' : 'flyer';
  if (input.sourceType === 'official_api' || input.sourceType === 'retailer_online_page') {
    return hasPromotion && input.memberOnly ? 'member' : 'online';
  }
  return 'estimated';
}

export function ingestRetailerProduct(input: RetailerProductInput): IngestionOutput {
  validateInput(input);
  const confidence = confidenceForSource(input.sourceType);
  const normalized = normalizeUnitPrice(input);
  const hasPromotion = input.regularPrice !== undefined && input.regularPrice > input.price;
  const priceType = priceTypeForSource(input, hasPromotion);
  const provenance: PriceProvenance = {
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    observedAt: input.observedAt,
    parserVersion: input.parserVersion,
    rawSnapshotRef: input.rawSnapshotRef,
    sourceRunId: input.sourceRunId
  };

  return {
    product: {
      id: input.productId,
      canonicalName: input.canonicalName,
      brand: input.brand,
      categoryId: input.categoryId,
      packageSize: input.packageSize,
      packageUnit: input.packageUnit,
      comparableUnit: normalized.comparableUnit
    },
    alias: {
      rawName: input.rawName,
      sourceType: input.sourceType,
      matchedProductId: input.productId,
      matchConfidence: confidence,
      reviewedByHuman: false
    },
    priceObservation: {
      productId: input.productId,
      retailerProductId: input.retailerProductId,
      storeId: input.storeId,
      chainId: input.chainId,
      observedAt: input.observedAt,
      price: input.price,
      unitPrice: normalized.unitPrice,
      currency: 'SEK',
      regularPrice: input.regularPrice,
      promoPrice: hasPromotion ? input.price : undefined,
      promoType: hasPromotion ? 'discount' : undefined,
      priceType,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      parserVersion: input.parserVersion,
      rawSnapshotRef: input.rawSnapshotRef,
      sourceRunId: input.sourceRunId,
      provenance,
      confidenceScore: confidence,
      isOnlinePrice: input.sourceType === 'official_api' || input.sourceType === 'retailer_online_page',
      isInstorePrice: input.sourceType === 'receipt_scan' || input.sourceType === 'shelf_photo' || input.sourceType === 'manual_user_report'
    },
    promotionObservation: hasPromotion
      ? {
          productId: input.productId,
          chainId: input.chainId,
          storeId: input.storeId,
          promoPrice: input.price,
          regularPriceClaimed: input.regularPrice,
          promoText: input.promoText ?? 'Promotion observed',
          memberOnly: input.memberOnly ?? false,
          priceType,
          sourceType: input.sourceType,
          provenance,
          confidenceScore: confidence
        }
      : null
  };
}

export type IngestionBatchPlan = {
  accepted: IngestionOutput[];
  rejected: Array<{ input: RetailerProductInput; reason: string }>;
};

export function planIngestionBatch(inputs: RetailerProductInput[]): IngestionBatchPlan {
  const accepted: IngestionOutput[] = [];
  const rejected: Array<{ input: RetailerProductInput; reason: string }> = [];
  for (const input of inputs) {
    try {
      accepted.push(ingestRetailerProduct(input));
    } catch (error) {
      rejected.push({ input, reason: error instanceof Error ? error.message : 'Unknown ingestion error.' });
    }
  }
  return { accepted, rejected };
}
