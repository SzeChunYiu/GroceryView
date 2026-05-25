export type NordicSeasonalProduce = {
  name: string;
  months: number[];
  expectedPriceBehavior: string;
  recommendedChains: string[];
  educationNote: string;
};

export type NordicSeasonalProduceMonth = {
  monthIndex: number;
  monthLabel: string;
  produce: NordicSeasonalProduce[];
};

const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const nordicSeasonalProduce: NordicSeasonalProduce[] = [
  {
    name: 'Root vegetables',
    months: [0, 1, 2, 9, 10, 11],
    expectedPriceBehavior: 'Storage crops are usually steadier and locally cheap through winter and late autumn.',
    recommendedChains: ['Willys', 'Hemköp'],
    educationNote: 'Compare kilo prices and choose loose roots when bag sizes do not match your household.'
  },
  {
    name: 'Asparagus',
    months: [4, 5],
    expectedPriceBehavior: 'Short Nordic season: prices often improve when Swedish and nearby European supply overlaps.',
    recommendedChains: ['ICA', 'Hemköp'],
    educationNote: 'Buy only for near-term meals; quality drops quickly after the peak window.'
  },
  {
    name: 'Strawberries',
    months: [5, 6],
    expectedPriceBehavior: 'Peak summer supply can create short-lived basket savings around midsummer and July.',
    recommendedChains: ['ICA', 'Willys'],
    educationNote: 'Check package weight and origin label before comparing headline punnet prices.'
  },
  {
    name: 'Cabbage',
    months: [7, 8, 9, 10],
    expectedPriceBehavior: 'Late summer and autumn harvests make cabbage a durable low-cost vegetable base.',
    recommendedChains: ['Willys', 'Lidl'],
    educationNote: 'Whole heads usually beat pre-cut bags on unit price when you can use leftovers.'
  },
  {
    name: 'Apples',
    months: [8, 9, 10],
    expectedPriceBehavior: 'Nordic apples are most competitive during autumn harvest weeks.',
    recommendedChains: ['Hemköp', 'ICA'],
    educationNote: 'Mix local apples with imported varieties only after checking kr/kg and bruising.'
  }
];

export function buildNordicSeasonalProduceCalendar(country = 'se'): NordicSeasonalProduceMonth[] {
  const countryCode = country.toLowerCase();
  const localChain = countryCode === 'is' ? 'Bonus' : countryCode === 'no' ? 'Rema 1000' : 'ICA';

  return monthLabels.map((monthLabel, monthIndex) => ({
    monthIndex,
    monthLabel,
    produce: nordicSeasonalProduce
      .filter((item) => item.months.includes(monthIndex))
      .map((item) => ({
        ...item,
        recommendedChains: [...new Set([localChain, ...item.recommendedChains])]
      }))
  }));
}
