export type CompositeRankDirection = 'higher-is-better' | 'lower-is-better';

export type WeightedRankerChoice<TCandidate> = {
  id: string;
  weight: number;
  direction?: CompositeRankDirection;
  score: (candidate: TCandidate, candidates: readonly TCandidate[]) => number;
};

export type WeightedRankerContribution = {
  rankerId: string;
  rawScore: number;
  normalizedScore: number;
  normalizedWeight: number;
  weightedScore: number;
};

export type WeightedCompositeRank<TCandidate> = {
  candidate: TCandidate;
  compositeScore: number;
  contributions: WeightedRankerContribution[];
  rank: number;
};

export type ComposeWeightedRankersInput<TCandidate> = {
  candidates: readonly TCandidate[];
  rankers: readonly WeightedRankerChoice<TCandidate>[];
  tieBreaker?: (left: TCandidate, right: TCandidate) => number;
};

const MIN_RANKERS = 2;
const MAX_RANKERS = 3;

function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) throw new Error(`${fieldName} must be a finite number.`);
}

function normalizeScore(rawScore: number, min: number, max: number, direction: CompositeRankDirection): number {
  if (max === min) return 50;
  const higherIsBetter = ((rawScore - min) / (max - min)) * 100;
  return direction === 'lower-is-better' ? 100 - higherIsBetter : higherIsBetter;
}

export function composeWeightedRankers<TCandidate>(
  input: ComposeWeightedRankersInput<TCandidate>
): WeightedCompositeRank<TCandidate>[] {
  if (input.rankers.length < MIN_RANKERS || input.rankers.length > MAX_RANKERS) {
    throw new Error(`Choose ${MIN_RANKERS}-${MAX_RANKERS} rankers to compose a weighted ranking.`);
  }

  const seenRankerIds = new Set<string>();
  let totalWeight = 0;
  for (const ranker of input.rankers) {
    if (!ranker.id.trim()) throw new Error('Ranker id is required.');
    if (seenRankerIds.has(ranker.id)) throw new Error(`Duplicate ranker id: ${ranker.id}`);
    seenRankerIds.add(ranker.id);
    assertFiniteNumber(ranker.weight, `Weight for ${ranker.id}`);
    if (ranker.weight <= 0) throw new Error(`Weight for ${ranker.id} must be greater than zero.`);
    totalWeight += ranker.weight;
  }

  const scoredByRanker = input.rankers.map((ranker) => {
    const rawScores = input.candidates.map((candidate) => {
      const score = ranker.score(candidate, input.candidates);
      assertFiniteNumber(score, `Score from ${ranker.id}`);
      return score;
    });

    return {
      direction: ranker.direction ?? 'higher-is-better',
      id: ranker.id,
      normalizedWeight: ranker.weight / totalWeight,
      rawScores,
      min: Math.min(...rawScores),
      max: Math.max(...rawScores)
    };
  });

  return input.candidates
    .map((candidate, candidateIndex) => {
      const contributions = scoredByRanker.map((ranker) => {
        const rawScore = ranker.rawScores[candidateIndex];
        const normalizedScore = normalizeScore(rawScore, ranker.min, ranker.max, ranker.direction);
        return {
          rankerId: ranker.id,
          rawScore,
          normalizedScore,
          normalizedWeight: ranker.normalizedWeight,
          weightedScore: normalizedScore * ranker.normalizedWeight
        };
      });

      const compositeScore = contributions.reduce((sum, contribution) => sum + contribution.weightedScore, 0);
      return { candidate, compositeScore, contributions, rank: 0 };
    })
    .sort((left, right) => {
      const scoreDelta = right.compositeScore - left.compositeScore;
      if (scoreDelta !== 0) return scoreDelta;
      return input.tieBreaker ? input.tieBreaker(left.candidate, right.candidate) : 0;
    })
    .map((result, index) => ({ ...result, rank: index + 1 }));
}
