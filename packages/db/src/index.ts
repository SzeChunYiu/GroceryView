export type Migration = {
  version: string;
  sql: string;
};

export type SqlMigrationFile = {
  path: string;
  sql: string;
};

export type SqlExecutor = {
  getAppliedMigrationVersions(): Promise<string[]>;
  execute(sql: string): Promise<void>;
  recordMigration(version: string): Promise<void>;
};

export const SCHEMA_MIGRATIONS_TABLE_SQL = `create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
)`;

export function migrationVersionFromPath(path: string): string {
  const filename = path.split(/[\\/]/).filter(Boolean).at(-1);
  if (!filename || !filename.endsWith('.sql')) throw new Error(`Migration path must end in .sql: ${path}`);
  return filename.slice(0, -'.sql'.length);
}

export function createMigrationPlan(files: SqlMigrationFile[]): Migration[] {
  const migrations = files
    .filter((file) => file.path.endsWith('.sql'))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file) => ({
      version: migrationVersionFromPath(file.path),
      sql: file.sql
    }));

  const seenVersions = new Set<string>();
  for (const migration of migrations) {
    if (seenVersions.has(migration.version)) throw new Error(`Duplicate migration version: ${migration.version}`);
    seenVersions.add(migration.version);
  }

  return migrations;
}

export function parseSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let statement = '';
  let index = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  let dollarQuoteTag: string | null = null;

  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (!singleQuoted && !doubleQuoted && !dollarQuoteTag && char === '-' && next === '-') {
      index += 2;
      while (index < sql.length && sql[index] !== '\n') index += 1;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && !dollarQuoteTag && char === '/' && next === '*') {
      index += 2;
      while (index < sql.length && !(sql[index] === '*' && sql[index + 1] === '/')) index += 1;
      index += index < sql.length ? 2 : 0;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && char === '$') {
      const tag = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
      if (tag) {
        if (!dollarQuoteTag) {
          dollarQuoteTag = tag;
        } else if (dollarQuoteTag === tag) {
          dollarQuoteTag = null;
        }
        statement += tag;
        index += tag.length;
        continue;
      }
    }

    if (!doubleQuoted && !dollarQuoteTag && char === "'") {
      statement += char;
      if (singleQuoted && next === "'") {
        statement += next;
        index += 2;
        continue;
      }
      singleQuoted = !singleQuoted;
      index += 1;
      continue;
    }

    if (!singleQuoted && !dollarQuoteTag && char === '"') {
      statement += char;
      if (doubleQuoted && next === '"') {
        statement += next;
        index += 2;
        continue;
      }
      doubleQuoted = !doubleQuoted;
      index += 1;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && !dollarQuoteTag && char === ';') {
      const trimmed = statement.trim();
      if (trimmed) statements.push(trimmed);
      statement = '';
      index += 1;
      continue;
    }

    statement += char;
    index += 1;
  }

  const trimmed = statement.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
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

export function createPostgresMigrationExecutor(executor: QueryExecutor): SqlExecutor {
  async function ensureSchemaMigrationsTable(): Promise<void> {
    await executor.query(SCHEMA_MIGRATIONS_TABLE_SQL);
  }

  return {
    async getAppliedMigrationVersions() {
      await ensureSchemaMigrationsTable();
      const rows = await executor.query<MigrationVersionRow>('select version from schema_migrations order by version');
      return rows.map((row) => row.version);
    },

    async execute(sql) {
      await executor.query(sql);
    },

    async recordMigration(version) {
      await ensureSchemaMigrationsTable();
      await executor.query('insert into schema_migrations(version) values ($1) on conflict (version) do nothing', [version]);
    }
  };
}

export type UserRecord = {
  id: string;
  email?: string;
};

export type BudgetRecord = {
  weeklyBudget: number;
  monthlyBudget: number;
};

