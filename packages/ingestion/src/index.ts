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
