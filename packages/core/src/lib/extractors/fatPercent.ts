export type FatPercentExtraction = {
  fat_percent: number;
  source: string;
  kind: 'single' | 'range';
  min?: number;
  max?: number;
};

const normalizeDecimal = (value: string): number => Number.parseFloat(value.replace(',', '.'));
const roundOneDecimal = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

/**
 * Extract fat percentage from Swedish grocery names/descriptions.
 *
 * Supports explicit fat context ("17% fett", "fett 3%", "fetthalt 10-15%")
 * and common dairy/mince titles such as "Mjölk 3.0%". Ranges return the midpoint
 * as fat_percent and preserve min/max with kind="range".
 */
export function extractFatPercent(input: string): FatPercentExtraction | undefined {
  const text = input.normalize('NFKC');
  const number = String.raw`\d+(?:[,.]\d+)?`;
  const range = String.raw`(${number})\s*(?:-|–|—|till)\s*(${number})\s*%`;
  const single = String.raw`(${number})\s*%`;

  const rangePatterns = [
    new RegExp(String.raw`\b(?:fett|fetthalt)\b[^\d%]{0,20}${range}`, 'i'),
    new RegExp(String.raw`${range}[^\p{L}\d]{0,20}\b(?:fett|fetthalt)\b`, 'iu'),
    new RegExp(range, 'i')
  ];

  for (const pattern of rangePatterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const min = normalizeDecimal(match[1]);
    const max = normalizeDecimal(match[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return { fat_percent: roundOneDecimal((low + high) / 2), source: match[0].trim(), kind: 'range', min: low, max: high };
  }

  const singlePatterns = [
    new RegExp(String.raw`\b(?:fett|fetthalt)\b[^\d%]{0,20}${single}`, 'i'),
    new RegExp(String.raw`${single}[^\p{L}\d]{0,20}\b(?:fett|fetthalt)\b`, 'iu'),
    new RegExp(single, 'i')
  ];

  for (const pattern of singlePatterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const value = normalizeDecimal(match[1]);
    if (!Number.isFinite(value)) continue;
    return { fat_percent: roundOneDecimal(value), source: match[0].trim(), kind: 'single' };
  }

  return undefined;
}
