export type PersonalGroceryInflationItem = {
  country: string;
  currency: string;
  currentPrice: number;
  previousPrice: number;
  quantity?: number;
};

export type PersonalGroceryInflationResult = {
  country: string;
  currency: string;
  currentSpend: number;
  inflationPct: number;
  itemCount: number;
  previousSpend: number;
};

function normalizeCountry(country: string) {
  return country.trim().toUpperCase();
}

export function calculatePersonalGroceryInflation(
  country: string,
  items: PersonalGroceryInflationItem[]
): PersonalGroceryInflationResult {
  const scopedCountry = normalizeCountry(country);
  const scopedItems = items.filter((item) => normalizeCountry(item.country) === scopedCountry);
  const currencies = new Set(scopedItems.map((item) => item.currency.trim().toUpperCase()).filter(Boolean));

  if (currencies.size !== 1) {
    throw new Error('calculatePersonalGroceryInflation requires exactly one currency for the selected country');
  }
  const currency = [...currencies][0];
  if (!currency) {
    throw new Error('calculatePersonalGroceryInflation requires a currency for the selected country');
  }

  const totals = scopedItems.reduce(
    (sum, item) => {
      const quantity = item.quantity ?? 1;

      return {
        currentSpend: sum.currentSpend + item.currentPrice * quantity,
        previousSpend: sum.previousSpend + item.previousPrice * quantity
      };
    },
    { currentSpend: 0, previousSpend: 0 }
  );

  if (totals.previousSpend <= 0) {
    throw new Error('calculatePersonalGroceryInflation requires positive previous spend');
  }

  return {
    country: scopedCountry,
    currency,
    currentSpend: totals.currentSpend,
    inflationPct: ((totals.currentSpend - totals.previousSpend) / totals.previousSpend) * 100,
    itemCount: scopedItems.length,
    previousSpend: totals.previousSpend
  };
}
