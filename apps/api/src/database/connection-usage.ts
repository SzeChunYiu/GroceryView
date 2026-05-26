import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

export type DatabaseConnectionUsageContext = {
  requestId: string;
  method: string;
  path: string;
  checkoutCount: number;
  activeCheckoutCount: number;
  maxActiveCheckoutCount: number;
};

export type DatabaseConnectionUsageLogRecord = {
  event: 'database_connection_usage';
  service: string;
  method: string;
  path: string;
  requestId: string;
  checkoutCount: number;
  maxActiveCheckoutCount: number;
  leakedCheckoutCount: number;
  timestamp: string;
};

export type DatabaseConnectionUsageWriter = (record: DatabaseConnectionUsageLogRecord) => void;

export type DatabaseConnectionUsageMiddlewareConfig = {
  enabled: boolean;
  serviceName: string;
  writer?: DatabaseConnectionUsageWriter;
};

export type DatabaseConnectionLeakSnapshot = {
  checkoutCount: number;
  activeCheckoutCount: number;
  maxActiveCheckoutCount: number;
};

type RequestLike = {
  method?: string;
  originalUrl?: string;
  path?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  on(event: 'finish', listener: () => void): void;
};

type NextFunction = () => void;

const storage = new AsyncLocalStorage<DatabaseConnectionUsageContext>();

let globalSnapshot: DatabaseConnectionLeakSnapshot = {
  checkoutCount: 0,
  activeCheckoutCount: 0,
  maxActiveCheckoutCount: 0
};

function defaultWriter(record: DatabaseConnectionUsageLogRecord): void {
  console.info(JSON.stringify(record));
}

function requestHeader(request: RequestLike, name: string): string | undefined {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function requestPath(request: RequestLike): string {
  const path = request.path ?? request.originalUrl ?? request.url ?? '/';
  return path.split('?')[0] || '/';
}

function createContext(request: RequestLike): DatabaseConnectionUsageContext {
  return {
    requestId: requestHeader(request, 'x-request-id')?.trim() || randomUUID(),
    method: (request.method ?? 'GET').toUpperCase(),
    path: requestPath(request),
    checkoutCount: 0,
    activeCheckoutCount: 0,
    maxActiveCheckoutCount: 0
  };
}

export function createDatabaseConnectionUsageMiddleware(config: DatabaseConnectionUsageMiddlewareConfig) {
  const writer = config.writer ?? defaultWriter;

  return (request: RequestLike, response: ResponseLike, next: NextFunction): void => {
    if (!config.enabled) {
      next();
      return;
    }

    const context = createContext(request);
    response.on('finish', () => {
      const leakedCheckoutCount = context.activeCheckoutCount;
      writer({
        event: 'database_connection_usage',
        service: config.serviceName,
        method: context.method,
        path: context.path,
        requestId: context.requestId,
        checkoutCount: context.checkoutCount,
        maxActiveCheckoutCount: context.maxActiveCheckoutCount,
        leakedCheckoutCount,
        timestamp: new Date().toISOString()
      });
    });

    storage.run(context, next);
  };
}

export async function recordDatabaseCheckout<T>(operation: () => Promise<T>): Promise<T> {
  const context = storage.getStore();
  if (context) {
    context.checkoutCount += 1;
    context.activeCheckoutCount += 1;
    context.maxActiveCheckoutCount = Math.max(context.maxActiveCheckoutCount, context.activeCheckoutCount);
  }

  globalSnapshot.checkoutCount += 1;
  globalSnapshot.activeCheckoutCount += 1;
  globalSnapshot.maxActiveCheckoutCount = Math.max(globalSnapshot.maxActiveCheckoutCount, globalSnapshot.activeCheckoutCount);

  try {
    return await operation();
  } finally {
    if (context) context.activeCheckoutCount = Math.max(0, context.activeCheckoutCount - 1);
    globalSnapshot.activeCheckoutCount = Math.max(0, globalSnapshot.activeCheckoutCount - 1);
  }
}

export function resetDatabaseConnectionLeakSnapshot(): void {
  globalSnapshot = {
    checkoutCount: 0,
    activeCheckoutCount: 0,
    maxActiveCheckoutCount: 0
  };
}

export function getDatabaseConnectionLeakSnapshot(): DatabaseConnectionLeakSnapshot {
  return { ...globalSnapshot };
}

export function assertNoDatabaseConnectionLeaks(options: { maxCheckoutCount?: number } = {}): DatabaseConnectionLeakSnapshot {
  const snapshot = getDatabaseConnectionLeakSnapshot();
  if (snapshot.activeCheckoutCount > 0) {
    throw new Error(`Postgres client leak detected: ${snapshot.activeCheckoutCount} checkout(s) still active.`);
  }
  if (options.maxCheckoutCount !== undefined && snapshot.checkoutCount > options.maxCheckoutCount) {
    throw new Error(`Postgres checkout count ${snapshot.checkoutCount} exceeded expected maximum ${options.maxCheckoutCount}.`);
  }
  return snapshot;
}
