import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  createPgQueryExecutor,
  createPostgresPriceObservationWriter,
  createPostgresProductAliasRepository,
  createPostgresSourceRecordWriter,
  type PriceType as DbPriceType,
  type PriceObservationRecord,
  type QueryExecutor,
  type PgLikeClient,
  type SourceRunRecord
} from '@groceryview/db';
import { COMMODITIES, findCommodity, type Commodity } from '@groceryview/catalog';
import {
  cacheAndRewriteProductImages,
  type ImageCacheOptions as ProductImageCacheOptions,
  type ImageCacheProduct
} from '@groceryview/image-cache';
import {
  fetchCityGrossProductsForAllStores,
  type CityGrossProduct
} from './connectors/citygross.js';
import { fetchCityGrossBulkProducts } from './connectors/citygross-bulk.js';
import type { AllStoreTaskRunnerControls } from './connectors/all-store-runner.js';
import {
  fetchCoopProductsForAllStores,
  fetchCoopWeeklyDiscountsForAllStores,
  type CoopStoreProduct,
  type CoopWeeklyDiscount
} from './connectors/coop.js';
import {
  fetchHemkopProductsForAllStores,
  fetchHemkopWeeklyDiscountsForAllStores,
  type HemkopStoreProduct,
  type HemkopWeeklyDiscount
} from './connectors/hemkop.js';
import {
  extractOpenFoodFactsBarcodeFromAxfoodImageUrl,
  extractOpenFoodFactsBarcodeFromImageUrl,
  fetchOpenFoodFactsExportProducts,
  OPENFOODFACTS_EXPORT_URL,
  type OpenFoodFactsProduct,
  type OpenFoodFactsRetailerEnrichment
} from './connectors/openfoodfacts.js';
import {
  DEFAULT_ICA_STORE_CONFIGS,
  fetchIcaDefaultStoreProducts,
  type IcaProduct,
  type IcaStoreConfig
} from './connectors/ica.js';
import {
  fetchPharmacyProducts,
  type ApohemProduct,
  DEFAULT_APOHEM_SOURCE_PATHS,
  DEFAULT_APOTEK_HJARTAT_SEARCH_URLS
} from './connectors/apohem.js';
import {
  fetchLidlOffersForAllStores,
  type LidlStoreOffer
} from './connectors/lidl.js';
import {
  fetchOkq8FuelPrices,
  OKQ8_FUEL_PRICES_URL,
  type FuelGradeId,
  type FuelPriceSourceKind,
  type FuelPriceObservation
} from './connectors/okq8-fuel.js';
import {
  fetchSevenElevenSeConvenienceProducts,
  type SevenElevenSeProduct
} from './connectors/seven-eleven-se.js';
import {
  fetchMathemProducts,
  type MathemProduct
} from './connectors/mathem.js';
import {
  fetchMatsparProducts,
  MATSPAR_MINIMUM_ROWS,
  type MatsparProduct
} from './connectors/matspar.js';
import {
  fetchWillysProductsForAllStores,
  fetchWillysWeeklyDiscountsForAllStores,
  type WillysProduct,
  type WillysStoreProduct,
  type WillysWeeklyDiscount
} from './connectors/willys.js';
import { fetchWillysBulkProducts } from './connectors/willys-bulk.js';

export * from './connectors/openfoodfacts.js';
export * from './connectors/all-store-runner.js';
export * from './connectors/overpass.js';
export * from './connectors/fuel-stations.js';
export * from './connectors/citygross.js';
export * from './connectors/citygross-bulk.js';
export * from './connectors/coop.js';
export * from './connectors/hemkop.js';
export * from './connectors/ica.js';
export * from './connectors/ica-bulk.js';
export * from './connectors/ica-reklamblad.js';
export * from './connectors/lidl.js';
export * from './connectors/mathem.js';
export * from './connectors/matpriskollen.js';
export * from './connectors/matspar.js';
export * from './connectors/lidl-bulk.js';
export * from './connectors/willys-bulk.js';
export * from './connectors/apohem.js';
export * from './connectors/okq8-fuel.js';
export * from './connectors/seven-eleven-se.js';
export * from './connectors/st1-fuel.js';
export * from './connectors/willys.js';
export * from './store-enumerator.js';
export * from './unit-price.js';

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
} & AllStoreTaskRunnerControls;

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

