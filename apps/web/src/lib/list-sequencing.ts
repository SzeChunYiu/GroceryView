import type { ShoppingListItem } from '@/hooks/useList';

export type StoreAisle = {
  id: string;
  label: string;
  order: number;
  keywords: string[];
};

export type AisleListGroup<TItem extends Pick<ShoppingListItem, 'id'>> = {
  aisle: StoreAisle;
  items: TItem[];
};

export const storeAisleLayout: StoreAisle[] = [
  { id: 'produce', label: 'Produce', order: 10, keywords: ['fruit', 'frukt', 'apple', 'banana', 'fresh', 'vegetable', 'grönsaker'] },
  { id: 'breakfast', label: 'Breakfast', order: 20, keywords: ['oats', 'havre', 'cereal', 'granola', 'porridge'] },
  { id: 'coffee-tea', label: 'Coffee & tea', order: 30, keywords: ['coffee', 'kaffe', 'tea', 'te'] },
  { id: 'dairy', label: 'Dairy', order: 40, keywords: ['milk', 'mjölk', 'fil', 'yoghurt', 'cheese', 'ost'] },
  { id: 'frozen', label: 'Frozen', order: 50, keywords: ['frozen', 'frysta', 'ice cream', 'glass'] },
  { id: 'pantry', label: 'Pantry', order: 60, keywords: ['pasta', 'rice', 'honey', 'oil', 'beans', 'sauce', 'pantry'] },
  { id: 'household', label: 'Household', order: 70, keywords: ['paper', 'detergent', 'cleaning', 'soap', 'trash'] },
  { id: 'uncategorized', label: 'Other aisles', order: 999, keywords: [] }
];

function searchableText(item: Pick<ShoppingListItem, 'detail' | 'matchedProductName' | 'name'>) {
  return [item.name, item.matchedProductName, item.detail].filter(Boolean).join(' ').toLocaleLowerCase('sv-SE');
}

export function inferListItemAisle(item: Pick<ShoppingListItem, 'detail' | 'matchedProductName' | 'name'>): StoreAisle {
  const text = searchableText(item);
  return storeAisleLayout.find((aisle) => aisle.keywords.some((keyword) => text.includes(keyword)))
    ?? storeAisleLayout[storeAisleLayout.length - 1];
}

export function sequenceListByAisle<TItem extends Pick<ShoppingListItem, 'detail' | 'id' | 'matchedProductName' | 'name'>>(items: TItem[]): AisleListGroup<TItem>[] {
  const grouped = new Map<string, AisleListGroup<TItem>>();

  for (const item of items) {
    const aisle = inferListItemAisle(item);
    const current = grouped.get(aisle.id) ?? { aisle, items: [] };
    current.items.push(item);
    grouped.set(aisle.id, current);
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort((left, right) => left.name.localeCompare(right.name, 'sv'))
    }))
    .sort((left, right) => left.aisle.order - right.aisle.order || left.aisle.label.localeCompare(right.aisle.label, 'sv'));
}
