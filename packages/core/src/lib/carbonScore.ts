export type CarbonScoreInput = {
  ecoscoreGrade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown' | null;
  originCountry?: string | null;
  saleCountry?: string | null;
  category?: string | null;
};

export type CarbonScore = {
  score: number;
  band: 'low' | 'medium' | 'high' | 'unknown';
  sortKey: number;
  evidence: string;
};

const ECOSCORE_POINTS = { a: 90, b: 72, c: 55, d: 35, e: 15 } as const;
const HIGH_IMPACT_CATEGORY = /beef|lamb|meat|cheese|dairy/i;

export function calculateCarbonScore(input: CarbonScoreInput): CarbonScore {
  const grade = input.ecoscoreGrade && input.ecoscoreGrade !== 'unknown' ? input.ecoscoreGrade : null;
  if (grade) {
    const score = ECOSCORE_POINTS[grade];
    return {
      score,
      band: score >= 75 ? 'low' : score >= 45 ? 'medium' : 'high',
      sortKey: 100 - score,
      evidence: `OpenFoodFacts ecoscore grade ${grade.toUpperCase()}.`
    };
  }

  const sameCountry = input.originCountry && input.saleCountry && input.originCountry.toLowerCase() === input.saleCountry.toLowerCase();
  const transportScore = sameCountry ? 70 : input.originCountry ? 45 : 50;
  const categoryPenalty = input.category && HIGH_IMPACT_CATEGORY.test(input.category) ? 20 : 0;
  const score = Math.max(0, Math.min(100, transportScore - categoryPenalty));

  return {
    score,
    band: score >= 75 ? 'low' : score >= 45 ? 'medium' : 'high',
    sortKey: 100 - score,
    evidence: sameCountry
      ? 'Origin matches sale country; no OpenFoodFacts ecoscore was available.'
      : 'Origin/category transport heuristic used because no OpenFoodFacts ecoscore was available.'
  };
}

export function sortByEcoScore<T extends CarbonScoreInput>(products: T[]) {
  return [...products].sort((first, second) => calculateCarbonScore(first).sortKey - calculateCarbonScore(second).sortKey);
}
