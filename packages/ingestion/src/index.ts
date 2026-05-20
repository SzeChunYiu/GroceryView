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

const DEFAULT_ROBOTS_CHECKED_AT = '2026-05-20T00:00:00.000Z';

const RETAILER_SOURCE_REGISTRY: RetailerSourceRegistryEntry[] = [
  {
    chainId: 'ica',
    displayName: 'ICA',
    surfaces: ['store_locator', 'online_product', 'weekly_offer'],
    sourceUrls: ['https://www.ica.se/butiker/', 'https://www.ica.se/handla/', 'https://www.ica.se/erbjudanden/'],
    robotsPolicy: {
      robotsUrl: 'https://www.ica.se/robots.txt',
      status: 'unknown',
      disallowedPaths: [],
      checkedAt: DEFAULT_ROBOTS_CHECKED_AT
    },
    legalReviewStatus: 'pending',
    stubOnly: true
  },
  {
    chainId: 'willys',
    displayName: 'Willys',
    ownerGroup: 'Axfood',
    surfaces: ['store_locator', 'online_product', 'weekly_offer', 'flyer', 'member_offer'],
    sourceUrls: ['https://www.willys.se/artikel/om-willys-appen', 'https://www.willys.se/artikel/hemleverans', 'https://www.willys.se/erbjudanden/butik'],
    robotsPolicy: {
      robotsUrl: 'https://www.willys.se/robots.txt',
      status: 'allow',
      crawlDelaySeconds: 10,
      visitTimeUtc: '0400-0845',
      disallowedPaths: ['/kassa/', '/varukorg', '/mitt-konto/', '/mina-kop/', '/mina-listor/', '/delad-lista/', '/minavanligastevaror', '/o/', '/sok'],
      checkedAt: DEFAULT_ROBOTS_CHECKED_AT
    },
    legalReviewStatus: 'pending',
    stubOnly: true
  },
  {
    chainId: 'coop',
    displayName: 'Coop',
    surfaces: ['store_locator', 'online_product', 'weekly_offer'],
    sourceUrls: ['https://www.coop.se/butiker-erbjudanden/', 'https://www.coop.se/handla/'],
    robotsPolicy: {
      robotsUrl: 'https://www.coop.se/robots.txt',
      status: 'unknown',
      disallowedPaths: [],
      checkedAt: DEFAULT_ROBOTS_CHECKED_AT
    },
    legalReviewStatus: 'pending',
    stubOnly: true
  },
  {
    chainId: 'hemkop',
    displayName: 'Hemkop',
    ownerGroup: 'Axfood',
    surfaces: ['store_locator', 'online_product', 'weekly_offer', 'flyer'],
    sourceUrls: ['https://www.hemkop.se/handla', 'https://www.hemkop.se/artikel/anvandarvillkor'],
    robotsPolicy: {
      robotsUrl: 'https://www.hemkop.se/robots.txt',
      status: 'allow',
      crawlDelaySeconds: 10,
      visitTimeUtc: '0400-0845',
      disallowedPaths: ['/kassa/', '/varukorg/', '/mina-sidor/', '/min-order/', '/o/', '/*?sort=', '/*?q=', '/dev-info', '/beta/'],
      checkedAt: DEFAULT_ROBOTS_CHECKED_AT
    },
    legalReviewStatus: 'pending',
    stubOnly: true
  },
  {
    chainId: 'lidl',
    displayName: 'Lidl Sweden',
    surfaces: ['store_locator', 'weekly_offer', 'flyer', 'member_offer'],
    sourceUrls: ['https://www.lidl.se/', 'https://www.lidl.se/c/'],
    robotsPolicy: {
      robotsUrl: 'https://www.lidl.se/robots.txt',
      status: 'unknown',
      disallowedPaths: [],
      checkedAt: DEFAULT_ROBOTS_CHECKED_AT
    },
    legalReviewStatus: 'pending',
    stubOnly: true
  },
  {
    chainId: 'city_gross',
    displayName: 'City Gross',
    ownerGroup: 'Axfood',
    surfaces: ['store_locator', 'online_product', 'weekly_offer'],
    sourceUrls: ['https://www.citygross.se/', 'https://www.citygross.se/butiker'],
    robotsPolicy: {
      robotsUrl: 'https://www.citygross.se/robots.txt',
      status: 'allow',
      disallowedPaths: ['/mina-sidor/', '/loop54/'],
      checkedAt: DEFAULT_ROBOTS_CHECKED_AT
    },
    legalReviewStatus: 'pending',
    stubOnly: true
  }
];

