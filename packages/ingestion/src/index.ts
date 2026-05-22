import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  createPgQueryExecutor,
  createPostgresPriceObservationWriter,
  createPostgresProductAliasRepository,
  createPostgresSourceRecordWriter,
  type PriceType as DbPriceType,
  type QueryExecutor,
  type SourceRunRecord
} from '@groceryview/db';
import {
  fetchCoopWeeklyDiscountsForAllStores,
  type CoopWeeklyDiscount
} from './connectors/coop.js';
import {
  fetchHemkopWeeklyDiscountsForAllStores,
  type HemkopWeeklyDiscount
} from './connectors/hemkop.js';
import {
  fetchWillysWeeklyDiscountsForAllStores,
  type WillysWeeklyDiscount
} from './connectors/willys.js';

export * from './connectors/openfoodfacts.js';
export * from './connectors/overpass.js';
export * from './connectors/coop.js';
export * from './connectors/hemkop.js';
export * from './connectors/ica.js';
export * from './connectors/ica-reklamblad.js';
export * from './connectors/mathem.js';
export * from './connectors/matpriskollen.js';
export * from './connectors/matspar.js';
export * from './connectors/willys.js';

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

export type OfferVisibilityBoundary =
  | 'public_weekly'
  | 'public_member_price'
  | 'authenticated_member'
  | 'personalized_coupon'
  | 'private_wallet';

export type OfferEligibilityLabel =
  | 'none'
  | 'requires_loyalty_membership'
  | 'requires_login'
  | 'personalized'
  | 'user_private';

export type OfferVisibilityBoundaryPlan = {
  visibility: OfferVisibilityBoundary;
  defaultPolicy: RetailerSourcePolicyLabel;
  canFetch: boolean;
  canEmitPublicCoverage: boolean;
  canAffectDefaultDealScore: boolean;
  requiredEligibilityLabel: OfferEligibilityLabel;
  requiredActions: string[];
};

export type ScbPxWebSelectionFilter = 'item' | 'top' | 'all';
export type ScbPxWebResponseFormat = 'JSON-stat2';
export type ScbPxWebQueryVariable = {
  code: 'VaruTjanstegrupp' | 'ContentsCode' | 'Tid';
  selection: {
    filter: ScbPxWebSelectionFilter;
    values: string[];
  };
};

export type ScbPxWebQueryPayload = {
  query: ScbPxWebQueryVariable[];
  response: { format: ScbPxWebResponseFormat };
};

export type ScbPxWebQueryFixture = {
  fixtureId: string;
  tableId: 'KPI2020COICOP2M' | 'KPI2020COICOPM' | 'KPI2020EPG01M';
  apiVersion: 'v1';
  language: 'sv';
  subjectPath: 'PR/PR0101/PR0101A';
  endpoint: string;
  payload: ScbPxWebQueryPayload;
  expectedDimensions: number[];
  expectedCellCount: number;
  contentCode: string;
  contentLabel: 'Index';
  source: 'SCB';
  license: 'CC0';
  observedMetadata: {
    directoryUpdated: string;
    responseUpdated: string;
    timeRange: string;
    categoryCount: number;
  };
  emitsStorePrices: false;
  emitsSkuPrices: false;
};

export type ScbPxWebQueryFixtureValidation = {
  status: 'valid' | 'invalid';
  fixtureIds: string[];
  issues: string[];
};

export type GroceryCategoryMappingScope = 'category' | 'hero_product';
export type GroceryCategoryMappingConfidence = 'high' | 'medium' | 'product_required' | 'unmapped';
export type GroceryCategoryCoicopMapping = {
  mappingId: string;
  scope: GroceryCategoryMappingScope;
  groceryCategoryId: string;
  heroProductSlug?: string;
  scbCoicopCode?: typeof scbCoicopFoodCategoryCodes[number];
  scbTableId?: ScbPxWebQueryFixture['tableId'];
  scbContentCode?: string;
  livsmedelsverketFoodNumber?: number;
  livsmedelsverketFoodName?: string;
  mappingConfidence: GroceryCategoryMappingConfidence;
  mappingReason: string;
  canUseForCategoryIndexBaseline: boolean;
  canUseForNutritionFacts: boolean;
  canUseForStorePrice: false;
};

export type GroceryCategoryCoicopMappingValidation = {
  status: 'valid' | 'invalid';
  mappingIds: string[];
  issues: string[];
};

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

export const offerVisibilityBoundaryPlans: OfferVisibilityBoundaryPlan[] = [
  {
    visibility: 'public_weekly',
    defaultPolicy: 'fixture_review',
    canFetch: false,
    canEmitPublicCoverage: true,
    canAffectDefaultDealScore: true,
    requiredEligibilityLabel: 'none',
    requiredActions: ['fixture_review_required']
  },
  {
    visibility: 'public_member_price',
    defaultPolicy: 'fixture_review',
    canFetch: false,
    canEmitPublicCoverage: true,
    canAffectDefaultDealScore: true,
    requiredEligibilityLabel: 'requires_loyalty_membership',
    requiredActions: ['fixture_review_required', 'loyalty_eligibility_label_required']
  },
  {
    visibility: 'authenticated_member',
    defaultPolicy: 'stub_only',
    canFetch: false,
    canEmitPublicCoverage: false,
    canAffectDefaultDealScore: false,
    requiredEligibilityLabel: 'requires_login',
    requiredActions: ['stub_only_no_network_fetch', 'login_surface_permission_required']
  },
  {
    visibility: 'personalized_coupon',
    defaultPolicy: 'stub_only',
    canFetch: false,
    canEmitPublicCoverage: false,
    canAffectDefaultDealScore: false,
    requiredEligibilityLabel: 'personalized',
    requiredActions: ['stub_only_no_network_fetch', 'personalized_offer_permission_required']
  },
  {
    visibility: 'private_wallet',
    defaultPolicy: 'stub_only',
    canFetch: false,
    canEmitPublicCoverage: false,
    canAffectDefaultDealScore: false,
    requiredEligibilityLabel: 'user_private',
    requiredActions: ['stub_only_no_network_fetch', 'private_wallet_consent_required']
  }
];

export function planOfferVisibilityBoundary(visibility: OfferVisibilityBoundary): OfferVisibilityBoundaryPlan {
  const plan = offerVisibilityBoundaryPlans.find((candidate) => candidate.visibility === visibility);
  if (!plan) throw new Error(`No offer visibility boundary for ${visibility}.`);
  return {
    ...plan,
    requiredActions: [...plan.requiredActions]
  };
}

