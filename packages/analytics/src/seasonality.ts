export type SeasonalSaleObservation = {
  observedAt: string;
  price: number;
};

export type SeasonalSaleHoliday = {
  id: string;
  label: string;
  month: number;
  day: number;
  leadWindowDays: number;
  minDiscountPercent: number;
  minSeasonCount: number;
};

export type SeasonalSalePatternInput = {
  productId: string;
  productName?: string;
  observations: SeasonalSaleObservation[];
  holiday?: SeasonalSaleHoliday;
};

export type SeasonalSaleWindowEvidence = {
  year: number;
  observedAt: string;
  price: number;
  discountPercent: number;
  daysBeforeHoliday: number;
};

export type SeasonalSalePatternReport = {
  available: boolean;
  productId: string;
  productName?: string;
  holiday: SeasonalSaleHoliday;
  hint: string;
  windowLabel: string;
  observedSeasonCount: number;
  qualifiedSeasonCount: number;
  observationCount: number;
  averageDiscountPercent: number;
  bestObservedPrice: number | null;
  bestObservedAt: string | null;
  evidence: SeasonalSaleWindowEvidence[];
  evidenceLabel: string;
  detail: string;
  guardrail: string;
};

export const midsommarSeasonalHoliday: SeasonalSaleHoliday = {
  id: 'midsommar',
  label: 'Midsommar',
  month: 6,
  day: 21,
  leadWindowDays: 30,
  minDiscountPercent: 8,
  minSeasonCount: 2
};
export const midsommarSeasonalSaleHint = 'Likely on sale before Midsommar';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseObservationDate(observedAt: string) {
  const parsed = Date.parse(`${observedAt.slice(0, 10)}T00:00:00.000Z`);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function medianFor(values: number[]) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2 : sorted[midpoint]!;
}

function holidayDateForYear(holiday: SeasonalSaleHoliday, year: number) {
  return new Date(Date.UTC(year, holiday.month - 1, holiday.day));
}

function daysBeforeHoliday(observedAt: Date, holiday: SeasonalSaleHoliday) {
  const holidayDate = holidayDateForYear(holiday, observedAt.getUTCFullYear());
  return Math.floor((holidayDate.getTime() - observedAt.getTime()) / MS_PER_DAY);
}

function isInsideHolidayWindow(observedAt: Date, holiday: SeasonalSaleHoliday) {
  const daysBefore = daysBeforeHoliday(observedAt, holiday);
  return daysBefore >= 0 && daysBefore <= holiday.leadWindowDays;
}

function percentOff(referencePrice: number, candidatePrice: number) {
  if (!Number.isFinite(referencePrice) || referencePrice <= 0) return 0;
  return Math.max(0, ((referencePrice - candidatePrice) / referencePrice) * 100);
}

function averageFor(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function emptyReport(input: SeasonalSalePatternInput, holiday: SeasonalSaleHoliday, detail: string): SeasonalSalePatternReport {
  return {
    available: false,
    productId: input.productId,
    productName: input.productName,
    holiday,
    hint: `Likely on sale before ${holiday.label}`,
    windowLabel: `${holiday.leadWindowDays} days before ${holiday.label}`,
    observedSeasonCount: 0,
    qualifiedSeasonCount: 0,
    observationCount: input.observations.length,
    averageDiscountPercent: 0,
    bestObservedPrice: null,
    bestObservedAt: null,
    evidence: [],
    evidenceLabel: `No repeat discounted ${holiday.label} windows detected`,
    detail,
    guardrail: 'GroceryView withholds the seasonal sale hint unless explicit historical holiday-window price evidence repeats across multiple years.'
  };
}

export function detectSeasonalSalePattern(input: SeasonalSalePatternInput): SeasonalSalePatternReport {
  const holiday = input.holiday ?? midsommarSeasonalHoliday;
  const parsedRows = input.observations
    .map((observation) => ({ ...observation, date: parseObservationDate(observation.observedAt) }))
    .filter((observation): observation is SeasonalSaleObservation & { date: Date } => observation.date !== null && Number.isFinite(observation.price) && observation.price > 0);

  if (parsedRows.length < holiday.minSeasonCount * 2) {
    return emptyReport(input, holiday, `Only ${parsedRows.length} usable dated price rows are available, so GroceryView withholds the seasonal sale hint instead of forecasting a ${holiday.label} discount.`);
  }

  const holidayWindowRows = parsedRows.filter((row) => isInsideHolidayWindow(row.date, holiday));
  const baselineRows = parsedRows.filter((row) => !isInsideHolidayWindow(row.date, holiday));
  const baselineMedian = medianFor(baselineRows.map((row) => row.price));

  if (holidayWindowRows.length < holiday.minSeasonCount || baselineMedian === null) {
    return emptyReport(input, holiday, `There are not enough baseline and ${holiday.label} holiday-window observations, so GroceryView withholds the seasonal sale hint until the historical record is stronger.`);
  }

  const bestHolidayRowsByYear = new Map<number, SeasonalSaleObservation & { date: Date; daysBeforeHoliday: number }>();
  for (const row of holidayWindowRows) {
    const year = row.date.getUTCFullYear();
    const current = bestHolidayRowsByYear.get(year);
    if (!current || row.price < current.price) {
      bestHolidayRowsByYear.set(year, { ...row, daysBeforeHoliday: daysBeforeHoliday(row.date, holiday) });
    }
  }

  const evidence = [...bestHolidayRowsByYear.entries()]
    .map(([year, row]) => ({
      year,
      observedAt: row.observedAt.slice(0, 10),
      price: row.price,
      discountPercent: percentOff(baselineMedian, row.price),
      daysBeforeHoliday: row.daysBeforeHoliday
    }))
    .filter((row) => row.discountPercent >= holiday.minDiscountPercent)
    .sort((left, right) => left.year - right.year);

  const observedSeasonCount = bestHolidayRowsByYear.size;
  const qualifiedSeasonCount = evidence.length;
  if (qualifiedSeasonCount < holiday.minSeasonCount) {
    return {
      ...emptyReport(input, holiday, `Only ${qualifiedSeasonCount} ${holiday.label} windows cleared the ${holiday.minDiscountPercent}% historical discount threshold, so GroceryView withholds the seasonal sale hint.`),
      observedSeasonCount,
      qualifiedSeasonCount,
      evidenceLabel: `${observedSeasonCount} historical ${holiday.label} windows observed, ${qualifiedSeasonCount} discounted enough`,
      evidence
    };
  }

  const bestEvidence = [...evidence].sort((left, right) => left.price - right.price)[0]!;
  const averageDiscountPercent = averageFor(evidence.map((row) => row.discountPercent));

  return {
    available: true,
    productId: input.productId,
    productName: input.productName,
    holiday,
    hint: `Likely on sale before ${holiday.label}`,
    windowLabel: `${holiday.leadWindowDays} days before ${holiday.label}`,
    observedSeasonCount,
    qualifiedSeasonCount,
    observationCount: parsedRows.length,
    averageDiscountPercent,
    bestObservedPrice: bestEvidence.price,
    bestObservedAt: bestEvidence.observedAt,
    evidence,
    evidenceLabel: `${qualifiedSeasonCount} historical ${holiday.label} windows were at least ${holiday.minDiscountPercent}% below the non-holiday median`,
    detail: `Likely on sale before ${holiday.label} is based only on repeated historical holiday-window prices versus this product's non-holiday median, not a future price forecast.`,
    guardrail: 'This hint requires explicit historical holiday-window price evidence and never infers a retailer promotion or future shelf price.'
  };
}
