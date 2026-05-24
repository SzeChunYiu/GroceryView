export const storeAisleLayout = [
  { id: 'produce', label: 'Produce' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'household', label: 'Household' }
] as const;

export type StoreAisleId = (typeof storeAisleLayout)[number]['id'];
export type AisleMoveDirection = 'up' | 'down';

export const defaultStoreAisleRoute: StoreAisleId[] = storeAisleLayout.map((aisle) => aisle.id);

const storeAisleIds = new Set<string>(defaultStoreAisleRoute);

export function normalizeStoreAisleId(value: string | null | undefined): StoreAisleId | null {
  return value && storeAisleIds.has(value) ? (value as StoreAisleId) : null;
}

export function normalizeStoreAisleRoute(value: unknown): StoreAisleId[] {
  const requested = Array.isArray(value) ? value : [];
  const seen = new Set<StoreAisleId>();
  const route = requested.flatMap((aisleId) => {
    const normalized = typeof aisleId === 'string' ? normalizeStoreAisleId(aisleId) : null;
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [normalized];
  });

  for (const aisleId of defaultStoreAisleRoute) {
    if (!seen.has(aisleId)) route.push(aisleId);
  }

  return route;
}

export function inferStoreAisleId(item: { detail?: string; name: string }): StoreAisleId {
  const text = `${item.name} ${item.detail ?? ''}`.toLowerCase();
  if (/fruit|vegetable|produce|fresh/.test(text)) return 'produce';
  if (/bread|bakery|bun|roll/.test(text)) return 'bakery';
  if (/milk|fil|yogurt|dairy|cheese|butter/.test(text)) return 'dairy';
  if (/frozen|ice cream/.test(text)) return 'frozen';
  if (/paper|clean|soap|detergent|household/.test(text)) return 'household';
  return 'pantry';
}

export function sortShoppingItemsByAisle<T extends { aisleId?: string; detail?: string; name: string }>(
  items: readonly T[],
  aisleRoute: readonly string[]
): T[] {
  const route = normalizeStoreAisleRoute(aisleRoute);
  const rank = new Map(route.map((aisleId, index) => [aisleId, index]));

  return items
    .map((item, index) => ({
      index,
      item,
      rank: rank.get(normalizeStoreAisleId(item.aisleId) ?? inferStoreAisleId(item)) ?? route.length
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ item }) => item);
}

export function moveStoreAisle(
  aisleRoute: readonly string[],
  aisleId: StoreAisleId,
  direction: AisleMoveDirection
): StoreAisleId[] {
  const route = normalizeStoreAisleRoute(aisleRoute);
  const index = route.indexOf(aisleId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= route.length) return route;

  const nextRoute = [...route];
  [nextRoute[index], nextRoute[targetIndex]] = [nextRoute[targetIndex], nextRoute[index]];
  return nextRoute;
}