function dailyNativeNumberListParam(url: URL, name: string): number[] | undefined {
  const values = dailyNativeStringListParam(url, name);
  if (!values) return undefined;
  return values.map((value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a comma-separated list of positive integers.`);
    return parsed;
  });
}

function validDailyBarcode(value: string | undefined): string | undefined {
  const barcode = value?.trim();
  return barcode && /^\d{8,14}$/.test(barcode) ? barcode : undefined;
}

function dailyProductIdForBarcode(prefix: string, fallback: string, barcode?: string): string {
  const normalizedBarcode = validDailyBarcode(barcode);
  return normalizedBarcode ? `ean-${stableKeyPart(normalizedBarcode)}` : `${prefix}-${stableKeyPart(fallback)}`;
}

function willysWeeklyDiscountToDailyItem(row: WillysWeeklyDiscount): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const regularPrice = nativePriceFromText(row.regularPriceText);
  const barcode = validDailyBarcode(extractOpenFoodFactsBarcodeFromAxfoodImageUrl(row.imageUrl));
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('willys', row.productCode || row.code, barcode),
    categoryId: stableKeyPart(row.category || 'weekly-offers'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: regularPrice !== undefined && regularPrice > row.price ? regularPrice : undefined,
    promoText: row.conditionText || row.priceText || undefined,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function willysStoreProductToDailyItem(row: WillysStoreProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const barcode = validDailyBarcode(extractOpenFoodFactsBarcodeFromAxfoodImageUrl(row.imageUrl));
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('willys', row.code, barcode),
    categoryId: stableKeyPart(row.category || 'willys-products'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function willysBulkProductToDailyItem(row: WillysProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const barcode = validDailyBarcode(extractOpenFoodFactsBarcodeFromAxfoodImageUrl(row.imageUrl));
  return {
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('willys', row.code, barcode),
    categoryId: stableKeyPart(row.category || 'willys-bulk-products'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}


function hemkopStoreProductToDailyItem(row: HemkopStoreProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const barcode = validDailyBarcode(extractOpenFoodFactsBarcodeFromAxfoodImageUrl(row.imageUrl));
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('hemkop', row.code, barcode),
    categoryId: stableKeyPart(row.category || 'hemkop-products'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function hemkopWeeklyDiscountToDailyItem(row: HemkopWeeklyDiscount): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const regularPrice = nativePriceFromText(row.regularPriceText);
  const barcode = validDailyBarcode(extractOpenFoodFactsBarcodeFromAxfoodImageUrl(row.imageUrl));
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('hemkop', row.productCode || row.code, barcode),
    categoryId: stableKeyPart(row.category || 'weekly-offers'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: regularPrice !== undefined && regularPrice > row.price ? regularPrice : undefined,
    promoText: row.conditionText || row.priceText || undefined,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function icaProductToDailyItem(row: IcaProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageSize);
  const price = row.promoPrice ?? row.price;
  if (price === null) throw new Error(`ICA product ${row.retailerProductId} had no current or promotion price.`);
  const barcode = validDailyBarcode(extractOpenFoodFactsBarcodeFromImageUrl(row.imageUrl));
  return {
    storeId: row.storeAccountId,
    retailerProductId: row.retailerProductId || row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('ica', row.productId || row.retailerProductId || row.code, barcode),
    categoryId: stableKeyPart(row.categories[0] || 'ica-store-promotions'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price,
    regularPrice: row.promoPrice !== null && row.price !== null && row.price > row.promoPrice ? row.price : undefined,
    promoText: row.promotionDescription || undefined,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function coopWeeklyDiscountToDailyItem(row: CoopWeeklyDiscount): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const barcode = validDailyBarcode(row.ean);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('coop', row.ean || row.code, barcode),
    categoryId: 'weekly-offers',
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.offerPrice,
    regularPrice: row.ordinaryPrice > row.offerPrice ? row.ordinaryPrice : undefined,
    promoText: row.offerMechanicText || row.offerPriceText || undefined,
    memberOnly: row.medMeraRequired,
    validFrom: row.validFrom,
    validUntil: row.validTo,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl
  };
}

function coopStoreProductToDailyItem(row: CoopStoreProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const barcode = validDailyBarcode(row.ean);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('coop', row.ean || row.code, barcode),
    categoryId: stableKeyPart(row.category || 'coop-products'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.promotionPrice ?? row.price,
    regularPrice: row.promotionPrice !== null && row.price > row.promotionPrice ? row.price : undefined,
    promoText: row.promotionText || undefined,
    memberOnly: row.medMeraRequired,
    isAvailable: row.availableOnline,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function lidlStoreOfferToDailyItem(row: LidlStoreOffer): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `lidl-${stableKeyPart(row.code)}`,
    categoryId: stableKeyPart(row.category || 'lidl-public-offers'),
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: row.regularPrice !== null && row.regularPrice > row.price ? row.regularPrice : undefined,
    promoText: row.promotionText || undefined,
    memberOnly: row.memberOnly,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function cityGrossProductToDailyItem(row: CityGrossProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  const barcode = validDailyBarcode(row.gtin);
  return {
    storeId: row.storeId,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode('citygross', row.gtin || row.code, barcode),
    categoryId: stableKeyPart(row.category || 'city-gross-products'),
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: row.regularPrice !== null && row.regularPrice > row.price ? row.regularPrice : undefined,
    promoText: row.regularPrice !== null && row.regularPrice > row.price ? 'City Gross discounted public price' : undefined,
    memberOnly: false,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function matsparCategoryId(row: MatsparProduct): string {
  try {
    const query = new URL(row.sourceUrl).searchParams.get('q');
    if (query?.trim()) return `matspar-${stableKeyPart(query)}`;
  } catch {
    // Keep a stable category even if a captured row has a malformed source URL.
  }
  return 'matspar-public-search';
}

function matsparProductToDailyItem(row: MatsparProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  return {
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `matspar-${stableKeyPart(row.code)}`,
    categoryId: matsparCategoryId(row),
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    memberOnly: false,
    isAvailable: true,
    observedAt: row.retrievedAt,
    sourceUrl: row.productUrl || row.sourceUrl
  };
}

function mathemCategoryId(row: MathemProduct): string {
  try {
    const query = new URL(row.sourceUrl).searchParams.get('q');
    if (query?.trim()) return `mathem-${stableKeyPart(query)}`;
  } catch {
    // Keep a stable category even if a captured row has a malformed source URL.
  }
  return 'mathem-public-search';
}

function mathemProductToDailyItem(row: MathemProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.packageText);
  return {
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: `mathem-${stableKeyPart(row.code)}`,
    categoryId: mathemCategoryId(row),
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    memberOnly: false,
    isAvailable: row.available,
    observedAt: row.retrievedAt,
    sourceUrl: row.productUrl || row.sourceUrl,
    imageUrl: row.imageUrl || undefined
  };
}

function okq8FuelPriceToDailyItem(row: FuelPriceObservation): RetailerConnectorParsedProduct {
  return {
    sourceType: 'retailer_online_page',
    observedAt: row.observedAt,
    chainId: row.chainId,
    retailerProductId: row.productId,
    rawName: row.gradeLabel,
    canonicalName: row.gradeLabel,
    productId: row.productId,
    categoryId: 'fuel',
    fuelGradeId: row.productId,
    fuelSource: {
      sourceKind: row.sourceKind,
      fuelGradeId: row.productId,
      originalPriceText: row.provenance.originalPriceText,
      originalEffectiveDate: row.effectiveFrom
    },
    brand: row.operatorName,
    packageSize: 1,
    packageUnit: 'l',
    price: row.pricePerLitre,
    memberOnly: false,
    validFrom: row.effectiveFrom,
    sourceUrl: row.sourceUrl
  };
}

function sevenElevenSeProductToDailyItem(row: SevenElevenSeProduct): RetailerConnectorParsedProduct {
  return {
    sourceType: 'retailer_online_page',
    observedAt: row.retrievedAt,
    chainId: row.chainId,
    retailerProductId: row.productId,
    rawName: row.name,
    canonicalName: row.name,
    productId: row.productId,
    categoryId: `convenience-${row.category}`,
    brand: row.chainName,
    packageSize: 1,
    packageUnit: 'each',
    price: row.priceMin,
    regularPrice: row.priceMax > row.priceMin ? row.priceMax : undefined,
    promoText: row.priceMax > row.priceMin ? `7-Eleven Sweden B2B range ${row.priceText}` : undefined,
    memberOnly: false,
    isAvailable: true,
    sourceUrl: row.pdfUrl
  };
}

function pharmacyProductToDailyItem(row: ApohemProduct): RetailerConnectorParsedProduct {
  const quantity = parseNativePackageText(row.name);
  const barcode = validDailyBarcode(row.ean);
  return {
    chainId: row.chain,
    retailerProductId: row.code,
    rawName: row.name,
    canonicalName: row.name,
    productId: dailyProductIdForBarcode(row.chain, row.ean || row.code, barcode),
    categoryId: `pharmacy-${stableKeyPart(row.category)}`,
    barcode,
    brand: row.brand || undefined,
    packageSize: quantity.packageSize,
    packageUnit: quantity.packageUnit,
    price: row.price,
    regularPrice: row.originalPrice !== null && row.originalPrice > row.price ? row.originalPrice : undefined,
    promoText: row.originalPrice !== null && row.originalPrice > row.price ? 'Public pharmacy discounted price' : undefined,
    memberOnly: false,
    isAvailable: availabilityFromStockStatus(row.stockStatus) ?? true,
    observedAt: row.retrievedAt,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl || undefined
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
  const runnerControlsFromUrl = (url: URL): AllStoreTaskRunnerControls => ({
    storeConcurrency: dailyNativeNumberParam(url, 'storeConcurrency') ?? options.storeConcurrency,
    storeStartDelayMs: dailyNativeNumberParam(url, 'storeStartDelayMs') ?? options.storeStartDelayMs,
    storeRetryAttempts: dailyNativeNumberParam(url, 'storeRetryAttempts') ?? options.storeRetryAttempts,
    storeRetryBaseDelayMs: dailyNativeNumberParam(url, 'storeRetryBaseDelayMs') ?? options.storeRetryBaseDelayMs
  });

  if (sourceUrl === GROCERYVIEW_DAILY_WILLYS_ALL_STORE_WEEKLY_OFFERS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_WILLYS_ALL_STORE_WEEKLY_OFFERS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchWillysWeeklyDiscountsForAllStores({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      pageSize: dailyNativeNumberParam(url, 'pageSize'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(willysWeeklyDiscountToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_WILLYS_BULK_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_WILLYS_BULK_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchWillysBulkProducts({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      minRows: dailyNativeNumberParam(url, 'minRows'),
      queries: dailyNativeStringListParam(url, 'queries'),
      categoryPaths: dailyNativeStringListParam(url, 'categoryPaths'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(willysBulkProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_ICA_STORE_PROMOTIONS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_ICA_STORE_PROMOTIONS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const maxStores = dailyNativeNumberParam(url, 'maxStores');
    const stores: readonly IcaStoreConfig[] | undefined = maxStores
      ? DEFAULT_ICA_STORE_CONFIGS.slice(0, maxStores)
      : undefined;
    const rows = await fetchIcaDefaultStoreProducts({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      stores,
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      maxPageSize: dailyNativeNumberParam(url, 'maxPageSize'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(icaProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_WILLYS_ALL_STORE_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_WILLYS_ALL_STORE_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchWillysProductsForAllStores({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRowsPerStore: dailyNativeNumberParam(url, 'maxRowsPerStore'),
      queries: dailyNativeStringListParam(url, 'queries'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(willysStoreProductToDailyItem) });
  }


  if (sourceUrl === GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchHemkopProductsForAllStores({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRowsPerStore: dailyNativeNumberParam(url, 'maxRowsPerStore'),
      pageSize: dailyNativeNumberParam(url, 'pageSize'),
      queries: dailyNativeStringListParam(url, 'queries'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(hemkopStoreProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_WEEKLY_OFFERS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_WEEKLY_OFFERS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchHemkopWeeklyDiscountsForAllStores({
      ...runnerControlsFromUrl(url),
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
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      productQueries: dailyNativeStringListParam(url, 'productQueries'),
      includeStoreDetails: url.searchParams.has('includeStoreDetails')
        ? url.searchParams.get('includeStoreDetails') === 'true'
        : undefined,
      subscriptionKey: url.searchParams.get('subscriptionKey') ?? undefined,
      storeApiSubscriptionKey: url.searchParams.get('storeApiSubscriptionKey') ?? undefined,
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(coopWeeklyDiscountToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_COOP_ALL_STORE_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_COOP_ALL_STORE_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchCoopProductsForAllStores({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRowsPerStore: dailyNativeNumberParam(url, 'maxRowsPerStore'),
      queries: dailyNativeStringListParam(url, 'queries'),
      includeStoreDetails: url.searchParams.has('includeStoreDetails')
        ? url.searchParams.get('includeStoreDetails') === 'true'
        : undefined,
      subscriptionKey: url.searchParams.get('subscriptionKey') ?? undefined,
      storeApiSubscriptionKey: url.searchParams.get('storeApiSubscriptionKey') ?? undefined,
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(coopStoreProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_LIDL_PUBLIC_OFFERS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_LIDL_PUBLIC_OFFERS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchLidlOffersForAllStores({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      offerPaths: dailyNativeStringListParam(url, 'paths'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(lidlStoreOfferToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_CITY_GROSS_BULK_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_CITY_GROSS_BULK_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchCityGrossBulkProducts({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRowsPerStore: dailyNativeNumberParam(url, 'maxRowsPerStore'),
      minRows: dailyNativeNumberParam(url, 'minRows'),
      pageSize: dailyNativeNumberParam(url, 'pageSize'),
      queries: dailyNativeStringListParam(url, 'queries'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(cityGrossProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_CITY_GROSS_PUBLIC_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_CITY_GROSS_PUBLIC_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchCityGrossProductsForAllStores({
      ...runnerControlsFromUrl(url),
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxStores: dailyNativeNumberParam(url, 'maxStores'),
      maxRowsPerStore: dailyNativeNumberParam(url, 'maxRowsPerStore'),
      pageSize: dailyNativeNumberParam(url, 'pageSize'),
      queries: dailyNativeStringListParam(url, 'queries'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(cityGrossProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_MATHEM_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_MATHEM_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchMathemProducts({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      queries: dailyNativeStringListParam(url, 'queries'),
      pages: dailyNativeNumberListParam(url, 'pages'),
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(mathemProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_MATSPAR_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_MATSPAR_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchMatsparProducts({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      queries: dailyNativeStringListParam(url, 'queries'),
      pages: dailyNativeNumberListParam(url, 'pages'),
      minRows: dailyNativeNumberParam(url, 'minRows') ?? MATSPAR_MINIMUM_ROWS,
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(matsparProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_OKQ8_FUEL_PRICES_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_OKQ8_FUEL_PRICES_URL}?`)) {
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchOkq8FuelPrices({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      capturedAt: retrievedAt,
      sourceUrl: OKQ8_FUEL_PRICES_URL
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(okq8FuelPriceToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_SEVEN_ELEVEN_SE_CONVENIENCE_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_SEVEN_ELEVEN_SE_CONVENIENCE_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchSevenElevenSeConvenienceProducts({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      pdfUrl: url.searchParams.get('pdfUrl') ?? undefined,
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(sevenElevenSeProductToDailyItem) });
  }

  if (sourceUrl === GROCERYVIEW_DAILY_PHARMACY_PRODUCTS_URL || sourceUrl?.startsWith(`${GROCERYVIEW_DAILY_PHARMACY_PRODUCTS_URL}?`)) {
    const url = new URL(sourceUrl);
    const retrievedAt = options.retrievedAt ?? new Date().toISOString();
    const rows = await fetchPharmacyProducts({
      fetchImpl: options.fetchImpl as unknown as typeof fetch | undefined,
      sourcePaths: dailyNativeStringListParam(url, 'sourcePaths') ?? DEFAULT_APOHEM_SOURCE_PATHS,
      apotekHjartatUrls: dailyNativeStringListParam(url, 'apotekHjartatUrls') ?? DEFAULT_APOTEK_HJARTAT_SEARCH_URLS,
      maxRows: dailyNativeNumberParam(url, 'maxRows'),
      retrievedAt
    });
    return dailyNativeSnapshotResult({ plan, retrievedAt, items: rows.map(pharmacyProductToDailyItem) });
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

function availabilityFromStockStatus(value: unknown): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return undefined;
  if (
    normalized.includes('out_of_stock') ||
    normalized.includes('sold_out') ||
    normalized.includes('unavailable') ||
    normalized.includes('not_available') ||
    normalized.includes('not_found') ||
    normalized.includes('http_404') ||
    normalized.includes('404') ||
    normalized.includes('empty_stock')
  ) {
    return false;
  }
  if (
    normalized.includes('in_stock') ||
    normalized.includes('buyable') ||
    normalized === 'available' ||
    normalized === 'i_lager'
  ) {
    return true;
  }
  return undefined;
}

function optionalAvailability(record: Record<string, unknown>, path: string): boolean | undefined {
  const explicit = optionalBoolean(record, 'isAvailable', path);
  if (explicit !== undefined) return explicit;
  const available = record.available;
  if (typeof available === 'boolean') return available;
  if (typeof available === 'string' && ['true', 'false'].includes(available.toLowerCase())) return available.toLowerCase() === 'true';
  const fromAvailableStatus = availabilityFromStockStatus(available);
  if (fromAvailableStatus !== undefined) return fromAvailableStatus;
  const fromStatus = availabilityFromStockStatus(record.stockStatus ?? record.availabilityStatus ?? record.stock);
  if (fromStatus !== undefined) return fromStatus;
  const availability = record.availability;
  if (availability && typeof availability === 'object' && !Array.isArray(availability)) {
    const availabilityRecord = availability as Record<string, unknown>;
    return optionalBoolean(availabilityRecord, 'isAvailable', `${path}.availability`) ??
      availabilityFromStockStatus(availabilityRecord.status ?? availabilityRecord.stockStatus);
  }
  return undefined;
}

function optionalFuelSource(record: Record<string, unknown>, path: string): RetailerProductInput['fuelSource'] {
  const value = record.fuelSource;
  if (value === undefined || value === null) return undefined;
  const source = recordFrom(value, `${path}.fuelSource`);
  return {
    sourceKind: requiredString(source, 'sourceKind', `${path}.fuelSource`) as FuelPriceSourceKind,
    fuelGradeId: requiredString(source, 'fuelGradeId', `${path}.fuelSource`) as FuelGradeId,
    originalPriceText: requiredString(source, 'originalPriceText', `${path}.fuelSource`),
    originalEffectiveDate: optionalString(source, 'originalEffectiveDate', `${path}.fuelSource`)
  };
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
      sourceType: optionalString(record, 'sourceType', path) as SourceType | undefined,
      parserVersion: optionalString(record, 'parserVersion', path),
      rawSnapshotRef: optionalString(record, 'rawSnapshotRef', path),
      sourceRunId: optionalString(record, 'sourceRunId', path),
      chainId: optionalString(record, 'chainId', path),
      storeId: optionalString(record, 'storeId', path),
      retailerProductId: optionalString(record, 'retailerProductId', path),
      rawName: requiredString(record, 'rawName', path),
      canonicalName: requiredString(record, 'canonicalName', path),
      productId: requiredString(record, 'productId', path),
      categoryId: requiredString(record, 'categoryId', path),
      barcode: optionalString(record, 'barcode', path),
      fuelGradeId: optionalString(record, 'fuelGradeId', path) as FuelGradeId | undefined,
      fuelSource: optionalFuelSource(record, path),
      brand: optionalString(record, 'brand', path),
      packageSize: requiredNumber(record, 'packageSize', path),
      packageUnit: requiredString(record, 'packageUnit', path),
      price: requiredNumber(record, 'price', path),
      regularPrice: optionalNumber(record, 'regularPrice', path),
      promoText: optionalString(record, 'promoText', path),
      memberOnly: optionalBoolean(record, 'memberOnly', path),
      isAvailable: optionalAvailability(record, path),
      validFrom: optionalString(record, 'validFrom', path),
      validUntil: optionalString(record, 'validUntil', path),
      observedAt: optionalString(record, 'observedAt', path),
      sourceUrl: optionalString(record, 'sourceUrl', path),
      imageUrl: optionalString(record, 'imageUrl', path)
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
  barcode?: string;
  productKind?: 'branded' | 'commodity';
  commodityId?: string;
  fuelGradeId?: FuelGradeId;
  fuelSource?: {
    sourceKind: FuelPriceSourceKind;
    fuelGradeId: FuelGradeId;
    originalPriceText: string;
    originalEffectiveDate?: string;
  };
  brand?: string;
  variant?: string;
  isOrganic?: boolean;
  originCountry?: string;
  soldByWeight?: boolean;
  packageSize: number;
  packageUnit: string;
  price: number;
  regularPrice?: number;
  promoText?: string;
  memberOnly?: boolean;
  isAvailable?: boolean;
  validFrom?: string;
  validUntil?: string;
  sourceUrl?: string;
  imageUrl?: string;
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
  barcode?: string;
  categoryId: string;
  productKind: 'branded' | 'commodity';
  commodityId?: string;
  fuelGradeId?: FuelGradeId;
  variant?: string;
  isOrganic: boolean;
  originCountry?: string;
  packageSize: number;
  packageUnit: string;
  comparableUnit: string;
  imageUrl?: string;
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
  validFrom?: string;
  validUntil?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  parserVersion: string;
  rawSnapshotRef: string;
  sourceRunId?: string;
  provenance: PriceProvenance;
  confidenceScore: number;
  isOnlinePrice: boolean;
  isInstorePrice: boolean;
  isAvailable: boolean;
  fuelSource?: RetailerProductInput['fuelSource'];
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
  validFrom?: string;
  validUntil?: string;
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
  if (input.validFrom !== undefined && Number.isNaN(Date.parse(input.validFrom))) throw new Error('validFrom must be an ISO date.');
  if (input.validUntil !== undefined && Number.isNaN(Date.parse(input.validUntil))) throw new Error('validUntil must be an ISO date.');
  if (input.originCountry !== undefined && !/^[a-z]{2}$/i.test(input.originCountry)) throw new Error('originCountry must be an ISO-3166 alpha-2 code.');
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

const normalizeSearchText = (value: string): string => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function commodityTerms(commodity: Commodity): string[] {
  return [
    commodity.slug.replace(/-/g, ' '),
    commodity.nameSv,
    commodity.nameEn,
    ...(commodity.variants ?? [])
  ].map(normalizeSearchText).filter(Boolean);
}

function categoryHintsMatch(input: RetailerProductInput, commodity: Commodity): boolean {
  const category = normalizeSearchText(input.categoryId);
  return commodity.categoryPath
    .map(normalizeSearchText)
    .some((hint) => hint.length > 0 && (category.includes(hint) || hint.includes(category)));
}

function resolveCommodity(input: RetailerProductInput): Commodity | null {
  if (input.commodityId) {
    const explicit = findCommodity(input.commodityId);
    if (!explicit) throw new Error(`Unknown commodityId: ${input.commodityId}`);
    return explicit;
  }

  const haystack = normalizeSearchText(`${input.rawName} ${input.canonicalName} ${input.categoryId}`);
  return COMMODITIES.find((commodity) => {
    const hasNameMatch = commodityTerms(commodity).some((term) => term.length > 0 && haystack.includes(term));
    return hasNameMatch && (categoryHintsMatch(input, commodity) || input.soldByWeight === true || input.productKind === 'commodity');
  }) ?? null;
}

function classifyRetailerProduct(input: RetailerProductInput): {
  productKind: 'branded' | 'commodity';
  commodityId?: string;
  matchConfidence: number;
} {
  const sourceConfidence = confidenceForSource(input.sourceType);
  const requiresCommodityResolution = input.productKind === 'commodity' || input.soldByWeight === true || input.commodityId !== undefined;
  if (!requiresCommodityResolution) return { productKind: 'branded', matchConfidence: sourceConfidence };

  const commodity = resolveCommodity(input);
  if (!commodity) throw new Error(`Could not resolve commodity mapping for ${input.rawName}.`);
  return {
    productKind: 'commodity',
    commodityId: commodity.slug,
    matchConfidence: Math.min(sourceConfidence, 0.68)
  };
}

export function ingestRetailerProduct(input: RetailerProductInput): IngestionOutput {
  validateInput(input);
  const classification = classifyRetailerProduct(input);
  const confidence = classification.matchConfidence;
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
      barcode: input.barcode,
      categoryId: input.categoryId,
      productKind: classification.productKind,
      commodityId: classification.commodityId,
      fuelGradeId: input.fuelGradeId,
      variant: input.variant,
      isOrganic: input.isOrganic ?? (/\b(eko|ekologisk|organic)\b/i.test(input.rawName) || /\b(eko|ekologisk|organic)\b/i.test(input.canonicalName)),
      originCountry: input.originCountry?.toUpperCase(),
      packageSize: input.packageSize,
      packageUnit: input.packageUnit,
      comparableUnit: normalized.comparableUnit,
      imageUrl: input.imageUrl?.trim() || undefined
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
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      parserVersion: input.parserVersion,
      rawSnapshotRef: input.rawSnapshotRef,
      sourceRunId: input.sourceRunId,
      provenance,
      confidenceScore: confidence,
      isOnlinePrice: input.sourceType === 'official_api' || input.sourceType === 'retailer_online_page',
      isInstorePrice: input.sourceType === 'receipt_scan' || input.sourceType === 'shelf_photo' || input.sourceType === 'manual_user_report',
      isAvailable: input.isAvailable ?? true,
      fuelSource: input.fuelSource
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
          validFrom: input.validFrom,
          validUntil: input.validUntil,
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

export type DailyIngestionDomain = 'grocery' | 'fuel' | 'pharmacy';

export type DailyIngestionConnectorConfig = Omit<RetailerConnectorPlanInput, 'requestedAt'> & AllStoreTaskRunnerControls & {
  requestedAt?: string;
  domain?: DailyIngestionDomain;
  stores?: DailyIngestionStoreConfig[];
  requireStoreScopedPrices?: boolean;
};

export type DailyIngestionEnv = Partial<Record<
  | 'DATABASE_URL'
  | 'GROCERYVIEW_DAILY_CONNECTORS_JSON'
  | 'GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE'
  | 'GROCERYVIEW_DAILY_BLOCKER_LOG_PATH'
  | 'GROCERYVIEW_DATABASE_URL'
  | 'GROCERYVIEW_OPENFOODFACTS_MAX_DB_BARCODES'
  | 'GROCERYVIEW_DAILY_DB_RETRY_ATTEMPTS'
  | 'GROCERYVIEW_DAILY_DB_RETRY_BASE_DELAY_MS'
  | 'GROCERYVIEW_DAILY_MAX_CONNECTORS'
  | 'GROCERYVIEW_DAILY_MAX_CONCURRENCY'
  | 'GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS'
  | 'GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS'
  | 'GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS'
  | 'GROCERYVIEW_DAILY_STORE_CONCURRENCY'
  | 'GROCERYVIEW_DAILY_STORE_START_DELAY_MS'
  | 'GROCERYVIEW_DAILY_STORE_RETRY_ATTEMPTS'
  | 'GROCERYVIEW_DAILY_STORE_RETRY_BASE_DELAY_MS'
  | 'GROCERYVIEW_IMAGE_CACHE_ENABLED'
  | 'GROCERYVIEW_IMAGE_CACHE_PUBLIC_DIR'
  | 'GROCERYVIEW_IMAGE_CACHE_MAX_BYTES',
  string
>>;

export type DailyIngestionEnvConfig = {
  databaseUrl: string;
  connectors: DailyIngestionConnectorConfig[];
  runtimeOptions: DailyIngestionRuntimeOptions;
  runner: {
    maxConnectors?: number;
    maxConcurrency?: number;
    connectorStartDelayMs?: number;
    connectorRetryAttempts?: number;
    connectorRetryBaseDelayMs?: number;
    storeConcurrency?: number;
    storeStartDelayMs?: number;
    storeRetryAttempts?: number;
    storeRetryBaseDelayMs?: number;
  };
};

export type DailyIngestionImageCacheOptions = ProductImageCacheOptions & { enabled?: boolean };

export type DailyIngestionRunInput = {
  executor: QueryExecutor;
  requestedAt: string;
  connectors: DailyIngestionConnectorConfig[];
  fetchImpl?: typeof fetch;
  /** Maximum number of connector fetch/parse/persist jobs to run at once. Defaults to one for conservative production DB sessions. */
  maxConcurrency?: number;
  /** Polite delay before a worker starts a connector after the first connector has been scheduled. */
  connectorStartDelayMs?: number;
  /** Number of extra attempts for transient connector fetch/parse failures before blocking the run. */
  connectorRetryAttempts?: number;
  /** Base delay between retries. Attempt N waits baseDelay * N. */
  connectorRetryBaseDelayMs?: number;
  /** File path for durable blocker diagnostics when a country-wide run is partial or blocked. */
  blockerLogPath?: string;
  /** Optional product image cache that downloads external product images and rewrites products.image_url at ingest time. */
  imageCache?: false | DailyIngestionImageCacheOptions;
};

export type DailyIngestionConnectorSummary = {
  connectorId: string;
  chainId: string;
  status: 'succeeded' | 'partial' | 'blocked';
  blockers: string[];
  persistedRuns: number;
  acceptedCount: number;
  rejectedCount: number;
  sourceRunIds: string[];
  rawRecordIds: string[];
  observationIds: string[];
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
  chainSummaries: DailyIngestionConnectorSummary[];
};

type IdRow = { id: string };

export const DEFAULT_DAILY_INGESTION_BLOCKER_LOG_PATH = 'codex-tasks/ingestion-blockers.txt';

export type DailyIngestionRuntimeOptions = Required<Pick<
  DailyIngestionRunInput,
  'maxConcurrency' | 'connectorStartDelayMs' | 'connectorRetryAttempts' | 'connectorRetryBaseDelayMs'
>> & {
  blockerLogPath: string;
};

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
export const GROCERYVIEW_DAILY_WILLYS_ALL_STORE_PRODUCTS_URL = 'groceryview://daily/willys/products/all-stores';
export const GROCERYVIEW_DAILY_WILLYS_BULK_PRODUCTS_URL = 'groceryview://daily/willys/products/bulk';
export const GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_PRODUCTS_URL = 'groceryview://daily/hemkop/products/all-stores';
export const GROCERYVIEW_DAILY_HEMKOP_ALL_STORE_WEEKLY_OFFERS_URL = 'groceryview://daily/hemkop/weekly-offers/all-stores';
export const GROCERYVIEW_DAILY_ICA_STORE_PROMOTIONS_URL = 'groceryview://daily/ica/store-promotions/default-stores';
export const GROCERYVIEW_DAILY_LIDL_PUBLIC_OFFERS_URL = 'groceryview://daily/lidl/public-offers/all-stores';
export const GROCERYVIEW_DAILY_COOP_ALL_STORE_WEEKLY_OFFERS_URL = 'groceryview://daily/coop/weekly-offers/all-stores';
export const GROCERYVIEW_DAILY_COOP_ALL_STORE_PRODUCTS_URL = 'groceryview://daily/coop/products/all-stores';
export const GROCERYVIEW_DAILY_CITY_GROSS_BULK_PRODUCTS_URL = 'groceryview://daily/city-gross/products/bulk';
export const GROCERYVIEW_DAILY_CITY_GROSS_PUBLIC_PRODUCTS_URL = 'groceryview://daily/city-gross/public-products/all-stores';
export const GROCERYVIEW_DAILY_MATHEM_PRODUCTS_URL = 'groceryview://daily/mathem/products/public-search';
export const GROCERYVIEW_DAILY_MATSPAR_PRODUCTS_URL = 'groceryview://daily/matspar/products/public-search';
export const GROCERYVIEW_DAILY_OKQ8_FUEL_PRICES_URL = OKQ8_FUEL_PRICES_URL;
export const GROCERYVIEW_DAILY_SEVEN_ELEVEN_SE_CONVENIENCE_PRODUCTS_URL = 'groceryview://daily/seven-eleven-se/convenience-products';
export const GROCERYVIEW_DAILY_PHARMACY_PRODUCTS_URL = 'groceryview://daily/pharmacy/products/public';

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
      domain: record.domain === undefined ? 'grocery' : record.domain as DailyIngestionDomain,
      stores: parseDailyStoreConfigs(record.stores, `GROCERYVIEW_DAILY_CONNECTORS_JSON[${index}].stores`),
      requireStoreScopedPrices: record.requireStoreScopedPrices === undefined ? true : Boolean(record.requireStoreScopedPrices),
      storeConcurrency: dailyRunnerIntegerFromUnknown(record.storeConcurrency),
      storeStartDelayMs: dailyRunnerIntegerFromUnknown(record.storeStartDelayMs),
      storeRetryAttempts: dailyRunnerIntegerFromUnknown(record.storeRetryAttempts),
      storeRetryBaseDelayMs: dailyRunnerIntegerFromUnknown(record.storeRetryBaseDelayMs)
    };
  });
  const configuredChains = new Set(connectors.map((connector) => normalizeDailySlug(connector.chainId)));
  const missingChains = requiredDailyIngestionChainIds.filter((chainId) => !configuredChains.has(normalizeDailySlug(chainId)));
  if (missingChains.length > 0) {
    throw new Error(`GROCERYVIEW_DAILY_CONNECTORS_JSON is missing required daily chain connectors: ${missingChains.join(', ')}.`);
  }
  return connectors;
}

function dailyRunnerIntegerFromUnknown(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
}

function dailyRunnerIntegerFromEnv(value: string | undefined, fallback?: number): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function dailyEnvFlagEnabled(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? '');
}

function buildDailyImageCacheOptionsFromEnv(env: DailyIngestionEnv): false | DailyIngestionImageCacheOptions {
  if (!dailyEnvFlagEnabled(env.GROCERYVIEW_IMAGE_CACHE_ENABLED)) return false;
  return {
    enabled: true,
    publicDir: env.GROCERYVIEW_IMAGE_CACHE_PUBLIC_DIR?.trim() || join(process.cwd(), 'apps/web/public'),
    maxBytes: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_IMAGE_CACHE_MAX_BYTES)
  };
}

