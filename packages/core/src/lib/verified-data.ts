export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export type CountryConfidenceInput = {
  countryCode?: string;
  coveragePercent?: number;
  level?: ConfidenceLevel;
  sampleSize?: number;
};

type Thresholds = {
  high: number;
  medium: number;
  low: number;
};

const defaultThresholds: Thresholds = { high: 75, medium: 40, low: 1 };
const countryThresholds: Record<string, Thresholds> = {
  SE: defaultThresholds,
  NO: { high: 85, medium: 55, low: 5 },
  IS: { high: 90, medium: 60, low: 5 }
};

export function normalizeCountryCode(countryCode: string | undefined): string {
  return (countryCode?.trim() || 'SE').toUpperCase();
}

export function confidenceLevelForCountry(input: CountryConfidenceInput): ConfidenceLevel {
  const countryCode = normalizeCountryCode(input.countryCode);
  const thresholds = countryThresholds[countryCode] ?? defaultThresholds;

  if (typeof input.coveragePercent === 'number' && Number.isFinite(input.coveragePercent)) {
    const coverage = Math.max(0, Math.min(100, input.coveragePercent));
    if (coverage >= thresholds.high) return 'high';
    if (coverage >= thresholds.medium) return 'medium';
    if (coverage >= thresholds.low) return 'low';
    return 'unknown';
  }

  if ((countryCode === 'NO' || countryCode === 'IS') && (input.sampleSize ?? 0) === 0) return 'unknown';
  if ((countryCode === 'NO' || countryCode === 'IS') && (input.sampleSize ?? 0) < thresholds.low) return 'low';

  return input.level ?? 'unknown';
}

export function confidenceTooltip(input: CountryConfidenceInput & { label: string }): string {
  const countryCode = normalizeCountryCode(input.countryCode);
  const level = confidenceLevelForCountry(input);
  const sample = input.sampleSize === undefined ? 'sample size not reported' : `n=${input.sampleSize}`;
  return `${input.label} confidence: ${level} · country ${countryCode} · ${sample}`;
}
