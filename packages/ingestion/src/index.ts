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
