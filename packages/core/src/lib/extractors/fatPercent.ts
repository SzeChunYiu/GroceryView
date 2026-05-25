export type FatPercentInput = {
  title?: string;
  description?: string;
  nutritionText?: string;
  packageText?: string;
};

export type FatPercentExtraction = {
  fatPercent: number | null;
  isRange: boolean;
  matchedText: string | null;
  reason: string;
};

const FAT_CONTEXT = /\b(fett|fat|mj[öo]lk|milk|gr[aä]dde|cream|f[äa]rs|mince|n[öo]tf[äa]rs|blandf[äa]rs|mejeri|dairy)\b/iu;
const RANGE_PATTERN = /(?<!\d)(\d{1,2}(?:[,.]\d+)?)\s*[-–]\s*(\d{1,2}(?:[,.]\d+)?)\s*%\s*(?:fett|fat)?/iu;
const SINGLE_PATTERN = /(?<!\d)(\d{1,2}(?:[,.]\d+)?)\s*%\s*(?:fett|fat)?/iu;

function normalizePercent(value: string) {
  return Number.parseFloat(value.replace(',', '.'));
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function sourceText(input: FatPercentInput | string) {
  return typeof input === 'string'
    ? input
    : [input.title, input.description, input.nutritionText, input.packageText].filter(Boolean).join(' ');
}

export function extractFatPercent(input: FatPercentInput | string): FatPercentExtraction {
  const text = sourceText(input).replace(/\s+/g, ' ').trim();
  if (!text) {
    return { fatPercent: null, isRange: false, matchedText: null, reason: 'No product text was provided.' };
  }

  const rangeMatch = text.match(RANGE_PATTERN);
  if (rangeMatch) {
    const low = normalizePercent(rangeMatch[1] ?? '');
    const high = normalizePercent(rangeMatch[2] ?? '');
    if (Number.isFinite(low) && Number.isFinite(high) && low >= 0 && high <= 100) {
      return {
        fatPercent: roundPercent((low + high) / 2),
        isRange: true,
        matchedText: rangeMatch[0],
        reason: 'Fat percentage range found; midpoint selected for structured fat_percent.'
      };
    }
  }

  const singleMatch = text.match(SINGLE_PATTERN);
  if (!singleMatch) {
    return { fatPercent: null, isRange: false, matchedText: null, reason: 'No percentage pattern was found.' };
  }

  const value = normalizePercent(singleMatch[1] ?? '');
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { fatPercent: null, isRange: false, matchedText: singleMatch[0], reason: 'Percentage was outside the valid fat_percent range.' };
  }

  const hasExplicitFatSuffix = /%\s*(?:fett|fat)\b/iu.test(singleMatch[0]);
  const hasFatContext = FAT_CONTEXT.test(text);
  if (!hasExplicitFatSuffix && !hasFatContext) {
    return { fatPercent: null, isRange: false, matchedText: singleMatch[0], reason: 'Percentage lacked fat, dairy, or mince context.' };
  }

  return {
    fatPercent: roundPercent(value),
    isRange: false,
    matchedText: singleMatch[0],
    reason: 'Single fat percentage found.'
  };
}
