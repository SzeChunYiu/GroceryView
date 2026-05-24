export type BasketBenchmarkSpend = {
  category: string;
  monthlySpend: number;
};

export type BasketBenchmarkMedian = {
  city: string;
  householdSize: number;
  category: string;
  medianMonthlySpend: number;
  sampleSize: number;
};

export type BasketBenchmarkInput = {
  city: string;
  householdSize: number;
  spend: BasketBenchmarkSpend[];
  medians: BasketBenchmarkMedian[];
  minSampleSize?: number;
};

export type BasketBenchmarkComparison = {
  category: string;
  city: string;
  householdSize: number;
  monthlySpend: number;
  medianMonthlySpend: number;
  deltaPercent: number;
  direction: 'above' | 'below' | 'at_median';
  sampleSize: number;
  summary: string;
};

export type BasketBenchmarkResult = {
  comparisons: BasketBenchmarkComparison[];
  withheld: Array<{ category: string; reason: string }>;
  privacyCopy: string;
};

export function buildBasketBenchmark(input: BasketBenchmarkInput): BasketBenchmarkResult {
  const minSampleSize = input.minSampleSize ?? 25;
  const medians = new Map(input.medians.map((median) => [
    benchmarkKey(median.city, median.householdSize, median.category),
    median
  ]));
  const comparisons: BasketBenchmarkComparison[] = [];
  const withheld: BasketBenchmarkResult['withheld'] = [];

  for (const row of input.spend) {
    const median = medians.get(benchmarkKey(input.city, input.householdSize, row.category));
    if (!median) {
      withheld.push({ category: row.category, reason: 'No aggregated city median is available.' });
      continue;
    }
    if (median.sampleSize < minSampleSize) {
      withheld.push({ category: row.category, reason: `Only ${median.sampleSize} households are in the aggregate; minimum is ${minSampleSize}.` });
      continue;
    }
    if (median.medianMonthlySpend <= 0) {
      withheld.push({ category: row.category, reason: 'Median spend is zero, so a percentage comparison would leak too much signal.' });
      continue;
    }

    const deltaPercent = ((row.monthlySpend - median.medianMonthlySpend) / median.medianMonthlySpend) * 100;
    const direction = Math.abs(deltaPercent) < 0.5 ? 'at_median' : deltaPercent > 0 ? 'above' : 'below';
    comparisons.push({
      category: row.category,
      city: input.city,
      householdSize: input.householdSize,
      monthlySpend: row.monthlySpend,
      medianMonthlySpend: median.medianMonthlySpend,
      deltaPercent,
      direction,
      sampleSize: median.sampleSize,
      summary: `${title(row.category)} spend is ${Math.round(Math.abs(deltaPercent))}% ${direction === 'at_median' ? 'at' : direction} median for ${input.city} households of size ${input.householdSize}.`
    });
  }

  return {
    comparisons,
    withheld,
    privacyCopy: `Anonymous benchmark: only aggregated medians with at least ${minSampleSize} households are shown; no individual household rows leave the cohort.`
  };
}

function benchmarkKey(city: string, householdSize: number, category: string) {
  return `${city.toLocaleLowerCase('sv-SE')}:${householdSize}:${category.toLocaleLowerCase('sv-SE')}`;
}

function title(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('sv-SE'));
}
