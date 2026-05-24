export type SeasonalProduceRow = {
  month: number;
  produce: string;
  countries: string[];
  locallyCheap: boolean;
  note: string;
};

export const nordicSeasonalProduce: SeasonalProduceRow[] = [
  { month: 1, produce: 'cabbage', countries: ['se', 'dk', 'fi', 'no'], locallyCheap: true, note: 'storage crop, good winter value' },
  { month: 4, produce: 'asparagus', countries: ['se', 'dk'], locallyCheap: false, note: 'early local season starts, often premium-priced' },
  { month: 6, produce: 'strawberries', countries: ['se', 'dk', 'fi', 'no'], locallyCheap: true, note: 'peak Nordic berry season' },
  { month: 8, produce: 'new potatoes', countries: ['se', 'dk', 'fi', 'no'], locallyCheap: true, note: 'local supply is broad and prices soften' },
  { month: 9, produce: 'apples', countries: ['se', 'dk', 'fi', 'no'], locallyCheap: true, note: 'harvest month for Nordic orchards' },
  { month: 10, produce: 'root vegetables', countries: ['se', 'dk', 'fi', 'no', 'is'], locallyCheap: true, note: 'carrot, beet, and swede are strong value staples' }
];

export function seasonalProduceFor(country: string, month: number) {
  const normalizedCountry = country.toLocaleLowerCase('sv-SE');
  return nordicSeasonalProduce.filter((row) => row.month === month && row.countries.includes(normalizedCountry));
}
