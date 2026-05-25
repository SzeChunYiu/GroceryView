export type FatPercentExtraction = {
  fat_percent: number;
  isRange: boolean;
  raw: string;
};

export type FatPercentInput = string | {
  title?: string;
  description?: string;
  packageText?: string;
  nutritionText?: string;
};

const normalizeDecimal = (value: string): number => Number.parseFloat(value.replace(',', '.'));
const roundOneDecimal = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

const FAT_PATTERNS: RegExp[] = [
  /(?<min>\d+(?:[,.]\d+)?)\s*[-–—]\s*(?<max>\d+(?:[,.]\d+)?)\s*%\s*(?:fett|fat)?\b/iu,
  /\b(?:fett|fat)\s*(?:halt|procent|percent|:)?\s*(?<min>\d+(?:[,.]\d+)?)\s*[-–—]\s*(?<max>\d+(?:[,.]\d+)?)\s*%\b/iu,
  /(?<value>\d+(?:[,.]\d+)?)\s*%\s*(?:fett|fat)\b/iu,
  /\b(?:fett|fat)\s*(?:halt|procent|percent|:)?\s*(?<value>\d+(?:[,.]\d+)?)\s*%\b/iu,
  /\b(?<value>\d+(?:[,.]\d+)?)\s*%\b/iu
];

function inputText(input: FatPercentInput): string {
  if (typeof input === 'string') return input;
  return [input.title, input.description, input.packageText, input.nutritionText].filter(Boolean).join(' ');
}

export function extractFatPercent(input: FatPercentInput): FatPercentExtraction | undefined {
  const text = inputText(input).replace(/\s+/g, ' ').trim();
  if (!text) return undefined;

  for (const pattern of FAT_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.groups) continue;

    if (match.groups.min !== undefined && match.groups.max !== undefined) {
      const min = normalizeDecimal(match.groups.min);
      const max = normalizeDecimal(match.groups.max);
      if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
      return {
        fat_percent: roundOneDecimal((min + max) / 2),
        isRange: true,
        raw: match[0].trim()
      };
    }

    if (match.groups.value !== undefined) {
      const value = normalizeDecimal(match.groups.value);
      if (!Number.isFinite(value)) continue;
      return {
        fat_percent: roundOneDecimal(value),
        isRange: false,
        raw: match[0].trim()
      };
    }
  }

  return undefined;
}