export function buildRetailerSourceRegistry(): RetailerSourceRegistryEntry[] {
  return RETAILER_SOURCE_REGISTRY.map((entry) => ({
    ...entry,
    surfaces: [...entry.surfaces],
    sourceUrls: [...entry.sourceUrls],
    robotsPolicy: {
      ...entry.robotsPolicy,
      disallowedPaths: [...entry.robotsPolicy.disallowedPaths]
    }
  }));
}

export function findRetailerSourceRegistryEntry(chainId: RetailerChainId): RetailerSourceRegistryEntry {
  const entry = RETAILER_SOURCE_REGISTRY.find((candidate) => candidate.chainId === chainId);
  if (!entry) throw new Error(`Retailer source registry entry not found: ${chainId}`);
  return buildRetailerSourceRegistry().find((candidate) => candidate.chainId === chainId)!;
}

function sourceHost(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).host;
  } catch {
    throw new Error('sourceUrl must be an absolute URL.');
  }
}

export function planFlyerSourceFetch(input: FlyerSourcePlanInput): FlyerSourcePlan {
  if (Number.isNaN(Date.parse(input.retrievedAt))) throw new Error('retrievedAt must be an ISO date.');
  const registryEntry = findRetailerSourceRegistryEntry(input.chainId);
  return {
    chainId: input.chainId,
    sourceUrl: input.sourceUrl,
    sourceHost: sourceHost(input.sourceUrl),
    format: input.format,
    retrievedAt: input.retrievedAt,
    storeId: input.storeId,
    retailerStoreKey: input.retailerStoreKey,
    requiresStoreSelection: input.requiresStoreSelection ?? false,
    requiresAuthentication: input.requiresAuthentication ?? false,
    memberOnly: input.memberOnly ?? false,
    rawSnapshotRef: input.rawSnapshotRef ?? null,
    contentHash: input.contentHash ?? null,
    parserVersion: input.parserVersion ?? '0.1.0',
    robotsPolicy: {
      ...registryEntry.robotsPolicy,
      disallowedPaths: [...registryEntry.robotsPolicy.disallowedPaths]
    },
    legalReviewStatus: registryEntry.legalReviewStatus,
    emitsProductFacts: false
  };
}

export function buildDefaultFlyerSourcePlans(retrievedAt = DEFAULT_ROBOTS_CHECKED_AT): FlyerSourcePlan[] {
  return [
    planFlyerSourceFetch({
      chainId: 'ica',
      sourceUrl: 'https://www.ica.se/butiker/erbjudanden/',
      format: 'weekly_offer_html',
      retrievedAt,
      requiresStoreSelection: true
    }),
    planFlyerSourceFetch({
      chainId: 'willys',
      sourceUrl: 'https://www.willys.se/erbjudanden/butik',
      format: 'store_offer_html',
      retrievedAt,
      requiresStoreSelection: true
    }),
    planFlyerSourceFetch({
      chainId: 'hemkop',
      sourceUrl: 'https://www.hemkop.se/handla',
      format: 'digital_flyer',
      retrievedAt
    }),
    planFlyerSourceFetch({
      chainId: 'lidl',
      sourceUrl: 'https://www.lidl.se/c/lidl-plus/s10017033',
      format: 'member_offer',
      retrievedAt,
      requiresAuthentication: true,
      memberOnly: true
    }),
    planFlyerSourceFetch({
      chainId: 'willys',
      sourceUrl: 'https://www.willys.se/artikel/om-willys-appen',
      format: 'app_offer',
      retrievedAt,
      requiresAuthentication: true,
      memberOnly: true
    }),
    planFlyerSourceFetch({
      chainId: 'city_gross',
      sourceUrl: 'https://www.citygross.se/reklamblad',
      format: 'app_rendered_offer_html',
      retrievedAt
    }),
    planFlyerSourceFetch({
      chainId: 'coop',
      sourceUrl: 'https://dr.coop.se/Butik/?store=105740',
      format: 'store_offer_html',
      retrievedAt,
      retailerStoreKey: '105740',
      requiresStoreSelection: true
    })
  ];
}