function definedAllStoreRunnerControls(input: AllStoreTaskRunnerControls): AllStoreTaskRunnerControls {
  const controls: AllStoreTaskRunnerControls = {};
  if (input.storeConcurrency !== undefined) controls.storeConcurrency = input.storeConcurrency;
  if (input.storeStartDelayMs !== undefined) controls.storeStartDelayMs = input.storeStartDelayMs;
  if (input.storeRetryAttempts !== undefined) controls.storeRetryAttempts = input.storeRetryAttempts;
  if (input.storeRetryBaseDelayMs !== undefined) controls.storeRetryBaseDelayMs = input.storeRetryBaseDelayMs;
  return controls;
}

export function buildDailyConnectorConfigsFromEnv(env: DailyIngestionEnv): DailyIngestionEnvConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required for daily ingestion.');
  const connectorsJson = env.GROCERYVIEW_DAILY_CONNECTORS_JSON?.trim()
    ?? (env.GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE?.trim() ? readFileSync(env.GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE.trim(), 'utf8') : undefined);
  if (!connectorsJson) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON or GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE is required for daily ingestion.');
  const parsedConnectors = parseDailyConnectorsJson(connectorsJson);
  const maxConnectors = dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_MAX_CONNECTORS);
  const storeRunnerOptions = {
    storeConcurrency: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_STORE_CONCURRENCY),
    storeStartDelayMs: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_STORE_START_DELAY_MS),
    storeRetryAttempts: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_STORE_RETRY_ATTEMPTS),
    storeRetryBaseDelayMs: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_STORE_RETRY_BASE_DELAY_MS)
  };
  const connectors = parsedConnectors.map((connector) => ({
    ...connector,
    ...definedAllStoreRunnerControls({
      storeConcurrency: connector.storeConcurrency ?? storeRunnerOptions.storeConcurrency,
      storeStartDelayMs: connector.storeStartDelayMs ?? storeRunnerOptions.storeStartDelayMs,
      storeRetryAttempts: connector.storeRetryAttempts ?? storeRunnerOptions.storeRetryAttempts,
      storeRetryBaseDelayMs: connector.storeRetryBaseDelayMs ?? storeRunnerOptions.storeRetryBaseDelayMs
    })
  }));
  const runtimeOptions = {
    maxConcurrency: parseDailyEnvInteger(env.GROCERYVIEW_DAILY_MAX_CONCURRENCY, 1, 'GROCERYVIEW_DAILY_MAX_CONCURRENCY'),
    connectorStartDelayMs: parseDailyEnvInteger(env.GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS, 0, 'GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS'),
    connectorRetryAttempts: parseDailyEnvInteger(env.GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS, 0, 'GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS'),
    connectorRetryBaseDelayMs: parseDailyEnvInteger(env.GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS, 250, 'GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS'),
    blockerLogPath: env.GROCERYVIEW_DAILY_BLOCKER_LOG_PATH?.trim() || DEFAULT_DAILY_INGESTION_BLOCKER_LOG_PATH
  };
  return {
    databaseUrl,
    connectors: maxConnectors && maxConnectors > 0 ? connectors.slice(0, maxConnectors) : connectors,
    runtimeOptions,
    runner: {
      maxConnectors,
      maxConcurrency: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_MAX_CONCURRENCY),
      connectorStartDelayMs: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS),
      connectorRetryAttempts: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS),
      connectorRetryBaseDelayMs: dailyRunnerIntegerFromEnv(env.GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS),
      ...definedAllStoreRunnerControls(storeRunnerOptions)
    }
  };
}

function parseDailyEnvInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer.`);
  return parsed;
}

export function buildDailyIngestionPostgresPoolConfig(databaseUrl: string): { connectionString: string; max: number } {
  const parsed = new URL(databaseUrl);
  if (parsed.hostname.endsWith('.pooler.supabase.com') && parsed.port === '6543') {
    parsed.port = '5432';
  }
  return {
    connectionString: parsed.toString(),
    max: 1
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

function normalizeDailyExactMatchKey(value: string | undefined | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

type BatchRawRecordIdRow = { ordinal: number; id: string };
type FuelPriceSourceIdRow = { id: string };
type BatchProductIdRow = { slug: string; id: string };

function chunkDailyRows<T>(rows: T[], size = 250): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

function normalizeDailyDomain(domain: DailyIngestionDomain | undefined): DailyIngestionDomain {
  return domain ?? 'grocery';
}

async function upsertDailyChain(executor: QueryExecutor, chainId: string, domain?: DailyIngestionDomain): Promise<string> {
  const slug = normalizeDailySlug(chainId);
  const rows = await executor.query<IdRow>(
    `insert into chains(slug, name, country_code, domain)
     values ($1, $2, 'SE', $3)
     on conflict (slug) do update set name = excluded.name, domain = excluded.domain, updated_at = now()
     returning id`,
    [slug, slug, normalizeDailyDomain(domain)]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Daily ingestion chain upsert did not return an id: ${chainId}`);
  return id;
}

