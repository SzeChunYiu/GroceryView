export type CarbonScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type CarbonScoreInput = {
  ecoscoreGrade?: string | null;
  categories?: readonly string[];
  labels?: readonly string[];
  originCountry?: string | null;
  marketCountry?: string;
  frozen?: boolean;
};

export type ProductCarbonScore = {
  score: number;
  grade: CarbonScoreGrade;
  label: string;
  source: 'openfoodfacts-ecoscore' | 'origin-transport-heuristic';
  reasons: string[];
};

const ecoscoreGradeScores: Record<string, number> = {
  a: 92,
  b: 78,
  c: 62,
  d: 43,
  e: 24
};

const nordicCountries = new Set(['SE', 'NO', 'DK', 'FI', 'IS']);

export function calculateCarbonScore(input: CarbonScoreInput): ProductCarbonScore {
  const ecoscore = normalizeEcoscore(input.ecoscoreGrade);
  if (ecoscore) {
    const score = ecoscoreGradeScores[ecoscore];
    return {
      score,
      grade: gradeForScore(score),
      label: `Eco-score ${ecoscore.toUpperCase()}`,
      source: 'openfoodfacts-ecoscore',
      reasons: ['OpenFoodFacts Eco-Score grade supplied']
    };
  }

  const categories = (input.categories ?? []).map((value) => value.toLocaleLowerCase('sv-SE'));
  const labels = (input.labels ?? []).map((value) => value.toLocaleLowerCase('sv-SE'));
  const reasons: string[] = [];
  let score = categoryBaseScore(categories, reasons);

  if (labels.some((label) => /organic|ecological|eko|krav|eu_ecological|fairtrade/.test(label))) {
    score += 8;
    reasons.push('Sustainability label evidence');
  }

  const originCountry = normalizeCountry(input.originCountry);
  const marketCountry = normalizeCountry(input.marketCountry) ?? 'SE';
  if (!originCountry) {
    score -= 5;
    reasons.push('Origin missing; transport impact estimated conservatively');
  } else if (originCountry === marketCountry) {
    score += 8;
    reasons.push('Local-market origin');
  } else if (nordicCountries.has(originCountry) && nordicCountries.has(marketCountry)) {
    score += 3;
    reasons.push('Nordic regional origin');
  } else {
    score -= 8;
    reasons.push('Imported origin transport penalty');
  }

  if (input.frozen || labels.includes('frozen') || categories.some((category) => category.includes('frozen'))) {
    score -= 5;
    reasons.push('Frozen handling penalty');
  }

  const normalizedScore = clamp(Math.round(score), 0, 100);
  return {
    score: normalizedScore,
    grade: gradeForScore(normalizedScore),
    label: `${normalizedScore}/100 carbon score`,
    source: 'origin-transport-heuristic',
    reasons
  };
}

function categoryBaseScore(categories: readonly string[], reasons: string[]): number {
  const text = categories.join(' ');
  if (/beef|lamb|meat|kött/.test(text)) {
    reasons.push('High-impact meat category');
    return 30;
  }
  if (/cheese|dairy|dairies|milk|mejeri|ost|egg/.test(text)) {
    reasons.push('Animal-product category');
    return 52;
  }
  if (/fish|seafood|fisk/.test(text)) {
    reasons.push('Seafood category');
    return 58;
  }
  if (/vegetable|fruit|legume|plant-based|cereal|bread|pasta|rice|produce|frukt|gront|skafferi/.test(text)) {
    reasons.push('Plant-forward grocery category');
    return 76;
  }
  reasons.push('Category-specific carbon data unavailable');
  return 60;
}

function normalizeEcoscore(value: string | null | undefined): keyof typeof ecoscoreGradeScores | null {
  const grade = value?.trim().toLocaleLowerCase('en-US');
  return grade && grade in ecoscoreGradeScores ? grade as keyof typeof ecoscoreGradeScores : null;
}

function normalizeCountry(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLocaleUpperCase('en-US');
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function gradeForScore(score: number): CarbonScoreGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
