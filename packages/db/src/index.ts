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

export type QueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

type FavoriteStoreRow = { store_id: string };
type BudgetRow = { weekly_budget: string | number; monthly_budget: string | number };
type WatchlistRow = { product_id: string; target_price: string | number | null; alert_deal_score_at: number | null; favorite_stores_only: boolean };
type BasketRow = { product_id: string; quantity: string | number };

export function createPostgresRepository(executor: QueryExecutor): GroceryViewRepository {
  return {
    async upsertUser(user) {
      await executor.query(
        'insert into app_users(id, email) values ($1, $2) on conflict (id) do update set email = excluded.email',
        [user.id, user.email ?? null]
      );
    },

    async addFavoriteStore(userId, storeId) {
      await executor.query(
        'insert into favorite_stores(user_id, store_id) values ($1, $2) on conflict (user_id, store_id) do nothing',
        [userId, storeId]
      );
    },

    async getFavoriteStoreIds(userId) {
      const rows = await executor.query<FavoriteStoreRow>('select store_id from favorite_stores where user_id = $1 order by store_id', [userId]);
      return rows.map((row) => row.store_id);
    },

    async upsertBudget(userId, budget) {
      await executor.query(
        `insert into user_preferences(user_id, weekly_budget, monthly_budget) values ($1, $2, $3)
         on conflict (user_id) do update set weekly_budget = excluded.weekly_budget, monthly_budget = excluded.monthly_budget`,
        [userId, budget.weeklyBudget, budget.monthlyBudget]
      );
    },

    async getBudget(userId) {
      const rows = await executor.query<BudgetRow>('select weekly_budget, monthly_budget from user_preferences where user_id = $1', [userId]);
      const row = rows[0];
      return row ? { weeklyBudget: Number(row.weekly_budget), monthlyBudget: Number(row.monthly_budget) } : null;
    },

    async addWatchlistItem(userId, item) {
      await executor.query(
        `insert into watchlist_items(user_id, product_id, target_price, alert_deal_score_at, favorite_stores_only)
         values ($1, $2, $3, $4, $5)`,
        [userId, item.productId, item.targetPrice ?? null, item.alertDealScoreAt ?? null, item.favoriteStoresOnly]
      );
    },

    async getWatchlist(userId) {
      const rows = await executor.query<WatchlistRow>(
        'select product_id, target_price, alert_deal_score_at, favorite_stores_only from watchlist_items where user_id = $1 order by id',
        [userId]
      );
      return rows.map((row) => ({
        productId: row.product_id,
        targetPrice: row.target_price === null ? undefined : Number(row.target_price),
        alertDealScoreAt: row.alert_deal_score_at ?? undefined,
        favoriteStoresOnly: row.favorite_stores_only
      }));
    },

    async addBasketItem(userId, item) {
      const basketRows = await executor.query<{ id: string | number }>(
        `insert into weekly_baskets(user_id, week_start)
         values ($1, date_trunc('week', current_date)::date)
         on conflict do nothing
         returning id`,
        [userId]
      );
      const basketId = basketRows[0]?.id ?? 0;
      await executor.query('insert into basket_items(basket_id, product_id, quantity) values ($1, $2, $3)', [basketId, item.productId, item.quantity]);
    },

    async getBasket(userId) {
      const rows = await executor.query<BasketRow>(
        `select bi.product_id, bi.quantity
         from basket_items bi
         join weekly_baskets wb on wb.id = bi.basket_id
         where wb.user_id = $1
         order by bi.id`,
        [userId]
      );
      return rows.map((row) => ({ productId: row.product_id, quantity: Number(row.quantity) }));
    }
  };
}