async function upsertDailyStore(executor: QueryExecutor, chainId: string, store: DailyIngestionStoreConfig, domain?: DailyIngestionDomain): Promise<string> {
  const slug = normalizeDailySlug(store.storeId);
  const rows = await executor.query<IdRow>(
    `insert into stores(slug, chain_id, external_ref, name, address_line1, city, region, country_code, position, store_type, domain)
     values (
       $1, $2, $3, $4, $5, $6, $7, $8,
       case
         when $9::numeric is null or $10::numeric is null then null
         else ST_SetSRID(ST_MakePoint($10::numeric, $9::numeric), 4326)::geography
       end,
       coalesce($11, 'supermarket'),
       $12
     )
     on conflict (slug) do update set
       chain_id = excluded.chain_id, external_ref = excluded.external_ref, name = excluded.name,
       address_line1 = excluded.address_line1, city = excluded.city, region = excluded.region,
       country_code = excluded.country_code, position = excluded.position,
       store_type = excluded.store_type, domain = excluded.domain, updated_at = now()
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
      store.storeType ?? null,
      normalizeDailyDomain(domain)
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

function validateConfiguredStoreObservationCoverage(config: DailyIngestionConnectorConfig, result: RetailerConnectorRunResult): string[] {
  if (config.requireStoreScopedPrices === false || config.sourceType !== 'official_api') return [];
  const configuredStores = (config.stores ?? []).map((store) => normalizeDailySlug(store.storeId));
  if (configuredStores.length === 0) return [];
  const observedStores = new Set(
    result.ingestion.accepted
      .map((accepted) => accepted.priceObservation.storeId?.trim())
      .filter((storeId): storeId is string => Boolean(storeId))
      .map((storeId) => normalizeDailySlug(storeId))
  );
  const missingStores = configuredStores.filter((storeId) => !observedStores.has(storeId));
  return missingStores.length > 0
    ? [`${config.chainId}:missing_configured_store_observations:${missingStores.slice(0, 10).join(',')}`]
    : [];
}

async function upsertDailyProduct(executor: QueryExecutor, product: IngestedProduct, domain?: DailyIngestionDomain): Promise<string> {
  const rows = await executor.query<IdRow>(
    `with input as (
       select
         $1::text as slug,
         $2::text as canonical_name,
         $3::text as brand,
         $4::text as barcode,
         $5::text[] as category_path,
         $6::numeric as package_size,
         $7::text as package_unit,
         $8::text as comparable_unit,
         $9::text as domain,
         $10::text as fuel_grade_id
     ),
     matched as (
       select input.*, coalesce(existing.slug, input.slug) as target_slug
       from input
       left join products existing on existing.barcode = input.barcode and input.barcode is not null
     ),
     upserted as (
       insert into products(
         slug,
         canonical_name,
         brand,
         barcode,
         category_path,
         package_size,
         package_unit,
         comparable_unit,
         domain,
         fuel_grade_id
       )
       select
         target_slug,
         canonical_name,
         brand,
         barcode,
         category_path,
         package_size,
         package_unit,
         comparable_unit,
         domain,
         fuel_grade_id
       from matched
       on conflict (slug) do update set
         canonical_name = excluded.canonical_name,
         brand = excluded.brand,
         barcode = excluded.barcode,
         category_path = excluded.category_path,
         package_size = excluded.package_size,
         package_unit = excluded.package_unit,
         comparable_unit = excluded.comparable_unit,
         domain = excluded.domain,
         fuel_grade_id = excluded.fuel_grade_id,
         updated_at = now()
       returning id
     )
     select id from upserted`,
    [
      normalizeDailySlug(product.id),
      product.canonicalName,
      product.brand ?? null,
      normalizeDailyExactMatchKey(product.barcode),
      product.categoryId ? [product.categoryId] : [],
      product.packageSize,
      product.packageUnit,
      product.comparableUnit,
      normalizeDailyDomain(domain),
      product.fuelGradeId ?? null
    ]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Daily ingestion product upsert did not return an id: ${product.id}`);
  return id;
}


async function upsertDailyProductBatch(executor: QueryExecutor, products: IngestedProduct[], domain?: DailyIngestionDomain): Promise<Map<string, string>> {
  if (products.length === 0) return new Map();
  const uniqueProducts = [...new Map(products.map((product) => [normalizeDailySlug(product.id), product])).values()];
  const ids = new Map<string, string>();
  for (const chunk of chunkDailyRows(uniqueProducts)) {
    const rows = await executor.query<BatchProductIdRow>(
      `with input as (
         select *
         from jsonb_to_recordset($1::jsonb) as x(
           slug text,
           canonical_name text,
           brand text,
           barcode text,
           category_id text,
           package_size numeric,
           package_unit text,
           comparable_unit text,
           domain text,
           fuel_grade_id text
         )
       ),
       batch_barcodes as (
         select barcode, min(slug) as batch_slug
         from input
         where barcode is not null
         group by barcode
       ),
       matched as (
         select input.*, coalesce(existing.slug, batch_barcodes.batch_slug, input.slug) as target_slug
         from input
         left join products existing on existing.barcode = input.barcode and input.barcode is not null
         left join batch_barcodes on batch_barcodes.barcode = input.barcode
       ),
       deduplicated as (
         select distinct on (target_slug)
           target_slug,
           canonical_name,
           brand,
           barcode,
           category_id,
           package_size,
           package_unit,
           comparable_unit,
           domain,
           fuel_grade_id
         from matched
         order by target_slug, slug
       ),
       upserted as (
         insert into products(
           slug,
           canonical_name,
           brand,
           barcode,
           category_path,
           package_size,
           package_unit,
           comparable_unit,
           domain,
           fuel_grade_id
         )
         select
           target_slug,
           canonical_name,
           brand,
           barcode,
           case when category_id is null then '{}'::text[] else array[category_id] end,
           package_size,
           package_unit,
           comparable_unit,
           domain,
           fuel_grade_id
         from deduplicated
         on conflict (slug) do update set
           canonical_name = excluded.canonical_name,
           brand = excluded.brand,
           barcode = excluded.barcode,
           category_path = excluded.category_path,
           package_size = excluded.package_size,
           package_unit = excluded.package_unit,
           comparable_unit = excluded.comparable_unit,
           domain = excluded.domain,
           fuel_grade_id = excluded.fuel_grade_id,
           updated_at = now()
         returning slug, id
       )
       select matched.slug, upserted.id
       from matched
       join upserted on upserted.slug = matched.target_slug
       order by matched.slug`,
      [JSON.stringify(chunk.map((product) => ({
        slug: normalizeDailySlug(product.id),
        canonical_name: product.canonicalName,
        brand: product.brand ?? null,
        barcode: normalizeDailyExactMatchKey(product.barcode),
        category_id: product.categoryId ?? null,
        package_size: product.packageSize ?? null,
        package_unit: product.packageUnit ?? null,
        comparable_unit: product.comparableUnit,
        domain: normalizeDailyDomain(domain),
        fuel_grade_id: product.fuelGradeId ?? null
      })))]
    );
    for (const row of rows) ids.set(row.slug, row.id);
  }
  return ids;
}

export type OpenFoodFactsMetadataPersistenceResult = {
  status: 'persisted' | 'partial';
  sourceRunId: string;
  updatedProductIds: string[];
  rawRecordIds: string[];
  skippedNoDbMatchCount: number;
};

export type OpenFoodFactsDbProductCandidate = {
  productId: string;
  slug: string;
  barcode: string;
  canonicalName: string;
  brand?: string;
};

export type OpenFoodFactsProductMetadataEnrichmentRunResult = OpenFoodFactsMetadataPersistenceResult & {
  candidateBarcodeCount: number;
  exportMatchCount: number;
  enrichmentRowCount: number;
  skippedExportNoMatchCount: number;
  skippedNoNutritionCount: number;
  sourceUrl: string;
  retrievedAt: string;
};

type OpenFoodFactsDbProductCandidateRow = {
  id: string;
  slug: string;
  barcode: string;
  canonical_name: string;
  brand: string | null;
};

function openFoodFactsNutritionPayload(row: OpenFoodFactsRetailerEnrichment): Record<string, unknown> {
  return {
    source: 'openfoodfacts',
    barcode: row.barcode,
    productUrl: row.productUrl,
    sourceUrl: row.sourceUrl,
    retrievedAt: row.retrievedAt,
    nutriscoreGrade: row.nutriscoreGrade,
    per100g: row.nutritionPer100g
  };
}

function hashOpenFoodFactsMetadataPayload(row: OpenFoodFactsRetailerEnrichment): string {
  return `sha256:${createHash('sha256').update(JSON.stringify({
    source: 'openfoodfacts',
    barcode: row.barcode,
    sourceUrl: row.sourceUrl,
    retrievedAt: row.retrievedAt,
    nutritionPer100g: row.nutritionPer100g
  })).digest('hex')}`;
}

function hasOpenFoodFactsMetadataNutrition(row: OpenFoodFactsProduct | OpenFoodFactsRetailerEnrichment): boolean {
  return Object.values(row.nutritionPer100g).some((value) => value !== null);
}

function openFoodFactsProductToMetadataRow(row: OpenFoodFactsProduct): OpenFoodFactsRetailerEnrichment {
  return {
    barcode: row.code,
    name: row.name,
    brands: row.brands,
    quantity: row.quantity,
    categories: row.categories,
    labels: row.labels,
    nutriscoreGrade: row.nutriscoreGrade,
    nutritionPer100g: row.nutritionPer100g,
    imageUrl: row.imageUrl,
    productUrl: row.productUrl,
    sourceUrl: row.sourceUrl,
    retrievedAt: row.retrievedAt,
    retailerMatches: []
  };
}

export async function listOpenFoodFactsDbProductCandidates(
  executor: QueryExecutor,
  options: { limit?: number } = {}
): Promise<OpenFoodFactsDbProductCandidate[]> {
  const limit = Math.min(Math.max(Math.floor(options.limit ?? 5000), 1), 50000);
  const rows = await executor.query<OpenFoodFactsDbProductCandidateRow>(
    `select id,
            slug,
            barcode,
            canonical_name,
            brand
     from products
     where barcode is not null
       and barcode ~ '^[0-9]{8,14}$'
     order by updated_at desc, slug asc
     limit $1`,
    [limit]
  );
  return rows.map((row) => ({
    productId: row.id,
    slug: row.slug,
    barcode: row.barcode,
    canonicalName: row.canonical_name,
    brand: row.brand ?? undefined
  }));
}