export type SubscriptionEntitlementRecord = {
  userId: string;
  tier: 'free' | 'premium';
  plan?: 'premium_monthly' | 'premium_yearly';
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEndsAt?: string;
  provider?: 'stripe_compatible';
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  updatedAt: string;
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

export type PriceType = 'shelf' | 'online' | 'member' | 'promotion' | 'receipt' | 'community' | 'estimated';

export type ProductCatalogRecord = {
  productId: string;
  slug: string;
  canonicalName: string;
  brand?: string;
  brandOwner?: string;
  privateLabelOwner?: string;
  barcode?: string;
  categoryPath: string[];
  packageSize?: number;
  packageUnit?: string;
  comparableUnit: string;
  nutrition: Record<string, unknown>;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductCatalogListFilter = {
  search?: string;
  categoryPath?: string[];
  limit?: number;
};

export type PostgresCatalogReader = {
  getProductBySlug(slug: string): Promise<ProductCatalogRecord | null>;
  listProducts(filter?: ProductCatalogListFilter): Promise<ProductCatalogRecord[]>;
};

export type PriceObservationRecord = {
  productId: string;
  chainId: string;
  storeId?: string;
  sourceRunId?: string;
  rawRecordId?: string;
  retailerProductRef?: string;
  priceType: PriceType;
  price: number;
  regularPrice?: number;
  unitPrice: number;
  currency?: string;
  quantity?: number;
  quantityUnit?: string;
  promotionText?: string;
  promotionStartsOn?: string;
  promotionEndsOn?: string;
  memberRequired?: boolean;
  observedAt: string;
  validFrom?: string;
  validUntil?: string;
  confidence: number;
  provenance: Record<string, unknown>;
};

export type PriceObservationWriteResult = {
  observationId: string;
};

export type PostgresPriceObservationWriter = {
  recordPriceObservation(observation: PriceObservationRecord): Promise<PriceObservationWriteResult>;
};

export type PriceObservationHistoryRecord = PriceObservationRecord & {
  observationId: string;
  currency: string;
  memberRequired: boolean;
};

export type PriceObservationHistoryFilter = {
  productId: string;
  chainId?: string;
  storeId?: string;
  priceType?: PriceType;
  observedFrom?: string;
  observedTo?: string;
  limit?: number;
};

export type LatestPriceRecord = {
  productId: string;
  chainId: string;
  storeId?: string;
  priceType: PriceType;
  observationId: string;
  price: number;
  regularPrice?: number;
  unitPrice: number;
  currency: string;
  observedAt: string;
  confidence: number;
  provenance: Record<string, unknown>;
};

export type PostgresPriceReader = {
  listLatestPricesForProduct(productId: string): Promise<LatestPriceRecord[]>;
  listPriceObservationHistory(filter: PriceObservationHistoryFilter): Promise<PriceObservationHistoryRecord[]>;
};

export type SourceRunRecord = {
  sourceType: 'retailer_api' | 'retailer_page' | 'weekly_leaflet' | 'receipt_ocr' | 'community_report' | 'manual_seed';
  sourceName: string;
  sourceUrl?: string;
  startedAt?: string;
  finishedAt?: string;
  status: 'running' | 'succeeded' | 'failed' | 'partial';
  provenance: Record<string, unknown>;
  errorMessage?: string;
};

export type RawRecordRecord = {
  sourceRunId: string;
  recordType: 'product' | 'store' | 'price' | 'promotion' | 'receipt' | 'community_report';
  externalRef?: string;
  observedAt?: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  provenance: Record<string, unknown>;
};

export type RawRecordReadRecord = RawRecordRecord & {
  rawRecordId: string;
  createdAt: string;
};

export type SourceRunReadRecord = SourceRunRecord & {
  sourceRunId: string;
  startedAt: string;
};

export type SourceRunListFilter = {
  status?: SourceRunRecord['status'];
  sourceType?: SourceRunRecord['sourceType'];
  limit?: number;
};

export type FinishSourceRunRecord = {
  sourceRunId: string;
  finishedAt?: string;
  status: 'succeeded' | 'failed' | 'partial';
  errorMessage?: string;
};

export type SourceRunWriteResult = {
  sourceRunId: string;
};

export type RawRecordWriteResult = {
  rawRecordId: string;
};

export type PostgresSourceRecordWriter = {
  createSourceRun(sourceRun: SourceRunRecord): Promise<SourceRunWriteResult>;
  finishSourceRun(sourceRun: FinishSourceRunRecord): Promise<SourceRunWriteResult>;
  upsertRawRecord(rawRecord: RawRecordRecord): Promise<RawRecordWriteResult>;
};

export type PostgresSourceRecordReader = {
  listSourceRuns(filter?: SourceRunListFilter): Promise<SourceRunReadRecord[]>;
  getRawRecordByHash(sourceRunId: string, payloadHash: string): Promise<RawRecordReadRecord | null>;
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
  upsertSubscriptionEntitlement(entitlement: SubscriptionEntitlementRecord): Promise<void>;
  getSubscriptionEntitlement(userId: string): Promise<SubscriptionEntitlementRecord | null>;
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
  const subscriptionEntitlements = new Map<string, SubscriptionEntitlementRecord>();
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

    async upsertSubscriptionEntitlement(entitlement) {
      requireUser(users, entitlement.userId);
      subscriptionEntitlements.set(entitlement.userId, { ...entitlement });
    },

    async getSubscriptionEntitlement(userId) {
      requireUser(users, userId);
      const entitlement = subscriptionEntitlements.get(userId);
      return entitlement ? { ...entitlement } : null;
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
type SubscriptionEntitlementRow = {
  user_id: string;
  tier: SubscriptionEntitlementRecord['tier'];
  plan: NonNullable<SubscriptionEntitlementRecord['plan']> | null;
  status: SubscriptionEntitlementRecord['status'];
  current_period_ends_at: string | Date | null;
  provider: NonNullable<SubscriptionEntitlementRecord['provider']> | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  updated_at: string | Date;
};
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
type LatestPriceRow = {
  product_id: string;
  chain_id: string;
  store_id: string | null;
  price_type: PriceType;
  observation_id: string;
  price: string | number;
  regular_price: string | number | null;
  unit_price: string | number;
  currency: string;
  observed_at: string | Date;
  confidence: string | number;
  provenance: Record<string, unknown> | string | null;
};
type PriceObservationHistoryRow = {
  id: string;
  product_id: string;
  chain_id: string;
  store_id: string | null;
  source_run_id: string | null;
  raw_record_id: string | null;
  retailer_product_ref: string | null;
  price_type: PriceType;
  price: string | number;
  regular_price: string | number | null;
  unit_price: string | number;
  currency: string;
  quantity: string | number | null;
  quantity_unit: string | null;
  promotion_text: string | null;
  promotion_starts_on: string | Date | null;
  promotion_ends_on: string | Date | null;
  member_required: boolean;
  observed_at: string | Date;
  valid_from: string | Date | null;
  valid_until: string | Date | null;
  confidence: string | number;
  provenance: Record<string, unknown> | string | null;
};
type RawRecordRow = {
  id: string;
  source_run_id: string;
  record_type: RawRecordRecord['recordType'];
  external_ref: string | null;
  observed_at: string | Date | null;
  payload: Record<string, unknown> | string;
  payload_hash: string;
  provenance: Record<string, unknown> | string | null;
  created_at: string | Date;
};
type SourceRunRow = {
  id: string;
  source_type: SourceRunRecord['sourceType'];
  source_name: string;
  source_url: string | null;
  started_at: string | Date;
  finished_at: string | Date | null;
  status: SourceRunRecord['status'];
  provenance: Record<string, unknown> | string | null;
  error_message: string | null;
};
type ProductCatalogRow = {
  id: string;
  slug: string;
  canonical_name: string;
  brand: string | null;
  brand_owner: string | null;
  private_label_owner: string | null;
  barcode: string | null;
  category_path: string[];
  package_size: string | number | null;
  package_unit: string | null;
  comparable_unit: string;
  nutrition: Record<string, unknown> | string | null;
  image_url: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function asIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function asRecord(value: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') return JSON.parse(value) as Record<string, unknown>;
  return value;
}

function mapLatestPrice(row: LatestPriceRow): LatestPriceRecord {
  return {
    productId: row.product_id,
    chainId: row.chain_id,
    ...(row.store_id ? { storeId: row.store_id } : {}),
    priceType: row.price_type,
    observationId: row.observation_id,
    price: Number(row.price),
    ...(row.regular_price === null ? {} : { regularPrice: Number(row.regular_price) }),
    unitPrice: Number(row.unit_price),
    currency: row.currency,
    observedAt: asIso(row.observed_at),
    confidence: Number(row.confidence),
    provenance: asRecord(row.provenance)
  };
}

function optionalIso(value: string | Date | null): string | undefined {
  return value === null ? undefined : asIso(value);
}

function mapPriceObservationHistory(row: PriceObservationHistoryRow): PriceObservationHistoryRecord {
  return {
    observationId: row.id,
    productId: row.product_id,
    chainId: row.chain_id,
    ...(row.store_id ? { storeId: row.store_id } : {}),
    ...(row.source_run_id ? { sourceRunId: row.source_run_id } : {}),
    ...(row.raw_record_id ? { rawRecordId: row.raw_record_id } : {}),
    ...(row.retailer_product_ref ? { retailerProductRef: row.retailer_product_ref } : {}),
    priceType: row.price_type,
    price: Number(row.price),
    ...(row.regular_price === null ? {} : { regularPrice: Number(row.regular_price) }),
    unitPrice: Number(row.unit_price),
    currency: row.currency,
    ...(row.quantity === null ? {} : { quantity: Number(row.quantity) }),
    ...(row.quantity_unit ? { quantityUnit: row.quantity_unit } : {}),
    ...(row.promotion_text ? { promotionText: row.promotion_text } : {}),
    ...(optionalIso(row.promotion_starts_on) ? { promotionStartsOn: optionalIso(row.promotion_starts_on) } : {}),
    ...(optionalIso(row.promotion_ends_on) ? { promotionEndsOn: optionalIso(row.promotion_ends_on) } : {}),
    memberRequired: row.member_required,
    observedAt: asIso(row.observed_at),
    ...(optionalIso(row.valid_from) ? { validFrom: optionalIso(row.valid_from) } : {}),
    ...(optionalIso(row.valid_until) ? { validUntil: optionalIso(row.valid_until) } : {}),
    confidence: Number(row.confidence),
    provenance: asRecord(row.provenance)
  };
}

function mapRawRecord(row: RawRecordRow): RawRecordReadRecord {
  return {
    rawRecordId: row.id,
    sourceRunId: row.source_run_id,
    recordType: row.record_type,
    ...(row.external_ref ? { externalRef: row.external_ref } : {}),
    ...(row.observed_at ? { observedAt: asIso(row.observed_at) } : {}),
    payload: asRecord(row.payload),
    payloadHash: row.payload_hash,
    provenance: asRecord(row.provenance),
    createdAt: asIso(row.created_at)
  };
}

function mapSourceRun(row: SourceRunRow): SourceRunReadRecord {
  return {
    sourceRunId: row.id,
    sourceType: row.source_type,
    sourceName: row.source_name,
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    startedAt: asIso(row.started_at),
    ...(row.finished_at ? { finishedAt: asIso(row.finished_at) } : {}),
    status: row.status,
    provenance: asRecord(row.provenance),
    ...(row.error_message ? { errorMessage: row.error_message } : {})
  };
}

function mapProductCatalog(row: ProductCatalogRow): ProductCatalogRecord {
  return {
    productId: row.id,
    slug: row.slug,
    canonicalName: row.canonical_name,
    ...(row.brand ? { brand: row.brand } : {}),
    ...(row.brand_owner ? { brandOwner: row.brand_owner } : {}),
    ...(row.private_label_owner ? { privateLabelOwner: row.private_label_owner } : {}),
    ...(row.barcode ? { barcode: row.barcode } : {}),
    categoryPath: [...row.category_path],
    ...(row.package_size === null ? {} : { packageSize: Number(row.package_size) }),
    ...(row.package_unit ? { packageUnit: row.package_unit } : {}),
    comparableUnit: row.comparable_unit,
    nutrition: asRecord(row.nutrition),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

function mapSubscriptionEntitlement(row: SubscriptionEntitlementRow): SubscriptionEntitlementRecord {
  return {
    userId: row.user_id,
    tier: row.tier,
    ...(row.plan ? { plan: row.plan } : {}),
    status: row.status,
    ...(row.current_period_ends_at ? { currentPeriodEndsAt: asIso(row.current_period_ends_at) } : {}),
    ...(row.provider ? { provider: row.provider } : {}),
    ...(row.provider_customer_id ? { providerCustomerId: row.provider_customer_id } : {}),
    ...(row.provider_subscription_id ? { providerSubscriptionId: row.provider_subscription_id } : {}),
    updatedAt: asIso(row.updated_at)
  };
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

    async upsertSubscriptionEntitlement(entitlement) {
      await executor.query(
        `insert into subscription_entitlements(
           user_id,
           tier,
           plan,
           status,
           current_period_ends_at,
           provider,
           provider_customer_id,
           provider_subscription_id,
           updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (user_id) do update set
           tier = excluded.tier,
           plan = excluded.plan,
           status = excluded.status,
           current_period_ends_at = excluded.current_period_ends_at,
           provider = excluded.provider,
           provider_customer_id = excluded.provider_customer_id,
           provider_subscription_id = excluded.provider_subscription_id,
           updated_at = excluded.updated_at`,
        [
          entitlement.userId,
          entitlement.tier,
          entitlement.plan ?? null,
          entitlement.status,
          entitlement.currentPeriodEndsAt ?? null,
          entitlement.provider ?? null,
          entitlement.providerCustomerId ?? null,
          entitlement.providerSubscriptionId ?? null,
          entitlement.updatedAt
        ]
      );
    },

    async getSubscriptionEntitlement(userId) {
      const rows = await executor.query<SubscriptionEntitlementRow>(
        `select user_id,
                tier,
                plan,
                status,
                current_period_ends_at,
                provider,
                provider_customer_id,
                provider_subscription_id,
                updated_at
         from subscription_entitlements
         where user_id = $1`,
        [userId]
      );
      const row = rows[0];
      return row ? mapSubscriptionEntitlement(row) : null;
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

export function createPostgresCatalogReader(executor: QueryExecutor): PostgresCatalogReader {
  return {
    async getProductBySlug(slug) {
      const rows = await executor.query<ProductCatalogRow>(
        `select id,
                slug,
                canonical_name,
                brand,
                brand_owner,
                private_label_owner,
                barcode,
                category_path,
                package_size,
                package_unit,
                comparable_unit,
                nutrition,
                image_url,
                created_at,
                updated_at
         from products
         where slug = $1`,
        [slug]
      );
      const row = rows[0];
      return row ? mapProductCatalog(row) : null;
    },

    async listProducts(filter = {}) {
      const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
      const rows = await executor.query<ProductCatalogRow>(
        `select id,
                slug,
                canonical_name,
                brand,
                brand_owner,
                private_label_owner,
                barcode,
                category_path,
                package_size,
                package_unit,
                comparable_unit,
                nutrition,
                image_url,
                created_at,
                updated_at
         from products
         where ($1::text is null or canonical_name ilike '%' || $1 || '%' or slug ilike '%' || $1 || '%')
           and ($2::text[] is null or category_path @> $2::text[])
         order by canonical_name, slug
         limit $3`,
        [filter.search ?? null, filter.categoryPath ?? null, limit]
      );
      return rows.map(mapProductCatalog);
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

export type PostgresRepositoryProbe = {
  name: string;
  run(executor: QueryExecutor): Promise<void>;
};

export type BuildPostgresRepositorySmokeProbesInput = {
  runId: string;
  now: string;
};

export type CollectPostgresIntegrationProbeInput = {
  executor: QueryExecutor;
  requiredTables?: readonly string[];
  requiredMigrationVersions?: readonly string[];
  repositoryProbes: PostgresRepositoryProbe[];
};

export type CheckPostgresIntegrationReadinessInput = CollectPostgresIntegrationProbeInput;

export type CheckPostgresRepositoryIntegrationReadinessInput = Omit<CollectPostgresIntegrationProbeInput, 'repositoryProbes'> & {
  runId?: string;
  now?: string;
  repositoryProbes?: readonly PostgresRepositoryProbe[];
};

export const POSTGRES_INTEGRATION_REQUIRED_TABLES = [
  'chains',
  'products',
  'source_runs',
  'raw_records',
  'observations',
  'latest_prices',
  'app_users',
  'favorite_stores',
  'user_preferences',
  'watchlist_items',
  'weekly_baskets',
  'basket_items',
  'human_review_assignments',
  'human_reviewers',
  'community_reporter_trust',
  'subscription_entitlements',
  'notification_tasks',
  'notification_suppressions'
] as const;

export const POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS = [
  '001_groceryview_schema',
  '002_repository_support_schema',
  '003_subscription_entitlements'
] as const;

function assertProbe(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function buildPostgresRepositorySmokeProbes(input: BuildPostgresRepositorySmokeProbesInput): PostgresRepositoryProbe[] {
  const safeId = input.runId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const userId = `postgres-probe-user-${safeId}`;
  const assignmentId = `postgres-probe-assignment-${safeId}`;
  const suppressionId = `postgres-probe-suppression-${safeId}`;
  const providerSubscriptionId = `postgres-probe-subscription-${safeId}`;
  const chainSlug = `postgres-probe-chain-${safeId}`;
  const productSlug = `postgres-probe-product-${safeId}`;

  return [
    {
      name: 'user_budget_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.upsertBudget(userId, { weeklyBudget: 1000, monthlyBudget: 4000 });
        const budget = await repository.getBudget(userId);
        assertProbe(budget?.weeklyBudget === 1000 && budget.monthlyBudget === 4000, 'user budget round trip did not return the written values');
      }
    },
    {
      name: 'user_subscription_entitlement_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.upsertSubscriptionEntitlement({
          userId,
          tier: 'premium',
          plan: 'premium_monthly',
          status: 'active',
          currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
          provider: 'stripe_compatible',
          providerCustomerId: `postgres-probe-customer-${safeId}`,
          providerSubscriptionId,
          updatedAt: input.now
        });
        const entitlement = await repository.getSubscriptionEntitlement(userId);
        assertProbe(
          entitlement?.tier === 'premium' && entitlement.providerSubscriptionId === providerSubscriptionId,
          'subscription entitlement round trip did not return the written values'
        );
      }
    },
    {
      name: 'human_review_assignment_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.saveHumanReviewAssignment({
          id: assignmentId,
          reviewId: assignmentId,
          subjectType: 'product_match',
          subjectId: `postgres-probe-match-${safeId}`,
          priority: 'low',
          reason: 'PostgreSQL integration smoke probe.',
          assigneeId: `postgres-probe-reviewer-${safeId}`,
          assignedAt: input.now,
          dueAt: input.now,
          status: 'assigned'
        });
        const assignments = await repository.listOpenHumanReviewAssignments();
        assertProbe(assignments.some((assignment) => assignment.id === assignmentId), 'human review assignment probe row was not readable');
      }
    },
    {
      name: 'notification_suppression_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertNotificationSuppression({
          id: suppressionId,
          recipient: `${userId}@example.invalid`,
          channel: 'email',
          reason: 'unsubscribed',
          active: true,
          updatedAt: input.now
        });
        const suppressions = await repository.listActiveNotificationSuppressions();
        assertProbe(suppressions.some((suppression) => suppression.id === suppressionId), 'notification suppression probe row was not readable');
      }
    },
    {
      name: 'price_observation_pipeline_round_trip',
      async run(executor) {
        const chainRows = await executor.query<ProbeIdRow>(
          `insert into chains(slug, name, country_code)
           values ($1, $2, 'SE')
           on conflict (slug) do update set name = excluded.name, updated_at = now()
           returning id`,
          [chainSlug, `Postgres Probe Chain ${safeId}`]
        );
        const chainId = chainRows[0]?.id;
        assertProbe(Boolean(chainId), 'price observation probe chain id was not returned');

        const productRows = await executor.query<ProbeIdRow>(
          `insert into products(slug, canonical_name, comparable_unit)
           values ($1, $2, 'pcs')
           on conflict (slug) do update set canonical_name = excluded.canonical_name, updated_at = now()
           returning id`,
          [productSlug, `Postgres Probe Product ${safeId}`]
        );
        const productId = productRows[0]?.id;
        assertProbe(Boolean(productId), 'price observation probe product id was not returned');

        const sourceWriter = createPostgresSourceRecordWriter(executor);
        const priceWriter = createPostgresPriceObservationWriter(executor);
        const sourceRun = await sourceWriter.createSourceRun({
          sourceType: 'manual_seed',
          sourceName: 'Postgres integration probe',
          startedAt: input.now,
          finishedAt: input.now,
          status: 'succeeded',
          provenance: { runId: input.runId, probe: 'price_observation_pipeline_round_trip' }
        });
        const rawRecord = await sourceWriter.upsertRawRecord({
          sourceRunId: sourceRun.sourceRunId,
          recordType: 'price',
          observedAt: input.now,
          payload: { chainSlug, productSlug, price: 12.34 },
          payloadHash: `postgres-probe-price-${safeId}`,
          provenance: { runId: input.runId }
        });
        const observation = await priceWriter.recordPriceObservation({
          productId,
          chainId,
          sourceRunId: sourceRun.sourceRunId,
          rawRecordId: rawRecord.rawRecordId,
          retailerProductRef: `postgres-probe-ref-${safeId}`,
          priceType: 'online',
          price: 12.34,
          unitPrice: 12.34,
          observedAt: input.now,
          confidence: 0.99,
          provenance: { runId: input.runId, sourceRunId: sourceRun.sourceRunId, rawRecordId: rawRecord.rawRecordId }
        });
        const latestRows = await executor.query<LatestPriceProbeRow>(
          `select observation_id
           from latest_prices
           where product_id = $1 and chain_id = $2 and store_id is null and price_type = 'online'`,
          [productId, chainId]
        );
        assertProbe(
          latestRows.some((row) => row.observation_id === observation.observationId),
          'latest price probe row did not reference the written observation'
        );
      }
    }
  ];
}

export type PostgresIntegrationReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  summary: string;
};

type TableNameRow = { table_name: string };
type MigrationVersionRow = { version: string };
type ProbeIdRow = { id: string };
type LatestPriceProbeRow = { observation_id: string };
type ObservationIdRow = { id: string };
type SourceRunIdRow = { id: string };
type RawRecordIdRow = { id: string };

export function createPostgresSourceRecordWriter(executor: QueryExecutor): PostgresSourceRecordWriter {
  return {
    async createSourceRun(sourceRun) {
      const rows = await executor.query<SourceRunIdRow>(
        `insert into source_runs(
           source_type,
           source_name,
           source_url,
           started_at,
           finished_at,
           status,
           provenance,
           error_message
         ) values ($1, $2, $3, coalesce($4, now()), $5, $6, $7::jsonb, $8)
         returning id`,
        [
          sourceRun.sourceType,
          sourceRun.sourceName,
          sourceRun.sourceUrl ?? null,
          sourceRun.startedAt ?? null,
          sourceRun.finishedAt ?? null,
          sourceRun.status,
          JSON.stringify(sourceRun.provenance),
          sourceRun.errorMessage ?? null
        ]
      );
      const sourceRunId = rows[0]?.id;
      if (!sourceRunId) throw new Error('Source run insert did not return an id');
      return { sourceRunId };
    },

    async finishSourceRun(sourceRun) {
      const rows = await executor.query<SourceRunIdRow>(
        `update source_runs
         set finished_at = coalesce($2, now()),
             status = $3,
             error_message = $4
         where id = $1
         returning id`,
        [sourceRun.sourceRunId, sourceRun.finishedAt ?? null, sourceRun.status, sourceRun.errorMessage ?? null]
      );
      const sourceRunId = rows[0]?.id;
      if (!sourceRunId) throw new Error(`Source run update did not return an id: ${sourceRun.sourceRunId}`);
      return { sourceRunId };
    },

    async upsertRawRecord(rawRecord) {
      const rows = await executor.query<RawRecordIdRow>(
        `insert into raw_records(
           source_run_id,
           record_type,
           external_ref,
           observed_at,
           payload,
           payload_hash,
           provenance
         ) values ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb)
         on conflict (source_run_id, payload_hash) do update set
           record_type = excluded.record_type,
           external_ref = excluded.external_ref,
           observed_at = excluded.observed_at,
           payload = excluded.payload,
           provenance = excluded.provenance
         returning id`,
        [
          rawRecord.sourceRunId,
          rawRecord.recordType,
          rawRecord.externalRef ?? null,
          rawRecord.observedAt ?? null,
          JSON.stringify(rawRecord.payload),
          rawRecord.payloadHash,
          JSON.stringify(rawRecord.provenance)
        ]
      );
      const rawRecordId = rows[0]?.id;
      if (!rawRecordId) throw new Error('Raw record upsert did not return an id');
      return { rawRecordId };
    }
  };
}

export function createPostgresSourceRecordReader(executor: QueryExecutor): PostgresSourceRecordReader {
  return {
    async listSourceRuns(filter = {}) {
      const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
      const rows = await executor.query<SourceRunRow>(
        `select id,
                source_type,
                source_name,
                source_url,
                started_at,
                finished_at,
                status,
                provenance,
                error_message
         from source_runs
         where ($1::text is null or status = $1)
           and ($2::text is null or source_type = $2)
         order by started_at desc, id
         limit $3`,
        [filter.status ?? null, filter.sourceType ?? null, limit]
      );
      return rows.map(mapSourceRun);
    },

    async getRawRecordByHash(sourceRunId, payloadHash) {
      const rows = await executor.query<RawRecordRow>(
        `select id,
                source_run_id,
                record_type,
                external_ref,
                observed_at,
                payload,
                payload_hash,
                provenance,
                created_at
         from raw_records
         where source_run_id = $1 and payload_hash = $2`,
        [sourceRunId, payloadHash]
      );
      const row = rows[0];
      return row ? mapRawRecord(row) : null;
    }
  };
}

export function createPostgresPriceObservationWriter(executor: QueryExecutor): PostgresPriceObservationWriter {
  return {
    async recordPriceObservation(observation) {
      const provenanceJson = JSON.stringify(observation.provenance);
      const rows = await executor.query<ObservationIdRow>(
        `insert into observations(
           product_id,
           chain_id,
           store_id,
           source_run_id,
           raw_record_id,
           retailer_product_ref,
           price_type,
           price,
           regular_price,
           unit_price,
           currency,
           quantity,
           quantity_unit,
           promotion_text,
           promotion_starts_on,
           promotion_ends_on,
           member_required,
           observed_at,
           valid_from,
           valid_until,
           confidence,
           provenance
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
           $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb
         )
         returning id`,
        [
          observation.productId,
          observation.chainId,
          observation.storeId ?? null,
          observation.sourceRunId ?? null,
          observation.rawRecordId ?? null,
          observation.retailerProductRef ?? null,
          observation.priceType,
          observation.price,
          observation.regularPrice ?? null,
          observation.unitPrice,
          observation.currency ?? 'SEK',
          observation.quantity ?? null,
          observation.quantityUnit ?? null,
          observation.promotionText ?? null,
          observation.promotionStartsOn ?? null,
          observation.promotionEndsOn ?? null,
          observation.memberRequired ?? false,
          observation.observedAt,
          observation.validFrom ?? null,
          observation.validUntil ?? null,
          observation.confidence,
          provenanceJson
        ]
      );
      const observationId = rows[0]?.id;
      if (!observationId) throw new Error('Price observation insert did not return an id');

      await executor.query(
        `insert into latest_prices(
           product_id,
           chain_id,
           store_id,
           price_type,
           observation_id,
           price,
           regular_price,
           unit_price,
           currency,
           observed_at,
           confidence,
           provenance
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
         on conflict (product_id, chain_id, store_id, price_type) do update set
           observation_id = excluded.observation_id,
           price = excluded.price,
           regular_price = excluded.regular_price,
           unit_price = excluded.unit_price,
           currency = excluded.currency,
           observed_at = excluded.observed_at,
           confidence = excluded.confidence,
           provenance = excluded.provenance,
           updated_at = now()
         where latest_prices.observed_at <= excluded.observed_at`,
        [
          observation.productId,
          observation.chainId,
          observation.storeId ?? null,
          observation.priceType,
          observationId,
          observation.price,
          observation.regularPrice ?? null,
          observation.unitPrice,
          observation.currency ?? 'SEK',
          observation.observedAt,
          observation.confidence,
          provenanceJson
        ]
      );

      return { observationId };
    }
  };
}

export function createPostgresPriceReader(executor: QueryExecutor): PostgresPriceReader {
  return {
    async listLatestPricesForProduct(productId) {
      const rows = await executor.query<LatestPriceRow>(
        `select product_id,
                chain_id,
                store_id,
                price_type,
                observation_id,
                price,
                regular_price,
                unit_price,
                currency,
                observed_at,
                confidence,
                provenance
         from latest_prices
         where product_id = $1
         order by observed_at desc, chain_id, store_id, price_type`,
        [productId]
      );
      return rows.map(mapLatestPrice);
    },

    async listPriceObservationHistory(filter) {
      const limit = Math.min(Math.max(filter.limit ?? 500, 1), 1000);
      const rows = await executor.query<PriceObservationHistoryRow>(
        `select id,
                product_id,
                chain_id,
                store_id,
                source_run_id,
                raw_record_id,
                retailer_product_ref,
                price_type,
                price,
                regular_price,
                unit_price,
                currency,
                quantity,
                quantity_unit,
                promotion_text,
                promotion_starts_on,
                promotion_ends_on,
                member_required,
                observed_at,
                valid_from,
                valid_until,
                confidence,
                provenance
         from observations
         where product_id = $1
           and ($2::uuid is null or chain_id = $2::uuid)
           and ($3::uuid is null or store_id = $3::uuid)
           and ($4::text is null or price_type = $4)
           and ($5::timestamptz is null or observed_at >= $5::timestamptz)
           and ($6::timestamptz is null or observed_at <= $6::timestamptz)
         order by observed_at desc, chain_id, store_id, price_type, id
         limit $7`,
        [
          filter.productId,
          filter.chainId ?? null,
          filter.storeId ?? null,
          filter.priceType ?? null,
          filter.observedFrom ?? null,
          filter.observedTo ?? null,
          limit
        ]
      );
      return rows.map(mapPriceObservationHistory);
    }
  };
}

export async function collectPostgresIntegrationProbe(input: CollectPostgresIntegrationProbeInput): Promise<PostgresIntegrationProbe> {
  const requiredTables = [...(input.requiredTables ?? POSTGRES_INTEGRATION_REQUIRED_TABLES)];
  const requiredMigrationVersions = [...(input.requiredMigrationVersions ?? POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS)];

  const repositoryChecks: PostgresIntegrationProbe['repositoryChecks'] = [];
  let tableRows: TableNameRow[] = [];
  let migrationRows: MigrationVersionRow[] = [];

  try {
    tableRows = await input.executor.query<TableNameRow>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public' and table_name = any($1::text[])
       order by table_name`,
      [requiredTables]
    );
  } catch {
    repositoryChecks.push({ name: 'required_table_probe', status: 'fail' });
  }

  try {
    migrationRows = await input.executor.query<MigrationVersionRow>('select version from schema_migrations order by version');
  } catch {
    repositoryChecks.push({ name: 'schema_migrations_probe', status: 'fail' });
  }

  for (const probe of input.repositoryProbes) {
    try {
      await probe.run(input.executor);
      repositoryChecks.push({ name: probe.name, status: 'pass' });
    } catch {
      repositoryChecks.push({ name: probe.name, status: 'fail' });
    }
  }

  return {
    requiredTables,
    existingTables: tableRows.map((row) => row.table_name),
    requiredMigrationVersions,
    appliedMigrationVersions: migrationRows.map((row) => row.version),
    repositoryChecks
  };
}

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

export async function checkPostgresIntegrationReadiness(
  input: CheckPostgresIntegrationReadinessInput
): Promise<PostgresIntegrationReadinessReport> {
  return buildPostgresIntegrationReadinessReport(await collectPostgresIntegrationProbe(input));
}

export async function checkPostgresRepositoryIntegrationReadiness(
  input: CheckPostgresRepositoryIntegrationReadinessInput
): Promise<PostgresIntegrationReadinessReport> {
  const now = input.now ?? new Date().toISOString();
  const runId = input.runId ?? `db-readiness-${now.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const repositoryProbes = [
    ...buildPostgresRepositorySmokeProbes({ runId, now }),
    ...(input.repositoryProbes ?? [])
  ];

  return checkPostgresIntegrationReadiness({
    executor: input.executor,
    requiredTables: input.requiredTables,
    requiredMigrationVersions: input.requiredMigrationVersions,
    repositoryProbes
  });
}
