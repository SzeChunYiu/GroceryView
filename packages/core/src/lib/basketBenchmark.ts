export type BasketBenchmarkCategorySpend = {
  category: string;
  yourSpend: number;
  cityMedianSpend: number;
};

export type BasketBenchmarkRow = BasketBenchmarkCategorySpend & {
  deltaPercent: number;
  direction: 'above' | 'below' | 'at';
  label: string;
};

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function benchmarkBasketSpend(rows: BasketBenchmarkCategorySpend[], city: string, householdSize: number): BasketBenchmarkRow[] {
  return rows.map((row) => {
    const deltaPercent = row.cityMedianSpend > 0 ? roundPercent(((row.yourSpend - row.cityMedianSpend) / row.cityMedianSpend) * 100) : 0;
    const direction = deltaPercent > 1 ? 'above' : deltaPercent < -1 ? 'below' : 'at';
    const label = direction === 'at'
      ? `Your ${row.category} spend matches the ${city} median for households of size ${householdSize}.`
      : `Your ${row.category} spend is ${Math.abs(deltaPercent)}% ${direction} median for ${city} households of size ${householdSize}.`;
    return { ...row, deltaPercent, direction, label };
  });
}
