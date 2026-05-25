export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  phoneticQueries: PhoneticSearchCandidate[];
};

export type PhoneticSearchCandidate = {
  query: string;
  matchedTerm: string;
  reason: 'alias' | 'phonetic' | 'edit-distance';
  score: number;
};

const groceryAliasEntries: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'coffee', aliases: ['kaffe', 'kafe', 'java', 'zoegas', 'zogas', 'zoégas'] },
  { canonical: 'Zoégas coffee', aliases: ['zoegas', 'zogas', 'zoégas brygg', 'zoegas brygg'] },
  { canonical: 'milk', aliases: ['mjolk', 'mjölk', 'melk', 'mjoelk', 'arla mjolk', 'arla mjölk'] },
  { canonical: 'eggs', aliases: ['agg', 'ägg', 'aegg'] },
  { canonical: 'chicken', aliases: ['kyck', 'kyckling', 'chix'] },
  { canonical: 'yogurt', aliases: ['yoghurt', 'fil', 'grekisk yoghurt'] },
  { canonical: 'butter', aliases: ['smor', 'smör', 'bregott'] },
  { canonical: 'tomatoes', aliases: ['tomat', 'tomater'] },
  { canonical: 'private label milk', aliases: ['garant mjolk', 'garant mjölk', 'willys mjolk', 'willys mjölk'] }
];

const phoneticSeedTerms = [
  'kaffe',
  'coffee',
  'mjölk',
  'milk',
  'ägg',
  'eggs',
  'kyckling',
  'chicken',
  'yoghurt',
  'yogurt',
  'fil',
  'smör',
  'butter',
  'tomat',
  'tomatoes',
  'potatis',
  'potato',
  'äpple',
  'apple',
  'banan',
  'banana',
  'blöjor',
  'diapers',
  'nappies',
  'glutenfri',
  'laktosfri',
  'vegan'
];

export function normalizeGrocerySearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/Å/g, 'a')
    .replace(/Ä/g, 'a')
    .replace(/Ö/g, 'o')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function grocerySoundKey(value: string): string {
  return normalizeGrocerySearchText(value)
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

function editDistance(left: string, right: string): number {
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

function candidateTerms(): string[] {
  const terms = new Set<string>(phoneticSeedTerms);
  for (const entry of groceryAliasEntries) {
    terms.add(entry.canonical);
    for (const alias of entry.aliases) terms.add(alias);
  }
  return [...terms];
}

function addUnique(values: string[], value: string): void {
  const normalized = normalizeGrocerySearchText(value);
  if (!normalized) return;
  if (!values.some((existing) => normalizeGrocerySearchText(existing) === normalized)) values.push(value);
}

function addCandidate(values: PhoneticSearchCandidate[], candidate: PhoneticSearchCandidate): void {
  const normalized = normalizeGrocerySearchText(candidate.query);
  if (!normalized) return;
  const existingIndex = values.findIndex((value) => normalizeGrocerySearchText(value.query) === normalized);
  if (existingIndex === -1) {
    values.push(candidate);
    return;
  }
  if (candidate.score > values[existingIndex]!.score) values[existingIndex] = candidate;
}

export function buildPhoneticSearchCandidates(query: string, maxCandidates = 4): PhoneticSearchCandidate[] {
  const normalizedQuery = normalizeGrocerySearchText(query);
  const tokens = normalizedQuery.split(' ').filter((token) => token.length >= 2);
  if (tokens.length === 0) return [];

  const candidates: PhoneticSearchCandidate[] = [];
  const terms = candidateTerms();
  for (const token of tokens) {
    const tokenKey = grocerySoundKey(token);
    if (!tokenKey) continue;

    for (const term of terms) {
      const normalizedTerm = normalizeGrocerySearchText(term);
      if (!normalizedTerm || normalizedTerm === token) continue;
      const termKey = grocerySoundKey(normalizedTerm);
      if (!termKey) continue;

      if (tokenKey === termKey) {
        addCandidate(candidates, { query: term, matchedTerm: token, reason: 'phonetic', score: 0.86 });
        continue;
      }

      const maxDistance = Math.max(token.length, normalizedTerm.length) <= 5 ? 1 : 2;
      const distance = editDistance(token, normalizedTerm);
      if (distance > 0 && distance <= maxDistance) {
        addCandidate(candidates, {
          query: term,
          matchedTerm: token,
          reason: 'edit-distance',
          score: Number((0.82 - distance * 0.08).toFixed(2))
        });
      }
    }
  }

  return candidates
    .sort((left, right) => right.score - left.score || left.query.localeCompare(right.query, 'sv-SE'))
    .slice(0, maxCandidates);
}

export function expandGrocerySearchQuery(query: string, maxQueries = 5): GrocerySearchExpansion {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const normalizedQuery = normalizeGrocerySearchText(trimmed);
  const tokens = new Set(normalizedQuery.split(' ').filter(Boolean));
  const expandedQueries: string[] = [];
  const matchedAliases: string[] = [];
  const phoneticQueries = buildPhoneticSearchCandidates(trimmed);
  addUnique(expandedQueries, trimmed);

  for (const entry of groceryAliasEntries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeGrocerySearchText(alias);
      if (!normalizedAlias) continue;
      if (normalizedQuery === normalizedAlias || tokens.has(normalizedAlias) || normalizedQuery.includes(normalizedAlias)) {
        addUnique(matchedAliases, alias);
        addUnique(expandedQueries, entry.canonical);
        for (const canonicalToken of normalizeGrocerySearchText(entry.canonical).split(' ')) addUnique(expandedQueries, canonicalToken);
        addCandidate(phoneticQueries, { query: entry.canonical, matchedTerm: alias, reason: 'alias', score: 0.92 });
      }
    }
  }

  for (const candidate of phoneticQueries) addUnique(expandedQueries, candidate.query);

  return {
    query: trimmed,
    expandedQueries: expandedQueries.slice(0, maxQueries),
    matchedAliases,
    phoneticQueries
  };
}