export async function persistOpenFoodFactsProductMetadata(
  executor: QueryExecutor,
  rows: readonly OpenFoodFactsRetailerEnrichment[],
  options: { retrievedAt: string; sourceUrl?: string; candidateCount?: number }
): Promise<OpenFoodFactsMetadataPersistenceResult> {
  const sourceUrl = options.sourceUrl ?? OPENFOODFACTS_EXPORT_URL;
  if (!Number.isFinite(Date.parse(options.retrievedAt))) throw new Error('retrievedAt must be an ISO date.');

  const sourceWriter = createPostgresSourceRecordWriter(executor);
  const sourceRun = await sourceWriter.createSourceRun({
    sourceType: 'official_api',
    sourceName: 'OpenFoodFacts barcode nutrition enrichment',
    sourceUrl,
    startedAt: options.retrievedAt,
    status: 'running',
    provenance: {
      source: 'openfoodfacts',
      sourceUrl,
      retrievedAt: options.retrievedAt,
      candidateCount: options.candidateCount ?? rows.length
    }
  });

  const rawRecordIds: string[] = [];
  const updatedProductIds: string[] = [];
  let skippedNoDbMatchCount = 0;

  for (const row of rows) {
    const barcode = validDailyBarcode(row.barcode);
    if (!barcode || !Object.values(row.nutritionPer100g).some((value) => value !== null)) {
      continue;
    }

    const updated = await executor.query<IdRow>(
      `update products
       set nutrition = $2::jsonb,
           image_url = coalesce(nullif($3, ''), image_url),
           updated_at = now()
       where barcode = $1
       returning id`,
      [barcode, JSON.stringify(openFoodFactsNutritionPayload(row)), row.imageUrl || null]
    );
    const productId = updated[0]?.id;
    if (!productId) {
      skippedNoDbMatchCount += 1;
      continue;
    }
    updatedProductIds.push(productId);

    const rawRecord = await sourceWriter.upsertRawRecord({
      sourceRunId: sourceRun.sourceRunId,
      recordType: 'product',
      externalRef: barcode,
      observedAt: row.retrievedAt,
      payload: {
        barcode,
        name: row.name,
        brands: row.brands,
        quantity: row.quantity,
        categories: row.categories,
        labels: row.labels,
        nutriscoreGrade: row.nutriscoreGrade,
        nutritionPer100g: row.nutritionPer100g,
        productUrl: row.productUrl,
        imageUrl: row.imageUrl,
        sourceUrl: row.sourceUrl
      },
      payloadHash: hashOpenFoodFactsMetadataPayload(row),
      provenance: {
        source: 'openfoodfacts',
        sourceUrl: row.sourceUrl,
        retrievedAt: row.retrievedAt,
        matchKey: 'barcode',
        barcode
      }
    });
    rawRecordIds.push(rawRecord.rawRecordId);
  }

  await sourceWriter.finishSourceRun({
    sourceRunId: sourceRun.sourceRunId,
    status: skippedNoDbMatchCount > 0 ? 'partial' : 'succeeded',
    finishedAt: options.retrievedAt
  });

  return {
    status: skippedNoDbMatchCount > 0 ? 'partial' : 'persisted',
    sourceRunId: sourceRun.sourceRunId,
    updatedProductIds,
    rawRecordIds,
    skippedNoDbMatchCount
  };
}

export async function runOpenFoodFactsProductMetadataEnrichment(input: {
  executor: QueryExecutor;
  retrievedAt: string;
  fetchImpl?: typeof fetch;
  maxDbBarcodes?: number;
  sourceUrl?: string;
}): Promise<OpenFoodFactsProductMetadataEnrichmentRunResult> {
  if (!Number.isFinite(Date.parse(input.retrievedAt))) throw new Error('retrievedAt must be an ISO date.');
  const sourceUrl = input.sourceUrl ?? OPENFOODFACTS_EXPORT_URL;
  const candidates = await listOpenFoodFactsDbProductCandidates(input.executor, { limit: input.maxDbBarcodes });
  if (candidates.length === 0) throw new Error('No DB products with valid barcodes were available for OpenFoodFacts enrichment.');

  const products = await fetchOpenFoodFactsExportProducts({
    codes: candidates.map((candidate) => candidate.barcode),
    fetchImpl: input.fetchImpl,
    maxRows: candidates.length,
    retrievedAt: input.retrievedAt
  });
  const rows = products
    .filter(hasOpenFoodFactsMetadataNutrition)
    .map(openFoodFactsProductToMetadataRow);
  const matchedBarcodes = new Set(products.map((row) => row.code));

  const persisted = await persistOpenFoodFactsProductMetadata(input.executor, rows, {
    retrievedAt: input.retrievedAt,
    sourceUrl,
    candidateCount: candidates.length
  });

  return {
    ...persisted,
    candidateBarcodeCount: candidates.length,
    exportMatchCount: products.length,
    enrichmentRowCount: rows.length,
    skippedExportNoMatchCount: candidates.filter((candidate) => !matchedBarcodes.has(candidate.barcode)).length,
    skippedNoNutritionCount: products.length - rows.length,
    sourceUrl,
    retrievedAt: input.retrievedAt
  };
}

