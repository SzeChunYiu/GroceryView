type SeasonalDealCalendarProductInput = {
  slug: string;
  productName: string;
  brand?: string;
  categoryLabel: string;
  bestBuyMonth: string;
  bestBuyMonthIndex: number;
  historicalMonthlyAverageLabel: string;
  savingsVsTypicalLabel: string;
  savingsVsTypicalPercent?: number | null;
  confidenceLabel: string;
  evidenceLabel: string;
  observationCount: number;
  observedMonthCount: number;
};

export type SeasonalDealCalendarProduct = {
  slug: string;
  productName: string;
  brand: string;
  categoryLabel: string;
  bestBuyMonth: string;
  historicalMonthlyAverageLabel: string;
  savingsVsTypicalLabel: string;
  savingsVsTypicalPercent: number;
  confidenceLabel: string;
  evidenceLabel: string;
  observationCount: number;
};

export type SeasonalDealCalendarWeek = {
  weekLabel: string;
  monthLabel: string;
  products: SeasonalDealCalendarProduct[];
};

export type SeasonalDealCalendarHoliday = {
  holidayLabel: string;
  monthLabel: string;
  planningLabel: string;
  products: SeasonalDealCalendarProduct[];
};

export type SeasonalDealCalendar = {
  asOfLabel: string;
  horizonLabel: string;
  upcomingWeeks: SeasonalDealCalendarWeek[];
  holidayRecommendations: SeasonalDealCalendarHoliday[];
  guardrails: string[];
};

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const holidayWindows = [
  { monthIndex: 2, holidayLabel: 'Easter pantry planning', planningLabel: 'compare spring produce and fika staples before Easter baskets' },
  { monthIndex: 3, holidayLabel: 'Valborg grill planning', planningLabel: 'watch early grill and produce rows before the late-April holiday' },
  { monthIndex: 5, holidayLabel: 'Midsummer basket planning', planningLabel: 'compare berries, potatoes, and picnic products before Midsummer week' },
  { monthIndex: 6, holidayLabel: 'Summer holiday pantry fill', planningLabel: 'use observed summer low months before stocking vacation meals' },
  { monthIndex: 7, holidayLabel: 'Crayfish season planning', planningLabel: 'check late-summer sides and fresh produce before August gatherings' },
  { monthIndex: 11, holidayLabel: 'Christmas and New Year shop', planningLabel: 'compare observed December lows before holiday stock-up trips' }
];

function weekStartLabel(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizeProduct(product: SeasonalDealCalendarProductInput): SeasonalDealCalendarProduct {
  return {
    slug: product.slug,
    productName: product.productName,
    brand: product.brand ?? 'Brand not reported',
    categoryLabel: product.categoryLabel,
    bestBuyMonth: product.bestBuyMonth,
    historicalMonthlyAverageLabel: product.historicalMonthlyAverageLabel,
    savingsVsTypicalLabel: product.savingsVsTypicalLabel,
    savingsVsTypicalPercent: product.savingsVsTypicalPercent ?? 0,
    confidenceLabel: product.confidenceLabel,
    evidenceLabel: product.evidenceLabel,
    observationCount: product.observationCount
  };
}

function rankedProductsForMonth(rows: ReadonlyArray<SeasonalDealCalendarProductInput>, monthIndex: number, limit: number) {
  return rows
    .filter((row) => row.bestBuyMonthIndex === monthIndex)
    .sort((left, right) =>
      (right.savingsVsTypicalPercent ?? 0) - (left.savingsVsTypicalPercent ?? 0) ||
      right.observationCount - left.observationCount ||
      right.observedMonthCount - left.observedMonthCount ||
      left.productName.localeCompare(right.productName, 'sv')
    )
    .slice(0, limit)
    .map(normalizeProduct);
}

export function buildSeasonalDealCalendar({
  horizonWeeks = 8,
  now = new Date(),
  rows
}: {
  horizonWeeks?: number;
  now?: Date;
  rows: ReadonlyArray<SeasonalDealCalendarProductInput>;
}): SeasonalDealCalendar {
  const asOf = Number.isFinite(now.getTime()) ? now : new Date();
  const weekStarts = Array.from({ length: Math.max(1, horizonWeeks) }, (_, index) => addDays(asOf, index * 7));
  const upcomingWeeks = weekStarts.map((weekStart) => {
    const monthIndex = weekStart.getUTCMonth();
    return {
      weekLabel: `Week of ${weekStartLabel(weekStart)}`,
      monthLabel: monthLabels[monthIndex]!,
      products: rankedProductsForMonth(rows, monthIndex, 3)
    };
  });
  const horizonMonthIndexes = new Set(weekStarts.map((weekStart) => weekStart.getUTCMonth()));
  const holidayRecommendations = holidayWindows
    .filter((holiday) => horizonMonthIndexes.has(holiday.monthIndex))
    .map((holiday) => ({
      holidayLabel: holiday.holidayLabel,
      monthLabel: monthLabels[holiday.monthIndex]!,
      planningLabel: holiday.planningLabel,
      products: rankedProductsForMonth(rows, holiday.monthIndex, 3)
    }))
    .filter((holiday) => holiday.products.length > 0);

  return {
    asOfLabel: asOf.toISOString().slice(0, 10),
    horizonLabel: `next ${weekStarts.length} weeks`,
    upcomingWeeks,
    holidayRecommendations,
    guardrails: [
      'Recommendations are historical: a product appears only when its cheapest observed month lands inside an upcoming week or holiday month.',
      'No future shelf price, stock, harvest, or promotion is predicted.',
      'Rows without enough dated OpenPrices month history are withheld from the calendar.'
    ]
  };
}
