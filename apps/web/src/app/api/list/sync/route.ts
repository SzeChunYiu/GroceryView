import {
  formatSseEvent,
  mergeRealtimeListItems,
  type RealtimeListItemState,
  type RealtimeListSyncEvent
} from '@/lib/realtime';

const encoder = new TextEncoder();
const listStates = new Map<string, RealtimeListItemState[]>();
const subscribers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

function listIdFromUrl(request: Request): string {
  return new URL(request.url).searchParams.get('listId') || 'default-shopping-list';
}

function payloadFor(listId: string): RealtimeListSyncEvent {
  return {
    items: listStates.get(listId) ?? [],
    listId,
    updatedAt: new Date().toISOString()
  };
}

function sendSse(controller: ReadableStreamDefaultController<Uint8Array>, event: string, payload: unknown) {
  controller.enqueue(encoder.encode(formatSseEvent(event, payload)));
}

function broadcast(listId: string) {
  const payload = payloadFor(listId);
  for (const controller of subscribers.get(listId) ?? []) {
    try {
      sendSse(controller, 'list-sync', payload);
    } catch {
      subscribers.get(listId)?.delete(controller);
    }
  }
}

export async function GET(request: Request) {
  const listId = listIdFromUrl(request);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const listSubscribers = subscribers.get(listId) ?? new Set<ReadableStreamDefaultController<Uint8Array>>();
      listSubscribers.add(controller);
      subscribers.set(listId, listSubscribers);
      sendSse(controller, 'list-sync', payloadFor(listId));

      const heartbeat = setInterval(() => {
        sendSse(controller, 'heartbeat', { listId, updatedAt: new Date().toISOString() });
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        listSubscribers.delete(controller);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'content-type': 'text/event-stream'
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Partial<RealtimeListItemState> & { listId?: string } | null;
  const listId = body?.listId || 'default-shopping-list';

  if (!body?.id || typeof body.checked !== 'boolean') {
    return Response.json({ error: 'id and checked are required.' }, { status: 400 });
  }

  const item: RealtimeListItemState = {
    actorId: body.actorId,
    checked: body.checked,
    id: body.id,
    updatedAt: body.updatedAt || new Date().toISOString()
  };
  const nextItems = mergeRealtimeListItems(listStates.get(listId) ?? [], [item]);
  listStates.set(listId, nextItems);
  broadcast(listId);

  return Response.json(payloadFor(listId));
}