const SCB_PXWEB_V1_BASE = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/PR/PR0101/PR0101A';
const SCB_DIRECTORY_UPDATED = '2026-05-13T08:00:00';
const SCB_RESPONSE_UPDATED = '2026-05-13T06:00:00Z';
export const scbCoicopFoodCategoryCodes = [
  '01',
  '01.1',
  '01.2',
  '01.1.1',
  '01.1.2',
  '01.1.3',
  '01.1.4',
  '01.1.5',
  '01.1.6',
  '01.1.7',
  '01.1.8',
  '01.1.9',
  '01.2.1',
  '01.2.2',
  '01.2.3',
  '01.2.5',
  '01.2.6',
  '01.2.9'
] as const;

function scbEndpoint(tableId: ScbPxWebQueryFixture['tableId']): string {
  return `${SCB_PXWEB_V1_BASE}/${tableId}`;
}

export const scbPxWebQueryFixtures: ScbPxWebQueryFixture[] = [
  {
    fixtureId: 'scb-kpi2020-coicop2m-food-division-index-top12',
    tableId: 'KPI2020COICOP2M',
    apiVersion: 'v1',
    language: 'sv',
    subjectPath: 'PR/PR0101/PR0101A',
    endpoint: scbEndpoint('KPI2020COICOP2M'),
    payload: {
      query: [
        { code: 'VaruTjanstegrupp', selection: { filter: 'item', values: ['01'] } },
        { code: 'ContentsCode', selection: { filter: 'item', values: ['0000080C'] } },
        { code: 'Tid', selection: { filter: 'top', values: ['12'] } }
      ],
      response: { format: 'JSON-stat2' }
    },
    expectedDimensions: [1, 1, 12],
    expectedCellCount: 12,
    contentCode: '0000080C',
    contentLabel: 'Index',
    source: 'SCB',
    license: 'CC0',
    observedMetadata: {
      directoryUpdated: SCB_DIRECTORY_UPDATED,
      responseUpdated: SCB_RESPONSE_UPDATED,
      timeRange: '1980M01..2026M04',
      categoryCount: 14
    },
    emitsStorePrices: false,
    emitsSkuPrices: false
  },
  {
    fixtureId: 'scb-kpi2020-coicopm-food-category-index-top12',
    tableId: 'KPI2020COICOPM',
    apiVersion: 'v1',
    language: 'sv',
    subjectPath: 'PR/PR0101/PR0101A',
    endpoint: scbEndpoint('KPI2020COICOPM'),
    payload: {
      query: [
        { code: 'VaruTjanstegrupp', selection: { filter: 'item', values: [...scbCoicopFoodCategoryCodes] } },
        { code: 'ContentsCode', selection: { filter: 'item', values: ['0000080H'] } },
        { code: 'Tid', selection: { filter: 'top', values: ['12'] } }
      ],
      response: { format: 'JSON-stat2' }
    },
    expectedDimensions: [18, 1, 12],
    expectedCellCount: 216,
    contentCode: '0000080H',
    contentLabel: 'Index',
    source: 'SCB',
    license: 'CC0',
    observedMetadata: {
      directoryUpdated: SCB_DIRECTORY_UPDATED,
      responseUpdated: SCB_RESPONSE_UPDATED,
      timeRange: '1980M01..2026M04',
      categoryCount: 398
    },
    emitsStorePrices: false,
    emitsSkuPrices: false
  },
  {
    fixtureId: 'scb-kpi2020-epg01m-fine-food-index-all',
    tableId: 'KPI2020EPG01M',
    apiVersion: 'v1',
    language: 'sv',
    subjectPath: 'PR/PR0101/PR0101A',
    endpoint: scbEndpoint('KPI2020EPG01M'),
    payload: {
      query: [
        { code: 'VaruTjanstegrupp', selection: { filter: 'all', values: ['*'] } },
        { code: 'ContentsCode', selection: { filter: 'item', values: ['0000080N'] } },
        { code: 'Tid', selection: { filter: 'all', values: ['*'] } }
      ],
      response: { format: 'JSON-stat2' }
    },
    expectedDimensions: [97, 1, 4],
    expectedCellCount: 388,
    contentCode: '0000080N',
    contentLabel: 'Index',
    source: 'SCB',
    license: 'CC0',
    observedMetadata: {
      directoryUpdated: SCB_DIRECTORY_UPDATED,
      responseUpdated: SCB_RESPONSE_UPDATED,
      timeRange: '2026M01..2026M04',
      categoryCount: 97
    },
    emitsStorePrices: false,
    emitsSkuPrices: false
  }
];

const SCB_COICOPM_CONTENT_CODE = '0000080H';
const currentHeroProductSlugs = [
  'standardmjolk-1l',
  'agg-12-pack',
  'smor-500g',
  'bryggkaffe-450g',
  'kycklingfile-1kg',
  'notfars-500g',
  'pasta-500g',
  'basmatiris-1kg',
  'formbrod-rost-700g',
  'hushallsost-1kg',
  'bananer-1kg',
  'tomater-500g',
  'potatis-2kg',
  'toalettpapper-8-pack',
  'tvattmedel-color-1l',
  'blojor-storlek-4',
  'havredryck-1l',
  'naturell-yoghurt-1kg',
  'olivolja-500ml',
  'fryst-pizza-350g'
] as const;

const activeGroceryCategoryIds = [
  'bakery',
  'bread',
  'butter',
  'coffee',
  'dairy',
  'eggs',
  'frozen',
  'fruit',
  'meat',
  'pantry',
  'rice',
  'snacks',
  'vegetables'
] as const;

function coicopFoodMapping(input: Omit<GroceryCategoryCoicopMapping, 'scbTableId' | 'scbContentCode' | 'canUseForStorePrice'>): GroceryCategoryCoicopMapping {
  return {
    ...input,
    scbTableId: 'KPI2020COICOPM',
    scbContentCode: SCB_COICOPM_CONTENT_CODE,
    canUseForStorePrice: false
  };
}

function unmappedGroceryMapping(input: Omit<GroceryCategoryCoicopMapping, 'canUseForCategoryIndexBaseline' | 'canUseForNutritionFacts' | 'canUseForStorePrice' | 'mappingConfidence'>): GroceryCategoryCoicopMapping {
  return {
    ...input,
    mappingConfidence: 'unmapped',
    canUseForCategoryIndexBaseline: false,
    canUseForNutritionFacts: false,
    canUseForStorePrice: false
  };
}

