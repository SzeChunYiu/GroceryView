export const dynamic = 'force-dynamic';

type HouseholdRole = 'partner' | 'kid' | 'guest';

type SharedListEvent = {
  actor: HouseholdRole;
  item?: {
    addedBy: HouseholdRole;
    checked: boolean;
    detail: string;
    id: string;
    name: string;
    quantity: string;
    updatedAt: string;
  };
  message?: string;
  type: 'item:add' | 'presence';
};

const encoder = new TextEncoder();

function countrySuggestions(country: string) {
  if (country === 'no') return { name: 'Taco fredag toppings', quantity: '1 set' };
  if (country === 'is') return { name: 'Kleinur for guests', quantity: '1 box' };
  return { name: 'Friday tacos', quantity: '1 kit' };
}

function sseFrame(event: SharedListEvent, id: string) {
  return encoder.encode(`id: ${id}\ndata: ${JSON.stringify(event)}\n\n`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim() || 'demo-household';
  const country = url.searchParams.get('country')?.trim().toLocaleLowerCase('en-US') || 'se';
  const suggestion = countrySuggestions(country);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: SharedListEvent, id: string) => controller.enqueue(sseFrame(event, id));
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`));
      }, 15_000);
      const timers = [
        setTimeout(() => send({ actor: 'partner', type: 'presence', message: 'Partner is viewing the shared household list.' }, `${token}-presence-partner`), 400),
        setTimeout(() => send({
          actor: 'kid',
          item: {
            addedBy: 'kid',
            checked: false,
            detail: 'Requested from the kids device via SSE',
            id: `${token}-kids-suggestion`,
            name: suggestion.name,
            quantity: suggestion.quantity,
            updatedAt: new Date().toISOString()
          },
          type: 'item:add'
        }, `${token}-kids-suggestion`), 1_200)
      ];

      const cleanup = () => {
        clearInterval(heartbeat);
        for (const timer of timers) clearTimeout(timer);
        try {
          controller.close();
        } catch {
          // The browser may already have closed the SSE connection.
        }
      };

      request.signal.addEventListener('abort', cleanup, { once: true });
    }
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    }
  });
}
