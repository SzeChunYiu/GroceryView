// Starter commodity taxonomy — canonical generic products for unbranded / loose
// items (meat, vegetables, fruit, bakery, bulk) that have no EAN and are sold by
// weight. Chain-specific loose items map onto these via the `aliases` table; the
// `commodity_id` column on `products` links them. Cross-chain comparison for these
// is on unit price (kr/kg, kr/l, kr/st), never barcode.
//
// `isStaple` marks the representative basket used for the per-chain "fresh-food
// index" (the watchdog-style basket comparison used when item-level matching is not
// high-confidence). Extend this list from real chain catalogs — keep slugs stable.

export type ComparableUnit = 'kg' | 'l' | 'st';

export type Commodity = {
  slug: string;
  nameSv: string;
  nameEn: string;
  categoryPath: string[];
  comparableUnit: ComparableUnit;
  /** common variants/grades a chain may carry within this commodity */
  variants?: string[];
  /** part of the representative staples basket for the fresh-food index */
  isStaple?: boolean;
};

export const COMMODITIES: readonly Commodity[] = [
  // ── Vegetables ──────────────────────────────────────────────────────────
  { slug: 'tomato', nameSv: 'Tomat', nameEn: 'Tomato', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg', variants: ['vine', 'cherry', 'plum', 'beef'], isStaple: true },
  { slug: 'cucumber', nameSv: 'Gurka', nameEn: 'Cucumber', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'st', isStaple: true },
  { slug: 'carrot', nameSv: 'Morot', nameEn: 'Carrot', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg', isStaple: true },
  { slug: 'yellow-onion', nameSv: 'Gul lök', nameEn: 'Yellow onion', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg', isStaple: true },
  { slug: 'potato', nameSv: 'Potatis', nameEn: 'Potato', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg', variants: ['fast', 'mjolig', 'farsk'], isStaple: true },
  { slug: 'bell-pepper', nameSv: 'Paprika', nameEn: 'Bell pepper', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg', variants: ['rod', 'gul', 'gron'] },
  { slug: 'broccoli', nameSv: 'Broccoli', nameEn: 'Broccoli', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg' },
  { slug: 'cauliflower', nameSv: 'Blomkål', nameEn: 'Cauliflower', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'st' },
  { slug: 'white-cabbage', nameSv: 'Vitkål', nameEn: 'White cabbage', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg' },
  { slug: 'iceberg-lettuce', nameSv: 'Isbergssallad', nameEn: 'Iceberg lettuce', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'st' },
  { slug: 'spinach', nameSv: 'Spenat', nameEn: 'Spinach', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg' },
  { slug: 'zucchini', nameSv: 'Zucchini', nameEn: 'Zucchini', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg' },
  { slug: 'mushroom', nameSv: 'Champinjoner', nameEn: 'Mushrooms', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg' },
  { slug: 'leek', nameSv: 'Purjolök', nameEn: 'Leek', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'kg' },
  { slug: 'garlic', nameSv: 'Vitlök', nameEn: 'Garlic', categoryPath: ['frukt-gront', 'gront'], comparableUnit: 'st' },
  { slug: 'avocado', nameSv: 'Avokado', nameEn: 'Avocado', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'st' },

  // ── Fruit ───────────────────────────────────────────────────────────────
  { slug: 'banana', nameSv: 'Banan', nameEn: 'Banana', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'kg', isStaple: true },
  { slug: 'apple', nameSv: 'Äpple', nameEn: 'Apple', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'kg', variants: ['royal-gala', 'granny-smith', 'pink-lady'], isStaple: true },
  { slug: 'orange', nameSv: 'Apelsin', nameEn: 'Orange', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'kg' },
  { slug: 'lemon', nameSv: 'Citron', nameEn: 'Lemon', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'kg' },
  { slug: 'pear', nameSv: 'Päron', nameEn: 'Pear', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'kg' },
  { slug: 'grapes', nameSv: 'Vindruvor', nameEn: 'Grapes', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'kg', variants: ['green', 'red'] },
  { slug: 'strawberry', nameSv: 'Jordgubbar', nameEn: 'Strawberries', categoryPath: ['frukt-gront', 'bar'], comparableUnit: 'kg' },
  { slug: 'blueberry', nameSv: 'Blåbär', nameEn: 'Blueberries', categoryPath: ['frukt-gront', 'bar'], comparableUnit: 'kg' },
  { slug: 'kiwi', nameSv: 'Kiwi', nameEn: 'Kiwi', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'st' },
  { slug: 'melon', nameSv: 'Melon', nameEn: 'Melon', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'st', variants: ['galia', 'water', 'honeydew'] },
  { slug: 'lime', nameSv: 'Lime', nameEn: 'Lime', categoryPath: ['frukt-gront', 'frukt'], comparableUnit: 'st' },

  // ── Meat & poultry ──────────────────────────────────────────────────────
  { slug: 'beef-mince', nameSv: 'Nötfärs', nameEn: 'Beef mince', categoryPath: ['kott-chark', 'kott'], comparableUnit: 'kg', variants: ['mince-10', 'mince-15', 'mince-20'], isStaple: true },
  { slug: 'mixed-mince', nameSv: 'Blandfärs', nameEn: 'Mixed mince', categoryPath: ['kott-chark', 'kott'], comparableUnit: 'kg', variants: ['mince-12', 'mince-17'] },
  { slug: 'pork-mince', nameSv: 'Fläskfärs', nameEn: 'Pork mince', categoryPath: ['kott-chark', 'kott'], comparableUnit: 'kg' },
  { slug: 'chicken-breast', nameSv: 'Kycklingfilé', nameEn: 'Chicken breast fillet', categoryPath: ['kott-chark', 'fagel'], comparableUnit: 'kg', isStaple: true },
  { slug: 'chicken-thigh', nameSv: 'Kycklinglårfilé', nameEn: 'Chicken thigh fillet', categoryPath: ['kott-chark', 'fagel'], comparableUnit: 'kg' },
  { slug: 'whole-chicken', nameSv: 'Hel kyckling', nameEn: 'Whole chicken', categoryPath: ['kott-chark', 'fagel'], comparableUnit: 'kg' },
  { slug: 'pork-chop', nameSv: 'Fläskkotlett', nameEn: 'Pork chop', categoryPath: ['kott-chark', 'kott'], comparableUnit: 'kg' },
  { slug: 'pork-fillet', nameSv: 'Fläskfilé', nameEn: 'Pork fillet', categoryPath: ['kott-chark', 'kott'], comparableUnit: 'kg' },
  { slug: 'beef-steak', nameSv: 'Nötstek', nameEn: 'Beef roast', categoryPath: ['kott-chark', 'kott'], comparableUnit: 'kg' },
  { slug: 'sausage', nameSv: 'Korv', nameEn: 'Sausage', categoryPath: ['kott-chark', 'chark'], comparableUnit: 'kg', variants: ['falukorv', 'grill', 'prinskorv'] },
  { slug: 'bacon', nameSv: 'Bacon', nameEn: 'Bacon', categoryPath: ['kott-chark', 'chark'], comparableUnit: 'kg' },

  // ── Fish & seafood ──────────────────────────────────────────────────────
  { slug: 'salmon', nameSv: 'Lax', nameEn: 'Salmon', categoryPath: ['fisk-skaldjur'], comparableUnit: 'kg', variants: ['fillet', 'whole'], isStaple: true },
  { slug: 'cod', nameSv: 'Torsk', nameEn: 'Cod', categoryPath: ['fisk-skaldjur'], comparableUnit: 'kg' },
  { slug: 'shrimp', nameSv: 'Räkor', nameEn: 'Shrimp', categoryPath: ['fisk-skaldjur'], comparableUnit: 'kg' },

  // ── Bakery (loose) ──────────────────────────────────────────────────────
  { slug: 'bread-loaf', nameSv: 'Limpa', nameEn: 'Bread loaf', categoryPath: ['brod-kakor'], comparableUnit: 'st', variants: ['rye', 'wheat', 'sourdough'], isStaple: true },
  { slug: 'baguette', nameSv: 'Baguette', nameEn: 'Baguette', categoryPath: ['brod-kakor'], comparableUnit: 'st' },
  { slug: 'cinnamon-bun', nameSv: 'Kanelbulle', nameEn: 'Cinnamon bun', categoryPath: ['brod-kakor'], comparableUnit: 'st' },

  // ── Dairy & eggs (often loose / per-unit comparable) ────────────────────
  { slug: 'eggs', nameSv: 'Ägg', nameEn: 'Eggs', categoryPath: ['mejeri', 'agg'], comparableUnit: 'st', variants: ['free-range', 'organic', 'caged'], isStaple: true },
  { slug: 'milk', nameSv: 'Mjölk', nameEn: 'Milk', categoryPath: ['mejeri'], comparableUnit: 'l', variants: ['standard-3', 'mellan-15', 'latt-05'], isStaple: true },

  // ── Bulk / dry staples ──────────────────────────────────────────────────
  { slug: 'rice', nameSv: 'Ris', nameEn: 'Rice', categoryPath: ['skafferi', 'ris-pasta'], comparableUnit: 'kg', variants: ['jasmine', 'basmati', 'long-grain'], isStaple: true },
  { slug: 'pasta', nameSv: 'Pasta', nameEn: 'Pasta', categoryPath: ['skafferi', 'ris-pasta'], comparableUnit: 'kg', isStaple: true },
  { slug: 'wheat-flour', nameSv: 'Vetemjöl', nameEn: 'Wheat flour', categoryPath: ['skafferi', 'baking'], comparableUnit: 'kg', isStaple: true },
  { slug: 'sugar', nameSv: 'Socker', nameEn: 'Sugar', categoryPath: ['skafferi', 'baking'], comparableUnit: 'kg' },
  { slug: 'oats', nameSv: 'Havregryn', nameEn: 'Rolled oats', categoryPath: ['skafferi', 'frukost'], comparableUnit: 'kg' },
  { slug: 'cooking-oil', nameSv: 'Matolja', nameEn: 'Cooking oil', categoryPath: ['skafferi'], comparableUnit: 'l', variants: ['rapeseed', 'olive', 'sunflower'] },
];

/** Commodities in the representative staples basket (the per-chain fresh-food index). */
export const STAPLE_BASKET: readonly Commodity[] = COMMODITIES.filter((c) => c.isStaple);

/** Look up a commodity by its stable slug. */
export function findCommodity(slug: string): Commodity | undefined {
  return COMMODITIES.find((c) => c.slug === slug);
}
