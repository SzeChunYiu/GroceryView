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

export type HumanReviewerRecord = {
  id: string;
  role: 'viewer' | 'moderator' | 'lead';
  active: boolean;
};

export type HumanReviewAssignmentRecord = {
  id: string;
  reviewId: string;
  subjectType: 'product_match' | 'community_report';
  subjectId: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  assigneeId: string;
  assignedAt: string;
  dueAt: string;
  status: 'assigned' | 'in_progress' | 'completed';
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
  upsertHumanReviewer(reviewer: HumanReviewerRecord): Promise<void>;
  getHumanReviewer(reviewerId: string): Promise<HumanReviewerRecord | null>;
  saveHumanReviewAssignment(assignment: HumanReviewAssignmentRecord): Promise<void>;
  listOpenHumanReviewAssignments(): Promise<HumanReviewAssignmentRecord[]>;
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
  const humanReviewers = new Map<string, HumanReviewerRecord>();
  const humanReviewAssignments = new Map<string, HumanReviewAssignmentRecord>();

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
    },

    async saveHumanReviewAssignment(assignment) {
      humanReviewAssignments.set(assignment.id, { ...assignment });
    },

    async listOpenHumanReviewAssignments() {
      return [...humanReviewAssignments.values()]
        .filter((assignment) => assignment.status !== 'completed')
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id))
        .map((assignment) => ({ ...assignment }));
    },

    async upsertHumanReviewer(reviewer) {
      humanReviewers.set(reviewer.id, { ...reviewer });
    },

    async getHumanReviewer(reviewerId) {
      const reviewer = humanReviewers.get(reviewerId);
      return reviewer ? { ...reviewer } : null;
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
type HumanReviewerRow = { id: string; role: HumanReviewerRecord['role']; active: boolean };
type HumanReviewAssignmentRow = {
  id: string;
  review_id: string;
  subject_type: HumanReviewAssignmentRecord['subjectType'];
  subject_id: string;
  priority: HumanReviewAssignmentRecord['priority'];
  reason: string;
  assignee_id: string;
  assigned_at: string | Date;
  due_at: string | Date;
  status: HumanReviewAssignmentRecord['status'];
};

function asIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapHumanReviewAssignment(row: HumanReviewAssignmentRow): HumanReviewAssignmentRecord {
  return {
    id: row.id,
    reviewId: row.review_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    priority: row.priority,
    reason: row.reason,
    assigneeId: row.assignee_id,
    assignedAt: asIso(row.assigned_at),
    dueAt: asIso(row.due_at),
    status: row.status
  };
}

function mapHumanReviewer(row: HumanReviewerRow): HumanReviewerRecord {
  return { id: row.id, role: row.role, active: row.active };
}

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
    },

    async saveHumanReviewAssignment(assignment) {
      await executor.query(
        `insert into human_review_assignments(
           id, review_id, subject_type, subject_id, priority, reason, assignee_id, assigned_at, due_at, status
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do update set
           review_id = excluded.review_id,
           subject_type = excluded.subject_type,
           subject_id = excluded.subject_id,
           priority = excluded.priority,
           reason = excluded.reason,
           assignee_id = excluded.assignee_id,
           assigned_at = excluded.assigned_at,
           due_at = excluded.due_at,
           status = excluded.status,
           updated_at = now()`,
        [
          assignment.id,
          assignment.reviewId,
          assignment.subjectType,
          assignment.subjectId,
          assignment.priority,
          assignment.reason,
          assignment.assigneeId,
          assignment.assignedAt,
          assignment.dueAt,
          assignment.status
        ]
      );
    },

    async listOpenHumanReviewAssignments() {
      const rows = await executor.query<HumanReviewAssignmentRow>(
        `select id, review_id, subject_type, subject_id, priority, reason, assignee_id, assigned_at, due_at, status
         from human_review_assignments
         where status in ('assigned', 'in_progress')
         order by due_at, id`
      );
      return rows.map(mapHumanReviewAssignment);
    },

    async upsertHumanReviewer(reviewer) {
      await executor.query(
        `insert into human_reviewers(id, role, active)
         values ($1, $2, $3)
         on conflict (id) do update set
           role = excluded.role,
           active = excluded.active,
           updated_at = now()`,
        [reviewer.id, reviewer.role, reviewer.active]
      );
    },

    async getHumanReviewer(reviewerId) {
      const rows = await executor.query<HumanReviewerRow>('select id, role, active from human_reviewers where id = $1', [reviewerId]);
      const row = rows[0];
      return row ? mapHumanReviewer(row) : null;
    }
  };
}

export type PgLikeClient = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
};

export function createPgQueryExecutor(client: PgLikeClient): QueryExecutor {
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const result = await client.query(sql, params);
      return result.rows as T[];
    }
  };
}
