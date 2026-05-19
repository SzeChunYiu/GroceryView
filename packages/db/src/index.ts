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

export type CommunityReporterTrustRecord = {
  reporterId: string;
  reportsLast24Hours: number;
  pendingReports: number;
  acceptedReportsLast30Days: number;
  rejectedReportsLast30Days: number;
  updatedAt: string;
};

export type NotificationTaskRecord = {
  id: string;
  channel: 'push' | 'email';
  type: string;
  title: string;
  body: string;
  priority: 'normal' | 'high';
  sendAt: string;
  recipient: string;
  attemptCount: number;
  maxAttempts: number;
  status: 'queued' | 'delivered' | 'dead_lettered' | 'suppressed';
};

export type NotificationTaskAcknowledgement =
  | {
      taskId: string;
      status: 'delivered';
      providerMessageId: string;
    }
  | {
      taskId: string;
      status: 'not_due';
    }
  | {
      taskId: string;
      status: 'retry_scheduled';
      attemptCount: number;
      nextAttemptAt: string;
      reason: string;
    }
  | {
      taskId: string;
      status: 'dead_lettered';
      attemptCount: number;
      reason: string;
    }
  | {
      taskId: string;
      status: 'suppressed';
      reason: 'unsubscribed' | 'bounce' | 'complaint';
    };

export type NotificationSuppressionRecord = {
  id: string;
  recipient: string;
  channel?: 'push' | 'email';
  reason: 'unsubscribed' | 'bounce' | 'complaint';
  active: boolean;
  updatedAt: string;
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
  upsertCommunityReporterTrust(trust: CommunityReporterTrustRecord): Promise<void>;
  getCommunityReporterTrust(reporterId: string): Promise<CommunityReporterTrustRecord | null>;
  upsertNotificationTask(task: NotificationTaskRecord): Promise<void>;
  listDueNotificationTasks(now: string): Promise<NotificationTaskRecord[]>;
  upsertNotificationSuppression(suppression: NotificationSuppressionRecord): Promise<void>;
  listActiveNotificationSuppressions(): Promise<NotificationSuppressionRecord[]>;
  saveHumanReviewAssignment(assignment: HumanReviewAssignmentRecord): Promise<void>;
  listOpenHumanReviewAssignments(): Promise<HumanReviewAssignmentRecord[]>;
};