const OFFICIAL_BASELINE_SOURCES: OfficialBaselineSource[] = [
  {
    id: 'scb-cpi-food-nonalcoholic-2020',
    authority: 'SCB',
    name: 'Consumer Price Index (CPI), food and non-alcoholic beverages, 2020=100',
    kind: 'price_index',
    datasetUrl: 'https://www.statistikdatabasen.scb.se/pxweb/en/ssd/START__PR__PR0101__PR0101A/KPI2020EPG01M/',
    apiUrl: 'https://www.scb.se/en/services/open-data-api/pxwebapi/pxwebapi-2.0',
    license: 'CC0',
    requiresAttribution: false,
    categoryScope: 'national_food_and_non_alcoholic_beverages',
    canGenerateStorePrices: false,
    canGenerateSkuPrices: false
  },
  {
    id: 'scb-pxweb-api',
    authority: 'SCB',
    name: 'Statistics Sweden PxWeb API',
    kind: 'price_index',
    datasetUrl: 'https://www.scb.se/en/services/open-data-api/',
    apiUrl: 'https://www.scb.se/en/services/open-data-api/pxwebapi/pxwebapi-2.0',
    license: 'CC0',
    requiresAttribution: false,
    categoryScope: 'official_statistics_query_transport',
    canGenerateStorePrices: false,
    canGenerateSkuPrices: false
  },
  {
    id: 'sjv-kpi-j-ppi-j-food',
    authority: 'Jordbruksverket',
    name: 'Prisindex och priser på livsmedelsområdet KPI-J/PPI-J',
    kind: 'price_index',
    datasetUrl: 'https://jordbruksverket.se/om-jordbruksverket/jordbruksverkets-officiella-statistik/jordbruksverkets-statistikrapporter/statistik/2025-12-15-prisindex-och-priser-pa-livsmedelsomradet--ars--och-manadsstatistik---202510',
    license: 'OFFICIAL_STATISTICS_TERMS_PENDING',
    requiresAttribution: true,
    attribution: 'Jordbruksverket',
    categoryScope: 'agriculture_regulated_food_indices',
    canGenerateStorePrices: false,
    canGenerateSkuPrices: false
  },
  {
    id: 'eurostat-hicp-food',
    authority: 'Eurostat',
    name: 'Harmonised Indices of Consumer Prices food categories',
    kind: 'price_index',
    datasetUrl: 'https://ec.europa.eu/eurostat/web/hicp',
    license: 'OFFICIAL_STATISTICS_TERMS_PENDING',
    requiresAttribution: true,
    attribution: 'Eurostat',
    categoryScope: 'international_hicp_food_comparison',
    canGenerateStorePrices: false,
    canGenerateSkuPrices: false
  },
  {
    id: 'slv-food-composition',
    authority: 'Livsmedelsverket',
    name: 'Swedish Food Composition Database',
    kind: 'taxonomy',
    datasetUrl: 'https://www.livsmedelsverket.se/en/about-us/open-data/food-composition-data/',
    apiUrl: 'https://dataportal.livsmedelsverket.se/livsmedel/swagger/index.html',
    license: 'CC_BY_4_0',
    requiresAttribution: true,
    attribution: 'Livsmedelsverket',
    categoryScope: 'food_taxonomy_and_composition',
    canGenerateStorePrices: false,
    canGenerateSkuPrices: false
  }
];

export function buildOfficialBaselineSourceRegistry(): OfficialBaselineSource[] {
  return OFFICIAL_BASELINE_SOURCES.map((source) => ({ ...source }));
}

export function officialPriceIndexSources(): OfficialBaselineSource[] {
  return buildOfficialBaselineSourceRegistry().filter((source) => source.kind === 'price_index');
}

export function assertOfficialPriceIndexSource(source: OfficialBaselineSource): OfficialBaselineSource {
  if (source.kind !== 'price_index') throw new Error(`Official source is not a price index: ${source.id}`);
  return source;
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
  sourceType: SourceType;
  sourceUrl?: string;
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
  sourceType: SourceType;
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
  if (Number.isNaN(Date.parse(input.observedAt))) throw new Error('observedAt must be an ISO date.');
}

export function ingestRetailerProduct(input: RetailerProductInput): IngestionOutput {
  validateInput(input);
  const confidence = confidenceForSource(input.sourceType);
  const normalized = normalizeUnitPrice(input);
  const hasPromotion = input.regularPrice !== undefined && input.regularPrice > input.price;

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
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
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
          sourceType: input.sourceType,
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
