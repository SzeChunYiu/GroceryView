export type SearchProductMatch = {
  slug?: string;
  name?: string;
  brand?: string;
  chain?: string;
  barcode?: string;
  sourceTables?: string[];
  code?: string;
  source?: string;
};

export type SearchRoutePayload = {
  products: SearchProductMatch[];
};

export type SearchRouteErrorPayload = {
  error: string;
};

export function normalizeEanInput(value: string): string {
  return value.trim();
}

export function validateEanInput(value: string): string | null {
  const normalized = normalizeEanInput(value);
  if (!normalized) return 'Add an EAN/UPC value before searching.';
  if (!/^\d{8,14}$/.test(normalized)) {
    return 'EAN/UPC inputs must be 8-14 digits so malformed scans are rejected before calling the backend.';
  }
  return null;
}

export async function searchProductsByEan(ean: string): Promise<SearchRoutePayload> {
  const response = await fetch(`/api/search?ean=${encodeURIComponent(ean)}`);
  const payload = (await response.json()) as SearchRoutePayload | SearchRouteErrorPayload;

  if (!response.ok) {
    const error = 'error' in payload ? payload.error : 'Barcode search request failed.';
    throw new Error(error);
  }

  if (!Array.isArray(payload?.products)) {
    throw new Error('Barcode search response was malformed.');
  }

  return payload;
}