export const groceryCategoryCoicopMappings: GroceryCategoryCoicopMapping[] = [
  coicopFoodMapping({ mappingId: 'category:bakery', scope: 'category', groceryCategoryId: 'bakery', scbCoicopCode: '01.1.1', mappingConfidence: 'medium', mappingReason: 'Bakery is represented as bread and cereals for CPI baselines; product-level mapping is required for pastries and non-bread bakery items.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:bread', scope: 'category', groceryCategoryId: 'bread', scbCoicopCode: '01.1.1', mappingConfidence: 'high', mappingReason: 'Bread products map directly to SCB bread and cereals for price-index baselines.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:butter', scope: 'category', groceryCategoryId: 'butter', scbCoicopCode: '01.1.5', mappingConfidence: 'high', mappingReason: 'Butter is covered by SCB oils and fats.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:coffee', scope: 'category', groceryCategoryId: 'coffee', scbCoicopCode: '01.2.1', mappingConfidence: 'high', mappingReason: 'Coffee is represented by SCB coffee, tea and cocoa.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:dairy', scope: 'category', groceryCategoryId: 'dairy', scbCoicopCode: '01.1.4', mappingConfidence: 'medium', mappingReason: 'Dairy spans milk, cheese, yoghurt and eggs; product-level mappings are required before nutrition facts.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:eggs', scope: 'category', groceryCategoryId: 'eggs', scbCoicopCode: '01.1.4', mappingConfidence: 'high', mappingReason: 'Eggs are included in SCB milk, cheese and eggs.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:frozen', scope: 'category', groceryCategoryId: 'frozen', scbCoicopCode: '01.1.9', mappingConfidence: 'product_required', mappingReason: 'Frozen includes prepared meals and single-ingredient foods, so only product mappings can choose a defensible baseline.', canUseForCategoryIndexBaseline: false, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:fruit', scope: 'category', groceryCategoryId: 'fruit', scbCoicopCode: '01.1.6', mappingConfidence: 'high', mappingReason: 'Fruit maps directly to SCB fruit.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:meat', scope: 'category', groceryCategoryId: 'meat', scbCoicopCode: '01.1.2', mappingConfidence: 'high', mappingReason: 'Meat products map to SCB meat.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:pantry', scope: 'category', groceryCategoryId: 'pantry', scbCoicopCode: '01.1.9', mappingConfidence: 'product_required', mappingReason: 'Pantry spans coffee, rice, pasta, oils and canned foods; category-level baselines are disabled until product mappings choose the specific SCB group.', canUseForCategoryIndexBaseline: false, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:rice', scope: 'category', groceryCategoryId: 'rice', scbCoicopCode: '01.1.1', mappingConfidence: 'high', mappingReason: 'Rice is represented by bread and cereals for CPI baselines.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:snacks', scope: 'category', groceryCategoryId: 'snacks', scbCoicopCode: '01.1.8', mappingConfidence: 'product_required', mappingReason: 'Snacks can map to sugar, confectionery or prepared-food groups depending on product; category baselines are disabled.', canUseForCategoryIndexBaseline: false, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'category:vegetables', scope: 'category', groceryCategoryId: 'vegetables', scbCoicopCode: '01.1.7', mappingConfidence: 'high', mappingReason: 'Vegetables map directly to SCB vegetables.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'hero:standardmjolk-1l', scope: 'hero_product', groceryCategoryId: 'dairy', heroProductSlug: 'standardmjolk-1l', scbCoicopCode: '01.1.4', livsmedelsverketFoodNumber: 123, livsmedelsverketFoodName: 'Mjolk fett 3% berikad', mappingConfidence: 'high', mappingReason: 'Seed product is standard milk and has a direct Livsmedelsverket milk concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:agg-12-pack', scope: 'hero_product', groceryCategoryId: 'eggs', heroProductSlug: 'agg-12-pack', scbCoicopCode: '01.1.4', livsmedelsverketFoodNumber: 1225, livsmedelsverketFoodName: 'Agg ratt', mappingConfidence: 'high', mappingReason: 'Eggs are explicitly covered by SCB milk, cheese and eggs and have a direct Livsmedelsverket egg concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:smor-500g', scope: 'hero_product', groceryCategoryId: 'butter', heroProductSlug: 'smor-500g', scbCoicopCode: '01.1.5', livsmedelsverketFoodNumber: 29, livsmedelsverketFoodName: 'Smor fett 80%', mappingConfidence: 'high', mappingReason: 'Butter maps to oils and fats and has a direct Livsmedelsverket butter concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:bryggkaffe-450g', scope: 'hero_product', groceryCategoryId: 'coffee', heroProductSlug: 'bryggkaffe-450g', scbCoicopCode: '01.2.1', livsmedelsverketFoodNumber: 1955, livsmedelsverketFoodName: 'Snabbkaffe pulver', mappingConfidence: 'medium', mappingReason: 'Coffee belongs to SCB coffee, tea and cocoa; Livsmedelsverket concept is only a reviewed proxy for dry coffee until a brewed/ground distinction is selected.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'hero:kycklingfile-1kg', scope: 'hero_product', groceryCategoryId: 'meat', heroProductSlug: 'kycklingfile-1kg', scbCoicopCode: '01.1.2', livsmedelsverketFoodNumber: 1173, livsmedelsverketFoodName: 'Kyckling brostfile ra u. skinn', mappingConfidence: 'high', mappingReason: 'Chicken fillet maps to meat and has a direct raw chicken breast concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:notfars-500g', scope: 'hero_product', groceryCategoryId: 'meat', heroProductSlug: 'notfars-500g', scbCoicopCode: '01.1.2', livsmedelsverketFoodNumber: 951, livsmedelsverketFoodName: 'Not fars ra fett 10%', mappingConfidence: 'high', mappingReason: 'Minced beef maps to meat and has a direct raw minced beef concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:pasta-500g', scope: 'hero_product', groceryCategoryId: 'pantry', heroProductSlug: 'pasta-500g', scbCoicopCode: '01.1.1', livsmedelsverketFoodNumber: 845, livsmedelsverketFoodName: 'Pasta okokt', mappingConfidence: 'high', mappingReason: 'Dry pasta is a cereal product and has a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:basmatiris-1kg', scope: 'hero_product', groceryCategoryId: 'rice', heroProductSlug: 'basmatiris-1kg', scbCoicopCode: '01.1.1', livsmedelsverketFoodNumber: 2475, livsmedelsverketFoodName: 'Ris basmati okokt', mappingConfidence: 'high', mappingReason: 'Basmati rice is a cereal product and has a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:formbrod-rost-700g', scope: 'hero_product', groceryCategoryId: 'bread', heroProductSlug: 'formbrod-rost-700g', scbCoicopCode: '01.1.1', mappingConfidence: 'high', mappingReason: 'Toast bread maps directly to bread and cereals; nutrition facts wait for a reviewed Livsmedelsverket bread concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false }),
  coicopFoodMapping({ mappingId: 'hero:hushallsost-1kg', scope: 'hero_product', groceryCategoryId: 'dairy', heroProductSlug: 'hushallsost-1kg', scbCoicopCode: '01.1.4', livsmedelsverketFoodNumber: 78, livsmedelsverketFoodName: 'Ost hardost fett 23%', mappingConfidence: 'high', mappingReason: 'Household cheese maps to milk, cheese and eggs and has a direct hard-cheese concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:bananer-1kg', scope: 'hero_product', groceryCategoryId: 'fruit', heroProductSlug: 'bananer-1kg', scbCoicopCode: '01.1.6', livsmedelsverketFoodNumber: 553, livsmedelsverketFoodName: 'Banan', mappingConfidence: 'high', mappingReason: 'Bananas map to fruit and have a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:tomater-500g', scope: 'hero_product', groceryCategoryId: 'vegetables', heroProductSlug: 'tomater-500g', scbCoicopCode: '01.1.7', livsmedelsverketFoodNumber: 364, livsmedelsverketFoodName: 'Tomat', mappingConfidence: 'high', mappingReason: 'Tomatoes map to vegetables and have a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:potatis-2kg', scope: 'hero_product', groceryCategoryId: 'vegetables', heroProductSlug: 'potatis-2kg', scbCoicopCode: '01.1.7', livsmedelsverketFoodNumber: 230, livsmedelsverketFoodName: 'Potatis host ra', mappingConfidence: 'high', mappingReason: 'Potatoes map to vegetables and have a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  unmappedGroceryMapping({ mappingId: 'hero:toalettpapper-8-pack', scope: 'hero_product', groceryCategoryId: 'household', heroProductSlug: 'toalettpapper-8-pack', mappingReason: 'Toilet paper is outside SCB food/non-alcoholic beverage categories and outside Livsmedelsverket food concepts.' }),
  unmappedGroceryMapping({ mappingId: 'hero:tvattmedel-color-1l', scope: 'hero_product', groceryCategoryId: 'household', heroProductSlug: 'tvattmedel-color-1l', mappingReason: 'Laundry detergent is outside SCB food/non-alcoholic beverage categories and outside Livsmedelsverket food concepts.' }),
  unmappedGroceryMapping({ mappingId: 'hero:blojor-storlek-4', scope: 'hero_product', groceryCategoryId: 'baby', heroProductSlug: 'blojor-storlek-4', mappingReason: 'Diapers are outside SCB food/non-alcoholic beverage categories and outside Livsmedelsverket food concepts.' }),
  coicopFoodMapping({ mappingId: 'hero:havredryck-1l', scope: 'hero_product', groceryCategoryId: 'dairy_alt', heroProductSlug: 'havredryck-1l', scbCoicopCode: '01.1.4', livsmedelsverketFoodNumber: 700, livsmedelsverketFoodName: 'Havredryck fett 1,5% berikad', mappingConfidence: 'medium', mappingReason: 'Oat drink has a direct Livsmedelsverket concept; SCB category uses the closest milk, cheese and eggs baseline until plant-drink subcategory metadata is reviewed.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:naturell-yoghurt-1kg', scope: 'hero_product', groceryCategoryId: 'dairy', heroProductSlug: 'naturell-yoghurt-1kg', scbCoicopCode: '01.1.4', livsmedelsverketFoodNumber: 124, livsmedelsverketFoodName: 'Yoghurt naturell fett 3% berikad', mappingConfidence: 'high', mappingReason: 'Plain yoghurt maps to milk, cheese and eggs and has a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:olivolja-500ml', scope: 'hero_product', groceryCategoryId: 'pantry', heroProductSlug: 'olivolja-500ml', scbCoicopCode: '01.1.5', livsmedelsverketFoodNumber: 35, livsmedelsverketFoodName: 'Olivolja', mappingConfidence: 'high', mappingReason: 'Olive oil maps to oils and fats and has a direct Livsmedelsverket concept.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: true }),
  coicopFoodMapping({ mappingId: 'hero:fryst-pizza-350g', scope: 'hero_product', groceryCategoryId: 'frozen', heroProductSlug: 'fryst-pizza-350g', scbCoicopCode: '01.1.9', livsmedelsverketFoodNumber: 762, livsmedelsverketFoodName: 'Pizza Capricciosa frysvara', mappingConfidence: 'medium', mappingReason: 'Frozen pizza maps to prepared food products; nutrition facts require recipe and brand review before use.', canUseForCategoryIndexBaseline: true, canUseForNutritionFacts: false })
];

export function cellCountForScbPxWebQueryFixture(fixture: ScbPxWebQueryFixture): number {
  return fixture.expectedDimensions.reduce((product, dimension) => product * dimension, 1);
}

export function cacheKeyForScbPxWebQueryFixture(fixture: ScbPxWebQueryFixture): string {
  const queryKey = fixture.payload.query
    .map((variable) => `${variable.code}=${variable.selection.filter}(${variable.selection.values.join(',')})`)
    .join(':');
  return [
    'scb',
    'pxweb',
    fixture.apiVersion,
    fixture.language,
    fixture.subjectPath,
    fixture.tableId,
    fixture.payload.response.format.toLowerCase(),
    queryKey
  ].join(':');
}

export function validateScbPxWebQueryFixtures(fixtures: ScbPxWebQueryFixture[]): ScbPxWebQueryFixtureValidation {
  const issues: string[] = [];
  const fixtureIds = fixtures.map((fixture) => fixture.fixtureId).sort();

  for (const fixture of fixtures) {
    if (!fixture.endpoint.startsWith(`${SCB_PXWEB_V1_BASE}/`)) issues.push(`invalid_endpoint:${fixture.fixtureId}`);
    if (fixture.source !== 'SCB') issues.push(`invalid_source:${fixture.fixtureId}`);
    if (fixture.license !== 'CC0') issues.push(`invalid_license:${fixture.fixtureId}`);
    if (fixture.contentLabel !== 'Index') issues.push(`non_index_content:${fixture.fixtureId}`);
    if (fixture.emitsStorePrices || fixture.emitsSkuPrices) issues.push(`emits_store_or_sku_prices:${fixture.fixtureId}`);
    if (cellCountForScbPxWebQueryFixture(fixture) !== fixture.expectedCellCount) issues.push(`cell_count_mismatch:${fixture.fixtureId}`);
    if (fixture.expectedCellCount > 100000) issues.push(`v1_cell_limit_exceeded:${fixture.fixtureId}`);
    if (fixture.payload.response.format !== 'JSON-stat2') issues.push(`invalid_response_format:${fixture.fixtureId}`);
    const contentSelection = fixture.payload.query.find((variable) => variable.code === 'ContentsCode');
    if (!contentSelection?.selection.values.includes(fixture.contentCode)) issues.push(`content_code_not_selected:${fixture.fixtureId}`);
  }

  const categoryFixture = fixtures.find((fixture) => fixture.tableId === 'KPI2020COICOPM');
  const categoryValues = categoryFixture?.payload.query.find((variable) => variable.code === 'VaruTjanstegrupp')?.selection.values ?? [];
  if (categoryValues.includes('01.2.4')) issues.push('missing_metadata_code_selected:01.2.4');

  const epgFixture = fixtures.find((fixture) => fixture.tableId === 'KPI2020EPG01M');
  if (epgFixture && !epgFixture.observedMetadata.timeRange.startsWith('2026M01')) issues.push('epg01_not_marked_2026_only');

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    fixtureIds,
    issues
  };
}

export function validateGroceryCategoryCoicopMappings(mappings: GroceryCategoryCoicopMapping[]): GroceryCategoryCoicopMappingValidation {
  const issues: string[] = [];
  const mappingIds = mappings.map((mapping) => mapping.mappingId).sort();
  const mappingIdSet = new Set<string>();
  const heroSlugSet = new Set<string>();
  const categoryIdSet = new Set<string>();
  const validScbCodes = new Set<string>(scbCoicopFoodCategoryCodes);

  for (const mapping of mappings) {
    if (mappingIdSet.has(mapping.mappingId)) issues.push(`duplicate_mapping_id:${mapping.mappingId}`);
    mappingIdSet.add(mapping.mappingId);
    if (!mapping.mappingReason.trim()) issues.push(`missing_reason:${mapping.mappingId}`);
    if (mapping.canUseForStorePrice) issues.push(`emits_store_price:${mapping.mappingId}`);

    if (mapping.scope === 'hero_product') {
      if (!mapping.heroProductSlug) issues.push(`missing_hero_slug:${mapping.mappingId}`);
      else heroSlugSet.add(mapping.heroProductSlug);
    }
    if (mapping.scope === 'category') {
      if (mapping.heroProductSlug) issues.push(`category_has_hero_slug:${mapping.mappingId}`);
      categoryIdSet.add(mapping.groceryCategoryId);
    }

    if (mapping.mappingConfidence === 'unmapped') {
      if (mapping.scbCoicopCode || mapping.livsmedelsverketFoodNumber || mapping.canUseForCategoryIndexBaseline || mapping.canUseForNutritionFacts) {
        issues.push(`unmapped_has_food_outputs:${mapping.mappingId}`);
      }
      continue;
    }

    if (!mapping.scbCoicopCode) issues.push(`missing_scb_code:${mapping.mappingId}`);
    if (mapping.scbCoicopCode && !validScbCodes.has(mapping.scbCoicopCode)) issues.push(`unknown_scb_code:${mapping.mappingId}:${mapping.scbCoicopCode}`);
    if (!mapping.scbTableId || mapping.scbTableId !== 'KPI2020COICOPM') issues.push(`invalid_scb_table:${mapping.mappingId}`);
    if (mapping.scbContentCode !== SCB_COICOPM_CONTENT_CODE) issues.push(`invalid_scb_content:${mapping.mappingId}`);
    if (mapping.scope === 'category' && mapping.canUseForNutritionFacts) issues.push(`category_emits_nutrition:${mapping.mappingId}`);
  }

  for (const heroSlug of currentHeroProductSlugs) {
    if (!heroSlugSet.has(heroSlug)) issues.push(`missing_hero_mapping:${heroSlug}`);
  }
  for (const categoryId of activeGroceryCategoryIds) {
    if (!categoryIdSet.has(categoryId)) issues.push(`missing_category_mapping:${categoryId}`);
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    mappingIds,
    issues
  };
}

export function groceryCategoryCoicopMappingsCanEmitStorePrices(): false {
  return false;
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

type ParsedPackageQuantity = {
  packageSize: number;
  packageUnit: string;
};

function parseNativePackageText(value: string): ParsedPackageQuantity {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*(kg|g|gram|l|liter|ml|st|styck|pcs|piece|pack)\b/i);
  if (!match) return { packageSize: 1, packageUnit: 'piece' };
  const unit = match[2].toLowerCase();
  const packageUnit = unit === 'st' || unit === 'styck' || unit === 'pack' ? 'piece' : unit === 'liter' ? 'l' : unit === 'gram' ? 'g' : unit;
  return { packageSize: Number(match[1].replace(',', '.')), packageUnit };
}

function nativePriceFromText(value: string): number | undefined {
  const match = value.match(/(\d+(?:[,.]\d+)?)/);
  if (!match) return undefined;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dailyNativeNumberParam(url: URL, name: string): number | undefined {
  const value = url.searchParams.get(name);
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

function dailyNativeStringListParam(url: URL, name: string): string[] | undefined {
  const value = url.searchParams.get(name);
  if (value === null || value.trim() === '') return undefined;
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function willysWeeklyDiscountToDailyItem(row: WillysWeeklyDiscount): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const regularPrice = nativePriceFromText(row.regularPriceText);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `willys-${stableKeyPart(row.productCode || row.code)}`,
    categoryId: stableKeyPart(row.category || 'weekly-offers'),
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: regularPrice !== undefined && regularPrice > row.price ? regularPrice : undefined,
    promoText: row.conditionText || row.priceText || undefined,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl
  };
}

function hemkopWeeklyDiscountToDailyItem(row: HemkopWeeklyDiscount): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const regularPrice = nativePriceFromText(row.regularPriceText);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `hemkop-${stableKeyPart(row.productCode || row.code)}`,
    categoryId: stableKeyPart(row.category || 'weekly-offers'),
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: regularPrice !== undefined && regularPrice > row.price ? regularPrice : undefined,
    promoText: row.conditionText || row.priceText || undefined,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl
  };
}

function coopWeeklyDiscountToDailyItem(row: CoopWeeklyDiscount): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `coop-${stableKeyPart(row.ean || row.code)}`,
    categoryId: 'weekly-offers',
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.offerPrice,
    regularPrice: row.ordinaryPrice > row.offerPrice ? row.ordinaryPrice : undefined,
    promoText: row.offerMechanicText || row.offerPriceText || undefined,
    memberOnly: row.medMeraRequired,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl
  };
}

function dailyNativeSnapshotResult(input: {
  plan: RetailerConnectorRunPlan;
  retrievedAt: string;
  items: RetailerConnectorParsedProduct[];
}): RetailerConnectorFetchResult {
  const body = JSON.stringify({ items: input.items });
  const contentHash = contentHashFor(body);
  const refHash = contentHash.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return {
    statusCode: 200,
    body,
    contentType: 'application/json',
    retrievedAt: input.retrievedAt,
    sourceUrl: input.plan.provenance.sourceUrl,
    rawSnapshotRef: `raw://daily-native/${stableKeyPart(input.plan.sourceRunId)}/${refHash}`,
    contentHash
  };
}

export async function fetchDailyConnectorSnapshot(
  plan: RetailerConnectorRunPlan,
  options: FetchRetailerConnectorSnapshotOptions = {}
): Promise<RetailerConnectorFetchResult> {
  const sourceUrl = plan.provenance.sourceUrl;
  if (sourceUrl === GROCERYVIEW_DAILY_WILLYS_ALL_STORE_WEEKLY_OFFERS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_WILLYS_ALL_STORE_WEEKLY_OFFERS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchWillysWeeklyDiscountsForAllStores({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      pageSize: dailyNativeNumberParam(url, 'pageSize'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(willysWeeklyDiscountToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_WEEKLY_OFFERS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_WEEKLY_OFFERS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchHemkopWeeklyDiscountsForAllStores({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      pageSize: dailyNativeNumberParam(url, 'pageSize'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(hemkopWeeklyDiscountToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_COOP_ALL_STORE_WEEKLY_OFFERS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_COOP_ALL_STORE_WEEKLY_OFFERS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchCoopWeeklyDiscountsForAllStores({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      productQueries: dailyNativeStringListParam(url, 'productQueries'),
      includeStoreDetails: url.searchParams.get('includeStoreDetails') === 'true',
      subscriptionKey: url.searchParams.get('subscriptionKey') ?? undefined,
      storeApiSubscriptionKey: url.searchParams.get('storeApiSubscriptionKey') ?? undefined,
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(coopWeeklyDiscountToDailyItem) });
  }

  return await fetchRetailerConnectorSnapshot(plan, options);
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

export type DailyIngestionStoreConfig = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  countryCode?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  storeType?: string;
};

export type DailyIngestionConnectorConfig = Omit<RetailerConnectorPlanInput, 'requestedAt'> & {
  requestedAt?: string;
  stores?: DailyIngestionStoreConfig[];
  requireStoreScopedPrices?: boolean;
};

export type DailyIngestionEnv = Partial<Record<'DATABASE_URL' | 'GROCERYVIEW_DAILY_CONNECTORS_JSON', string>>;

export type DailyIngestionEnvConfig = {
  databaseUrl: string;
  connectors: DailyIngestionConnectorConfig[];
};

export type DailyIngestionRunInput = {
  executor: QueryExecutor;
  requestedAt: string;
  connectors: DailyIngestionConnectorConfig[];
  fetchImpl?: typeof fetch;
};

export type DailyIngestionRunResult = {
  status: 'succeeded' | 'partial' | 'blocked';
  blockers: string[];
  persistedRuns: number;
  acceptedCount: number;
  rejectedCount: number;
  sourceRunIds: string[];
  rawRecordIds: string[];
  observationIds: string[];
};

type IdRow = { id: string };

const dailyRequiredConnectorFields = [
  'connectorId',
  'chainId',
  'sourceType',
  'endpointUrl',
  'parserVersion',
  'robotsTxtStatus',
  'legalReviewStatus',
  'hasDataAgreement'
] as const;

export const requiredDailyIngestionChainIds = [
  'ica',
  'willys',
  'coop',
  'hemkop',
  'lidl',
  'city_gross'
] as const;

export const GROCERYVIEW_DAILY_WILLYS_ALL_STORE_WEEKLY_OFFERS_URL = 'groceryview://daily/willys/weekly-offers/all-stores';
export const GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_WEEKLY_OFFERS_URL = 'groceryview://daily/hemkop/weekly-offers/all-stores';
export const GROCERYVIEW_DAILY_COOP_ALL_STORE_WEEKLY_OFFERS_URL = 'groceryview://daily/coop/weekly-offers/all-stores';

const requireForDailyIngestion = createRequire(import.meta.url);

function parseDailyStoreConfigs(value: unknown, path: string): DailyIngestionStoreConfig[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error(`${path} must be an array when provided.`);
  return value.map((entry, index) => {
    const storePath = `${path}[${index}]`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${storePath} must be an object.`);
    const record = entry as Record<string, unknown>;
    for (const field of ['storeId', 'name', 'address', 'city']) {
      if (typeof record[field] !== 'string' || !record[field].trim()) throw new Error(`${storePath}.${field} is required.`);
    }
    const optionalString = (field: string): string | undefined => {
      const candidate = record[field];
      if (candidate === undefined || candidate === null || candidate === '') return undefined;
      if (typeof candidate !== 'string') throw new Error(`${storePath}.${field} must be a string.`);
      return candidate.trim();
    };
    const optionalNumber = (field: string): number | undefined => {
      const candidate = record[field];
      if (candidate === undefined || candidate === null || candidate === '') return undefined;
      const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
      if (!Number.isFinite(parsed)) throw new Error(`${storePath}.${field} must be a finite number.`);
      return parsed;
    };
    return {
      storeId: String(record.storeId).trim(),
      name: String(record.name).trim(),
      address: String(record.address).trim(),
      city: String(record.city).trim(),
      countryCode: optionalString('countryCode'),
      district: optionalString('district'),
      latitude: optionalNumber('latitude'),
      longitude: optionalNumber('longitude'),
      storeType: optionalString('storeType')
    };
  });
}

function parseDailyConnectorsJson(value: string): DailyIngestionConnectorConfig[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON must be a non-empty JSON array.');
  const connectors = parsed.map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}] must be an object.`);
    }
    const record = entry as Record<string, unknown>;
    for (const field of dailyRequiredConnectorFields) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].${field} is required.`);
      }
    }
    return {
      connectorId: String(record.connectorId),
      requestedAt: typeof record.requestedAt === 'string' ? record.requestedAt : new Date().toISOString(),
      chainId: String(record.chainId),
      sourceType: record.sourceType as RetailerConnectorKind,
      robotsTxtStatus: record.robotsTxtStatus as RobotsTxtStatus,
      legalReviewStatus: record.legalReviewStatus as LegalReviewStatus,
      hasDataAgreement: Boolean(record.hasDataAgreement),
      endpointUrl: String(record.endpointUrl),
      parserVersion: String(record.parserVersion),
      stores: parseDailyStoreConfigs(record.stores, `GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].stores`),
      requireStoreScopedPrices: record.requireStoreScopedPrices === undefined ? true : Boolean(record.requireStoreScopedPrices)
    };
  });
  const configuredChains = new Set(connectors.map((connector) => normalizeDailySlug(connector.chainId)));
  const missingChains = requiredDailyIngestionChainIds.filter((chainId) => !configuredChains.has(normalizeDailySlug(chainId)));
  if (missingChains.length > 0) {
    throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON is missing required daily chain connectors: ${missingChains.join(', ')}.`);
  }
  return connectors;
}

export function buildDailyConnectorConfigsFromEnv(env: DailyIngestionEnv): DailyIngestionEnvConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required for daily ingestion.');
  const connectorsJson = env.GROCERYVIEW_DAILY_CONNECTORS_JSON?.trim();
  if (!connectorsJson) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON is required for daily ingestion.');
  return {
    databaseUrl,
    connectors: parseDailyConnectorsJson(connectorsJson)
  };
}

function dbSourceTypeForConnector(sourceType: RetailerConnectorKind): SourceRunRecord['sourceType'] {
  if (sourceType === 'official_api') return 'official_api';
  if (sourceType === 'retailer_online_page') return 'retailer_page';
  return 'weekly_leaflet';
}

function dbPriceTypeForIngested(priceType: PriceType): DbPriceType {
  if (priceType === 'online' || priceType === 'member' || priceType === 'receipt' || priceType === 'estimated') return priceType;
  if (priceType === 'flyer') return 'promotion';
  if (priceType === 'in_store' || priceType === 'shelf_photo') return 'shelf';
  return 'community';
}

function normalizeDailySlug(value: string): string {
  const slug = value.trim().toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('Daily ingestion slug must be non-empty.');
  return slug;
}

function dailyPayloadHash(payload: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

async function upsertDailyChain(executor: QueryExecutor, chainId: string): Promise<string> {
  const slug = normalizeDailySlug(chainId);
  const rows = await executor.query<IdRow>(
    `insert into chains(slug, name, country_code)
     values ($1, $2, 'SE')
     on conflict (slug) do update set name = excluded.name, updated_at = now()
     returning id`,
    [slug, slug]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Daily ingestion chain upsert did not return an id: ${chainId}`);
  return id;
}

async function upsertDailyStore(executor: QueryExecutor, chainId: string, store: DailyIngestionStoreConfig): Promise<string> {
  const slug = normalizeDailySlug(store.storeId);
  const rows = await executor.query<IdRow>(
    `insert into stores(slug, chain_id, external_ref, name, address_line1, city, region, country_code, position, store_type)
     values (
       $1, $2, $3, $4, $5, $6, $7, $8,
       case
         when $9::numeric is null or $10::numeric is null then null
         else ST_SetSRID(ST_MakePoint($10::numeric, $9::numeric), 4326)::geography
       end,
       coalesce($11, 'supermarket')
     )
     on conflict (slug) do update set
       chain_id = excluded.chain_id, external_ref = excluded.external_ref, name = excluded.name,
       address_line1 = excluded.address_line1, city = excluded.city, region = excluded.region,
       country_code = excluded.country_code, position = excluded.position,
       store_type = excluded.store_type, updated_at = now()
     returning id`,
    [
      slug,
      chainId,
      store.storeId,
      store.name,
      store.address,
      store.city,
      store.district ?? null,
      store.countryCode ?? 'SE',
      store.latitude ?? null,
      store.longitude ?? null,
      store.storeType ?? null
    ]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Daily ingestion store upsert did not return an id: ${store.storeId}`);
  return id;
}

function validateStoreScopedConnectorOutput(config: DailyIngestionConnectorConfig, result: RetailerConnectorRunResult): string[] {
  if (config.requireStoreScopedPrices === false) return [];
  const configuredStores = new Set((config.stores ?? []).map((store) => normalizeDailySlug(store.storeId)));
  const missingStoreProducts: string[] = [];
  const unknownStores = new Set<string>();
  for (const accepted of result.ingestion.accepted) {
    const storeId = accepted.priceObservation.storeId;
    if (!storeId?.trim()) {
      missingStoreProducts.push(accepted.priceObservation.retailerProductId ?? accepted.product.id);
      continue;
    }
    const normalizedStoreId = normalizeDailySlug(storeId);
    if (!configuredStores.has(normalizedStoreId)) unknownStores.add(normalizedStoreId);
  }
  const blockers: string[] = [];
  if (missingStoreProducts.length > 0) blockers.push(`${config.chainId}:missing_store_scoped_prices:${missingStoreProducts.slice(0, 10).join(',')}`);
  if (unknownStores.size > 0) blockers.push(`${config.chainId}:unknown_store_ids:${[...unknownStores].sort().slice(0, 10).join(',')}`);
  return blockers;
}

async function upsertDailyProduct(executor: QueryExecutor, product: IngestedProduct): Promise<string> {
  const rows = await executor.query<IdRow>(
    `insert into products(
       slug,
       canonical_name,
       brand,
       category_path,
       package_size,
       package_unit,
       comparable_unit
     ) values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (slug) do update set
       canonical_name = excluded.canonical_name,
       brand = excluded.brand,
       category_path = excluded.category_path,
       package_size = excluded.package_size,
       package_unit = excluded.package_unit,
       comparable_unit = excluded.comparable_unit,
       updated_at = now()
     returning id`,
    [
      normalizeDailySlug(product.id),
      product.canonicalName,
      product.brand ?? null,
      product.categoryId ? [product.categoryId] : [],
      product.packageSize,
      product.packageUnit,
      product.comparableUnit
    ]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Daily ingestion product upsert did not return an id: ${product.id}`);
  return id;
}

async function persistDailyConnectorOutput(input: {
  executor: QueryExecutor;
  config: DailyIngestionConnectorConfig;
  result: RetailerConnectorRunResult;
}): Promise<Pick<DailyIngestionRunResult, 'sourceRunIds' | 'rawRecordIds' | 'observationIds' | 'acceptedCount' | 'rejectedCount'>> {
  const { executor, config, result } = input;
  const sourceWriter = createPostgresSourceRecordWriter(executor);
  const aliasRepository = createPostgresProductAliasRepository(executor);
  const priceWriter = createPostgresPriceObservationWriter(executor);
  const storesBySlug = new Map((config.stores ?? []).map((store) => [normalizeDailySlug(store.storeId), store]));
  const sourceRun = await sourceWriter.createSourceRun({
    sourceType: dbSourceTypeForConnector(config.sourceType),
    sourceName: config.connectorId,
    sourceUrl: config.endpointUrl,
    startedAt: config.requestedAt,
    finishedAt: config.requestedAt,
    status: 'running',
    provenance: {
      chainId: config.chainId,
      cadence: 'daily',
      connectorId: config.connectorId,
      runKey: result.plan.runKey,
      parserVersion: config.parserVersion,
      acceptedCount: result.acceptedCount,
      rejectedCount: result.rejectedCount
    }
  });

  const rawRecordIds: string[] = [];
  const observationIds: string[] = [];

  for (const accepted of result.ingestion.accepted) {
    const chainId = await upsertDailyChain(executor, accepted.priceObservation.chainId);
    const storeConfig = accepted.priceObservation.storeId ? storesBySlug.get(normalizeDailySlug(accepted.priceObservation.storeId)) : undefined;
    const storeId = storeConfig ? await upsertDailyStore(executor, chainId, storeConfig) : undefined;
    const productId = await upsertDailyProduct(executor, accepted.product);
    await aliasRepository.upsertProductAlias({
      productId,
      alias: accepted.alias.rawName,
      normalizedAlias: accepted.alias.rawName.trim().toLowerCase().replace(/\s+/g, ' '),
      sourceType: 'retailer',
      sourceRef: result.plan.runKey,
      matchConfidence: accepted.alias.matchConfidence
    });

    const payload = {
      product: accepted.product,
      alias: accepted.alias,
      priceObservation: accepted.priceObservation,
      promotionObservation: accepted.promotionObservation
    };
    const rawRecord = await sourceWriter.upsertRawRecord({
      sourceRunId: sourceRun.sourceRunId,
      recordType: 'price',
      externalRef: accepted.priceObservation.retailerProductId ?? accepted.product.id,
      observedAt: accepted.priceObservation.observedAt,
      payload,
      payloadHash: dailyPayloadHash({
        runKey: result.plan.runKey,
        productId: accepted.product.id,
        retailerProductId: accepted.priceObservation.retailerProductId ?? null,
        observedAt: accepted.priceObservation.observedAt,
        price: accepted.priceObservation.price
      }),
      provenance: {
        ...accepted.priceObservation.provenance,
        chainId: config.chainId,
        cadence: 'daily',
        connectorId: config.connectorId,
        runKey: result.plan.runKey
      }
    });
    rawRecordIds.push(rawRecord.rawRecordId);

    const observation = await priceWriter.recordPriceObservation({
      productId,
      chainId,
      storeId,
      sourceRunId: sourceRun.sourceRunId,
      rawRecordId: rawRecord.rawRecordId,
      retailerProductRef: accepted.priceObservation.retailerProductId,
      priceType: dbPriceTypeForIngested(accepted.priceObservation.priceType),
      price: accepted.priceObservation.price,
      regularPrice: accepted.priceObservation.regularPrice,
      unitPrice: accepted.priceObservation.unitPrice,
      currency: accepted.priceObservation.currency,
      quantity: accepted.product.packageSize,
      quantityUnit: accepted.product.packageUnit,
      promotionText: accepted.promotionObservation?.promoText,
      memberRequired: accepted.promotionObservation?.memberOnly ?? false,
      observedAt: accepted.priceObservation.observedAt,
      confidence: accepted.priceObservation.confidenceScore,
      provenance: {
        ...accepted.priceObservation.provenance,
        chainId: config.chainId,
        cadence: 'daily',
        connectorId: config.connectorId,
        runKey: result.plan.runKey
      }
    });
    observationIds.push(observation.observationId);
  }

  await sourceWriter.finishSourceRun({
    sourceRunId: sourceRun.sourceRunId,
    finishedAt: config.requestedAt,
    status: result.rejectedCount > 0 ? 'partial' : 'succeeded'
  });

  return {
    sourceRunIds: [sourceRun.sourceRunId],
    rawRecordIds,
    observationIds,
    acceptedCount: result.acceptedCount,
    rejectedCount: result.rejectedCount
  };
}

export async function runDailyIngestion(input: DailyIngestionRunInput): Promise<DailyIngestionRunResult> {
  const blockers: string[] = [];
  const sourceRunIds: string[] = [];
  const rawRecordIds: string[] = [];
  const observationIds: string[] = [];
  let persistedRuns = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;

  for (const config of input.connectors) {
    const runConfig = { ...config, requestedAt: input.requestedAt };
    const result = await runRetailerConnector({
      ...runConfig,
      fetcher: (plan) => fetchDailyConnectorSnapshot(plan, {
        retrievedAt: input.requestedAt,
        rawSnapshotRefPrefix: 'raw://daily-ingestion',
        fetchImpl: input.fetchImpl,
        headers: { accept: 'application/json' }
      }),
      parser: parseRetailerProductJsonSnapshot
    });

    if (result.status === 'blocked') {
      blockers.push(...result.requiredActions.map((action) => `${config.chainId}:${action}`));
      continue;
    }
    if (result.status !== 'completed') {
      blockers.push(`${config.chainId}:connector_${result.status}`);
      continue;
    }
    if (result.acceptedCount === 0) {
      blockers.push(`${config.chainId}:no_accepted_products`);
      continue;
    }

    const storeScopeBlockers = validateStoreScopedConnectorOutput(runConfig, result);
    if (storeScopeBlockers.length > 0) {
      blockers.push(...storeScopeBlockers);
      continue;
    }

    try {
      const persisted = await persistDailyConnectorOutput({ executor: input.executor, config: runConfig, result });
      persistedRuns += 1;
      acceptedCount += persisted.acceptedCount;
      rejectedCount += persisted.rejectedCount;
      sourceRunIds.push(...persisted.sourceRunIds);
      rawRecordIds.push(...persisted.rawRecordIds);
      observationIds.push(...persisted.observationIds);
      if (persisted.rejectedCount > 0) blockers.push(`${config.chainId}:rejected_products:${persisted.rejectedCount}`);
    } catch (error) {
      blockers.push(`${config.chainId}:persistence_failed:${error instanceof Error ? error.message : 'unknown_error'}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'succeeded' : persistedRuns > 0 ? 'partial' : 'blocked',
    blockers,
    persistedRuns,
    acceptedCount,
    rejectedCount,
    sourceRunIds,
    rawRecordIds,
    observationIds
  };
}

export async function runDailyIngestionFromEnv(env: DailyIngestionEnv = process.env): Promise<DailyIngestionRunResult> {
  const { databaseUrl, connectors } = buildDailyConnectorConfigsFromEnv(env);
  const pg = requireForDailyIngestion('pg') as { Pool?: new (config: { connectionString: string }) => { query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>; end(): Promise<void> } };
  if (!pg.Pool) throw new Error('pg Pool export is not available.');
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    return await runDailyIngestion({
      executor: createPgQueryExecutor(pool),
      requestedAt: new Date().toISOString(),
      connectors
    });
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  runDailyIngestionFromEnv()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (result.status !== 'succeeded') process.exitCode = 1;
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