export async function runOpenFoodFactsProductMetadataEnrichmentFromEnv(env: DailyIngestionEnv = process.env): Promise<OpenFoodFactsProductMetadataEnrichmentRunResult> {
  const databaseUrl = env.GROCERYVIEW_DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('GROCERYVIEW_DATABASE_URL is required for OpenFoodFacts DB metadata enrichment.');
  const maxDbBarcodes = env.GROCERYVIEW_OPENFOODFACTS_MAX_DB_BARCODES?.trim()
    ? Number(env.GROCERYVIEW_OPENFOODFACTS_MAX_DB_BARCODES)
    : undefined;
  if (maxDbBarcodes !== undefined && (!Number.isFinite(maxDbBarcodes) || maxDbBarcodes <= 0)) {
    throw new Error('GROCERYVIEW_OPENFOODFACTS_MAX_DB_BARCODES must be a positive number when provided.');
  }

  const pg = requireForDailyIngestion('pg') as { Pool?: new (config: { connectionString: string; max?: number }) => { query(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>; end(): Promise<void>; on?(event: 'error', listener: (error: unknown) => void): void } };
  if (!pg.Pool) throw new Error('pg Pool export is not available.');
  const pool = new pg.Pool(buildDailyIngestionPostgresPoolConfig(databaseUrl));
  try {
    await pool.query('set default_transaction_read_only=off');
    return await runOpenFoodFactsProductMetadataEnrichment({
      executor: createPgQueryExecutor(pool),
      retrievedAt: new Date().toISOString(),
      maxDbBarcodes
    });
  } finally {
    await pool.end();
  }
}

async function upsertDailyAliasBatch(executor: QueryExecutor, aliases: Array<{
  productId: string;
  alias: string;
  normalizedAlias: string;
  sourceRef: string;
  matchConfidence: number;
}>): Promise<void> {
  if (aliases.length === 0) return;
  const uniqueAliases = [...new Map(aliases.map((alias) => [`${alias.normalizedAlias}:${alias.sourceRef}`, alias])).values()];
  for (const chunk of chunkDailyRows(uniqueAliases)) {
    await executor.query(
      `with input as (
         select *
         from jsonb_to_recordset($1::jsonb) as x(
           product_id uuid,
           alias text,
           normalized_alias text,
           source_ref text,
           match_confidence numeric
         )
       )
       insert into aliases(
         product_id,
         alias,
         normalized_alias,
         source_type,
         source_ref,
         match_confidence,
         reviewed_at
       )
       select product_id, alias, normalized_alias, 'retailer', source_ref, match_confidence, null
       from input
       on conflict (normalized_alias, source_type, source_ref) do update set
         product_id = excluded.product_id,
         alias = excluded.alias,
         match_confidence = excluded.match_confidence,
         reviewed_at = excluded.reviewed_at`,
      [JSON.stringify(chunk.map((alias) => ({
        product_id: alias.productId,
        alias: alias.alias,
        normalized_alias: alias.normalizedAlias,
        source_ref: alias.sourceRef,
        match_confidence: alias.matchConfidence
      })))]
    );
  }
}

async function persistDailyConnectorOutput(input: {
  executor: QueryExecutor;
  config: DailyIngestionConnectorConfig;
  result: RetailerConnectorRunResult;
}): Promise<Pick<DailyIngestionRunResult, 'sourceRunIds' | 'rawRecordIds' | 'observationIds' | 'acceptedCount' | 'rejectedCount'> & { imageCacheProducts: ImageCacheProduct[] }> {
  const { executor, config, result } = input;
  const domain = normalizeDailyDomain(config.domain);
  await executor.query('set default_transaction_read_only=off');
  const sourceWriter = createPostgresSourceRecordWriter(executor);
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
      rejectedCount: result.rejectedCount,
      domain
    }
  });

  const rawRecordIds: string[] = [];
  const observationIds: string[] = [];
  const chainIdsBySlug = new Map<string, string>();
  const storeIdsBySlug = new Map<string, string>();

  async function getDailyChainId(chainId: string): Promise<string> {
    const slug = normalizeDailySlug(chainId);
    const cached = chainIdsBySlug.get(slug);
    if (cached) return cached;
    const id = await upsertDailyChain(executor, chainId, domain);
    chainIdsBySlug.set(slug, id);
    return id;
  }

  async function getDailyStoreId(chainDbId: string, store: DailyIngestionStoreConfig): Promise<string> {
    const slug = normalizeDailySlug(store.storeId);
    const cached = storeIdsBySlug.get(slug);
    if (cached) return cached;
    const id = await upsertDailyStore(executor, chainDbId, store, domain);
    storeIdsBySlug.set(slug, id);
    return id;
  }


  async function upsertRawRecordBatch(records: Array<{
    ordinal: number;
    recordType: string;
    externalRef?: string;
    observedAt?: string;
    payload: unknown;
    payloadHash: string;
    provenance: Record<string, unknown>;
  }>): Promise<Map<number, string>> {
    if (records.length === 0) return new Map();
    const ids = new Map<number, string>();
    for (const chunk of chunkDailyRows(records)) {
      const rows = await executor.query<BatchRawRecordIdRow>(
      `with input as (
         select *
         from jsonb_to_recordset($2::jsonb) as x(
           ordinal int,
           record_type text,
           external_ref text,
           observed_at timestamptz,
           payload jsonb,
           payload_hash text,
           provenance jsonb
         )
       ),
       upserted as (
         insert into raw_records(
           source_run_id,
           record_type,
           external_ref,
           observed_at,
           payload,
           payload_hash,
           provenance
         )
         select $1, record_type, external_ref, observed_at, payload, payload_hash, provenance
         from (
           select distinct on (payload_hash)
             record_type,
             external_ref,
             observed_at,
             payload,
             payload_hash,
             provenance
           from input
           order by payload_hash, observed_at desc nulls last, ordinal desc
         ) raw_input
         on conflict (source_run_id, payload_hash) do update set
           record_type = excluded.record_type,
           external_ref = excluded.external_ref,
           observed_at = excluded.observed_at,
           payload = excluded.payload,
           provenance = excluded.provenance
         returning id, payload_hash
       )
       select input.ordinal, upserted.id
       from input
       join upserted on upserted.payload_hash = input.payload_hash
       order by input.ordinal`,
      [sourceRun.sourceRunId, JSON.stringify(chunk.map((record) => ({
        ordinal: record.ordinal,
        record_type: record.recordType,
        external_ref: record.externalRef ?? null,
        observed_at: record.observedAt ?? null,
        payload: record.payload,
        payload_hash: record.payloadHash,
        provenance: record.provenance
      })))]
      );
      for (const row of rows) ids.set(Number(row.ordinal), row.id);
    }
    return ids;
  }

  async function insertFuelPriceSourceObservationLinks(links: Array<{
    observationId: string;
    fuelGradeId: FuelGradeId;
    originalPriceText: string;
    originalEffectiveDate?: string;
  }>): Promise<void> {
    if (links.length === 0) return;
    const rows = await executor.query<FuelPriceSourceIdRow>(
      `insert into fuel_price_sources(
         source_kind,
         operator_id,
         operator_name,
         source_url,
         parser_version,
         captured_at,
         provenance
       ) values ($1, $2, $3, $4, $5, $6, $7)
       returning id`,
      [
        'operator_public_price_page',
        normalizeDailySlug(config.chainId),
        config.chainId.toUpperCase(),
        config.endpointUrl,
        config.parserVersion,
        config.requestedAt ?? result.plan.provenance.capturedAt,
        JSON.stringify({
          chainId: config.chainId,
          connectorId: config.connectorId,
          sourceRunId: sourceRun.sourceRunId,
          runKey: result.plan.runKey,
          domain
        })
      ]
    );
    const sourceId = rows[0]?.id;
    if (!sourceId) throw new Error(`Daily ingestion fuel source insert did not return an id: ${config.connectorId}`);

    await executor.query(
      `insert into fuel_price_source_observations(
         source_id,
         observation_id,
         fuel_grade_id,
         original_price_text,
         original_effective_date
       )
       select
         $1,
         observation_id,
         fuel_grade_id,
         original_price_text,
         original_effective_date
       from jsonb_to_recordset($2::jsonb) as x(
         observation_id uuid,
         fuel_grade_id text,
         original_price_text text,
         original_effective_date date
       )
       on conflict (observation_id) do update set
         source_id = excluded.source_id,
         fuel_grade_id = excluded.fuel_grade_id,
         original_price_text = excluded.original_price_text,
         original_effective_date = excluded.original_effective_date`,
      [sourceId, JSON.stringify(links.map((link) => ({
        observation_id: link.observationId,
        fuel_grade_id: link.fuelGradeId,
        original_price_text: link.originalPriceText,
        original_effective_date: link.originalEffectiveDate ?? null
      })))]
    );
  }

  try {
    const configuredChainId = await getDailyChainId(config.chainId);
    for (const store of config.stores ?? []) {
      await getDailyStoreId(configuredChainId, store);
    }

    const productIdsBySlug = await upsertDailyProductBatch(executor, result.ingestion.accepted.map((accepted) => accepted.product), domain);
    const imageCacheProducts: ImageCacheProduct[] = [];
    const aliasesToUpsert: Parameters<typeof upsertDailyAliasBatch>[1] = [];
    for (const accepted of result.ingestion.accepted) {
      const productId = productIdsBySlug.get(normalizeDailySlug(accepted.product.id));
      if (!productId) throw new Error(`Daily ingestion product batch did not return an id: ${accepted.product.id}`);
      aliasesToUpsert.push({
        productId,
        alias: accepted.alias.rawName,
        normalizedAlias: accepted.alias.rawName.trim().toLowerCase().replace(/\s+/g, ' '),
        sourceRef: result.plan.runKey,
        matchConfidence: accepted.alias.matchConfidence
      });
      if (accepted.product.imageUrl?.trim()) {
        imageCacheProducts.push({ productId, imageUrl: accepted.product.imageUrl });
      }
    }
    await upsertDailyAliasBatch(executor, aliasesToUpsert);

    const rawRecordsToUpsert: Parameters<typeof upsertRawRecordBatch>[0] = [];
    const observationsToInsert: PriceObservationRecord[] = [];

    for (const [ordinal, accepted] of result.ingestion.accepted.entries()) {
      const chainId = await getDailyChainId(accepted.priceObservation.chainId);
      const storeConfig = accepted.priceObservation.storeId ? storesBySlug.get(normalizeDailySlug(accepted.priceObservation.storeId)) : undefined;
      const storeId = storeConfig ? await getDailyStoreId(chainId, storeConfig) : undefined;
      const productId = productIdsBySlug.get(normalizeDailySlug(accepted.product.id));
      if (!productId) throw new Error(`Daily ingestion product batch did not return an id: ${accepted.product.id}`);

      const payload = {
        chainId: config.chainId,
        productId: accepted.product.id,
        storeId: accepted.priceObservation.storeId,
        priceType: accepted.priceObservation.priceType,
        price: accepted.priceObservation.price,
        isAvailable: accepted.priceObservation.isAvailable,
        observedAt: accepted.priceObservation.observedAt
      };
      const rawProvenance = {
        sourceType: accepted.priceObservation.provenance.sourceType,
        sourceUrl: accepted.priceObservation.provenance.sourceUrl,
        parserVersion: accepted.priceObservation.provenance.parserVersion,
        rawSnapshotRef: accepted.priceObservation.provenance.rawSnapshotRef,
        chainId: config.chainId,
        cadence: 'daily',
        connectorId: config.connectorId,
        runKey: result.plan.runKey,
        domain
      };
      rawRecordsToUpsert.push({
        ordinal,
        recordType: 'price',
        externalRef: accepted.priceObservation.retailerProductId ?? accepted.product.id,
        observedAt: accepted.priceObservation.observedAt,
        payload,
        payloadHash: dailyPayloadHash({
          runKey: result.plan.runKey,
          productId: accepted.product.id,
          retailerProductId: accepted.priceObservation.retailerProductId ?? null,
          storeId: accepted.priceObservation.storeId ?? null,
          observedAt: accepted.priceObservation.observedAt,
          price: accepted.priceObservation.price,
          isAvailable: accepted.priceObservation.isAvailable
        }),
        provenance: rawProvenance
      });
      observationsToInsert.push({
        productId,
        chainId,
        storeId,
        sourceRunId: sourceRun.sourceRunId,
        retailerProductRef: accepted.priceObservation.retailerProductId,
        priceType: dbPriceTypeForIngested(accepted.priceObservation.priceType),
        price: accepted.priceObservation.price,
        regularPrice: accepted.priceObservation.regularPrice,
        unitPrice: accepted.priceObservation.unitPrice,
        currency: accepted.priceObservation.currency,
        quantity: accepted.product.packageSize,
        quantityUnit: accepted.product.packageUnit,
        promotionText: accepted.promotionObservation?.promoText,
        promotionStartsOn: accepted.promotionObservation?.validFrom?.slice(0, 10),
        promotionEndsOn: accepted.promotionObservation?.validUntil?.slice(0, 10),
        memberRequired: accepted.promotionObservation?.memberOnly ?? false,
        isAvailable: accepted.priceObservation.isAvailable,
        observedAt: accepted.priceObservation.observedAt,
        validFrom: accepted.priceObservation.validFrom,
        validUntil: accepted.priceObservation.validUntil,
        confidence: accepted.priceObservation.confidenceScore,
        domain,
        provenance: rawProvenance
      });
    }

    const rawRecordIdsByOrdinal = await upsertRawRecordBatch(rawRecordsToUpsert);
    for (let index = 0; index < observationsToInsert.length; index += 1) {
      const rawRecordId = rawRecordIdsByOrdinal.get(index);
      if (!rawRecordId) throw new Error(`Daily ingestion raw record batch did not return an id for accepted record ${index}`);
      rawRecordIds.push(rawRecordId);
      observationsToInsert[index]!.rawRecordId = rawRecordId;
    }
    const insertedObservationIds = (await priceWriter.upsertConnectorPriceObservations(observationsToInsert)).observationIds;
    observationIds.push(...insertedObservationIds);

    if (domain === 'fuel') {
      await insertFuelPriceSourceObservationLinks(result.ingestion.accepted.flatMap((accepted, index) => {
        const source = accepted.priceObservation.fuelSource;
        const observationId = insertedObservationIds[index];
        if (!source || !observationId) return [];
        return [{
          observationId,
          fuelGradeId: source.fuelGradeId,
          originalPriceText: source.originalPriceText,
          originalEffectiveDate: source.originalEffectiveDate
        }];
      }));
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
      rejectedCount: result.rejectedCount,
      imageCacheProducts
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sourceWriter.finishSourceRun({
      sourceRunId: sourceRun.sourceRunId,
      finishedAt: config.requestedAt,
      status: 'failed',
      errorMessage: message
    });
    throw error;
  }
}

type DailyConnectorRunPersistenceResult = Pick<DailyIngestionRunResult, 'sourceRunIds' | 'rawRecordIds' | 'observationIds' | 'acceptedCount' | 'rejectedCount'> & {
  blockers: string[];
  persistedRuns: number;
  imageCacheProducts?: ImageCacheProduct[];
};

function writeDailyIngestionBlockerLog(path: string, result: DailyIngestionRunResult, requestedAt: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const lines = [
    '# Daily ingestion blockers',
    '',
    `requestedAt: ${requestedAt}`,
    `status: ${result.status}`,
    `persistedRuns: ${result.persistedRuns}`,
    `acceptedCount: ${result.acceptedCount}`,
    `rejectedCount: ${result.rejectedCount}`,
    `sourceRunCount: ${result.sourceRunIds.length}`,
    `rawRecordCount: ${result.rawRecordIds.length}`,
    `observationCount: ${result.observationIds.length}`,
    '',
    'blockers:'
  ];

  if (result.blockers.length === 0) {
    lines.push('- none');
  } else {
    lines.push(...result.blockers.map((blocker) => `- ${blocker}`));
  }

  writeFileSync(path, `${lines.join('\n')}\n`);
}

