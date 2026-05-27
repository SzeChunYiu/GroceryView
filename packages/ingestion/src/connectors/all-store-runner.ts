export type AllStoreTaskRunnerControls = {
  storeConcurrency?: number;
  storeStartDelayMs?: number;
  storeRetryAttempts?: number;
  storeRetryBaseDelayMs?: number;
  failOnStoreFailure?: boolean;
};

export type AllStoreTaskFailure = {
  storeId: string;
  error: string;
};

export const ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS = [
  'lloyds-apotek-se-products',
  'kronans-apotek-se-products',
  'seven-eleven-se-convenience-products',
  'direkten-se-small-store-products',
  'halal-center-se-kosher-halal-products',
  'mathem-prenumeration-se-products'
] as const;

export type AllStoreRunnerChainwideCatalogConnector = typeof ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS[number];

function normalizeRunnerInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

async function waitForDelay(delayMs: number): Promise<void> {
  if (delayMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function formatAllStoreFailures(failures: readonly AllStoreTaskFailure[]): string {
  return failures.map((failure) => `${failure.storeId}:${failure.error}`).join('; ');
}

export async function runAllStoreTasks<TStore, TValue>(input: AllStoreTaskRunnerControls & {
  stores: readonly TStore[];
  storeId: (store: TStore) => string;
  task: (store: TStore) => Promise<readonly TValue[]>;
}): Promise<{ rows: TValue[]; failures: AllStoreTaskFailure[] }> {
  const concurrency = Math.max(1, normalizeRunnerInteger(input.storeConcurrency, 4));
  const startDelayMs = normalizeRunnerInteger(input.storeStartDelayMs, 0);
  const retryAttempts = normalizeRunnerInteger(input.storeRetryAttempts, 1);
  const retryBaseDelayMs = normalizeRunnerInteger(input.storeRetryBaseDelayMs, 250);
  const rowsByStore = new Array<readonly TValue[]>(input.stores.length);
  const failures: AllStoreTaskFailure[] = [];
  let nextStoreIndex = 0;
  let nextStoreStartAt = 0;
  let storeStartsScheduled = 0;

  async function waitForStartSlot(): Promise<void> {
    if (startDelayMs <= 0) return;
    const now = Date.now();
    const scheduledStartAt = storeStartsScheduled === 0 ? now : Math.max(now, nextStoreStartAt);
    storeStartsScheduled += 1;
    nextStoreStartAt = scheduledStartAt + startDelayMs;
    await waitForDelay(Math.max(0, scheduledStartAt - now));
  }

  async function runOne(store: TStore): Promise<readonly TValue[]> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
      try {
        return await input.task(store);
      } catch (error) {
        lastError = error;
        if (attempt >= retryAttempts) break;
        await waitForDelay(retryBaseDelayMs * (attempt + 1));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async function worker(): Promise<void> {
    while (nextStoreIndex < input.stores.length) {
      const storeIndex = nextStoreIndex;
      nextStoreIndex += 1;
      const store = input.stores[storeIndex];
      if (!store) continue;
      const storeId = input.storeId(store);
      try {
        await waitForStartSlot();
        rowsByStore[storeIndex] = await runOne(store);
      } catch (error) {
        failures.push({
          storeId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, input.stores.length)) }, () => worker()));
  if (input.failOnStoreFailure && failures.length > 0) {
    throw new Error(`All-store runner failed for ${failures.length} store(s): ${formatAllStoreFailures(failures)}`);
  }
  return {
    rows: rowsByStore.flatMap((row) => row ?? []),
    failures
  };
}
