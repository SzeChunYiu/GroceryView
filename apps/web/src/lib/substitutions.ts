import type { AdaptiveProductCard } from './verified-data';

export type StoreSubstitutionSuggestion = {
  slug: string;
  name: string;
  brand: string;
  totalPriceLabel: string;
  unitPriceLabel: string;
  score: number;
  reason: string;
  nutritionImpactLabel: string;
  brandPreferenceLabel: string;
};

export type StoreSubstitutionPlan = {
  unavailableProduct: Pick<AdaptiveProductCard, 'slug' | 'name' | 'brand' | 'productKind'>;
  suggestions: StoreSubstitutionSuggestion[];
  guardrails: string[];
};

function nutritionImpactLabel(unavailable: AdaptiveProductCard, candidate: AdaptiveProductCard) {
  const sharedDietaryTags = candidate.safetyProfile.dietaryTags.filter((tag) => unavailable.safetyProfile.dietaryTags.includes(tag));
  const newAllergenTags = candidate.safetyProfile.allergenTags.filter((tag) => !unavailable.safetyProfile.allergenTags.includes(tag));

  if (newAllergenTags.length > 0) {
    return `Review allergen change: ${newAllergenTags.join(', ')}`;
  }

  if (sharedDietaryTags.length > 0) {
    return `Keeps ${sharedDietaryTags.slice(0, 2).join(', ')} dietary evidence`;
  }

  return candidate.safetyEvidenceLabel;
}

function substitutionScore(unavailable: AdaptiveProductCard, candidate: AdaptiveProductCard) {
  const sameCategory = candidate.productKind === unavailable.productKind;
  const sameBrand = candidate.brand === unavailable.brand;
  const cheaper = candidate.totalSortPrice < unavailable.totalSortPrice;
  const unitCheaper = candidate.unitSortPrice !== null
    && unavailable.unitSortPrice !== null
    && candidate.unitSortPrice < unavailable.unitSortPrice;
  const nutritionPenalty = candidate.safetyProfile.allergenTags.some((tag) => !unavailable.safetyProfile.allergenTags.includes(tag)) ? 12 : 0;

  return [
    sameCategory ? 42 : 0,
    sameBrand ? 24 : 8,
    cheaper ? 14 : 0,
    unitCheaper ? 12 : 0,
    Math.min(candidate.carbonScore.score / 10, 10),
    candidate.confidenceLevel === 'high' ? 8 : candidate.confidenceLevel === 'medium' ? 4 : 0,
    -nutritionPenalty
  ].reduce((sum, value) => sum + value, 0);
}

export function substitutionSuggestionsForUnavailableProduct(
  unavailable: AdaptiveProductCard,
  candidates: AdaptiveProductCard[],
  limit = 3
): StoreSubstitutionSuggestion[] {
  return candidates
    .filter((candidate) => candidate.slug !== unavailable.slug && candidate.isAvailable !== false)
    .map((candidate) => {
      const sameCategory = candidate.productKind === unavailable.productKind;
      const sameBrand = candidate.brand === unavailable.brand;
      return {
        slug: candidate.slug,
        name: candidate.name,
        brand: candidate.brand,
        totalPriceLabel: candidate.totalPriceLabel,
        unitPriceLabel: candidate.unitPriceLabel,
        score: Math.round(substitutionScore(unavailable, candidate)),
        reason: [
          sameCategory ? `same ${candidate.productKind} category` : 'nearby grocery category',
          sameBrand ? 'same preferred brand' : `${candidate.brand} fallback brand`,
          candidate.confidenceLabel
        ].join(' · '),
        nutritionImpactLabel: nutritionImpactLabel(unavailable, candidate),
        brandPreferenceLabel: sameBrand ? 'Keeps selected brand' : `Switches from ${unavailable.brand} to ${candidate.brand}`
      };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, 'sv-SE'))
    .slice(0, limit);
}

export function substitutionPlansForUnavailableProducts(cards: AdaptiveProductCard[], limitPerProduct = 3): StoreSubstitutionPlan[] {
  return cards
    .filter((card) => card.isAvailable === false)
    .map((card) => ({
      unavailableProduct: {
        slug: card.slug,
        name: card.name,
        brand: card.brand,
        productKind: card.productKind
      },
      suggestions: substitutionSuggestionsForUnavailableProduct(card, cards, limitPerProduct),
      guardrails: [
        'Only verified available product cards can be suggested as replacements.',
        'Scores prefer same category, same brand, lower price, and nutrition/safety evidence.',
        'Substitutions are suggestions only and are never auto-applied to a basket or checkout.'
      ]
    }));
}
