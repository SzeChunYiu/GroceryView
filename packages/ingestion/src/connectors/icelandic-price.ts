/**
 * Parse Icelandic retail prices from text or numbers.
 * Supports thousands with dots (1.299) and decimals with comma (1.299,90)
 * or dot decimals from APIs (231.30).
 */
export function parseIcelandicPrice(value: string | number | undefined | null): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const match = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseIcelandicPriceOrNull(value: string | number | undefined | null): number | null {
  const parsed = parseIcelandicPrice(value);
  return parsed === undefined ? null : parsed;
}
