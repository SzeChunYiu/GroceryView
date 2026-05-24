import { PrismaClient, type Prisma } from '@prisma/client';

type AnalyticsBody = {
  event?: unknown;
  payload?: unknown;
  sessionId?: unknown;
};

type AnalyticsEventStore = {
  analyticsEvent: {
    create(args: {
      data: {
        event: string;
        payload: Prisma.InputJsonValue;
        sessionId: string;
      };
    }): Promise<unknown>;
  };
};

type RouteApp = {
  post(path: string, handler: (request: { body?: unknown }, response: unknown) => Promise<unknown>): void;
};

const prisma = new PrismaClient() as unknown as AnalyticsEventStore;

function normalizeAnalyticsBody(body: unknown) {
  const input = (body ?? {}) as AnalyticsBody;
  const event = typeof input.event === 'string' ? input.event.trim() : '';
  const sessionId = typeof input.sessionId === 'string' ? input.sessionId.trim() : '';

  if (!sessionId || !event) {
    return { error: 'sessionId and event are required.' } as const;
  }

  return {
    event,
    payload: (input.payload ?? {}) as Prisma.InputJsonValue,
    sessionId,
  } as const;
}

function send(response: unknown, status: number, payload: unknown) {
  const target = response as {
    code?: (status: number) => { send?: (payload: unknown) => unknown };
    json?: (payload: unknown) => unknown;
    send?: (payload: unknown) => unknown;
    status?: (status: number) => { json?: (payload: unknown) => unknown; send?: (payload: unknown) => unknown };
  };

  if (typeof target.code === 'function') {
    return target.code(status).send?.(payload);
  }

  if (typeof target.status === 'function') {
    const next = target.status(status);
    return next.json?.(payload) ?? next.send?.(payload);
  }

  return target.json?.(payload) ?? target.send?.(payload) ?? payload;
}

export async function recordAnalyticsEvent(body: unknown, store: AnalyticsEventStore = prisma) {
  const normalized = normalizeAnalyticsBody(body);

  if ('error' in normalized) {
    return normalized;
  }

  const event = await store.analyticsEvent.create({
    data: {
      event: normalized.event,
      payload: normalized.payload,
      sessionId: normalized.sessionId,
    },
  });

  return { event, ok: true };
}

export function registerAnalyticsRoutes(app: RouteApp, store: AnalyticsEventStore = prisma) {
  app.post('/analytics', async (request, response) => {
    const result = await recordAnalyticsEvent(request.body, store);

    if ('error' in result) {
      return send(response, 400, result);
    }

    return send(response, 201, result);
  });
}

export default registerAnalyticsRoutes;
