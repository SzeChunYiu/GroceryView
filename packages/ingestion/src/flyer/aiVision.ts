export type FlyerImageCrop = {
  data: Uint8Array | string;
  mimeType: string;
};

export type FlyerParserRow = {
  confidence: number;
  imageCrop?: FlyerImageCrop;
  price?: number | null;
  productName?: string;
  sourceId?: string;
};

export type VisionRecoveredFlyerRow = {
  confidence: number;
  price: number;
  productName: string;
  sourceId?: string;
};

export type LocalVisionFlyerCall = (crop: FlyerImageCrop, prompt: string) => Promise<VisionRecoveredFlyerRow[]>;

export type PromotionRouter<T> = (row: VisionRecoveredFlyerRow) => T;

export type AiVisionFallbackOptions<T> = {
  confidenceThreshold?: number;
  maxVisionCalls?: number;
  maxVisionRows?: number;
  promotionRouter: PromotionRouter<T>;
  visionCall?: LocalVisionFlyerCall;
};

export const DEFAULT_FLYER_VISION_CONFIDENCE_THRESHOLD = 0.7;
export const DEFAULT_FLYER_VISION_CALL_CAP = 8;
export const DEFAULT_FLYER_VISION_ROW_CAP = 24;

export async function recoverUnclearFlyerRows<T>(
  pdfParserRows: readonly FlyerParserRow[],
  options: AiVisionFallbackOptions<T>
): Promise<T[]> {
  const confidenceThreshold = options.confidenceThreshold ?? DEFAULT_FLYER_VISION_CONFIDENCE_THRESHOLD;
  const maxVisionCalls = options.maxVisionCalls ?? DEFAULT_FLYER_VISION_CALL_CAP;
  const maxVisionRows = options.maxVisionRows ?? DEFAULT_FLYER_VISION_ROW_CAP;
  const visionCall = options.visionCall ?? unavailableVisionCall;
  const routedRows: T[] = [];
  let visionCalls = 0;

  for (const row of pdfParserRows) {
    if (row.confidence >= confidenceThreshold || !row.imageCrop) continue;
    if (visionCalls >= maxVisionCalls || routedRows.length >= maxVisionRows) break;

    visionCalls += 1;
    const recoveredRows = await visionCall(row.imageCrop, flyerVisionPrompt(row));
    for (const recoveredRow of recoveredRows) {
      if (!isUsableVisionRow(recoveredRow)) continue;

      routedRows.push(options.promotionRouter({
        ...recoveredRow,
        sourceId: recoveredRow.sourceId ?? row.sourceId
      }));
      if (routedRows.length >= maxVisionRows) break;
    }
  }

  return routedRows;
}

export function shouldUseFlyerVisionFallback(
  row: FlyerParserRow,
  confidenceThreshold = DEFAULT_FLYER_VISION_CONFIDENCE_THRESHOLD
) {
  return row.confidence < confidenceThreshold && Boolean(row.imageCrop);
}

function flyerVisionPrompt(row: FlyerParserRow) {
  return [
    'Read this grocery flyer crop and return only product names with numeric prices.',
    'Ignore decorative text, loyalty boilerplate, and non-product copy.',
    `Parser confidence: ${row.confidence.toFixed(2)}.`,
    row.productName ? `Parser guess: ${row.productName}.` : ''
  ].filter(Boolean).join(' ');
}

function isUsableVisionRow(row: VisionRecoveredFlyerRow) {
  return Boolean(row.productName.trim() && Number.isFinite(row.price) && row.price > 0);
}

async function unavailableVisionCall(): Promise<VisionRecoveredFlyerRow[]> {
  return [];
}
