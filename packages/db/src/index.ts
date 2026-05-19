export type Migration = {
  version: string;
  sql: string;
};

export type SqlExecutor = {
  getAppliedMigrationVersions(): Promise<string[]>;
  execute(sql: string): Promise<void>;
  recordMigration(version: string): Promise<void>;
};

export function parseSqlStatements(sql: string): string[] {
  return sql
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function applyMigrations(executor: SqlExecutor, migrations: Migration[]): Promise<string[]> {
  const applied = new Set(await executor.getAppliedMigrationVersions());
  const pending = [...migrations].sort((a, b) => a.version.localeCompare(b.version)).filter((migration) => !applied.has(migration.version));

  for (const migration of pending) {
    for (const statement of parseSqlStatements(migration.sql)) {
      await executor.execute(statement);
    }
    await executor.recordMigration(migration.version);
  }

  return pending.map((migration) => migration.version);
}

export type UserRecord = {
  id: string;
  email?: string;
};

export type BudgetRecord = {
  weeklyBudget: number;
  monthlyBudget: number;
};

export type WatchlistRecord = {
  productId: string;
  targetPrice?: number;
  alertDealScoreAt?: number;
  favoriteStoresOnly: boolean;
};

export type BasketRecord = {
  productId: string;
  quantity: number;
};

export type GroceryViewRepository = {
  upsertUser(user: UserRecord): Promise<void>;
  addFavoriteStore(userId: string, storeId: string): Promise<void>;
  getFavoriteStoreIds(userId: string): Promise<string[]>;
  upsertBudget(userId: string, budget: BudgetRecord): Promise<void>;
  getBudget(userId: string): Promise<BudgetRecord | null>;
  addWatchlistItem(userId: string, item: WatchlistRecord): Promise<void>;
  getWatchlist(userId: string): Promise<WatchlistRecord[]>;
  addBasketItem(userId: string, item: BasketRecord): Promise<void>;
  getBasket(userId: string): Promise<BasketRecord[]>;
};

function requireUser(users: Map<string, UserRecord>, userId: string): void {
  if (!users.has(userId)) throw new Error(`User not found: ${userId}`);
}

export function createMemoryRepository(): GroceryViewRepository {
  const users = new Map<string, UserRecord>();
  const favoriteStores = new Map<string, Set<string>>();
  const budgets = new Map<string, BudgetRecord>();
  const watchlists = new Map<string, WatchlistRecord[]>();
  const baskets = new Map<string, BasketRecord[]>();

  return {
    async upsertUser(user) {
      users.set(user.id, { ...user });
    },

    async addFavoriteStore(userId, storeId) {
      requireUser(users, userId);
      const stores = favoriteStores.get(userId) ?? new Set<string>();
      stores.add(storeId);
      favoriteStores.set(userId, stores);
    },

    async getFavoriteStoreIds(userId) {
      requireUser(users, userId);
      return [...(favoriteStores.get(userId) ?? new Set<string>())].sort();
    },

    async upsertBudget(userId, budget) {
      requireUser(users, userId);
      budgets.set(userId, { ...budget });
    },

    async getBudget(userId) {
      requireUser(users, userId);
      const budget = budgets.get(userId);
      return budget ? { ...budget } : null;
    },

    async addWatchlistItem(userId, item) {
      requireUser(users, userId);
      watchlists.set(userId, [...(watchlists.get(userId) ?? []), { ...item }]);
    },

    async getWatchlist(userId) {
      requireUser(users, userId);
      return (watchlists.get(userId) ?? []).map((item) => ({ ...item }));
    },

    async addBasketItem(userId, item) {
      requireUser(users, userId);
      baskets.set(userId, [...(baskets.get(userId) ?? []), { ...item }]);
    },

    async getBasket(userId) {
      requireUser(users, userId);
      return (baskets.get(userId) ?? []).map((item) => ({ ...item }));
    }
  };
}
