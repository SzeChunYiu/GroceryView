export type FatPercentExtraction = {
  fat_percent: number;
  kind: 'single' | 'range';
  raw: string;
  min?: number;
  max?: number;
};

const DECIMAL = String.raw`\d+(?:[,.]\d+)?`;
const FAT_WORDS = String.raw`(?:fett|fat|fettprocent|mjölkfett|milk\s*fat)`;
const NUMBER_BEFORE_FAT = new RegExp(String.raw`(${DECIMAL})\s*%\s*${FAT_WORDS}?`, 'iu');
const RANGE_BEFORE_FAT = new RegExp(String.raw`(${DECIMAL})\s*(?:-|–|—|to|till)\s*(${DECIMAL})\s*%\s*${FAT_WORDS}?`, 'iu');
const FAT_BEFORE_NUMBER = new RegExp(String.raw`${FAT_WORDS}\s*[:=]?\s*(${DECIMAL})\s*%`, 'iu');
const FAT_BEFORE_RANGE = new RegExp(String.raw`${FAT_WORDS}\s*[:=]?\s*(${DECIMAL})\s*(?:-|–|—|to|till)\s*(${DECIMAL})\s*%`, 'iu');

function parsePercentNumber(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildRange(raw: string, minText: string, maxText: string): FatPercentExtraction | null {
  const min = parsePercentNumber(minText);
  const max = parsePercentNumber(maxText);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) return null;
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return {
    fat_percent: roundPercent((low + high) / 2),
    kind: 'range',
    raw,
    min: roundPercent(low),
    max: roundPercent(high)
  };
}

function buildSingle(raw: string, valueText: string): FatPercentExtraction | null {
  const value = parsePercentNumber(valueText);
  if (!Number.isFinite(value) || value < 0) return null;
  return { fat_percent: roundPercent(value), kind: 'single', raw };
}

export function extractFatPercent(input: string): FatPercentExtraction | null {
  const text = input.trim();
  if (!text) return null;

  for (const pattern of [RANGE_BEFORE_FAT, FAT_BEFORE_RANGE]) {
    const match = text.match(pattern);
    if (match) return buildRange(match[0], match[1], match[2]);
  }

  for (const pattern of [NUMBER_BEFORE_FAT, FAT_BEFORE_NUMBER]) {
    const match = text.match(pattern);
    if (match) return buildSingle(match[0], match[1]);
  }

  return null;
}
