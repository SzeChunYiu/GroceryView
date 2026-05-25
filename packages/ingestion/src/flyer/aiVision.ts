export const FLYER_AI_VISION_CONFIDENCE_THRESHOLD = 0.7;
export const FLYER_AI_VISION_DEFAULT_MAX_CALLS = 3;

export type FlyerPdfParserRow = {
  productName?: string;
  price?: number;
  priceText?: string;
  confidence: number;
};

export type FlyerImageCrop = {
  id: string;
  imageBytes: Uint8Array;
  mimeType: string;
};

export type FlyerAiVisionRow = {
  productName: string;
  price: number;
  priceText: string;
  confidence: number;
  source: 'ai_vision';
  cropId: string;
};

export type FlyerPromotionRow = FlyerPdfParserRow | FlyerAiVisionRow;

export type FlyerVisionCall = (crop: FlyerImageCrop) => Promise<Omit<FlyerAiVisionRow, 'source' | 'cropId'>>;
export type FlyerPromotionRouter<T> = (row: FlyerPromotionRow) => T;

export type RecoverUnclearFlyerRowsOptions<T> = {
  pdfRows: FlyerPdfParserRow[];
  cropsByRow: FlyerImageCrop[];
  visionCall: FlyerVisionCall;
  promotionRouter: FlyerPromotionRouter<T>;
  confidenceThreshold?: number;
  maxVisionCalls?: number;
};

export async function recoverUnclearFlyerRows<T>(options: RecoverUnclearFlyerRowsOptions<T>): Promise<T[]> {
  const threshold = options.confidenceThreshold ?? FLYER_AI_VISION_CONFIDENCE_THRESHOLD;
  const maxCalls = options.maxVisionCalls ?? FLYER_AI_VISION_DEFAULT_MAX_CALLS;
  const routed: T[] = [];
  let calls = 0;

  for (let index = 0; index < options.pdfRows.length; index += 1) {
    const pdfRow = options.pdfRows[index];
    if (pdfRow.confidence >= threshold) {
      routed.push(options.promotionRouter(pdfRow));
      continue;
    }

    const crop = options.cropsByRow[index];
    if (!crop || calls >= maxCalls) {
      routed.push(options.promotionRouter(pdfRow));
      continue;
    }

    calls += 1;
    const recovered = await options.visionCall(crop);
    routed.push(options.promotionRouter({
      ...recovered,
      source: 'ai_vision',
      cropId: crop.id
    }));
  }

  return routed;
}
