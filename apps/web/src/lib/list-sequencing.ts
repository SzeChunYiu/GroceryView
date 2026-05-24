export type ListSequencingMatch = {
  category: string;
  keywords: string[];
  productName: string;
};

export type AisleConfidence = {
  aisle: string;
  label: string;
  reason: string;
  matchedKeyword?: string;
};

export function normalizeListText(value: string) {
  return value.toLocaleLowerCase('sv-SE').normalize('NFKD').replace(/\p{Diacritic}/gu, '');
}

export function getAisleConfidenceLabel(line: string, match: ListSequencingMatch | null): AisleConfidence {
  if (!match) {
    return {
      aisle: 'other',
      label: 'Aisle: other',
      reason: 'Fallback to Other because no catalog keyword matched this imported line.'
    };
  }

  const normalizedLine = normalizeListText(line);
  const matchedKeyword = match.keywords.find((keyword) => normalizedLine.includes(normalizeListText(keyword)));
  const reason = matchedKeyword
    ? `Matched keyword "${matchedKeyword}" from the ${match.category} aisle.`
    : `Matched catalog product "${match.productName}" in the ${match.category} aisle.`;

  return {
    aisle: match.category,
    label: `Aisle: ${match.category}`,
    matchedKeyword,
    reason
  };
}