function normalizeDailyRunnerInteger(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

async function waitForDailyRunnerDelay(delayMs: number): Promise<void> {
  if (delayMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function isTransientDailyDatabaseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection\s+(?:to database\s+)?closed|terminating connection|connection terminated|database system is not accepting connections|EDBHANDLEREXITED|ECONNRESET|ECONNREFUSED|econnrefused|EPIPE|timeout|Connection terminated unexpectedly/i.test(message);
}

export function createDailyIngestionQueryExecutor(
  client: PgLikeClient,
  options: { retryAttempts?: number; retryBaseDelayMs?: number } = {}
): QueryExecutor {
  const retryAttempts = normalizeDailyRunnerInteger(options.retryAttempts, 8);
  const retryBaseDelayMs = normalizeDailyRunnerInteger(options.retryBaseDelayMs, 2000);
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
        try {
          const result = await client.query(sql, params);
          return result.rows as T[];
        } catch (error) {
          if (attempt >= retryAttempts || !isTransientDailyDatabaseError(error)) throw error;
          process.stderr.write(`[daily-ingestion] retrying database query attempt=${attempt + 2}/${retryAttempts + 1}: ${error instanceof Error ? error.message : String(error)}
`);
          await waitForDailyRunnerDelay(retryBaseDelayMs * (attempt + 1));
        }
      }
      throw new Error('Daily ingestion database query retry loop exhausted.');
    }
  };
}

async function runDailyIngestionConnector(input: {
  executor: QueryExecutor;
  requestedAt: string;
  config: DailyIngestionConnectorConfig;
  fetchImpl?: typeof fetch;
  retryAttempts: number;
  retryBaseDelayMs: number;
}): Promise<DailyConnectorRunPersistenceResult> {
  const { executor, config, requestedAt, fetchImpl, retryAttempts, retryBaseDelayMs } = input;
  const runConfig = { ...config, requestedAt };

  for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
    if (attempt > 0) {
      process.stderr.write(`[daily-ingestion] retrying ${config.connectorId} (${config.chainId}) attempt=${attempt + 1}/${retryAttempts + 1}\n`);
      await waitForDailyRunnerDelay(retryBaseDelayMs * attempt);
    }

    process.stderr.write(`[daily-ingestion] starting ${config.connectorId} (${config.chainId}) attempt=${attempt + 1}/${retryAttempts + 1}\n`);
    const result = await runRetailerConnector({
      ...runConfig,
      fetcher: (plan) => fetchDailyConnectorSnapshot(plan, {
        retrievedAt: requestedAt,
        rawSnapshotRefPrefix: 'raw://daily-ingestion',
        fetchImpl,
        storeConcurrency: config.storeConcurrency,
        storeStartDelayMs: config.storeStartDelayMs,
        storeRetryAttempts: config.storeRetryAttempts,
        storeRetryBaseDelayMs: config.storeRetryBaseDelayMs,
        headers: { accept: 'application/json' }
      }),
      parser: parseRetailerProductJsonSnapshot
    });

    process.stderr.write(`[daily-ingestion] fetched ${config.connectorId}: status=${result.status} accepted=${result.acceptedCount} rejected=${result.rejectedCount}\n`);

    if (result.status === 'blocked') {
      return {
        blockers: result.requiredActions.map((action) => `${config.chainId}:${action}`),
        persistedRuns: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        sourceRunIds: [],
        rawRecordIds: [],
        observationIds: []
      };
    }

    if (result.status !== 'completed') {
      if (attempt < retryAttempts) continue;
      return {
        blockers: [`${config.chainId}:connector_${result.status}`],
        persistedRuns: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        sourceRunIds: [],
        rawRecordIds: [],
        observationIds: []
      };
    }

    if (result.acceptedCount === 0) {
      return {
        blockers: [`${config.chainId}:no_accepted_products`],
        persistedRuns: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        sourceRunIds: [],
        rawRecordIds: [],
        observationIds: []
      };
    }

    const storeScopeBlockers = validateStoreScopedConnectorOutput(runConfig, result);
    const storeCoverageBlockers = storeScopeBlockers.length === 0
      ? validateConfiguredStoreObservationCoverage(runConfig, result)
      : [];
    const storeBlockers = [...storeScopeBlockers, ...storeCoverageBlockers];
    if (storeBlockers.length > 0) {
      return {
        blockers: storeBlockers,
        persistedRuns: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        sourceRunIds: [],
        rawRecordIds: [],
        observationIds: []
      };
    }

    try {
      const persisted = await persistDailyConnectorOutput({ executor, config: runConfig, result });
      const blockers = persisted.rejectedCount > 0 ? [`${config.chainId}:rejected_products:${persisted.rejectedCount}`] : [];
      process.stderr.write(`[daily-ingestion] persisted ${config.connectorId}: accepted=${persisted.acceptedCount} rejected=${persisted.rejectedCount} observations=${persisted.observationIds.length}\n`);
      return {
        ...persisted,
        blockers,
        persistedRuns: 1
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      process.stderr.write(`[daily-ingestion] persistence failed ${config.connectorId}: ${message}\n`);
      return {
        blockers: [`${config.chainId}:persistence_failed:${message}`],
        persistedRuns: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        sourceRunIds: [],
        rawRecordIds: [],
        observationIds: []
      };
    }
  }

  return {
    blockers: [`${config.chainId}:connector_failed`],
    persistedRuns: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    sourceRunIds: [],
    rawRecordIds: [],
    observationIds: []
  };
}

export async function runDailyIngestion(input: DailyIngestionRunInput): Promise<DailyIngestionRunResult> {
  const maxConcurrency = Math.max(1, normalizeDailyRunnerInteger(input.maxConcurrency, 1));
  const connectorStartDelayMs = normalizeDailyRunnerInteger(input.connectorStartDelayMs, 0);
  const retryAttempts = normalizeDailyRunnerInteger(input.connectorRetryAttempts, 0);
  const retryBaseDelayMs = normalizeDailyRunnerInteger(input.connectorRetryBaseDelayMs, 250);
  const results = new Array<DailyConnectorRunPersistenceResult | undefined>(input.connectors.length);
  let nextConnectorIndex = 0;
  let nextConnectorStartAt = 0;
  let connectorStartsScheduled = 0;

  async function waitForConnectorStartSlot(): Promise<void> {
    if (connectorStartDelayMs <= 0) return;

    const now = Date.now();
    const scheduledStartAt = connectorStartsScheduled === 0 ? now : Math.max(now, nextConnectorStartAt);
    connectorStartsScheduled += 1;
    nextConnectorStartAt = scheduledStartAt + connectorStartDelayMs;
    await waitForDailyRunnerDelay(Math.max(0, scheduledStartAt - now));
  }

  async function worker(): Promise<void> {
    while (nextConnectorIndex < input.connectors.length) {
      const connectorIndex = nextConnectorIndex;
      nextConnectorIndex += 1;
      const config = input.connectors[connectorIndex];
      if (!config) continue;
      await waitForConnectorStartSlot();
      results[connectorIndex] = await runDailyIngestionConnector({
        executor: input.executor,
        requestedAt: input.requestedAt,
        config,
        fetchImpl: input.fetchImpl,
        retryAttempts,
        retryBaseDelayMs
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(maxConcurrency, Math.max(1, input.connectors.length)) }, () => worker()));

  const blockers: string[] = [];
  const sourceRunIds: string[] = [];
  const rawRecordIds: string[] = [];
  const observationIds: string[] = [];
  const chainSummaries: DailyIngestionConnectorSummary[] = [];
  const imageCacheProducts: ImageCacheProduct[] = [];
  let persistedRuns = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;

  for (const [index, result] of results.entries()) {
    if (!result) continue;
    const config = input.connectors[index];
    if (!config) continue;
    blockers.push(...result.blockers);
    persistedRuns += result.persistedRuns;
    acceptedCount += result.acceptedCount;
    rejectedCount += result.rejectedCount;
    sourceRunIds.push(...result.sourceRunIds);
    rawRecordIds.push(...result.rawRecordIds);
    observationIds.push(...result.observationIds);
    imageCacheProducts.push(...(result.imageCacheProducts ?? []));
    chainSummaries.push({
      connectorId: config.connectorId,
      chainId: config.chainId,
      status: result.blockers.length === 0 ? 'succeeded' : result.persistedRuns > 0 ? 'partial' : 'blocked',
      blockers: [...result.blockers],
      persistedRuns: result.persistedRuns,
      acceptedCount: result.acceptedCount,
      rejectedCount: result.rejectedCount,
      sourceRunIds: [...result.sourceRunIds],
      rawRecordIds: [...result.rawRecordIds],
      observationIds: [...result.observationIds]
    });
  }

  if (input.imageCache && input.imageCache.enabled !== false && imageCacheProducts.length > 0) {
    try {
      const imageCacheResult = await cacheAndRewriteProductImages(input.executor, imageCacheProducts, {
        fetchImpl: input.fetchImpl,
        ...input.imageCache
      });
      process.stderr.write(`[daily-ingestion] cached product images: cached=${imageCacheResult.cachedImages.length} updated=${imageCacheResult.updatedProductIds.length} skipped=${imageCacheResult.skippedProductIds.length}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      blockers.push(`image_cache_failed:${message}`);
      process.stderr.write(`[daily-ingestion] image cache failed: ${message}\n`);
    }
  }

  const runResult: DailyIngestionRunResult = {
    status: blockers.length === 0 ? 'succeeded' : persistedRuns > 0 ? 'partial' : 'blocked',
    blockers,
    persistedRuns,
    acceptedCount,
    rejectedCount,
    sourceRunIds,
    rawRecordIds,
    observationIds,
    chainSummaries
  };

  if (input.blockerLogPath?.trim()) {
    writeDailyIngestionBlockerLog(input.blockerLogPath.trim(), runResult, input.requestedAt);
  }

  return runResult;
}

export async function runDailyIngestionFromEnv(env: DailyIngestionEnv = process.env): Promise<DailyIngestionRunResult> {
  const { databaseUrl, connectors, runtimeOptions } = buildDailyConnectorConfigsFromEnv(env);
  const pg = requireForDailyIngestion('pg') as { Pool?: new (config: { connectionString: string; max?: number }) => { query(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>; end(): Promise<void>; on?(event: 'error', listener: (error: unknown) => void): void } };
  if (!pg.Pool) throw new Error('pg Pool export is not available.');
  const pool = new pg.Pool(buildDailyIngestionPostgresPoolConfig(databaseUrl));
  pool.on?.('error', (error: unknown) => {
    process.stderr.write(`[daily-ingestion] database pool error: ${error instanceof Error ? error.message : String(error)}\n`);
  });
  const executor = createDailyIngestionQueryExecutor(pool, {
    retryAttempts: env.GROCERYVIEW_DAILY_DB_RETRY_ATTEMPTS?.trim() ? Number(env.GROCERYVIEW_DAILY_DB_RETRY_ATTEMPTS) : undefined,
    retryBaseDelayMs: env.GROCERYVIEW_DAILY_DB_RETRY_BASE_DELAY_MS?.trim() ? Number(env.GROCERYVIEW_DAILY_DB_RETRY_BASE_DELAY_MS) : undefined
  });
  try {
    await executor.query('set default_transaction_read_only=off');
    return await runDailyIngestion({
      executor,
      requestedAt: new Date().toISOString(),
      connectors,
      imageCache: buildDailyImageCacheOptionsFromEnv(env),
      ...runtimeOptions
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
