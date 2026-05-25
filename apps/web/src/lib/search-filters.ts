export type AllergenRiskBadge = {
  label: string;
  matchedTerms: string[];
};

export type TypoTolerantSearchMatch = {
  matched: boolean;
  score: number;
  reason: 'exact' | 'contains' | 'phonetic' | 'edit-distance' | 'none';
  matchedText: string;
};

type AllergenRiskMatcher = {
  label: string;
  riskTerms: string[];
  safeTerms: string[];
};

const allergenRiskMatchers: AllergenRiskMatcher[] = [
  {
    label: 'milk/lactose',
    riskTerms: ['mjölk', 'milk', 'laktos', 'lactose', 'grädde', 'cream', 'ost', 'cheese'],
    safeTerms: ['laktosfri', 'laktosfree', 'lactose-free', 'milk-free', 'mjölkfri', 'vegan']
  },
  {
    label: 'gluten/wheat',
    riskTerms: ['gluten', 'vete', 'wheat', 'råg', 'rye', 'korn', 'barley'],
    safeTerms: ['glutenfri', 'glutenfree', 'gluten-free', 'crossed_ax']
  }
];

function normalizedSearchText(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part)).join(' ').toLocaleLowerCase('sv-SE');
}

function hasTerm(text: string, term: string) {
  return text.includes(term.toLocaleLowerCase('sv-SE'));
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function soundKey(value: string): string {
  return normalizeSearchText(value)
    .replace(/\b(skj|stj|sj|ch|sh)/g, 'x')
    .replace(/\b(kj|tj)/g, 'x')
    .replace(/sch/g, 'x')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/z/g, 's')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1')
    .replace(/[^a-z0-9]+/g, '');
}

function distance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }
    for (let index = 0; index < previous.length; index += 1) previous[index] = current[index]!;
  }

  return previous[right.length]!;
}

export function typoTolerantSearchMatch(query: string, parts: Array<string | null | undefined>): TypoTolerantSearchMatch {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedParts = parts.map((part) => normalizeSearchText(part ?? '')).filter(Boolean);
  const text = normalizedParts.join(' ');
  if (!normalizedQuery || !text) return { matched: true, score: 0, reason: 'none', matchedText: '' };
  if (text === normalizedQuery) return { matched: true, score: 1, reason: 'exact', matchedText: normalizedQuery };
  if (text.includes(normalizedQuery)) return { matched: true, score: 0.9, reason: 'contains', matchedText: normalizedQuery };

  const queryTokens = normalizedQuery.split(' ').filter((token) => token.length >= 2);
  const textTokens = text.split(' ').filter((token) => token.length >= 2);
  let best: TypoTolerantSearchMatch = { matched: false, score: 0, reason: 'none', matchedText: '' };

  for (const queryToken of queryTokens) {
    const queryKey = soundKey(queryToken);
    for (const textToken of textTokens) {
      if (queryKey && queryKey === soundKey(textToken)) {
        const candidate: TypoTolerantSearchMatch = { matched: true, score: 0.78, reason: 'phonetic', matchedText: textToken };
        if (candidate.score > best.score) best = candidate;
        continue;
      }

      const maxDistance = Math.max(queryToken.length, textToken.length) <= 5 ? 1 : 2;
      const tokenDistance = distance(queryToken, textToken);
      if (tokenDistance > 0 && tokenDistance <= maxDistance) {
        const candidate: TypoTolerantSearchMatch = {
          matched: true,
          score: Number((0.72 - tokenDistance * 0.08).toFixed(2)),
          reason: 'edit-distance',
          matchedText: textToken
        };
        if (candidate.score > best.score) best = candidate;
      }
    }
  }

  return best;
}

export function allergenRiskBadgesForText(parts: Array<string | null | undefined>): AllergenRiskBadge[] {
  const text = normalizedSearchText(parts);
  if (!text) return [];

  return allergenRiskMatchers.flatMap((matcher) => {
    if (matcher.safeTerms.some((term) => hasTerm(text, term))) return [];

    const matchedTerms = matcher.riskTerms
      .filter((term) => hasTerm(text, term))
      .map((term) => term.toLocaleLowerCase('sv-SE'));

    return matchedTerms.length > 0
      ? [{ label: `risk: ${matcher.label}`, matchedTerms: [...new Set(matchedTerms)] }]
      : [];
  });
}
