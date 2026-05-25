export type MissingProductRequest = {
  missingQuery: string;
  barcode?: string;
  preferredStore?: string;
  shopperEmail?: string;
  capturedAt: string;
  source: 'zero_result_search';
};

export function buildMissingProductRequest(input: {
  missingQuery: string;
  barcode?: string;
  preferredStore?: string;
  shopperEmail?: string;
  capturedAt?: string;
}): MissingProductRequest | null {
  const missingQuery = input.missingQuery.trim();
  const barcode = input.barcode?.trim();
  const preferredStore = input.preferredStore?.trim();
  const shopperEmail = input.shopperEmail?.trim();
  if (!missingQuery && !barcode) return null;

  return {
    missingQuery,
    ...(barcode ? { barcode } : {}),
    ...(preferredStore ? { preferredStore } : {}),
    ...(shopperEmail ? { shopperEmail } : {}),
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    source: 'zero_result_search'
  };
}

export function missingProductRequestMailto(request: MissingProductRequest) {
  const body = [
    `Missing query: ${request.missingQuery || 'not provided'}`,
    `Barcode: ${request.barcode ?? 'not provided'}`,
    `Preferred store: ${request.preferredStore ?? 'not provided'}`,
    `Shopper email: ${request.shopperEmail ?? 'not provided'}`,
    `Captured at: ${request.capturedAt}`
  ].join('\n');
  return `mailto:catalog@groceryview.example?subject=${encodeURIComponent('Missing product request')}&body=${encodeURIComponent(body)}`;
}
