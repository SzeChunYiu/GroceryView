export type SharedListActivityKind = 'item_added' | 'item_removed';

export type SharedListActor = {
  id: string;
  name: string;
};

export type SharedListActivityEvent = {
  id: string;
  listId: string;
  itemId: string;
  itemName: string;
  kind: SharedListActivityKind;
  actor: SharedListActor;
  timestamp: string;
};

export type SharedListActivityInput = {
  listId: string;
  itemId: string;
  itemName: string;
  actor: SharedListActor;
  timestamp?: string | Date;
};

type ActivitySubscriber = (event: SharedListActivityEvent) => void;

const activityEvents: SharedListActivityEvent[] = [];
const subscribers = new Set<ActivitySubscriber>();

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required to publish shared-list activity.`);
  return trimmed;
}

function isoTimestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('timestamp must be a valid date.');
  return date.toISOString();
}

function activityId(kind: SharedListActivityKind, input: SharedListActivityInput, timestamp: string): string {
  return [kind, input.listId, input.itemId, input.actor.id, timestamp].map((part) => encodeURIComponent(part)).join(':');
}

export function getSharedListActivityEvents(listId?: string): SharedListActivityEvent[] {
  return activityEvents.filter((event) => listId === undefined || event.listId === listId);
}

export function subscribeToSharedListActivity(subscriber: ActivitySubscriber): () => void {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

export function publishSharedListActivity(kind: SharedListActivityKind, input: SharedListActivityInput): SharedListActivityEvent {
  const timestamp = isoTimestamp(input.timestamp);
  const event: SharedListActivityEvent = {
    id: activityId(kind, input, timestamp),
    listId: required(input.listId, 'listId'),
    itemId: required(input.itemId, 'itemId'),
    itemName: required(input.itemName, 'itemName'),
    kind,
    actor: {
      id: required(input.actor.id, 'actor.id'),
      name: required(input.actor.name, 'actor.name')
    },
    timestamp
  };

  activityEvents.unshift(event);
  for (const subscriber of subscribers) subscriber(event);
  return event;
}

export function publishSharedListItemAdded(input: SharedListActivityInput): SharedListActivityEvent {
  return publishSharedListActivity('item_added', input);
}

export function publishSharedListItemRemoved(input: SharedListActivityInput): SharedListActivityEvent {
  return publishSharedListActivity('item_removed', input);
}
