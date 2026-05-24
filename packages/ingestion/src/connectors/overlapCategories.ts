export type GroceryOverlapCategory =
  | 'bakery'
  | 'beverages'
  | 'dry_goods'
  | 'pantry'
  | 'produce'
  | 'spices';

export const ETHNIC_MIDDLE_EASTERN_OVERLAP_CATEGORY_PATTERNS: Array<[GroceryOverlapCategory, RegExp]> = [
  ['dry_goods', /rice|ris|bulgur|couscous|lentil|lins|bean|böna|bona|chickpea|kikärt|kikart/i],
  ['spices', /spice|krydd|zaatar|sumac|saffran|cumin|kummin|tahini/i],
  ['pantry', /oil|olja|olive|oliv|date|dad(el|lar)|tomat|sauce|sås|sas|konserv|pickle|inlagd/i],
  ['bakery', /bread|bröd|brod|pita|lavash|naan|baklava/i],
  ['beverages', /tea|te|coffee|kaffe|juice|dryck/i],
  ['produce', /fruit|frukt|vegetable|grönsak|gronsak|herb|örter|orter/i]
];

export function classifyMiddleEasternGroceryOverlap(value: string): GroceryOverlapCategory | null {
  return ETHNIC_MIDDLE_EASTERN_OVERLAP_CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(value))?.[0] ?? null;
}
