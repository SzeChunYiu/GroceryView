export type NordicCountry = 'SE' | 'NO' | 'IS';

export type SeasonalProduceItem = {
  name: string;
  months: number[];
  country: NordicCountry;
  cheapSignal: 'local_peak' | 'storage_crop' | 'greenhouse' | 'import_overlap';
  note: string;
};

export const seasonalProduceCalendar: SeasonalProduceItem[] = [
  { country: 'SE', name: 'Potatoes', months: [7, 8, 9, 10], cheapSignal: 'local_peak', note: 'Swedish new potatoes peak in summer and early autumn.' },
  { country: 'SE', name: 'Carrots', months: [8, 9, 10, 11, 12], cheapSignal: 'storage_crop', note: 'Local carrots are harvested in autumn and store well into winter.' },
  { country: 'SE', name: 'Strawberries', months: [6, 7], cheapSignal: 'local_peak', note: 'Short local berry season; prices often improve during peak supply.' },
  { country: 'NO', name: 'Cabbage', months: [8, 9, 10, 11], cheapSignal: 'storage_crop', note: 'Norwegian cabbage is a durable autumn staple.' },
  { country: 'NO', name: 'Apples', months: [9, 10], cheapSignal: 'local_peak', note: 'Norwegian apple supply is strongest in early autumn.' },
  { country: 'NO', name: 'Root vegetables', months: [9, 10, 11, 12], cheapSignal: 'storage_crop', note: 'Root crops are locally abundant after harvest.' },
  { country: 'IS', name: 'Greenhouse tomatoes', months: [5, 6, 7, 8, 9], cheapSignal: 'greenhouse', note: 'Icelandic greenhouse supply is strongest across the bright season.' },
  { country: 'IS', name: 'Potatoes', months: [8, 9, 10], cheapSignal: 'local_peak', note: 'Local potatoes are a late-summer and autumn staple.' },
  { country: 'IS', name: 'Rutabaga', months: [9, 10, 11], cheapSignal: 'storage_crop', note: 'Storage-friendly roots help bridge the colder months.' },
];

export function seasonalProduceFor(country: NordicCountry, month: number): SeasonalProduceItem[] {
  return seasonalProduceCalendar.filter((item) => item.country === country && item.months.includes(month));
}

export function countrySeasonalProduce(country: NordicCountry): SeasonalProduceItem[] {
  return seasonalProduceCalendar.filter((item) => item.country === country);
}