export function applyNotificationTaskAcknowledgements(input: {
  tasks: NotificationTaskRecord[];
  acknowledgements: NotificationTaskAcknowledgement[];
}): NotificationTaskRecord[] {
  const tasksById = new Map(input.tasks.map((task) => [task.id, task]));
  const updates: NotificationTaskRecord[] = [];

  for (const acknowledgement of input.acknowledgements) {
    const task = tasksById.get(acknowledgement.taskId);
    if (!task) throw new Error(`Unknown notification task acknowledgement: ${acknowledgement.taskId}`);

    if (acknowledgement.status === 'not_due') continue;

    if (acknowledgement.status === 'delivered') {
      updates.push({ ...task, status: 'delivered' });
      continue;
    }

    if (acknowledgement.status === 'retry_scheduled') {
      updates.push({
        ...task,
        status: 'queued',
        attemptCount: acknowledgement.attemptCount,
        sendAt: acknowledgement.nextAttemptAt
      });
      continue;
    }

    if (acknowledgement.status === 'dead_lettered') {
      updates.push({ ...task, status: 'dead_lettered', attemptCount: acknowledgement.attemptCount });
      continue;
    }

    updates.push({ ...task, status: 'suppressed' });
  }

  return updates;
}

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
  const communityReporterTrust = new Map<string, CommunityReporterTrustRecord>();
  const notificationTasks = new Map<string, NotificationTaskRecord>();
  const notificationSuppressions = new Map<string, NotificationSuppressionRecord>();
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
    },

    async upsertCommunityReporterTrust(trust) {
      communityReporterTrust.set(trust.reporterId, { ...trust });
    },

    async getCommunityReporterTrust(reporterId) {
      const trust = communityReporterTrust.get(reporterId);
      return trust ? { ...trust } : null;
    },

    async upsertNotificationTask(task) {
      notificationTasks.set(task.id, { ...task });
    },

    async listDueNotificationTasks(now) {
      return [...notificationTasks.values()]
        .filter((task) => task.status === 'queued' && task.sendAt <= now)
        .sort((a, b) => a.sendAt.localeCompare(b.sendAt) || a.id.localeCompare(b.id))
        .map((task) => ({ ...task }));
    },

    async upsertNotificationSuppression(suppression) {
      notificationSuppressions.set(suppression.id, { ...suppression });
    },

    async listActiveNotificationSuppressions() {
      return [...notificationSuppressions.values()]
        .filter((suppression) => suppression.active)
        .sort((a, b) => a.recipient.localeCompare(b.recipient) || (a.channel ?? '').localeCompare(b.channel ?? '') || a.id.localeCompare(b.id))
        .map((suppression) => ({ ...suppression }));
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
type NotificationTaskRow = {
  id: string;
  channel: NotificationTaskRecord['channel'];
  type: string;
  title: string;
  body: string;
  priority: NotificationTaskRecord['priority'];
  send_at: string | Date;
  recipient: string;
  attempt_count: string | number;
  max_attempts: string | number;
  status: NotificationTaskRecord['status'];
};
type NotificationSuppressionRow = {
  id: string;
  recipient: string;
  channel: NotificationSuppressionRecord['channel'] | null;
  reason: NotificationSuppressionRecord['reason'];
  active: boolean;
  updated_at: string | Date;
};
type CommunityReporterTrustRow = {
  reporter_id: string;
  reports_last_24_hours: string | number;
  pending_reports: string | number;
  accepted_reports_last_30_days: string | number;
  rejected_reports_last_30_days: string | number;
  updated_at: string | Date;
};
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

function mapCommunityReporterTrust(row: CommunityReporterTrustRow): CommunityReporterTrustRecord {
  return {
    reporterId: row.reporter_id,
    reportsLast24Hours: Number(row.reports_last_24_hours),
    pendingReports: Number(row.pending_reports),
    acceptedReportsLast30Days: Number(row.accepted_reports_last_30_days),
    rejectedReportsLast30Days: Number(row.rejected_reports_last_30_days),
    updatedAt: asIso(row.updated_at)
  };
}

function mapNotificationTask(row: NotificationTaskRow): NotificationTaskRecord {
  return {
    id: row.id,
    channel: row.channel,
    type: row.type,
    title: row.title,
    body: row.body,
    priority: row.priority,
    sendAt: asIso(row.send_at),
    recipient: row.recipient,
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    status: row.status
  };
}

function mapNotificationSuppression(row: NotificationSuppressionRow): NotificationSuppressionRecord {
  return {
    id: row.id,
    recipient: row.recipient,
    ...(row.channel ? { channel: row.channel } : {}),
    reason: row.reason,
    active: row.active,
    updatedAt: asIso(row.updated_at)
  };
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
         on conflict (user_id, week_start) do update set user_id = excluded.user_id
         returning id`,
        [userId]
      );
      const basketId = basketRows[0]?.id;
      if (basketId === undefined) throw new Error(`Weekly basket was not returned for user: ${userId}`);
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
    },

    async upsertCommunityReporterTrust(trust) {
      await executor.query(
        `insert into community_reporter_trust(
           reporter_id,
           reports_last_24_hours,
           pending_reports,
           accepted_reports_last_30_days,
           rejected_reports_last_30_days,
           updated_at
         ) values ($1, $2, $3, $4, $5, $6)
         on conflict (reporter_id) do update set
           reports_last_24_hours = excluded.reports_last_24_hours,
           pending_reports = excluded.pending_reports,
           accepted_reports_last_30_days = excluded.accepted_reports_last_30_days,
           rejected_reports_last_30_days = excluded.rejected_reports_last_30_days,
           updated_at = excluded.updated_at`,
        [
          trust.reporterId,
          trust.reportsLast24Hours,
          trust.pendingReports,
          trust.acceptedReportsLast30Days,
          trust.rejectedReportsLast30Days,
          trust.updatedAt
        ]
      );
    },

    async getCommunityReporterTrust(reporterId) {
      const rows = await executor.query<CommunityReporterTrustRow>(
        `select reporter_id,
                reports_last_24_hours,
                pending_reports,
                accepted_reports_last_30_days,
                rejected_reports_last_30_days,
                updated_at
         from community_reporter_trust
         where reporter_id = $1`,
        [reporterId]
      );
      const row = rows[0];
      return row ? mapCommunityReporterTrust(row) : null;
    },

    async upsertNotificationTask(task) {
      await executor.query(
        `insert into notification_tasks(
           id, channel, type, title, body, priority, send_at, recipient, attempt_count, max_attempts, status
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (id) do update set
           channel = excluded.channel,
           type = excluded.type,
           title = excluded.title,
           body = excluded.body,
           priority = excluded.priority,
           send_at = excluded.send_at,
           recipient = excluded.recipient,
           attempt_count = excluded.attempt_count,
           max_attempts = excluded.max_attempts,
           status = excluded.status,
           updated_at = now()`,
        [
          task.id,
          task.channel,
          task.type,
          task.title,
          task.body,
          task.priority,
          task.sendAt,
          task.recipient,
          task.attemptCount,
          task.maxAttempts,
          task.status
        ]
      );
    },

    async listDueNotificationTasks(now) {
      const rows = await executor.query<NotificationTaskRow>(
        `select id, channel, type, title, body, priority, send_at, recipient, attempt_count, max_attempts, status
         from notification_tasks
         where status = 'queued' and send_at <= $1
         order by send_at, id`,
        [now]
      );
      return rows.map(mapNotificationTask);
    },

    async upsertNotificationSuppression(suppression) {
      await executor.query(
        `insert into notification_suppressions(id, recipient, channel, reason, active, updated_at)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (id) do update set
           recipient = excluded.recipient,
           channel = excluded.channel,
           reason = excluded.reason,
           active = excluded.active,
           updated_at = excluded.updated_at`,
        [
          suppression.id,
          suppression.recipient,
          suppression.channel ?? null,
          suppression.reason,
          suppression.active,
          suppression.updatedAt
        ]
      );
    },

    async listActiveNotificationSuppressions() {
      const rows = await executor.query<NotificationSuppressionRow>(
        `select id, recipient, channel, reason, active, updated_at
         from notification_suppressions
         where active = true
         order by recipient, coalesce(channel, ''), id`
      );
      return rows.map(mapNotificationSuppression);
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

export type PostgresIntegrationProbe = {
  requiredTables: string[];
  existingTables: string[];
  requiredMigrationVersions: string[];
  appliedMigrationVersions: string[];
  repositoryChecks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'not_run';
  }>;
};

export type PostgresIntegrationReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  summary: string;
};

export function buildPostgresIntegrationReadinessReport(input: PostgresIntegrationProbe): PostgresIntegrationReadinessReport {
  const existingTables = new Set(input.existingTables);
  const appliedMigrations = new Set(input.appliedMigrationVersions);
  const blockers: string[] = [];
  const evidence: string[] = [];

  for (const table of [...new Set(input.requiredTables)].sort()) {
    if (existingTables.has(table)) {
      evidence.push(`table:${table}`);
    } else {
      blockers.push(`missing_table:${table}`);
    }
  }

  for (const version of [...new Set(input.requiredMigrationVersions)].sort()) {
    if (appliedMigrations.has(version)) {
      evidence.push(`migration:${version}`);
    } else {
      blockers.push(`missing_migration:${version}`);
    }
  }

  for (const check of [...input.repositoryChecks].sort((a, b) => a.name.localeCompare(b.name))) {
    if (check.status === 'pass') {
      evidence.push(`repository_check:${check.name}`);
    } else {
      blockers.push(`repository_check_${check.status}:${check.name}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    summary: blockers.length === 0 ? 'PostgreSQL integration contract is ready.' : 'PostgreSQL integration contract is blocked.'
  };
}
