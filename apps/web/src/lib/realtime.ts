export type RealtimeListItemState = {
  actorId?: string;
  checked: boolean;
  id: string;
  updatedAt: string;
};

export type RealtimeListSyncEvent = {
  items: RealtimeListItemState[];
  listId: string;
  updatedAt: string;
};

type CheckableItem = {
  checked: boolean;
  id: string;
};

export function mergeRealtimeListItems(
  currentItems: RealtimeListItemState[],
  incomingItems: RealtimeListItemState[]
): RealtimeListItemState[] {
  const merged = new Map(currentItems.map((item) => [item.id, item]));
  for (const incoming of incomingItems) {
    const current = merged.get(incoming.id);
    if (!current || Date.parse(incoming.updatedAt) >= Date.parse(current.updatedAt)) {
      merged.set(incoming.id, incoming);
    }
  }
  return [...merged.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function listItemStatesFromShoppingItems(items: CheckableItem[], updatedAt = '1970-01-01T00:00:00.000Z'): RealtimeListItemState[] {
  return items.map((item) => ({
    checked: item.checked,
    id: item.id,
    updatedAt
  }));
}

export function applyOptimisticListToggle(
  items: RealtimeListItemState[],
  itemId: string,
  checked: boolean,
  actorId: string,
  updatedAt = new Date().toISOString()
): RealtimeListItemState[] {
  return mergeRealtimeListItems(items, [{ actorId, checked, id: itemId, updatedAt }]);
}

export function formatSseEvent(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}
