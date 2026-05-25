import { getComparableUnitPrice, type CanonicalUnit } from "./unit-normalizer";

export type DietaryFilter = string;

export type SubstitutionRankerProduct = {
  id: string;
  name: string;
  category?: string | null;
  unitPrice?: number | null;
  unitPriceUnit?: string | null;
  dietaryTags?: readonly string[] | null;
};

export type RankedSubstitution<T extends SubstitutionRankerProduct> = {
  product: T;
  savingsPerUnit: number;
  savingsPercent: number;
  unit: CanonicalUnit;
};

export type BasketSubstitutionSuggestions<T extends SubstitutionRankerProduct> = {
  item: T;
  substitutions: RankedSubstitution<T>[];
};

export type RankSubstitutionsOptions<T extends SubstitutionRankerProduct> = {
  basketItems: readonly T[];
  candidates: readonly T[];
  selectedDietaryFilters?: readonly DietaryFilter[];
  limitPerItem?: number;
};

function normalizeToken(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function hasSelectedDietaryFilters(
  product: SubstitutionRankerProduct,
  selectedDietaryFilters: readonly DietaryFilter[] = [],
): boolean {
  const requiredFilters = selectedDietaryFilters.map(normalizeToken).filter(Boolean);

  if (requiredFilters.length === 0) {
    return true;
  }

  const productTags = new Set((product.dietaryTags ?? []).map(normalizeToken).filter(Boolean));

  return requiredFilters.every((filter) => productTags.has(filter));
}

export function rankSubstitutionsForBasket<T extends SubstitutionRankerProduct>({
  basketItems,
  candidates,
  selectedDietaryFilters = [],
  limitPerItem = 3,
}: RankSubstitutionsOptions<T>): BasketSubstitutionSuggestions<T>[] {
  const suggestionLimit = Math.max(0, Math.floor(limitPerItem));

  if (suggestionLimit === 0) {
    return [];
  }

  return basketItems
    .map((item) => {
      const category = normalizeToken(item.category);
      const itemUnitPrice = getComparableUnitPrice(item.unitPrice, item.unitPriceUnit);

      if (!category || !itemUnitPrice) {
        return { item, substitutions: [] };
      }

      const substitutions = candidates
        .filter((candidate) => candidate.id !== item.id)
        .filter((candidate) => normalizeToken(candidate.category) === category)
        .filter((candidate) => hasSelectedDietaryFilters(candidate, selectedDietaryFilters))
        .map((candidate): RankedSubstitution<T> | null => {
          const candidateUnitPrice = getComparableUnitPrice(candidate.unitPrice, candidate.unitPriceUnit);

          if (!candidateUnitPrice || candidateUnitPrice.unit !== itemUnitPrice.unit) {
            return null;
          }

          const savingsPerUnit = itemUnitPrice.price - candidateUnitPrice.price;

          if (savingsPerUnit <= 0) {
            return null;
          }

          return {
            product: candidate,
            savingsPerUnit,
            savingsPercent: savingsPerUnit / itemUnitPrice.price,
            unit: itemUnitPrice.unit,
          };
        })
        .filter((substitution): substitution is RankedSubstitution<T> => substitution !== null)
        .sort((left, right) => {
          if (right.savingsPerUnit !== left.savingsPerUnit) {
            return right.savingsPerUnit - left.savingsPerUnit;
          }

          return left.product.name.localeCompare(right.product.name, "sv");
        })
        .slice(0, suggestionLimit);

      return { item, substitutions };
    })
    .filter((suggestion) => suggestion.substitutions.length > 0);
}
