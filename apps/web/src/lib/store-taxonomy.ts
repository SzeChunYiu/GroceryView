export const SHOPPING_LIST_SELECTED_STORE_KEY = 'groceryview:selected-store';
export const SHOPPING_LIST_SELECTED_STORE_EVENT = 'groceryview:selected-store-changed';

export type ShoppingStoreSelection = {
  slug: string;
  name: string;
  brand: string;
};

export type AisleCategory =
  | 'produce'
  | 'bakery'
  | 'dairy'
  | 'meatSeafood'
  | 'deli'
  | 'pantry'
  | 'beverages'
  | 'frozen'
  | 'household'
  | 'personal'
  | 'other';

type AisleProfile = {
  match: RegExp;
  order: AisleCategory[];
};

const DEFAULT_AISLE_ORDER: AisleCategory[] = [
  'produce',
  'bakery',
  'dairy',
  'meatSeafood',
  'deli',
  'pantry',
  'beverages',
  'frozen',
  'household',
  'personal',
  'other',
];

const STORE_AISLE_PROFILES: AisleProfile[] = [
  {
    match: /lidl/i,
    order: [
      'bakery',
      'produce',
      'dairy',
      'meatSeafood',
      'pantry',
      'beverages',
      'frozen',
      'household',
      'personal',
      'deli',
      'other',
    ],
  },
  {
    match: /willys|city gross/i,
    order: [
      'produce',
      'bakery',
      'meatSeafood',
      'dairy',
      'frozen',
      'pantry',
      'beverages',
      'household',
      'personal',
      'deli',
      'other',
    ],
  },
  {
    match: /coop|ica|hemk[oö]p/i,
    order: DEFAULT_AISLE_ORDER,
  },
];

const CATEGORY_LABELS: Record<AisleCategory, string> = {
  produce: 'Fruit & vegetables',
  bakery: 'Bakery',
  dairy: 'Dairy & eggs',
  meatSeafood: 'Meat & seafood',
  deli: 'Deli & ready meals',
  pantry: 'Pantry',
  beverages: 'Drinks',
  frozen: 'Frozen',
  household: 'Household',
  personal: 'Personal care',
  other: 'Other aisles',
};

const CATEGORY_KEYWORDS: Array<{ category: AisleCategory; match: RegExp }> = [
  {
    category: 'produce',
    match:
      /apple|avocado|banana|berries|berry|carrot|citrus|cucumber|fruit|garlic|grape|lettuce|lime|onion|orange|pepper|potato|produce|salad|tomato|vegetable/i,
  },
  { category: 'bakery', match: /bagel|bakery|bread|brioche|bun|cake|croissant|loaf|pastry|roll|tortilla/i },
  { category: 'dairy', match: /butter|cheese|cream|dairy|egg|milk|yogh?urt/i },
  { category: 'meatSeafood', match: /bacon|beef|chicken|fish|meat|pork|salmon|seafood|shrimp|turkey/i },
  { category: 'deli', match: /deli|dip|hummus|meal|ready|salami|sandwich|sauce|soup/i },
  { category: 'frozen', match: /frozen|ice cream|pizza/i },
  { category: 'beverages', match: /beer|coffee|drink|juice|soda|tea|water|wine/i },
  { category: 'household', match: /clean|detergent|household|kitchen|paper|soap|toilet/i },
  { category: 'personal', match: /care|deodorant|personal|shampoo|tooth/i },
  { category: 'pantry', match: /cereal|flour|oil|pasta|pantry|rice|snack|spice|sugar|tin|tomato sauce/i },
];

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function itemText(item: unknown): string {
  const record = item as Record<string, unknown>;
  return [
    stringField(record.category),
    stringField(record.aisle),
    stringField(record.name),
    stringField(record.productName),
    stringField(record.localizedName),
    stringField(record.displayName),
    stringField(record.title),
    stringField(record.label),
    stringField(record.description),
  ]
    .filter(Boolean)
    .join(' ');
}

function profileForStore(store: ShoppingStoreSelection | null): AisleCategory[] {
  const storeText = [store?.brand, store?.name, store?.slug].filter(Boolean).join(' ');
  return STORE_AISLE_PROFILES.find((profile) => profile.match.test(storeText))?.order ?? DEFAULT_AISLE_ORDER;
}

export function parseShoppingStoreSelection(value: string | null): ShoppingStoreSelection | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<ShoppingStoreSelection>;
    if (!parsed.slug || !parsed.name) return null;

    return {
      slug: parsed.slug,
      name: parsed.name,
      brand: parsed.brand || 'Store',
    };
  } catch {
    return null;
  }
}

export function shoppingListCategory(item: unknown): AisleCategory {
  const text = itemText(item);
  return CATEGORY_KEYWORDS.find((keyword) => keyword.match.test(text))?.category ?? 'other';
}

export function shoppingListCategoryLabel(category: AisleCategory): string {
  return CATEGORY_LABELS[category];
}

export function sortShoppingListForStore<T>(items: readonly T[], store: ShoppingStoreSelection | null): T[] {
  const order = profileForStore(store);
  const rank = new Map(order.map((category, index) => [category, index]));

  return [...items].sort((left, right) => {
    const leftCategory = shoppingListCategory(left);
    const rightCategory = shoppingListCategory(right);

    return (rank.get(leftCategory) ?? order.length) - (rank.get(rightCategory) ?? order.length);
  });
}
