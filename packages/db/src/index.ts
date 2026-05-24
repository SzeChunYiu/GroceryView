import { createHash } from 'node:crypto';
import { buildUserAccountDeletionQueries } from './queries/users.js';

export * from './queries/categories.js';
export * from './queries/favorites.js';
export * from './queries/productSearch.js';
export * from './queries/stores.js';
export * from './queries/retailers.js';
export * from './queries/users.js';
export * from './seed/retailers.js';

export type Migration = {
  version: string;
  sql: string;
};

export type SqlMigrationFile = {
  path: string;
  sql: string;
};

export type MigrationPlanStatus = {
  status: 'ready' | 'pending' | 'drift';
  applied: string[];
  pending: string[];
  unknownApplied: string[];
  duplicateApplied: string[];
  summary: string;
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
    .filter((file) => {
      const filename = file.path.split(/[\\/]/).filter(Boolean).at(-1) ?? '';
      return filename.endsWith('.sql') && !filename.startsWith('._');
    })
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

export function buildMigrationPlanStatus(migrations: Migration[], appliedVersions: string[]): MigrationPlanStatus {
  const plannedVersions = [...new Set(migrations.map((migration) => migration.version))].sort();
  const planned = new Set(plannedVersions);
  const appliedCounts = new Map<string, number>();

  for (const version of appliedVersions) {
    appliedCounts.set(version, (appliedCounts.get(version) ?? 0) + 1);
  }

  const applied = [...appliedCounts.keys()].filter((version) => planned.has(version)).sort();
  const pending = plannedVersions.filter((version) => !appliedCounts.has(version));
  const unknownApplied = [...appliedCounts.keys()].filter((version) => !planned.has(version)).sort();
  const duplicateApplied = [...appliedCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([version]) => version)
    .sort();
  const driftCount = unknownApplied.length + duplicateApplied.length;

  return {
    status: driftCount > 0 ? 'drift' : pending.length > 0 ? 'pending' : 'ready',
    applied,
    pending,
    unknownApplied,
    duplicateApplied,
    summary:
      driftCount > 0
        ? `Migration metadata drift detected: ${driftCount} issue(s).`
        : pending.length > 0
          ? `${pending.length} migration(s) pending.`
          : 'All planned migrations are applied.'
  };
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

export type WatchlistAllowedPriceType = 'shelf' | 'member' | 'promotion' | 'estimated';

export type WatchlistRecord = {
  productId: string;
  targetPrice?: number;
  alertDealScoreAt?: number;
  favoriteStoresOnly: boolean;
  allowedPriceTypes?: WatchlistAllowedPriceType[];
};

export type BasketRecord = {
  productId: string;
  quantity: number;
};

export type BasketImportReviewStatus = 'open' | 'accepted' | 'dismissed';

export type BasketImportReviewRecord = {
  reviewItemId: string;
  rawName: string;
  quantity: number;
  reason: string;
  retailerId: string;
  sourceKind: 'bookmarklet' | 'browser_extension' | 'copy_paste';
  capturedAt: string;
  status: BasketImportReviewStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedProductId?: string;
};

export type BasketImportReviewResolution = {
  status: Exclude<BasketImportReviewStatus, 'open'>;
  resolvedAt: string;
  resolvedProductId?: string;
  quantity?: number;
};

export type PantryItemRecord = {
  id: string;
  userId: string;
  productId: string;
  name: string;
  category: 'protein' | 'pantry' | 'vegetables' | 'dairy' | 'fruit' | 'other';
  quantity: number;
  unit: string;
  minimumQuantity: number;
  targetQuantity?: number;
  expiresOn?: string;
  updatedAt: string;
};

export type ReceiptItemRecord = {
  id: string;
  receiptId: string;
  rawName: string;
  productId?: string;
  canonicalName?: string;
  quantity: number;
  itemTotal: number;
  matchConfidence?: number;
};

export type ReceiptUploadRecord = {
  id: string;
  userId: string;
  storeId?: string;
  imageUri: string;
  purchasedAt: string;
  totalAmount: number;
  ocrConfidence: number;
  status: 'uploaded' | 'parsed' | 'needs_review' | 'processed' | 'failed';
  createdAt: string;
  updatedAt: string;
  items: ReceiptItemRecord[];
};

export type HouseholdMemberRecord = {
  userId: string;
  displayName: string;
  role?: 'owner' | 'editor' | 'viewer';
};

export type HouseholdBasketItemRecord = {
  productId: string;
  quantity: number;
  addedBy: string;
  checked?: boolean;
  checkedBy?: string;
  checkedAt?: string;
};

export type HouseholdWatchlistItemRecord = {
  productId: string;
  addedBy: string;
  targetPrice?: number;
};

export type HouseholdPlanRecord = {
  householdId: string;
  userId: string;
  name: string;
  weeklyBudget: number;
  approvalLimit: number;
  reviewer: string;
  members: HouseholdMemberRecord[];
  basketItems: HouseholdBasketItemRecord[];
  watchlistItems: HouseholdWatchlistItemRecord[];
  sharedFavoriteStoreIds: string[];
  createdAt: string;
  updatedAt: string;
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
  page?: number;
};

export type CategoryHierarchyNode = {
  slug: string;
  label: string;
  parentSlug?: string;
  routable: boolean;
};

export const groceryCategoryHierarchy: readonly CategoryHierarchyNode[] = [
  { slug: 'grocery', label: 'Grocery', routable: false },
  { slug: 'fresh-food', label: 'Fresh food', parentSlug: 'grocery', routable: false },
  { slug: 'packaged-grocery', label: 'Packaged grocery', parentSlug: 'grocery', routable: false },
  { slug: 'household-personal', label: 'Household & personal', parentSlug: 'grocery', routable: false },
  { slug: 'dairy', label: 'Dairy', parentSlug: 'fresh-food', routable: true },
  { slug: 'bread', label: 'Bread & Bakery', parentSlug: 'fresh-food', routable: true },
  { slug: 'meat', label: 'Meat & Charcuterie', parentSlug: 'fresh-food', routable: true },
  { slug: 'fish', label: 'Fish & Seafood', parentSlug: 'fresh-food', routable: true },
  { slug: 'produce', label: 'Fruit & Vegetables', parentSlug: 'fresh-food', routable: true },
  { slug: 'breakfast', label: 'Breakfast', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'beverages', label: 'Beverages', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'coffee-tea', label: 'Coffee & Tea', parentSlug: 'beverages', routable: true },
  { slug: 'alcohol', label: 'Wine, Beer & Spirits', parentSlug: 'beverages', routable: true },
  { slug: 'snacks', label: 'Snacks', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'sweets', label: 'Sweets & Ice cream', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'frozen', label: 'Frozen', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'pantry', label: 'Pantry', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'plant-based', label: 'Plant-based', parentSlug: 'packaged-grocery', routable: true },
  { slug: 'baby', label: 'Baby', parentSlug: 'household-personal', routable: true },
  { slug: 'pet', label: 'Pet', parentSlug: 'household-personal', routable: true },
  { slug: 'household', label: 'Cleaning & Household', parentSlug: 'household-personal', routable: true },
  { slug: 'personal-care', label: 'Personal care', parentSlug: 'household-personal', routable: true }
] as const;

export function categoryPathForSlug(slug: string): CategoryHierarchyNode[] {
  const bySlug = new Map(groceryCategoryHierarchy.map((category) => [category.slug, category]));
  const path: CategoryHierarchyNode[] = [];
  let cursor = bySlug.get(slug);
  if (!cursor) return [{ slug, label: slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '), routable: true }];
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentSlug ? bySlug.get(cursor.parentSlug) : undefined;
  }
  return path;
}

export type StoreCatalogRecord = {
  storeId: string;
  chainId: string;
  chainSlug: string;
  chainName: string;
  slug: string;
  externalRef?: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  city: string;
  region?: string;
  countryCode: string;
  longitude?: number;
  latitude?: number;
  storeType: string;
  openingHours: Record<string, unknown>;
  onlineOrderUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type StoreCatalogListFilter = {
  search?: string;
  chainSlug?: string;
  city?: string;
  limit?: number;
};

export type CatalogProductCoverageRecord = {
  id: string;
  categoryId: string;
  observedChainIds: string[];
  observedStoreIds: string[];
  observedPriceTypes: string[];
  observedStorePriceTypes: string[];
};

export type ProductAliasSourceType = 'retailer' | 'receipt' | 'community' | 'import' | 'manual';

export type ProductAliasRecord = {
  aliasId: string;
  productId: string;
  alias: string;
  normalizedAlias: string;
  sourceType: ProductAliasSourceType;
  sourceRef?: string;
  matchConfidence: number;
  reviewedAt?: string;
  createdAt: string;
};

export type ProductAliasWriteRecord = {
  productId: string;
  alias: string;
  normalizedAlias: string;
  sourceType: ProductAliasSourceType;
  sourceRef?: string;
  matchConfidence: number;
  reviewedAt?: string;
};

export type ProductAliasLookupFilter = {
  normalizedAlias?: string;
  productId?: string;
  sourceType?: ProductAliasSourceType;
  limit?: number;
};

export type PostgresCatalogReader = {
  getProductBySlug(slug: string): Promise<ProductCatalogRecord | null>;
  listProducts(filter?: ProductCatalogListFilter): Promise<ProductCatalogRecord[]>;
  getStoreBySlug(slug: string): Promise<StoreCatalogRecord | null>;
  listStores(filter?: StoreCatalogListFilter): Promise<StoreCatalogRecord[]>;
  listProductCoverageRows(filter?: { limit?: number }): Promise<CatalogProductCoverageRecord[]>;
};

export type PostgresProductAliasRepository = {
  upsertProductAlias(alias: ProductAliasWriteRecord): Promise<ProductAliasRecord>;
  findProductAliases(filter: ProductAliasLookupFilter): Promise<ProductAliasRecord[]>;
};

export type PriceObservationRecord = {
  productId: string;
  chainId: string;
  storeId?: string;
  domain?: 'grocery' | 'fuel' | 'pharmacy';
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
  isAvailable?: boolean;
  observedAt: string;
  validFrom?: string;
  validUntil?: string;
  confidence: number;
  provenance: Record<string, unknown>;
};

export type PriceObservationWriteResult = {
  observationId: string;
  status?: 'unchanged';
};

export type PriceObservationBatchWriteResult = {
  observationIds: string[];
};

export type PostgresPriceObservationWriter = {
  recordPriceObservation(observation: PriceObservationRecord): Promise<PriceObservationWriteResult>;
  upsertConnectorPriceObservations(observations: PriceObservationRecord[]): Promise<PriceObservationBatchWriteResult>;
};

export type PriceObservationHistoryRecord = PriceObservationRecord & {
  observationId: string;
  currency: string;
  memberRequired: boolean;
  isAvailable: boolean;
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
  isAvailable: boolean;
  confidence: number;
  provenance: Record<string, unknown>;
};

export type PostgresPriceReader = {
  listLatestPricesForProduct(productId: string): Promise<LatestPriceRecord[]>;
  listPriceObservationHistory(filter: PriceObservationHistoryFilter): Promise<PriceObservationHistoryRecord[]>;
};

export type WeeklyPriceDropDigestFilter = {
  since: string;
  until: string;
  limit?: number;
};

export type WeeklyPriceDropDigestItem = {
  rank: number;
  productId: string;
  productSlug: string;
  productName: string;
  brand?: string;
  chainSlug: string;
  chainName: string;
  storeSlug?: string;
  storeName?: string;
  priceType: PriceType;
  price: number;
  regularPrice: number;
  savingsAmount: number;
  dropPercent: number;
  currency: string;
  observedAt: string;
  confidence: number;
  emailSubject: string;
  emailPreview: string;
};

export type PostgresWeeklyPriceDropDigestReader = {
  listWeeklyPriceDropDigest(filter: WeeklyPriceDropDigestFilter): Promise<WeeklyPriceDropDigestItem[]>;
};

export type TrendingPriceChangePoint = {
  productId: string;
  productSlug: string;
  productName: string;
  brand?: string;
  categoryLabel?: string;
  price: number;
  currency: string;
  observedAt: string;
  chainSlug?: string;
  chainName?: string;
  storeSlug?: string;
  storeName?: string;
};

export type TrendingProductPriceChange = {
  rank: number;
  productId: string;
  productSlug: string;
  productName: string;
  brand?: string;
  categoryLabel?: string;
  changeCount: number;
  observationCount: number;
  latestPrice: number;
  previousPrice: number;
  changeAmount: number;
  changePercent: number;
  currency: string;
  latestObservedAt: string;
  chainSlug?: string;
  chainName?: string;
  storeSlug?: string;
  storeName?: string;
};

export type TrendingPriceChangeInput = {
  points: TrendingPriceChangePoint[];
  asOf: string;
  windowDays?: number;
  limit?: number;
};

export type TrendingPriceChangeFilter = {
  since: string;
  until: string;
  limit?: number;
};

export type PostgresTrendingPriceChangeReader = {
  listTrendingPriceChanges(filter: TrendingPriceChangeFilter): Promise<TrendingProductPriceChange[]>;
};

export type SiteLatestPriceSnapshotRow = LatestPriceRecord & {
  productSlug: string;
  canonicalName: string;
  brand?: string;
  imageUrl?: string;
  categoryPath: string[];
  packageSize?: number;
  packageUnit?: string;
  comparableUnit: string;
  chainSlug: string;
  chainName: string;
  storeSlug?: string;
  storeExternalRef?: string;
  storeName?: string;
  city?: string;
  promotionText?: string;
  promotionStartsOn?: string;
  promotionEndsOn?: string;
  memberRequired: boolean;
  validFrom?: string;
  validUntil?: string;
  retailerProductRef?: string;
};

export type SiteLatestPriceSnapshotFilter = {
  minConfidence?: number;
  limit?: number;
};

export type PostgresSiteSnapshotReader = {
  listLatestPriceSnapshotRows(filter?: SiteLatestPriceSnapshotFilter): Promise<SiteLatestPriceSnapshotRow[]>;
};

export type SourceRunRecord = {
  sourceType: 'official_api' | 'retailer_api' | 'retailer_page' | 'weekly_leaflet' | 'receipt_ocr' | 'community_report' | 'manual_seed';
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

export type SourceRunHealthInput = {
  now: string;
  maxRunningMinutes: number;
  staleAfterMinutes: number;
  requiredFreshChainIds?: readonly string[];
  requiredAcceptedCountByChain?: Readonly<Record<string, number>>;
  runs: SourceRunReadRecord[];
};

export type SourceRunHealthReadFilter = {
  sourceType?: SourceRunRecord['sourceType'];
  limit?: number;
};

export type CheckSourceRunHealthInput = Omit<SourceRunHealthInput, 'runs'> & {
  reader: Pick<PostgresSourceRecordReader, 'listSourceRuns'>;
  filter?: SourceRunHealthReadFilter;
};

export type SourceRunHealthReport = {
  status: 'healthy' | 'blocked';
  blockers: string[];
  evidence: string[];
  runningRunIds: string[];
  staleRunIds: string[];
  latestSuccessfulRunId?: string;
  latestSuccessfulFinishedAt?: string;
};

export type SourceRunHealthSummary = {
  status: SourceRunHealthReport['status'];
  blockers: {
    total: number;
    failed: number;
    partial: number;
    stale: number;
    stuckRunning: number;
    missingFinishedAt: number;
    startedInFuture: number;
    finishedInFuture: number;
    noFreshRuns: number;
    missingFreshChains: number;
    insufficientAcceptedRows: number;
  };
  evidence: {
    total: number;
    succeeded: number;
  };
  running: number;
  stale: number;
  latestSuccessfulRunId?: string;
  latestSuccessfulFinishedAt?: string;
};

export type SourceRunHealthCheckResult = {
  report: SourceRunHealthReport;
  summary: SourceRunHealthSummary;
  runCount: number;
  filter: SourceRunHealthReadFilter;
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

export type OpenPricesArtifactProduct = {
  id: string;
  canonicalName: string;
  brand?: string;
  categoryId?: string;
  packageSize?: number;
  packageUnit?: string;
  comparableUnit: string;
};

export type OpenPricesArtifactAlias = {
  rawName: string;
  sourceType?: string;
  matchedProductId?: string;
  matchConfidence: number;
  reviewedByHuman?: boolean;
};

export type OpenPricesArtifactPriceObservation = {
  productId: string;
  retailerProductId?: string;
  chainId: string;
  observedAt: string;
  price: number;
  unitPrice: number;
  currency: 'SEK';
  regularPrice?: number;
  priceType: string;
  sourceType?: string;
  sourceUrl?: string;
  parserVersion?: string;
  rawSnapshotRef: string;
  sourceRunId?: string;
  confidenceScore: number;
  isOnlinePrice?: boolean;
  isInstorePrice?: boolean;
  provenance?: Record<string, unknown>;
};

export type OpenPricesArtifactAcceptedObservation = {
  product: OpenPricesArtifactProduct;
  alias: OpenPricesArtifactAlias;
  priceObservation: OpenPricesArtifactPriceObservation;
  promotionObservation?: {
    promoText?: string;
    memberOnly?: boolean;
  } | null;
};

export type OpenPricesNormalizedArtifact = {
  status: string;
  sourceUrl: string;
  retrievedAt: string;
  contentHash: string;
  rawSnapshotRef: string;
  acceptedObservations: OpenPricesArtifactAcceptedObservation[];
};

export type OpenPricesArtifactPersistenceResult = {
  status: 'persisted';
  sourceRunId: string;
  acceptedCount: number;
  rawRecordIds: string[];
  observationIds: string[];
  productIds: string[];
  chainIds: string[];
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
  channel: 'push' | 'email' | 'telegram';
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
  channel?: 'push' | 'email' | 'telegram';
  reason: 'unsubscribed' | 'bounce' | 'complaint';
  active: boolean;
  updatedAt: string;
};

export type AlertRuleRecord = {
  id: string;
  userId: string;
  productId: string;
  storeId?: string;
  channel: 'push' | 'email';
  alertType: 'target_price' | 'deal_score' | 'back_in_stock' | 'price_drop';
  targetPrice?: number;
  dealScoreThreshold?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HumanReviewAssignmentRecord = {
  id: string;
  reviewId: string;
  subjectType: 'product_match' | 'community_report' | 'commodity_mapping';
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
  deleteUserAccount(userId: string): Promise<void>;
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
  saveBasketImportReviewItems(userId: string, items: BasketImportReviewRecord[]): Promise<void>;
  listOpenBasketImportReviewItems(userId: string): Promise<BasketImportReviewRecord[]>;
  resolveBasketImportReviewItem(userId: string, reviewItemId: string, resolution: BasketImportReviewResolution): Promise<BasketImportReviewRecord>;
  upsertPantryItem(item: PantryItemRecord): Promise<void>;
  listPantryItems(userId: string): Promise<PantryItemRecord[]>;
  upsertReceiptUpload(upload: ReceiptUploadRecord): Promise<void>;
  listReceiptUploads(userId: string): Promise<ReceiptUploadRecord[]>;
  upsertHouseholdPlan(plan: HouseholdPlanRecord): Promise<void>;
  getHouseholdPlan(userId: string): Promise<HouseholdPlanRecord | null>;
  upsertHumanReviewer(reviewer: HumanReviewerRecord): Promise<void>;
  getHumanReviewer(reviewerId: string): Promise<HumanReviewerRecord | null>;
  upsertCommunityReporterTrust(trust: CommunityReporterTrustRecord): Promise<void>;
  getCommunityReporterTrust(reporterId: string): Promise<CommunityReporterTrustRecord | null>;
  upsertNotificationTask(task: NotificationTaskRecord): Promise<void>;
  listDueNotificationTasks(now: string): Promise<NotificationTaskRecord[]>;
  upsertNotificationSuppression(suppression: NotificationSuppressionRecord): Promise<void>;
  listActiveNotificationSuppressions(): Promise<NotificationSuppressionRecord[]>;
  upsertAlertRule(rule: AlertRuleRecord): Promise<void>;
  listActiveAlertRules(userId: string): Promise<AlertRuleRecord[]>;
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

function parseDbIsoDate(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be an ISO date.`);
  return parsed;
}

export function buildSourceRunHealthReport(input: SourceRunHealthInput): SourceRunHealthReport {
  if (!Number.isFinite(input.maxRunningMinutes) || input.maxRunningMinutes <= 0) throw new Error('maxRunningMinutes must be positive.');
  if (!Number.isFinite(input.staleAfterMinutes) || input.staleAfterMinutes <= 0) throw new Error('staleAfterMinutes must be positive.');

  const nowMs = parseDbIsoDate(input.now, 'now');
  const blockers: string[] = [];
  const evidence: string[] = [];
  const runningRunIds: string[] = [];
  const staleRunIds: string[] = [];
  const freshSuccessfulChainIds = new Set<string>();
  const freshSuccessfulAcceptedCountByChain = new Map<string, number>();
  let latestSuccessfulRunId: string | undefined;
  let latestSuccessfulFinishedAt: string | undefined;
  let latestSuccessfulFinishedAtMs = Number.NEGATIVE_INFINITY;

  for (const run of [...input.runs].sort((a, b) => a.sourceRunId.localeCompare(b.sourceRunId))) {
    const startedAtMs = parseDbIsoDate(run.startedAt, `startedAt for ${run.sourceRunId}`);
    if (startedAtMs > nowMs) {
      blockers.push(`source_run_started_in_future:${run.sourceRunId}`);
      continue;
    }

    if (run.status === 'running') {
      const runningMinutes = (nowMs - startedAtMs) / 60_000;
      runningRunIds.push(run.sourceRunId);
      if (runningMinutes > input.maxRunningMinutes) blockers.push(`source_run_stuck_running:${run.sourceRunId}`);
      continue;
    }

    if (!run.finishedAt) {
      blockers.push(`source_run_missing_finished_at:${run.sourceRunId}`);
      continue;
    }

    const finishedAtMs = parseDbIsoDate(run.finishedAt, `finishedAt for ${run.sourceRunId}`);
    if (finishedAtMs > nowMs) {
      blockers.push(`source_run_finished_in_future:${run.sourceRunId}`);
      continue;
    }

    const ageMinutes = (nowMs - finishedAtMs) / 60_000;
    if (run.status === 'succeeded' && finishedAtMs > latestSuccessfulFinishedAtMs) {
      latestSuccessfulRunId = run.sourceRunId;
      latestSuccessfulFinishedAt = run.finishedAt;
      latestSuccessfulFinishedAtMs = finishedAtMs;
    }

    if (ageMinutes > input.staleAfterMinutes) {
      staleRunIds.push(run.sourceRunId);
      blockers.push(`source_run_stale:${run.sourceRunId}`);
    }

    if (run.status === 'failed') blockers.push(`source_run_failed:${run.sourceRunId}`);
    if (run.status === 'partial') blockers.push(`source_run_partial:${run.sourceRunId}`);
    if (run.status === 'succeeded' && ageMinutes <= input.staleAfterMinutes) {
      evidence.push(`source_run_succeeded:${run.sourceRunId}`);
      const chainId = run.provenance.chainId;
      if (typeof chainId === 'string' && chainId.trim()) {
        freshSuccessfulChainIds.add(chainId);
        const acceptedCount = run.provenance.acceptedCount;
        if (typeof acceptedCount === 'number' && Number.isFinite(acceptedCount)) {
          freshSuccessfulAcceptedCountByChain.set(
            chainId,
            Math.max(freshSuccessfulAcceptedCountByChain.get(chainId) ?? 0, acceptedCount)
          );
        }
      }
    }
  }

  if (evidence.length === 0) blockers.push('source_run_no_fresh_success');

  for (const chainId of [...(input.requiredFreshChainIds ?? [])].sort()) {
    if (!freshSuccessfulChainIds.has(chainId)) blockers.push(`source_run_missing_fresh_chain:${chainId}`);
  }

  for (const [chainId, minimumAcceptedCount] of Object.entries(input.requiredAcceptedCountByChain ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!Number.isFinite(minimumAcceptedCount) || minimumAcceptedCount < 1) throw new Error(`requiredAcceptedCountByChain.${chainId} must be positive.`);
    if (!freshSuccessfulChainIds.has(chainId)) continue;
    const acceptedCount = freshSuccessfulAcceptedCountByChain.get(chainId) ?? 0;
    if (acceptedCount < minimumAcceptedCount) blockers.push(`source_run_insufficient_accepted_rows:${chainId}:${acceptedCount}/${minimumAcceptedCount}`);
  }

  return {
    status: blockers.length === 0 ? 'healthy' : 'blocked',
    blockers,
    evidence,
    runningRunIds,
    staleRunIds,
    ...(latestSuccessfulRunId && latestSuccessfulFinishedAt ? { latestSuccessfulRunId, latestSuccessfulFinishedAt } : {})
  };
}

export function summarizeSourceRunHealthReport(report: SourceRunHealthReport): SourceRunHealthSummary {
  const summary: SourceRunHealthSummary = {
    status: report.status,
    blockers: {
      total: report.blockers.length,
      failed: 0,
      partial: 0,
      stale: 0,
      stuckRunning: 0,
      missingFinishedAt: 0,
      startedInFuture: 0,
        finishedInFuture: 0,
        noFreshRuns: 0,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
    },
    evidence: {
      total: report.evidence.length,
      succeeded: 0
    },
    running: report.runningRunIds.length,
    stale: report.staleRunIds.length,
    ...(report.latestSuccessfulRunId ? { latestSuccessfulRunId: report.latestSuccessfulRunId } : {}),
    ...(report.latestSuccessfulFinishedAt ? { latestSuccessfulFinishedAt: report.latestSuccessfulFinishedAt } : {})
  };

  for (const blocker of report.blockers) {
    if (blocker.startsWith('source_run_failed:')) summary.blockers.failed += 1;
    if (blocker.startsWith('source_run_partial:')) summary.blockers.partial += 1;
    if (blocker.startsWith('source_run_stale:')) summary.blockers.stale += 1;
    if (blocker.startsWith('source_run_stuck_running:')) summary.blockers.stuckRunning += 1;
    if (blocker.startsWith('source_run_missing_finished_at:')) summary.blockers.missingFinishedAt += 1;
    if (blocker.startsWith('source_run_started_in_future:')) summary.blockers.startedInFuture += 1;
    if (blocker.startsWith('source_run_finished_in_future:')) summary.blockers.finishedInFuture += 1;
    if (blocker === 'source_run_no_fresh_success') summary.blockers.noFreshRuns += 1;
    if (blocker.startsWith('source_run_missing_fresh_chain:')) summary.blockers.missingFreshChains += 1;
    if (blocker.startsWith('source_run_insufficient_accepted_rows:')) summary.blockers.insufficientAcceptedRows += 1;
  }

  for (const evidence of report.evidence) {
    if (evidence.startsWith('source_run_succeeded:')) summary.evidence.succeeded += 1;
  }

  return summary;
}

export async function checkSourceRunHealth(input: CheckSourceRunHealthInput): Promise<SourceRunHealthCheckResult> {
  const filter: SourceRunHealthReadFilter = {
    ...(input.filter?.sourceType ? { sourceType: input.filter.sourceType } : {}),
    limit: input.filter?.limit ?? 100
  };
  const runs = await input.reader.listSourceRuns(filter);
  const report = buildSourceRunHealthReport({
    now: input.now,
    maxRunningMinutes: input.maxRunningMinutes,
    staleAfterMinutes: input.staleAfterMinutes,
    requiredFreshChainIds: input.requiredFreshChainIds,
    requiredAcceptedCountByChain: input.requiredAcceptedCountByChain,
    runs
  });
  return {
    report,
    summary: summarizeSourceRunHealthReport(report),
    runCount: runs.length,
    filter
  };
}

function requireUser(users: Map<string, UserRecord>, userId: string): void {
  if (!users.has(userId)) throw new Error(`User not found: ${userId}`);
}

const watchlistAllowedPriceTypes = ['shelf', 'member', 'promotion', 'estimated'] as const satisfies readonly WatchlistAllowedPriceType[];

function normalizeWatchlistAllowedPriceTypes(value: readonly string[] | null | undefined): WatchlistAllowedPriceType[] {
  const priceTypes = value ?? ['shelf'];
  if (priceTypes.length === 0) throw new Error('allowedPriceTypes must not be empty.');
  const allowed = new Set<string>(watchlistAllowedPriceTypes);
  for (const priceType of priceTypes) {
    if (!allowed.has(priceType)) {
      throw new Error(`allowedPriceTypes must contain only: ${watchlistAllowedPriceTypes.join(', ')}.`);
    }
  }
  return [...priceTypes] as WatchlistAllowedPriceType[];
}

function watchlistRecordForStorage(item: WatchlistRecord): WatchlistRecord {
  return { ...item, allowedPriceTypes: normalizeWatchlistAllowedPriceTypes(item.allowedPriceTypes) };
}

export function createMemoryRepository(): GroceryViewRepository {
  const users = new Map<string, UserRecord>();
  const favoriteStores = new Map<string, Set<string>>();
  const budgets = new Map<string, BudgetRecord>();
  const subscriptionEntitlements = new Map<string, SubscriptionEntitlementRecord>();
  const watchlists = new Map<string, WatchlistRecord[]>();
  const baskets = new Map<string, BasketRecord[]>();
  const basketImportReviewItems = new Map<string, BasketImportReviewRecord[]>();
  const pantryItems = new Map<string, PantryItemRecord>();
  const receiptUploads = new Map<string, ReceiptUploadRecord>();
  const householdPlans = new Map<string, HouseholdPlanRecord>();
  const humanReviewers = new Map<string, HumanReviewerRecord>();
  const communityReporterTrust = new Map<string, CommunityReporterTrustRecord>();
  const notificationTasks = new Map<string, NotificationTaskRecord>();
  const notificationSuppressions = new Map<string, NotificationSuppressionRecord>();
  const alertRules = new Map<string, AlertRuleRecord>();
  const humanReviewAssignments = new Map<string, HumanReviewAssignmentRecord>();

  return {
    async upsertUser(user) {
      users.set(user.id, { ...user });
    },

    async deleteUserAccount(userId) {
      users.delete(userId);
      favoriteStores.delete(userId);
      budgets.delete(userId);
      subscriptionEntitlements.delete(userId);
      watchlists.delete(userId);
      baskets.delete(userId);
      basketImportReviewItems.delete(userId);
      for (const [itemId, item] of pantryItems) if (item.userId === userId) pantryItems.delete(itemId);
      for (const [uploadId, upload] of receiptUploads) if (upload.userId === userId) receiptUploads.delete(uploadId);
      for (const [planId, plan] of householdPlans) {
        if (plan.members.some((member) => member.userId === userId)) householdPlans.delete(planId);
      }
      for (const [ruleId, rule] of alertRules) if (rule.userId === userId) alertRules.delete(ruleId);
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
      watchlists.set(userId, [...(watchlists.get(userId) ?? []), watchlistRecordForStorage(item)]);
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

    async saveBasketImportReviewItems(userId, items) {
      requireUser(users, userId);
      basketImportReviewItems.set(userId, [
        ...(basketImportReviewItems.get(userId) ?? []),
        ...items.map((item) => ({ ...item }))
      ]);
    },

    async listOpenBasketImportReviewItems(userId) {
      requireUser(users, userId);
      return (basketImportReviewItems.get(userId) ?? [])
        .filter((item) => item.status === 'open')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.reviewItemId.localeCompare(b.reviewItemId))
        .map((item) => ({ ...item }));
    },

    async resolveBasketImportReviewItem(userId, reviewItemId, resolution) {
      requireUser(users, userId);
      const items = basketImportReviewItems.get(userId) ?? [];
      const index = items.findIndex((item) => item.reviewItemId === reviewItemId && item.status === 'open');
      if (index === -1) throw new Error(`Basket import review item not found: ${reviewItemId}`);
      const resolved = {
        ...items[index]!,
        status: resolution.status,
        resolvedAt: resolution.resolvedAt,
        ...(resolution.resolvedProductId ? { resolvedProductId: resolution.resolvedProductId } : {}),
        ...(resolution.quantity === undefined ? {} : { quantity: resolution.quantity })
      };
      basketImportReviewItems.set(userId, items.map((item, itemIndex) => itemIndex === index ? resolved : item));
      return { ...resolved };
    },

    async upsertPantryItem(item) {
      requireUser(users, item.userId);
      pantryItems.set(item.id, { ...item });
    },

    async listPantryItems(userId) {
      requireUser(users, userId);
      return [...pantryItems.values()]
        .filter((item) => item.userId === userId)
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name) || a.productId.localeCompare(b.productId) || a.id.localeCompare(b.id))
        .map((item) => ({ ...item }));
    },

    async upsertReceiptUpload(upload) {
      requireUser(users, upload.userId);
      receiptUploads.set(upload.id, {
        ...upload,
        items: upload.items.map((item) => ({ ...item }))
      });
    },

    async listReceiptUploads(userId) {
      requireUser(users, userId);
      return [...receiptUploads.values()]
        .filter((upload) => upload.userId === userId)
        .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt) || a.id.localeCompare(b.id))
        .map((upload) => ({ ...upload, items: upload.items.map((item) => ({ ...item })) }));
    },

    async upsertHouseholdPlan(plan) {
      requireUser(users, plan.userId);
      householdPlans.set(plan.userId, {
        ...plan,
        members: plan.members.map((member) => ({ ...member })),
        basketItems: plan.basketItems.map((item) => ({ ...item })),
        watchlistItems: plan.watchlistItems.map((item) => ({ ...item })),
        sharedFavoriteStoreIds: [...plan.sharedFavoriteStoreIds]
      });
    },

    async getHouseholdPlan(userId) {
      requireUser(users, userId);
      const plan = householdPlans.get(userId);
      return plan
        ? {
            ...plan,
            members: plan.members.map((member) => ({ ...member })),
            basketItems: plan.basketItems.map((item) => ({ ...item })),
            watchlistItems: plan.watchlistItems.map((item) => ({ ...item })),
            sharedFavoriteStoreIds: [...plan.sharedFavoriteStoreIds]
          }
        : null;
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
    },

    async upsertAlertRule(rule) {
      requireUser(users, rule.userId);
      alertRules.set(rule.id, { ...rule });
    },

    async listActiveAlertRules(userId) {
      requireUser(users, userId);
      return [...alertRules.values()]
        .filter((rule) => rule.userId === userId && rule.active)
        .sort((a, b) => a.productId.localeCompare(b.productId) || a.alertType.localeCompare(b.alertType) || a.id.localeCompare(b.id))
        .map((rule) => ({ ...rule }));
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
type WatchlistRow = {
  product_id: string;
  target_price: string | number | null;
  alert_deal_score_at: number | null;
  favorite_stores_only: boolean;
  allowed_price_types: string[] | null;
};
type BasketRow = { product_id: string; quantity: string | number };
type PantryItemRow = {
  id: string;
  user_id: string;
  product_id: string;
  name: string;
  category: PantryItemRecord['category'];
  quantity: string | number;
  unit: string;
  minimum_quantity: string | number;
  target_quantity: string | number | null;
  expires_on: string | Date | null;
  updated_at: string | Date;
};
type ReceiptUploadRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  image_uri: string;
  purchased_at: string | Date;
  total_amount: string | number;
  ocr_confidence: string | number;
  status: ReceiptUploadRecord['status'];
  created_at: string | Date;
  updated_at: string | Date;
};
type ReceiptItemRow = {
  id: string;
  receipt_id: string;
  raw_name: string;
  product_id: string | null;
  canonical_name: string | null;
  quantity: string | number;
  item_total: string | number;
  match_confidence: string | number | null;
};
type HouseholdPlanRow = {
  id: string;
  user_id: string;
  name: string;
  weekly_budget: string | number;
  approval_limit: string | number;
  reviewer_user_id: string;
  created_at: string | Date;
  updated_at: string | Date;
};
type HouseholdMemberRow = { household_id: string; user_id: string; display_name: string; role?: HouseholdMemberRecord['role'] | null };
type HouseholdBasketItemRow = {
  household_id: string;
  line_position: string | number;
  product_id: string;
  quantity: string | number;
  added_by: string;
  checked?: boolean | null;
  checked_by?: string | null;
  checked_at?: string | Date | null;
};
type HouseholdWatchlistItemRow = {
  household_id: string;
  line_position: string | number;
  product_id: string;
  added_by: string;
  target_price: string | number | null;
};
type HouseholdFavoriteStoreRow = { household_id: string; store_id: string };
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
type AlertRuleRow = {
  id: string;
  user_id: string;
  product_id: string;
  store_id: string | null;
  channel: AlertRuleRecord['channel'];
  alert_type: AlertRuleRecord['alertType'];
  target_price: string | number | null;
  deal_score_threshold: string | number | null;
  active: boolean;
  created_at: string | Date;
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
  is_available: boolean;
  observed_at: string | Date;
  confidence: string | number;
  provenance: Record<string, unknown> | string | null;
};


type SiteLatestPriceSnapshotRowSql = LatestPriceRow & {
  product_slug: string;
  canonical_name: string;
  brand: string | null;
  image_url: string | null;
  category_path: string[] | string | null;
  package_size: string | number | null;
  package_unit: string | null;
  comparable_unit: string;
  chain_slug: string;
  chain_name: string;
  store_slug: string | null;
  store_external_ref: string | null;
  store_name: string | null;
  city: string | null;
  promotion_text: string | null;
  promotion_starts_on: string | Date | null;
  promotion_ends_on: string | Date | null;
  member_required: boolean;
  valid_from: string | Date | null;
  valid_until: string | Date | null;
  retailer_product_ref: string | null;
};
type WeeklyPriceDropDigestRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  chain_slug: string;
  chain_name: string;
  store_slug: string | null;
  store_name: string | null;
  price_type: PriceType;
  price: string | number;
  regular_price: string | number;
  savings_amount: string | number;
  drop_percent: string | number;
  currency: string;
  observed_at: string | Date;
  confidence: string | number;
};
type TrendingPriceChangeRow = {
  rank: string | number;
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  category_label: string | null;
  change_count: string | number;
  observation_count: string | number;
  latest_price: string | number;
  previous_price: string | number;
  change_amount: string | number;
  change_percent: string | number;
  currency: string;
  latest_observed_at: string | Date;
  chain_slug: string | null;
  chain_name: string | null;
  store_slug: string | null;
  store_name: string | null;
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
  is_available: boolean;
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
type StoreCatalogRow = {
  id: string;
  chain_id: string;
  chain_slug: string;
  chain_name: string;
  slug: string;
  external_ref: string | null;
  name: string;
  address_line1: string;
  address_line2: string | null;
  postal_code: string | null;
  city: string;
  region: string | null;
  country_code: string;
  longitude: string | number | null;
  latitude: string | number | null;
  store_type: string;
  opening_hours: Record<string, unknown> | string | null;
  online_order_url: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};
type CatalogProductCoverageRow = {
  product_id: string;
  category_id: string | null;
  observed_chain_ids: string[] | null;
  observed_store_ids: string[] | null;
  observed_price_types: string[] | null;
  observed_store_price_types: string[] | null;
};
type ProductAliasRow = {
  id: string;
  product_id: string;
  alias: string;
  normalized_alias: string;
  source_type: ProductAliasSourceType;
  source_ref: string | null;
  match_confidence: string | number;
  reviewed_at: string | Date | null;
  created_at: string | Date;
};
type BasketImportReviewRow = {
  review_item_id: string;
  raw_name: string;
  quantity: string | number;
  reason: string;
  retailer_id: string;
  source_kind: BasketImportReviewRecord['sourceKind'];
  captured_at: string | Date;
  status: BasketImportReviewStatus;
  created_at: string | Date;
  resolved_at: string | Date | null;
  resolved_product_id: string | null;
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
    isAvailable: row.is_available !== false,
    confidence: Number(row.confidence),
    provenance: asRecord(row.provenance)
  };
}

function samePriceValue(left: string | number | null, right: number | null | undefined): boolean {
  if (left === null || right === null || right === undefined) return left === null && (right === null || right === undefined);
  return Math.abs(Number(left) - Number(right)) < 0.000001;
}

function sameLatestPriceKey(row: LatestPriceRow, observation: PriceObservationRecord): boolean {
  return row.product_id === observation.productId &&
    row.chain_id === observation.chainId &&
    (row.store_id ?? null) === (observation.storeId ?? null) &&
    row.price_type === observation.priceType;
}

function latestPriceIsUnchanged(row: LatestPriceRow, observation: PriceObservationRecord): boolean {
  if (!sameLatestPriceKey(row, observation)) return false;
  if (Date.parse(asIso(row.observed_at)) > Date.parse(observation.observedAt)) return false;
  return samePriceValue(row.price, observation.price) &&
    samePriceValue(row.regular_price, observation.regularPrice ?? null) &&
    samePriceValue(row.unit_price, observation.unitPrice) &&
    row.currency === (observation.currency ?? 'SEK') &&
    (row.is_available !== false) === (observation.isAvailable ?? true);
}


function asStringArray(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.map(String) : [];
}

function optionalNumberFromDb(value: string | number | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapSiteLatestPriceSnapshotRow(row: SiteLatestPriceSnapshotRowSql): SiteLatestPriceSnapshotRow {
  return {
    ...mapLatestPrice(row),
    productSlug: row.product_slug,
    canonicalName: row.canonical_name,
    ...(row.brand ? { brand: row.brand } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    categoryPath: asStringArray(row.category_path),
    ...(optionalNumberFromDb(row.package_size) === undefined ? {} : { packageSize: optionalNumberFromDb(row.package_size) }),
    ...(row.package_unit ? { packageUnit: row.package_unit } : {}),
    comparableUnit: row.comparable_unit,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
    ...(row.store_external_ref ? { storeExternalRef: row.store_external_ref } : {}),
    ...(row.store_name ? { storeName: row.store_name } : {}),
    ...(row.city ? { city: row.city } : {}),
    ...(row.promotion_text ? { promotionText: row.promotion_text } : {}),
    ...(row.promotion_starts_on ? { promotionStartsOn: asIso(row.promotion_starts_on) } : {}),
    ...(row.promotion_ends_on ? { promotionEndsOn: asIso(row.promotion_ends_on) } : {}),
    memberRequired: row.member_required,
    ...(row.valid_from ? { validFrom: asIso(row.valid_from) } : {}),
    ...(row.valid_until ? { validUntil: asIso(row.valid_until) } : {}),
    ...(row.retailer_product_ref ? { retailerProductRef: row.retailer_product_ref } : {})
  };
}

function formatDigestMoney(currency: string, value: number): string {
  return `${currency} ${value.toFixed(2)}`;
}

function formatDigestPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function mapWeeklyPriceDropDigestRow(row: WeeklyPriceDropDigestRow, index: number): WeeklyPriceDropDigestItem {
  const price = Number(row.price);
  const regularPrice = Number(row.regular_price);
  const savingsAmount = Number(row.savings_amount);
  const dropPercent = Number(row.drop_percent);
  const location = row.store_name ?? row.chain_name;

  return {
    rank: index + 1,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    ...(row.brand ? { brand: row.brand } : {}),
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
    ...(row.store_name ? { storeName: row.store_name } : {}),
    priceType: row.price_type,
    price,
    regularPrice,
    savingsAmount,
    dropPercent,
    currency: row.currency,
    observedAt: asIso(row.observed_at),
    confidence: Number(row.confidence),
    emailSubject: `${formatDigestPercent(dropPercent)} drop: ${row.product_name} at ${row.chain_name}`,
    emailPreview: `Now ${formatDigestMoney(row.currency, price)}, down from ${formatDigestMoney(row.currency, regularPrice)}. Save ${formatDigestMoney(row.currency, savingsAmount)} at ${location}.`
  };
}

function sortTrendingPriceChangePoints(left: TrendingPriceChangePoint, right: TrendingPriceChangePoint): number {
  const dateDelta = Date.parse(left.observedAt) - Date.parse(right.observedAt);
  if (dateDelta !== 0) return dateDelta;
  const productDelta = left.productId.localeCompare(right.productId);
  if (productDelta !== 0) return productDelta;
  const leftLocation = `${left.chainSlug ?? ''}:${left.storeSlug ?? ''}`;
  const rightLocation = `${right.chainSlug ?? ''}:${right.storeSlug ?? ''}`;
  return leftLocation.localeCompare(rightLocation);
}

function sameObservedPrice(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}

function rankTrendingPriceChanges(items: Omit<TrendingProductPriceChange, 'rank'>[], limit: number): TrendingProductPriceChange[] {
  return items
    .sort((left, right) => {
      const changeDelta = right.changeCount - left.changeCount;
      if (changeDelta !== 0) return changeDelta;
      const observationDelta = right.observationCount - left.observationCount;
      if (observationDelta !== 0) return observationDelta;
      const magnitudeDelta = Math.abs(right.changeAmount) - Math.abs(left.changeAmount);
      if (magnitudeDelta !== 0) return magnitudeDelta;
      return left.productName.localeCompare(right.productName, 'sv');
    })
    .slice(0, limit)
    .map((item, index) => ({ rank: index + 1, ...item }));
}

export function summarizeTrendingProductPriceChanges(input: TrendingPriceChangeInput): TrendingProductPriceChange[] {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 10);
  const windowDays = Math.min(Math.max(input.windowDays ?? 7, 1), 31);
  const untilMs = Date.parse(input.asOf);
  if (Number.isNaN(untilMs)) throw new Error(`Invalid trending price asOf date: ${input.asOf}`);
  const sinceMs = untilMs - windowDays * 24 * 60 * 60 * 1000;
  const byProduct = new Map<string, TrendingPriceChangePoint[]>();

  for (const point of input.points) {
    const observedMs = Date.parse(point.observedAt);
    if (!Number.isFinite(point.price) || Number.isNaN(observedMs) || observedMs > untilMs) continue;
    byProduct.set(point.productId, [...(byProduct.get(point.productId) ?? []), point]);
  }

  const ranked: Omit<TrendingProductPriceChange, 'rank'>[] = [];
  for (const points of byProduct.values()) {
    const sorted = [...points].sort(sortTrendingPriceChangePoints);
    let previous: TrendingPriceChangePoint | undefined;
    const windowChanges: Array<{ previous: TrendingPriceChangePoint; latest: TrendingPriceChangePoint }> = [];
    let windowObservationCount = 0;

    for (const point of sorted) {
      const observedMs = Date.parse(point.observedAt);
      if (observedMs >= sinceMs && observedMs <= untilMs) {
        windowObservationCount += 1;
        if (previous && !sameObservedPrice(previous.price, point.price)) {
          windowChanges.push({ previous, latest: point });
        }
      }
      previous = point;
    }

    const latestChange = windowChanges.at(-1);
    if (!latestChange) continue;
    const latestPoint = latestChange.latest;
    const previousPoint = latestChange.previous;
    const changeAmount = latestPoint.price - previousPoint.price;
    ranked.push({
      productId: latestPoint.productId,
      productSlug: latestPoint.productSlug,
      productName: latestPoint.productName,
      ...(latestPoint.brand ? { brand: latestPoint.brand } : {}),
      ...(latestPoint.categoryLabel ? { categoryLabel: latestPoint.categoryLabel } : {}),
      changeCount: windowChanges.length,
      observationCount: windowObservationCount,
      latestPrice: latestPoint.price,
      previousPrice: previousPoint.price,
      changeAmount,
      changePercent: previousPoint.price > 0 ? (changeAmount / previousPoint.price) * 100 : 0,
      currency: latestPoint.currency,
      latestObservedAt: latestPoint.observedAt,
      ...(latestPoint.chainSlug ? { chainSlug: latestPoint.chainSlug } : {}),
      ...(latestPoint.chainName ? { chainName: latestPoint.chainName } : {}),
      ...(latestPoint.storeSlug ? { storeSlug: latestPoint.storeSlug } : {}),
      ...(latestPoint.storeName ? { storeName: latestPoint.storeName } : {})
    });
  }

  return rankTrendingPriceChanges(ranked, limit);
}

function mapTrendingPriceChangeRow(row: TrendingPriceChangeRow): TrendingProductPriceChange {
  return {
    rank: Number(row.rank),
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    ...(row.brand ? { brand: row.brand } : {}),
    ...(row.category_label ? { categoryLabel: row.category_label } : {}),
    changeCount: Number(row.change_count),
    observationCount: Number(row.observation_count),
    latestPrice: Number(row.latest_price),
    previousPrice: Number(row.previous_price),
    changeAmount: Number(row.change_amount),
    changePercent: Number(row.change_percent),
    currency: row.currency,
    latestObservedAt: asIso(row.latest_observed_at),
    ...(row.chain_slug ? { chainSlug: row.chain_slug } : {}),
    ...(row.chain_name ? { chainName: row.chain_name } : {}),
    ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
    ...(row.store_name ? { storeName: row.store_name } : {})
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
    isAvailable: row.is_available !== false,
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

function mapStoreCatalog(row: StoreCatalogRow): StoreCatalogRecord {
  return {
    storeId: row.id,
    chainId: row.chain_id,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    slug: row.slug,
    ...(row.external_ref ? { externalRef: row.external_ref } : {}),
    name: row.name,
    addressLine1: row.address_line1,
    ...(row.address_line2 ? { addressLine2: row.address_line2 } : {}),
    ...(row.postal_code ? { postalCode: row.postal_code } : {}),
    city: row.city,
    ...(row.region ? { region: row.region } : {}),
    countryCode: row.country_code,
    ...(row.longitude === null ? {} : { longitude: Number(row.longitude) }),
    ...(row.latitude === null ? {} : { latitude: Number(row.latitude) }),
    storeType: row.store_type,
    openingHours: asRecord(row.opening_hours),
    ...(row.online_order_url ? { onlineOrderUrl: row.online_order_url } : {}),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

function mapCatalogProductCoverage(row: CatalogProductCoverageRow): CatalogProductCoverageRecord {
  return {
    id: row.product_id,
    categoryId: row.category_id ?? 'uncategorized',
    observedChainIds: [...(row.observed_chain_ids ?? [])].sort(),
    observedStoreIds: [...(row.observed_store_ids ?? [])].sort(),
    observedPriceTypes: [...(row.observed_price_types ?? [])].sort(),
    observedStorePriceTypes: [...(row.observed_store_price_types ?? [])].sort()
  };
}

function mapProductAlias(row: ProductAliasRow): ProductAliasRecord {
  return {
    aliasId: row.id,
    productId: row.product_id,
    alias: row.alias,
    normalizedAlias: row.normalized_alias,
    sourceType: row.source_type,
    ...(row.source_ref ? { sourceRef: row.source_ref } : {}),
    matchConfidence: Number(row.match_confidence),
    ...(row.reviewed_at ? { reviewedAt: asIso(row.reviewed_at) } : {}),
    createdAt: asIso(row.created_at)
  };
}

function mapBasketImportReview(row: BasketImportReviewRow): BasketImportReviewRecord {
  return {
    reviewItemId: row.review_item_id,
    rawName: row.raw_name,
    quantity: Number(row.quantity),
    reason: row.reason,
    retailerId: row.retailer_id,
    sourceKind: row.source_kind,
    capturedAt: asIso(row.captured_at),
    status: row.status,
    createdAt: asIso(row.created_at),
    ...(row.resolved_at ? { resolvedAt: asIso(row.resolved_at) } : {}),
    ...(row.resolved_product_id ? { resolvedProductId: row.resolved_product_id } : {})
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

function mapPantryItem(row: PantryItemRow): PantryItemRecord {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    name: row.name,
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    minimumQuantity: Number(row.minimum_quantity),
    ...(row.target_quantity === null ? {} : { targetQuantity: Number(row.target_quantity) }),
    ...(row.expires_on ? { expiresOn: asIso(row.expires_on).slice(0, 10) } : {}),
    updatedAt: asIso(row.updated_at)
  };
}

function mapReceiptItem(row: ReceiptItemRow): ReceiptItemRecord {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    rawName: row.raw_name,
    ...(row.product_id ? { productId: row.product_id } : {}),
    ...(row.canonical_name ? { canonicalName: row.canonical_name } : {}),
    quantity: Number(row.quantity),
    itemTotal: Number(row.item_total),
    ...(row.match_confidence === null ? {} : { matchConfidence: Number(row.match_confidence) })
  };
}

function mapReceiptUpload(row: ReceiptUploadRow, items: ReceiptItemRecord[]): ReceiptUploadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    ...(row.store_id ? { storeId: row.store_id } : {}),
    imageUri: row.image_uri,
    purchasedAt: asIso(row.purchased_at),
    totalAmount: Number(row.total_amount),
    ocrConfidence: Number(row.ocr_confidence),
    status: row.status,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
    items
  };
}

function mapHouseholdPlan(
  row: HouseholdPlanRow,
  members: HouseholdMemberRecord[],
  basketItems: HouseholdBasketItemRecord[],
  watchlistItems: HouseholdWatchlistItemRecord[],
  sharedFavoriteStoreIds: string[]
): HouseholdPlanRecord {
  return {
    householdId: row.id,
    userId: row.user_id,
    name: row.name,
    weeklyBudget: Number(row.weekly_budget),
    approvalLimit: Number(row.approval_limit),
    reviewer: row.reviewer_user_id,
    members,
    basketItems,
    watchlistItems,
    sharedFavoriteStoreIds,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

function mapAlertRule(row: AlertRuleRow): AlertRuleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    ...(row.store_id ? { storeId: row.store_id } : {}),
    channel: row.channel,
    alertType: row.alert_type,
    ...(row.target_price === null ? {} : { targetPrice: Number(row.target_price) }),
    ...(row.deal_score_threshold === null ? {} : { dealScoreThreshold: Number(row.deal_score_threshold) }),
    active: row.active,
    createdAt: asIso(row.created_at),
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

    async deleteUserAccount(userId) {
      for (const query of buildUserAccountDeletionQueries(userId)) {
        await executor.query(query.sql, query.values);
      }
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
      const allowedPriceTypes = normalizeWatchlistAllowedPriceTypes(item.allowedPriceTypes);
      await executor.query(
        `insert into watchlist_items(user_id, product_id, target_price, alert_deal_score_at, favorite_stores_only, allowed_price_types)
         values ($1, $2, $3, $4, $5, $6)`,
        [userId, item.productId, item.targetPrice ?? null, item.alertDealScoreAt ?? null, item.favoriteStoresOnly, allowedPriceTypes]
      );
    },

    async getWatchlist(userId) {
      const rows = await executor.query<WatchlistRow>(
        'select product_id, target_price, alert_deal_score_at, favorite_stores_only, allowed_price_types from watchlist_items where user_id = $1 order by id',
        [userId]
      );
      return rows.map((row) => ({
        productId: row.product_id,
        targetPrice: row.target_price === null ? undefined : Number(row.target_price),
        alertDealScoreAt: row.alert_deal_score_at ?? undefined,
        favoriteStoresOnly: row.favorite_stores_only,
        allowedPriceTypes: normalizeWatchlistAllowedPriceTypes(row.allowed_price_types)
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

    async saveBasketImportReviewItems(userId, items) {
      for (const item of items) {
        await executor.query(
          `insert into basket_import_review_items(
             user_id, review_item_id, raw_name, quantity, reason, retailer_id, source_kind, captured_at, status, created_at, resolved_at, resolved_product_id
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           on conflict (user_id, review_item_id) do update set
             raw_name = excluded.raw_name,
             quantity = excluded.quantity,
             reason = excluded.reason,
             retailer_id = excluded.retailer_id,
             source_kind = excluded.source_kind,
             captured_at = excluded.captured_at,
             status = excluded.status,
             created_at = excluded.created_at,
             resolved_at = excluded.resolved_at,
             resolved_product_id = excluded.resolved_product_id`,
          [
            userId,
            item.reviewItemId,
            item.rawName,
            item.quantity,
            item.reason,
            item.retailerId,
            item.sourceKind,
            item.capturedAt,
            item.status,
            item.createdAt,
            item.resolvedAt ?? null,
            item.resolvedProductId ?? null
          ]
        );
      }
    },

    async listOpenBasketImportReviewItems(userId) {
      const rows = await executor.query<BasketImportReviewRow>(
        `select review_item_id, raw_name, quantity, reason, retailer_id, source_kind, captured_at, status, created_at, resolved_at, resolved_product_id
         from basket_import_review_items
         where user_id = $1 and status = 'open'
         order by created_at, review_item_id`,
        [userId]
      );
      return rows.map(mapBasketImportReview);
    },

    async resolveBasketImportReviewItem(userId, reviewItemId, resolution) {
      const rows = await executor.query<BasketImportReviewRow>(
        `update basket_import_review_items
         set status = $3,
             resolved_at = $4,
             resolved_product_id = $5,
             quantity = coalesce($6, quantity)
         where user_id = $1 and review_item_id = $2 and status = 'open'
         returning review_item_id, raw_name, quantity, reason, retailer_id, source_kind, captured_at, status, created_at, resolved_at, resolved_product_id`,
        [userId, reviewItemId, resolution.status, resolution.resolvedAt, resolution.resolvedProductId ?? null, resolution.quantity ?? null]
      );
      const row = rows[0];
      if (!row) throw new Error(`Basket import review item not found: ${reviewItemId}`);
      return mapBasketImportReview(row);
    },

    async upsertPantryItem(item) {
      await executor.query(
        `insert into pantry_items(
           id, user_id, product_id, name, category, quantity, unit, minimum_quantity, target_quantity, expires_on, updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (id) do update set
           user_id = excluded.user_id,
           product_id = excluded.product_id,
           name = excluded.name,
           category = excluded.category,
           quantity = excluded.quantity,
           unit = excluded.unit,
           minimum_quantity = excluded.minimum_quantity,
           target_quantity = excluded.target_quantity,
           expires_on = excluded.expires_on,
           updated_at = excluded.updated_at`,
        [
          item.id,
          item.userId,
          item.productId,
          item.name,
          item.category,
          item.quantity,
          item.unit,
          item.minimumQuantity,
          item.targetQuantity ?? null,
          item.expiresOn ?? null,
          item.updatedAt
        ]
      );
    },

    async listPantryItems(userId) {
      const rows = await executor.query<PantryItemRow>(
        `select id, user_id, product_id, name, category, quantity, unit, minimum_quantity, target_quantity, expires_on, updated_at
         from pantry_items
         where user_id = $1
         order by category, name, product_id, id`,
        [userId]
      );
      return rows.map(mapPantryItem);
    },

    async upsertReceiptUpload(upload) {
      await executor.query(
        `insert into receipt_uploads(
           id, user_id, store_id, image_uri, purchased_at, total_amount, ocr_confidence, status, created_at, updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do update set
           user_id = excluded.user_id,
           store_id = excluded.store_id,
           image_uri = excluded.image_uri,
           purchased_at = excluded.purchased_at,
           total_amount = excluded.total_amount,
           ocr_confidence = excluded.ocr_confidence,
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [
          upload.id,
          upload.userId,
          upload.storeId ?? null,
          upload.imageUri,
          upload.purchasedAt,
          upload.totalAmount,
          upload.ocrConfidence,
          upload.status,
          upload.createdAt,
          upload.updatedAt
        ]
      );
      await executor.query('delete from receipt_items where receipt_id = $1', [upload.id]);
      for (const item of upload.items) {
        await executor.query(
          `insert into receipt_items(
             id, receipt_id, raw_name, product_id, canonical_name, quantity, item_total, match_confidence
           ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            item.id,
            upload.id,
            item.rawName,
            item.productId ?? null,
            item.canonicalName ?? null,
            item.quantity,
            item.itemTotal,
            item.matchConfidence ?? null
          ]
        );
      }
    },

    async listReceiptUploads(userId) {
      const receiptRows = await executor.query<ReceiptUploadRow>(
        `select id, user_id, store_id, image_uri, purchased_at, total_amount, ocr_confidence, status, created_at, updated_at
         from receipt_uploads
         where user_id = $1
         order by purchased_at desc, id`,
        [userId]
      );
      if (receiptRows.length === 0) return [];
      const receiptIds = receiptRows.map((row) => row.id);
      const itemRows = await executor.query<ReceiptItemRow>(
        `select id, receipt_id, raw_name, product_id, canonical_name, quantity, item_total, match_confidence
         from receipt_items
         where receipt_id = any($1::text[])
         order by receipt_id, id`,
        [receiptIds]
      );
      const itemsByReceiptId = new Map<string, ReceiptItemRecord[]>();
      for (const item of itemRows.map(mapReceiptItem)) {
        const items = itemsByReceiptId.get(item.receiptId) ?? [];
        items.push(item);
        itemsByReceiptId.set(item.receiptId, items);
      }
      return receiptRows.map((row) => mapReceiptUpload(row, itemsByReceiptId.get(row.id) ?? []));
    },

    async upsertHouseholdPlan(plan) {
      await executor.query(
        `insert into household_plans(
           id, user_id, name, weekly_budget, approval_limit, reviewer_user_id, created_at, updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (id) do update set
           user_id = excluded.user_id,
           name = excluded.name,
           weekly_budget = excluded.weekly_budget,
           approval_limit = excluded.approval_limit,
           reviewer_user_id = excluded.reviewer_user_id,
           updated_at = excluded.updated_at`,
        [
          plan.householdId,
          plan.userId,
          plan.name,
          plan.weeklyBudget,
          plan.approvalLimit,
          plan.reviewer,
          plan.createdAt,
          plan.updatedAt
        ]
      );
      await executor.query('delete from household_favorite_stores where household_id = $1', [plan.householdId]);
      await executor.query('delete from household_watchlist_items where household_id = $1', [plan.householdId]);
      await executor.query('delete from household_basket_items where household_id = $1', [plan.householdId]);
      await executor.query('delete from household_members where household_id = $1', [plan.householdId]);

      for (const member of plan.members) {
        await executor.query(
          'insert into household_members(household_id, user_id, display_name, role) values ($1, $2, $3, $4)',
          [plan.householdId, member.userId, member.displayName, member.role ?? 'editor']
        );
      }
      for (const [linePosition, item] of plan.basketItems.entries()) {
        await executor.query(
          `insert into household_basket_items(household_id, line_position, product_id, quantity, added_by, checked, checked_by, checked_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            plan.householdId,
            linePosition,
            item.productId,
            item.quantity,
            item.addedBy,
            item.checked ?? false,
            item.checkedBy ?? null,
            item.checkedAt ?? null
          ]
        );
      }
      for (const [linePosition, item] of plan.watchlistItems.entries()) {
        await executor.query(
          `insert into household_watchlist_items(household_id, line_position, product_id, added_by, target_price)
           values ($1, $2, $3, $4, $5)`,
          [plan.householdId, linePosition, item.productId, item.addedBy, item.targetPrice ?? null]
        );
      }
      for (const storeId of plan.sharedFavoriteStoreIds) {
        await executor.query(
          'insert into household_favorite_stores(household_id, store_id) values ($1, $2) on conflict (household_id, store_id) do nothing',
          [plan.householdId, storeId]
        );
      }
    },

    async getHouseholdPlan(userId) {
      const planRows = await executor.query<HouseholdPlanRow>(
        `select id, user_id, name, weekly_budget, approval_limit, reviewer_user_id, created_at, updated_at
         from household_plans
         where user_id = $1`,
        [userId]
      );
      const plan = planRows[0];
      if (!plan) return null;
      const householdId = plan.id;
      const [memberRows, basketRows, watchlistRows, favoriteStoreRows] = await Promise.all([
        executor.query<HouseholdMemberRow>(
          `select household_id, user_id, display_name, role
           from household_members
           where household_id = $1
           order by user_id`,
          [householdId]
        ),
        executor.query<HouseholdBasketItemRow>(
          `select household_id, line_position, product_id, quantity, added_by, checked, checked_by, checked_at
           from household_basket_items
           where household_id = $1
           order by line_position`,
          [householdId]
        ),
        executor.query<HouseholdWatchlistItemRow>(
          `select household_id, line_position, product_id, added_by, target_price
           from household_watchlist_items
           where household_id = $1
           order by line_position`,
          [householdId]
        ),
        executor.query<HouseholdFavoriteStoreRow>(
          `select household_id, store_id
           from household_favorite_stores
           where household_id = $1
           order by store_id`,
          [householdId]
        )
      ]);

      return mapHouseholdPlan(
        plan,
        memberRows.map((row) => ({ userId: row.user_id, displayName: row.display_name, ...(row.role ? { role: row.role } : {}) })),
        basketRows.map((row) => ({
          productId: row.product_id,
          quantity: Number(row.quantity),
          addedBy: row.added_by,
          checked: row.checked ?? false,
          ...(row.checked_by ? { checkedBy: row.checked_by } : {}),
          ...(row.checked_at ? { checkedAt: asIso(row.checked_at) } : {})
        })),
        watchlistRows.map((row) => ({
          productId: row.product_id,
          addedBy: row.added_by,
          ...(row.target_price === null ? {} : { targetPrice: Number(row.target_price) })
        })),
        favoriteStoreRows.map((row) => row.store_id)
      );
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
    },

    async upsertAlertRule(rule) {
      await executor.query(
        `insert into alert_rules(
           id, user_id, product_id, store_id, channel, alert_type, target_price, deal_score_threshold, active, created_at, updated_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (id) do update set
           user_id = excluded.user_id,
           product_id = excluded.product_id,
           store_id = excluded.store_id,
           channel = excluded.channel,
           alert_type = excluded.alert_type,
           target_price = excluded.target_price,
           deal_score_threshold = excluded.deal_score_threshold,
           active = excluded.active,
           updated_at = excluded.updated_at`,
        [
          rule.id,
          rule.userId,
          rule.productId,
          rule.storeId ?? null,
          rule.channel,
          rule.alertType,
          rule.targetPrice ?? null,
          rule.dealScoreThreshold ?? null,
          rule.active,
          rule.createdAt,
          rule.updatedAt
        ]
      );
    },

    async listActiveAlertRules(userId) {
      const rows = await executor.query<AlertRuleRow>(
        `select id, user_id, product_id, store_id, channel, alert_type, target_price, deal_score_threshold, active, created_at, updated_at
         from alert_rules
         where user_id = $1 and active = true
         order by product_id, alert_type, id`,
        [userId]
      );
      return rows.map(mapAlertRule);
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

type IdRow = { id: string };

function normalizeImportSlug(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('Open Prices import slug must contain at least one alphanumeric character.');
  return slug;
}

function normalizeAlias(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) throw new Error('Open Prices alias must be non-empty.');
  return normalized;
}

function contentHashForPayload(payload: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function mapOpenPricesPriceType(value: string): PriceType {
  if (value === 'online' || value === 'member' || value === 'receipt' || value === 'estimated') return value;
  if (value === 'flyer') return 'promotion';
  if (value === 'in_store' || value === 'shelf_photo') return 'shelf';
  if (value === 'manual') return 'community';
  throw new Error(`Unsupported Open Prices artifact priceType: ${value}`);
}

function validateOpenPricesArtifact(artifact: OpenPricesNormalizedArtifact): void {
  if (artifact.status !== 'passed' || artifact.acceptedObservations.length === 0) {
    throw new Error('persistOpenPricesArtifact requires a passed Open Prices artifact with at least one accepted observation.');
  }
  if (!artifact.sourceUrl?.trim()) throw new Error('Open Prices artifact sourceUrl is required.');
  if (!artifact.contentHash?.startsWith('sha256:')) throw new Error('Open Prices artifact contentHash must start with sha256:.');
  if (!artifact.rawSnapshotRef?.trim()) throw new Error('Open Prices artifact rawSnapshotRef is required.');
  if (Number.isNaN(Date.parse(artifact.retrievedAt))) throw new Error('Open Prices artifact retrievedAt must be an ISO date.');

  artifact.acceptedObservations.forEach((row, index) => {
    const path = `acceptedObservations[${index}]`;
    if (!row.product.id.trim()) throw new Error(`${path}.product.id is required.`);
    if (!row.product.canonicalName.trim()) throw new Error(`${path}.product.canonicalName is required.`);
    if (!row.product.comparableUnit.trim()) throw new Error(`${path}.product.comparableUnit is required.`);
    if (!row.alias.rawName.trim()) throw new Error(`${path}.alias.rawName is required.`);
    if (!Number.isFinite(row.alias.matchConfidence) || row.alias.matchConfidence < 0 || row.alias.matchConfidence > 1) {
      throw new Error(`${path}.alias.matchConfidence must be between 0 and 1.`);
    }
    if (!row.priceObservation.chainId.trim()) throw new Error(`${path}.priceObservation.chainId is required.`);
    if (!Number.isFinite(row.priceObservation.price) || row.priceObservation.price < 0) throw new Error(`${path}.priceObservation.price must be non-negative.`);
    if (!Number.isFinite(row.priceObservation.unitPrice) || row.priceObservation.unitPrice < 0) {
      throw new Error(`${path}.priceObservation.unitPrice must be non-negative.`);
    }
    if (row.priceObservation.currency !== 'SEK') throw new Error(`${path}.priceObservation.currency must be SEK.`);
    if (Number.isNaN(Date.parse(row.priceObservation.observedAt))) throw new Error(`${path}.priceObservation.observedAt must be an ISO date.`);
    if (!Number.isFinite(row.priceObservation.confidenceScore) || row.priceObservation.confidenceScore < 0 || row.priceObservation.confidenceScore > 1) {
      throw new Error(`${path}.priceObservation.confidenceScore must be between 0 and 1.`);
    }
    mapOpenPricesPriceType(row.priceObservation.priceType);
  });
}

async function upsertOpenPricesChain(executor: QueryExecutor, chainSlug: string): Promise<string> {
  const slug = normalizeImportSlug(chainSlug);
  const rows = await executor.query<IdRow>(
    `insert into chains(slug, name, country_code)
     values ($1, $2, $3)
     on conflict (slug) do update set
       name = excluded.name,
       country_code = excluded.country_code,
       updated_at = now()
     returning id`,
    [slug, slug, 'SE']
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Open Prices chain upsert did not return an id: ${slug}`);
  return id;
}

async function upsertOpenPricesProduct(executor: QueryExecutor, product: OpenPricesArtifactProduct): Promise<string> {
  const slug = normalizeImportSlug(product.id);
  const rows = await executor.query<IdRow>(
    `insert into products(
       slug,
       canonical_name,
       brand,
       category_path,
       package_size,
       package_unit,
       comparable_unit
     ) values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (slug) do update set
       canonical_name = excluded.canonical_name,
       brand = excluded.brand,
       category_path = excluded.category_path,
       package_size = excluded.package_size,
       package_unit = excluded.package_unit,
       comparable_unit = excluded.comparable_unit,
       updated_at = now()
     returning id`,
    [
      slug,
      product.canonicalName,
      product.brand ?? null,
      product.categoryId ? [product.categoryId] : [],
      product.packageSize ?? null,
      product.packageUnit ?? null,
      product.comparableUnit
    ]
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Open Prices product upsert did not return an id: ${slug}`);
  return id;
}

export async function persistOpenPricesArtifact(
  executor: QueryExecutor,
  artifact: OpenPricesNormalizedArtifact
): Promise<OpenPricesArtifactPersistenceResult> {
  validateOpenPricesArtifact(artifact);
  const sourceWriter = createPostgresSourceRecordWriter(executor);
  const aliasRepository = createPostgresProductAliasRepository(executor);
  const priceWriter = createPostgresPriceObservationWriter(executor);
  const sourceRun = await sourceWriter.createSourceRun({
    sourceType: 'official_api',
    sourceName: 'Open Food Facts Open Prices',
    sourceUrl: artifact.sourceUrl,
    startedAt: artifact.retrievedAt,
    status: 'running',
    provenance: {
      source: 'open_prices',
      sourceUrl: artifact.sourceUrl,
      contentHash: artifact.contentHash,
      rawSnapshotRef: artifact.rawSnapshotRef,
      acceptedCount: artifact.acceptedObservations.length
    }
  });

  const rawRecordIds: string[] = [];
  const observationIds: string[] = [];
  const productIds = new Set<string>();
  const chainIds = new Set<string>();

  for (const accepted of artifact.acceptedObservations) {
    const priceObservation = accepted.priceObservation;
    const chainId = await upsertOpenPricesChain(executor, priceObservation.chainId);
    const productId = await upsertOpenPricesProduct(executor, accepted.product);
    chainIds.add(chainId);
    productIds.add(productId);

    await aliasRepository.upsertProductAlias({
      productId,
      alias: accepted.alias.rawName,
      normalizedAlias: normalizeAlias(accepted.alias.rawName),
      sourceType: 'import',
      sourceRef: artifact.contentHash,
      matchConfidence: accepted.alias.matchConfidence
    });

    const payload = {
      product: accepted.product,
      alias: accepted.alias,
      priceObservation,
      promotionObservation: accepted.promotionObservation ?? null
    };
    const rawRecord = await sourceWriter.upsertRawRecord({
      sourceRunId: sourceRun.sourceRunId,
      recordType: 'price',
      externalRef: priceObservation.retailerProductId ?? accepted.product.id,
      observedAt: priceObservation.observedAt,
      payload,
      payloadHash: contentHashForPayload({
        contentHash: artifact.contentHash,
        productId: accepted.product.id,
        retailerProductId: priceObservation.retailerProductId ?? null,
        observedAt: priceObservation.observedAt,
        price: priceObservation.price
      }),
      provenance: {
        source: 'open_prices',
        sourceUrl: priceObservation.sourceUrl ?? artifact.sourceUrl,
        contentHash: artifact.contentHash,
        rawSnapshotRef: priceObservation.rawSnapshotRef || artifact.rawSnapshotRef,
        parserVersion: priceObservation.parserVersion
      }
    });
    rawRecordIds.push(rawRecord.rawRecordId);

    const provenance = {
      ...(priceObservation.provenance ?? {}),
      source: 'open_prices',
      sourceUrl: priceObservation.sourceUrl ?? artifact.sourceUrl,
      contentHash: artifact.contentHash,
      rawSnapshotRef: priceObservation.rawSnapshotRef || artifact.rawSnapshotRef,
      parserVersion: priceObservation.parserVersion
    };
    const observation = await priceWriter.recordPriceObservation({
      productId,
      chainId,
      sourceRunId: sourceRun.sourceRunId,
      rawRecordId: rawRecord.rawRecordId,
      retailerProductRef: priceObservation.retailerProductId,
      priceType: mapOpenPricesPriceType(priceObservation.priceType),
      price: priceObservation.price,
      regularPrice: priceObservation.regularPrice,
      unitPrice: priceObservation.unitPrice,
      currency: priceObservation.currency,
      quantity: accepted.product.packageSize,
      quantityUnit: accepted.product.packageUnit,
      promotionText: accepted.promotionObservation?.promoText,
      memberRequired: accepted.promotionObservation?.memberOnly ?? false,
      observedAt: priceObservation.observedAt,
      confidence: priceObservation.confidenceScore,
      provenance
    });
    observationIds.push(observation.observationId);
  }

  await sourceWriter.finishSourceRun({
    sourceRunId: sourceRun.sourceRunId,
    status: 'succeeded'
  });

  return {
    status: 'persisted',
    sourceRunId: sourceRun.sourceRunId,
    acceptedCount: artifact.acceptedObservations.length,
    rawRecordIds,
    observationIds,
    productIds: [...productIds],
    chainIds: [...chainIds]
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
      const limit = Math.min(Math.max(filter.limit ?? 50, 1), 500);
      const rawPage = Math.trunc(filter.page ?? 1);
      const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
      const offset = (page - 1) * limit;
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
         cross join (select nullif(trim($1::text), '') as term) as query
         where (
             query.term is null
             or products.barcode = query.term
             or products.canonical_name ilike '%' || query.term || '%'
             or products.slug ilike '%' || query.term || '%'
             or products.canonical_name % query.term
             or products.slug % query.term
             or exists (
               select 1
               from aliases
               where aliases.product_id = products.id
                 and (
                   aliases.normalized_alias ilike '%' || lower(query.term) || '%'
                   or aliases.normalized_alias % lower(query.term)
                 )
             )
           )
           and ($2::text[] is null or category_path @> $2::text[])
         order by case
                    when query.term is null then 5
                    when products.barcode = query.term then 0
                    when lower(products.canonical_name) = lower(query.term) then 1
                    when lower(products.canonical_name) like lower(query.term) || '%' then 2
                    when exists (
                      select 1
                      from aliases
                      where aliases.product_id = products.id
                      and aliases.normalized_alias % lower(query.term)
                    ) then 3
                    else 4
                  end,
                  greatest(similarity(products.canonical_name, coalesce(query.term, '')), similarity(products.slug, coalesce(query.term, ''))) desc,
                  canonical_name,
                  slug
         limit $3
         offset $4`,
        [filter.search ?? null, filter.categoryPath ?? null, limit, offset]
      );
      return rows.map(mapProductCatalog);
    },

    async getStoreBySlug(slug) {
      const rows = await executor.query<StoreCatalogRow>(
        `select stores.id,
                stores.chain_id,
                chains.slug as chain_slug,
                chains.name as chain_name,
                stores.slug,
                stores.external_ref,
                stores.name,
                stores.address_line1,
                stores.address_line2,
                stores.postal_code,
                stores.city,
                stores.region,
                stores.country_code,
                case when stores.position is null then null else ST_X(stores.position::geometry) end as longitude,
                case when stores.position is null then null else ST_Y(stores.position::geometry) end as latitude,
                stores.store_type,
                stores.opening_hours,
                stores.online_order_url,
                stores.created_at,
                stores.updated_at
         from stores
         join chains on chains.id = stores.chain_id
         where stores.slug = $1`,
        [slug]
      );
      const row = rows[0];
      return row ? mapStoreCatalog(row) : null;
    },

    async listStores(filter = {}) {
      const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
      const rows = await executor.query<StoreCatalogRow>(
        `select stores.id,
                stores.chain_id,
                chains.slug as chain_slug,
                chains.name as chain_name,
                stores.slug,
                stores.external_ref,
                stores.name,
                stores.address_line1,
                stores.address_line2,
                stores.postal_code,
                stores.city,
                stores.region,
                stores.country_code,
                case when stores.position is null then null else ST_X(stores.position::geometry) end as longitude,
                case when stores.position is null then null else ST_Y(stores.position::geometry) end as latitude,
                stores.store_type,
                stores.opening_hours,
                stores.online_order_url,
                stores.created_at,
                stores.updated_at
         from stores
         join chains on chains.id = stores.chain_id
         cross join (select nullif(trim($1::text), '') as query) as search
         where (
             search.query is null
             or stores.name ilike '%' || search.query || '%'
             or stores.slug ilike '%' || search.query || '%'
             or chains.name ilike '%' || search.query || '%'
             or stores.name % search.query
             or stores.slug % search.query
             or chains.name % search.query
           )
           and ($2::text is null or chains.slug = $2)
           and ($3::text is null or stores.city = $3)
         order by case
                    when search.query is null then 4
                    when lower(stores.name) = lower(search.query) then 0
                    when lower(stores.name) like lower(search.query) || '%' then 1
                    when lower(chains.name) = lower(search.query) then 2
                    else 3
                  end,
                  greatest(similarity(stores.name, coalesce(search.query, '')), similarity(stores.slug, coalesce(search.query, '')), similarity(chains.name, coalesce(search.query, ''))) desc,
                  stores.city,
                  chains.name,
                  stores.name,
                  stores.slug
         limit $4`,
        [filter.search ?? null, filter.chainSlug ?? null, filter.city ?? null, limit]
      );
      return rows.map(mapStoreCatalog);
    },

    async listProductCoverageRows(filter = {}) {
      const limit = Math.min(Math.max(filter.limit ?? 5000, 1), 50_000);
      const rows = await executor.query<CatalogProductCoverageRow>(
        `select products.id as product_id,
                coalesce(products.category_path[1], 'uncategorized') as category_id,
                coalesce(array_agg(distinct replace(chains.slug, '-', '_')) filter (where chains.slug is not null), '{}') as observed_chain_ids,
                coalesce(
                  array_agg(distinct coalesce(stores.external_ref, stores.slug, latest_prices.store_id::text))
                    filter (where latest_prices.store_id is not null),
                  '{}'
                ) as observed_store_ids,
                coalesce(
                  array_agg(distinct latest_prices.price_type)
                    filter (where latest_prices.price_type is not null),
                  '{}'
                ) as observed_price_types,
                coalesce(
                  array_agg(distinct coalesce(stores.external_ref, stores.slug, latest_prices.store_id::text) || ':' || latest_prices.price_type)
                    filter (where latest_prices.store_id is not null and latest_prices.price_type is not null),
                  '{}'
                ) as observed_store_price_types
         from products
         left join latest_prices on latest_prices.product_id = products.id
         left join chains on chains.id = latest_prices.chain_id
         left join stores on stores.id = latest_prices.store_id
         group by products.id, products.category_path
         order by products.id
         limit $1`,
        [limit]
      );
      return rows.map(mapCatalogProductCoverage);
    }
  };
}

export function createPostgresProductAliasRepository(executor: QueryExecutor): PostgresProductAliasRepository {
  return {
    async upsertProductAlias(alias) {
      const rows = await executor.query<ProductAliasRow>(
        `insert into aliases(
           product_id,
           alias,
           normalized_alias,
           source_type,
           source_ref,
           match_confidence,
           reviewed_at
         ) values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (normalized_alias, source_type, source_ref) do update set
           product_id = excluded.product_id,
           alias = excluded.alias,
           match_confidence = excluded.match_confidence,
           reviewed_at = excluded.reviewed_at
         returning id,
                   product_id,
                   alias,
                   normalized_alias,
                   source_type,
                   source_ref,
                   match_confidence,
                   reviewed_at,
                   created_at`,
        [
          alias.productId,
          alias.alias,
          alias.normalizedAlias,
          alias.sourceType,
          alias.sourceRef ?? null,
          alias.matchConfidence,
          alias.reviewedAt ?? null
        ]
      );
      const row = rows[0];
      if (!row) throw new Error('Product alias upsert did not return a row');
      return mapProductAlias(row);
    },

    async findProductAliases(filter) {
      const limit = Math.min(Math.max(filter.limit ?? 25, 1), 100);
      const rows = await executor.query<ProductAliasRow>(
        `select id,
                product_id,
                alias,
                normalized_alias,
                source_type,
                source_ref,
                match_confidence,
                reviewed_at,
                created_at
         from aliases
         where ($1::text is null or normalized_alias = $1)
           and ($2::uuid is null or product_id = $2::uuid)
           and ($3::text is null or source_type = $3)
         order by match_confidence desc, reviewed_at desc nulls last, created_at desc, id
         limit $4`,
        [filter.normalizedAlias ?? null, filter.productId ?? null, filter.sourceType ?? null, limit]
      );
      return rows.map(mapProductAlias);
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

export type TimescaleDbEvaluationProbe = {
  timescaleExtensionAvailable: boolean;
  hypertables: string[];
  compressionPolicies: string[];
  retentionPolicies: string[];
  fallbackTables: string[];
  fallbackFunctions: string[];
};

export type TimescaleDbEvaluationReport = {
  status: 'timescale_ready' | 'fallback_ready' | 'blocked';
  blockers: string[];
  timescaleGaps: string[];
  evidence: string[];
  recommendation: string;
  summary: string;
};

export const TIMESCALEDB_EVALUATION_HYPERTABLES = ['observations_v2'] as const;
export const TIMESCALEDB_EVALUATION_COMPRESSION_POLICIES = ['observations_v2'] as const;
export const TIMESCALEDB_EVALUATION_RETENTION_POLICIES = ['observations_v2'] as const;
export const TIMESCALEDB_EVALUATION_FALLBACK_TABLES = ['observations_v2', 'price_daily', 'price_weekly'] as const;
export const TIMESCALEDB_EVALUATION_FALLBACK_FUNCTIONS = [
  'create_observations_partitions',
  'drop_observations_partitions_before'
] as const;

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
  'fuel_grades',
  'source_runs',
  'raw_records',
  'retailer_source_policies',
  'fuel_price_sources',
  'fuel_price_source_observations',
  'observations',
  'observations_v2',
  'latest_prices',
  'price_daily',
  'price_weekly',
  'app_users',
  'favorite_stores',
  'user_preferences',
  'watchlist_items',
  'weekly_baskets',
  'basket_items',
  'basket_import_review_items',
  'human_review_assignments',
  'human_reviewers',
  'community_reporter_trust',
  'subscription_entitlements',
  'notification_tasks',
  'notification_suppressions',
  'alert_rules',
  'pantry_items',
  'receipt_uploads',
  'receipt_items',
  'household_plans',
  'household_members',
  'household_basket_items',
  'household_watchlist_items',
  'household_favorite_stores'
] as const;

export const POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS = [
  '001_groceryview_schema',
  '002_repository_support_schema',
  '003_subscription_entitlements',
  '004_alert_rules',
  '005_pantry_inventory',
  '006_source_runs_official_api',
  '007_receipt_uploads',
  '008_household_plans',
  '009_retailer_source_policies',
  '010_basket_import_reviews',
  '010_commodity_taxonomy',
  '011_multi_vertical_domains',
  '012_price_rollups',
  '013_observations_partitioning',
  '014_fuel_price_sources',
  '016_observation_connector_idempotency',
  '017_observation_availability',
  '018_household_collaboration_rls',
  '019_price_snapshot_unique_index'
] as const;

function assertProbe(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function buildPostgresRepositorySmokeProbes(input: BuildPostgresRepositorySmokeProbesInput): PostgresRepositoryProbe[] {
  const safeId = input.runId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const userId = `postgres-probe-user-${safeId}`;
  const assignmentId = `postgres-probe-assignment-${safeId}`;
  const suppressionId = `postgres-probe-suppression-${safeId}`;
  const alertRuleId = `postgres-probe-alert-${safeId}`;
  const pantryItemId = `postgres-probe-pantry-${safeId}`;
  const receiptId = `postgres-probe-receipt-${safeId}`;
  const receiptItemId = `postgres-probe-receipt-item-${safeId}`;
  const householdId = `postgres-probe-household-${safeId}`;
  const basketImportReviewId = `postgres-probe-basket-import-review-${safeId}`;
  const providerSubscriptionId = `postgres-probe-subscription-${safeId}`;
  const storeId = `postgres-probe-store-${safeId}`;
  const groceryProductId = `postgres-probe-grocery-${safeId}`;
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
      name: 'grocery_user_state_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.addFavoriteStore(userId, storeId);
        await repository.addWatchlistItem(userId, {
          productId: groceryProductId,
          targetPrice: 49.9,
          alertDealScoreAt: 80,
          favoriteStoresOnly: true
        });
        await repository.addBasketItem(userId, { productId: groceryProductId, quantity: 2 });
        const favoriteStoreIds = await repository.getFavoriteStoreIds(userId);
        const watchlist = await repository.getWatchlist(userId);
        const basket = await repository.getBasket(userId);
        assertProbe(favoriteStoreIds.includes(storeId), 'favorite store probe row was not readable');
        assertProbe(watchlist.some((item) => item.productId === groceryProductId), 'watchlist probe row was not readable');
        assertProbe(basket.some((item) => item.productId === groceryProductId && item.quantity === 2), 'basket probe row was not readable');
      }
    },
    {
      name: 'basket_import_review_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.saveBasketImportReviewItems(userId, [{
          reviewItemId: basketImportReviewId,
          rawName: 'Postgres Probe Unmatched Retailer Row',
          quantity: 1,
          reason: 'PostgreSQL integration smoke probe.',
          retailerId: 'willys',
          sourceKind: 'bookmarklet',
          capturedAt: input.now,
          status: 'open',
          createdAt: input.now
        }]);
        const openItems = await repository.listOpenBasketImportReviewItems(userId);
        assertProbe(openItems.some((item) => item.reviewItemId === basketImportReviewId && item.status === 'open'), 'basket import review probe row was not readable');
        const resolved = await repository.resolveBasketImportReviewItem(userId, basketImportReviewId, {
          status: 'dismissed',
          resolvedAt: input.now
        });
        assertProbe(resolved.status === 'dismissed', 'basket import review probe row was not resolvable');
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
      name: 'alert_rule_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.upsertAlertRule({
          id: alertRuleId,
          userId,
          productId: `postgres-probe-product-${safeId}`,
          channel: 'push',
          alertType: 'target_price',
          targetPrice: 49.9,
          active: true,
          createdAt: input.now,
          updatedAt: input.now
        });
        const alertRules = await repository.listActiveAlertRules(userId);
        assertProbe(alertRules.some((rule) => rule.id === alertRuleId), 'alert rule probe row was not readable');
      }
    },
    {
      name: 'pantry_item_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.upsertPantryItem({
          id: pantryItemId,
          userId,
          productId: `postgres-probe-product-${safeId}`,
          name: 'Postgres Probe Pantry Item',
          category: 'pantry',
          quantity: 1,
          unit: 'pcs',
          minimumQuantity: 2,
          targetQuantity: 4,
          expiresOn: '2026-06-20',
          updatedAt: input.now
        });
        const pantryItems = await repository.listPantryItems(userId);
        assertProbe(pantryItems.some((item) => item.id === pantryItemId), 'pantry item probe row was not readable');
      }
    },
    {
      name: 'receipt_upload_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.upsertReceiptUpload({
          id: receiptId,
          userId,
          imageUri: `scan://postgres-probe/${safeId}`,
          purchasedAt: input.now,
          totalAmount: 12.34,
          ocrConfidence: 0.97,
          status: 'parsed',
          createdAt: input.now,
          updatedAt: input.now,
          items: [
            {
              id: receiptItemId,
              receiptId,
              rawName: 'Postgres Probe Receipt Item',
              productId: `postgres-probe-product-${safeId}`,
              canonicalName: 'Postgres Probe Product',
              quantity: 1,
              itemTotal: 12.34,
              matchConfidence: 0.91
            }
          ]
        });
        const receipts = await repository.listReceiptUploads(userId);
        assertProbe(
          receipts.some((receipt) => receipt.id === receiptId && receipt.items.some((item) => item.id === receiptItemId)),
          'receipt upload probe row was not readable'
        );
      }
    },
    {
      name: 'household_plan_round_trip',
      async run(executor) {
        const repository = createPostgresRepository(executor);
        await repository.upsertUser({ id: userId, email: `${userId}@example.invalid` });
        await repository.upsertHouseholdPlan({
          householdId,
          userId,
          name: 'Postgres Probe Household',
          weeklyBudget: 800,
          approvalLimit: 400,
          reviewer: userId,
          members: [{ userId, displayName: 'Postgres Probe User' }],
          basketItems: [{ productId: `postgres-probe-product-${safeId}`, quantity: 1, addedBy: userId }],
          watchlistItems: [{ productId: `postgres-probe-product-${safeId}`, addedBy: userId, targetPrice: 50 }],
          sharedFavoriteStoreIds: [`postgres-probe-store-${safeId}`],
          createdAt: input.now,
          updatedAt: input.now
        });
        const householdPlan = await repository.getHouseholdPlan(userId);
        assertProbe(
          householdPlan?.householdId === householdId && householdPlan.members.some((member) => member.userId === userId),
          'household plan probe row was not readable'
        );
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

export type PostgresIntegrationReadinessSummary = {
  status: PostgresIntegrationReadinessReport['status'];
  blockers: {
    total: number;
    missingTables: number;
    missingMigrations: number;
    repositoryFailures: number;
    repositoryNotRun: number;
  };
  evidence: {
    total: number;
    tables: number;
    migrations: number;
    repositoryChecks: number;
  };
};

type TableNameRow = { table_name: string };
type MigrationVersionRow = { version: string };
type ProbeIdRow = { id: string };
type LatestPriceProbeRow = { observation_id: string };
type ObservationIdRow = { id: string };
type BatchObservationIdRow = { ordinal: string | number; id: string };
type SourceRunIdRow = { id: string };
type RawRecordIdRow = { id: string };

async function findExistingObservationId(executor: QueryExecutor, observation: PriceObservationRecord): Promise<string | undefined> {
  const rows = await executor.query<ObservationIdRow>(
    `select id
     from observations
     where product_id = $1
       and chain_id = $2
       and store_id is not distinct from $3
       and domain = $4
       and retailer_product_ref is not distinct from $5
       and price_type = $6
       and observed_at = $7
       and price = $8
       and unit_price = $9
       and currency = $10
       and is_available = $11
       and confidence = $12
       and provenance = $13::jsonb
     order by id
     limit 1`,
    [
      observation.productId,
      observation.chainId,
      observation.storeId ?? null,
      observation.domain ?? 'grocery',
      observation.retailerProductRef ?? null,
      observation.priceType,
      observation.observedAt,
      observation.price,
      observation.unitPrice,
      observation.currency ?? 'SEK',
      observation.isAvailable ?? true,
      observation.confidence,
      JSON.stringify(observation.provenance)
    ]
  );
  return rows[0]?.id;
}

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
           domain,
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
           is_available,
           observed_at,
           valid_from,
           valid_until,
           confidence,
           provenance
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
           $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb
         )
         on conflict (
           product_id,
           chain_id,
           store_id,
           domain,
           retailer_product_ref,
           price_type,
           observed_at,
           price,
           unit_price,
           currency,
           is_available,
           confidence,
           provenance
         ) do nothing
         returning id`,
        [
          observation.productId,
          observation.chainId,
          observation.storeId ?? null,
          observation.domain ?? 'grocery',
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
          observation.isAvailable ?? true,
          observation.observedAt,
          observation.validFrom ?? observation.observedAt,
          observation.validUntil ?? null,
          observation.confidence,
          provenanceJson
        ]
      );
      const observationId = rows[0]?.id ?? (await findExistingObservationId(executor, observation));
      if (!observationId) throw new Error('Price observation insert did not return an id');

      await executor.query(
        `insert into latest_prices(
           product_id,
           chain_id,
           store_id,
           domain,
           price_type,
           observation_id,
           price,
           regular_price,
           unit_price,
           currency,
           observed_at,
           is_available,
           confidence,
           provenance
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
         on conflict (product_id, chain_id, store_id, price_type) do update set
           observation_id = excluded.observation_id,
           price = excluded.price,
           regular_price = excluded.regular_price,
           unit_price = excluded.unit_price,
           currency = excluded.currency,
           observed_at = excluded.observed_at,
           is_available = excluded.is_available,
           confidence = excluded.confidence,
           domain = excluded.domain,
           provenance = excluded.provenance,
           updated_at = now()
         where latest_prices.observed_at <= excluded.observed_at`,
        [
          observation.productId,
          observation.chainId,
          observation.storeId ?? null,
          observation.domain ?? 'grocery',
          observation.priceType,
          observationId,
          observation.price,
          observation.regularPrice ?? null,
          observation.unitPrice,
          observation.currency ?? 'SEK',
          observation.observedAt,
          observation.isAvailable ?? true,
          observation.confidence,
          provenanceJson
        ]
      );

      return { observationId };
    },

    async upsertConnectorPriceObservations(observations) {
      if (observations.length === 0) return { observationIds: [] };
      const rows = await executor.query<BatchObservationIdRow>(
        `with input as (
           select *
           from jsonb_to_recordset($1::jsonb) as x(
             ordinal int,
             product_id uuid,
             chain_id uuid,
             store_id uuid,
             domain text,
             source_run_id uuid,
             raw_record_id uuid,
             retailer_product_ref text,
             price_type text,
             price numeric(12, 2),
             regular_price numeric(12, 2),
             unit_price numeric(12, 4),
             currency char(3),
             quantity numeric,
             quantity_unit text,
             promotion_text text,
             promotion_starts_on date,
             promotion_ends_on date,
             member_required boolean,
             is_available boolean,
             observed_at timestamptz,
             valid_from timestamptz,
             valid_until timestamptz,
             confidence numeric(5, 4),
             provenance jsonb
           )
         ),
         ranked_input as (
           select input.*,
                  row_number() over (
                    partition by product_id, chain_id, store_id, domain, price_type, observed_at, retailer_product_ref, price, unit_price, currency, is_available, confidence, provenance
                    order by ordinal
                  ) as input_rank
           from input
         ),
         existing as (
           select distinct on (ranked_input.ordinal)
                  ranked_input.ordinal,
                  observations.id,
                  observations.product_id,
                  observations.chain_id,
                  observations.store_id,
                  observations.domain,
                  observations.price_type,
                  observations.price,
                  observations.regular_price,
                  observations.unit_price,
                  observations.currency,
                  observations.is_available,
                  observations.observed_at,
                  observations.confidence,
                  observations.provenance
           from ranked_input
           join observations on observations.product_id = ranked_input.product_id
             and observations.chain_id = ranked_input.chain_id
             and observations.store_id is not distinct from ranked_input.store_id
             and observations.domain = ranked_input.domain
             and observations.price_type = ranked_input.price_type
             and observations.observed_at = ranked_input.observed_at
             and observations.retailer_product_ref is not distinct from ranked_input.retailer_product_ref
             and observations.price = ranked_input.price
             and observations.unit_price = ranked_input.unit_price
             and observations.currency = ranked_input.currency
             and observations.is_available = ranked_input.is_available
             and observations.confidence = ranked_input.confidence
             and observations.provenance = ranked_input.provenance
           order by ranked_input.ordinal, observations.created_at, observations.id
         ),
         inserted as (
           insert into observations(
             product_id,
             chain_id,
             store_id,
             domain,
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
             is_available,
             observed_at,
             valid_from,
             valid_until,
             confidence,
             provenance
           )
           select
             product_id,
             chain_id,
             store_id,
             domain,
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
             is_available,
             observed_at,
             valid_from,
             valid_until,
             confidence,
             provenance
           from ranked_input
           where input_rank = 1
             and not exists (
               select 1
               from existing
               where existing.ordinal = ranked_input.ordinal
             )
           on conflict (
             product_id,
             chain_id,
             store_id,
             domain,
             retailer_product_ref,
             price_type,
             observed_at,
             price,
             unit_price,
             currency,
             is_available,
             confidence,
             provenance
           ) do nothing
           returning id, product_id, chain_id, store_id, domain, retailer_product_ref, price_type, price, regular_price, unit_price, currency, is_available, observed_at, confidence, provenance
         ),
         written as (
           select ranked_input.ordinal,
                  coalesce(inserted.id, existing.id) as id,
                  coalesce(inserted.product_id, existing.product_id) as product_id,
                  coalesce(inserted.chain_id, existing.chain_id) as chain_id,
                  coalesce(inserted.store_id, existing.store_id) as store_id,
                  coalesce(inserted.domain, existing.domain) as domain,
                  coalesce(inserted.price_type, existing.price_type) as price_type,
                  coalesce(inserted.price, existing.price) as price,
                  coalesce(inserted.regular_price, existing.regular_price) as regular_price,
                  coalesce(inserted.unit_price, existing.unit_price) as unit_price,
                  coalesce(inserted.currency, existing.currency) as currency,
                  coalesce(inserted.is_available, existing.is_available) as is_available,
                  coalesce(inserted.observed_at, existing.observed_at) as observed_at,
                  coalesce(inserted.confidence, existing.confidence) as confidence,
                  coalesce(inserted.provenance, existing.provenance) as provenance
           from ranked_input
           left join existing on existing.ordinal = ranked_input.ordinal
           left join inserted on inserted.product_id = ranked_input.product_id
             and inserted.chain_id = ranked_input.chain_id
             and inserted.store_id is not distinct from ranked_input.store_id
             and inserted.domain = ranked_input.domain
             and inserted.price_type = ranked_input.price_type
             and inserted.observed_at = ranked_input.observed_at
             and inserted.retailer_product_ref is not distinct from ranked_input.retailer_product_ref
             and inserted.price = ranked_input.price
             and inserted.unit_price = ranked_input.unit_price
             and inserted.currency = ranked_input.currency
             and inserted.is_available = ranked_input.is_available
             and inserted.confidence = ranked_input.confidence
             and inserted.provenance = ranked_input.provenance
           where inserted.id is not null or existing.id is not null
         ),
         latest_upsert as (
           insert into latest_prices(
             product_id,
             chain_id,
             store_id,
             domain,
             price_type,
             observation_id,
             price,
             regular_price,
             unit_price,
             currency,
             observed_at,
             is_available,
             confidence,
             provenance
           )
           select
             product_id,
             chain_id,
             store_id,
             domain,
             price_type,
             id,
             price,
             regular_price,
             unit_price,
             currency,
             observed_at,
             is_available,
             confidence,
             provenance
           from (
             select distinct on (product_id, chain_id, store_id, price_type)
               product_id,
               chain_id,
               store_id,
               domain,
               price_type,
               id,
               price,
               regular_price,
               unit_price,
               currency,
               observed_at,
               is_available,
               confidence,
               provenance
             from written
             order by product_id, chain_id, store_id, price_type, observed_at desc, id desc
           ) latest_input
           on conflict (product_id, chain_id, store_id, price_type) do update set
             observation_id = excluded.observation_id,
             price = excluded.price,
             regular_price = excluded.regular_price,
             unit_price = excluded.unit_price,
             currency = excluded.currency,
             observed_at = excluded.observed_at,
             is_available = excluded.is_available,
             confidence = excluded.confidence,
             domain = excluded.domain,
             provenance = excluded.provenance,
             updated_at = now()
           where latest_prices.observed_at <= excluded.observed_at
           returning 1
         )
         select ordinal, id
         from written
         order by ordinal`,
        [JSON.stringify(observations.map((observation, ordinal) => ({
          ordinal,
          product_id: observation.productId,
          chain_id: observation.chainId,
          store_id: observation.storeId ?? null,
          domain: observation.domain ?? 'grocery',
          source_run_id: observation.sourceRunId ?? null,
          raw_record_id: observation.rawRecordId ?? null,
          retailer_product_ref: observation.retailerProductRef ?? null,
          price_type: observation.priceType,
          price: observation.price,
          regular_price: observation.regularPrice ?? null,
          unit_price: observation.unitPrice,
          currency: observation.currency ?? 'SEK',
          quantity: observation.quantity ?? null,
          quantity_unit: observation.quantityUnit ?? null,
          promotion_text: observation.promotionText ?? null,
          promotion_starts_on: observation.promotionStartsOn ?? null,
          promotion_ends_on: observation.promotionEndsOn ?? null,
          member_required: observation.memberRequired ?? false,
          is_available: observation.isAvailable ?? true,
          observed_at: observation.observedAt,
          valid_from: observation.validFrom ?? null,
          valid_until: observation.validUntil ?? null,
          confidence: observation.confidence,
          provenance: observation.provenance
        })))]
      );
      if (rows.length !== observations.length) throw new Error('Connector price observation upsert did not return an id for every input row');

      const idsByOrdinal = new Map(rows.map((row) => [Number(row.ordinal), row.id]));
      return {
        observationIds: observations.map((_, ordinal) => {
          const id = idsByOrdinal.get(ordinal);
          if (!id) throw new Error(`Connector price observation upsert did not return an id for input row ${ordinal}`);
          return id;
        })
      };
    }
  };
}

export function createPostgresSiteSnapshotReader(executor: QueryExecutor): PostgresSiteSnapshotReader {
  return {
    async listLatestPriceSnapshotRows(filter = {}) {
      const minConfidence = Math.min(Math.max(filter.minConfidence ?? 0, 0), 1);
      const limit = Math.min(Math.max(filter.limit ?? 10000, 1), 10000);
      const rows = await executor.query<SiteLatestPriceSnapshotRowSql>(
        `select latest_prices.product_id,
                products.slug as product_slug,
                products.canonical_name,
                products.brand,
                products.image_url,
                products.category_path,
                products.package_size,
                products.package_unit,
                products.comparable_unit,
                latest_prices.chain_id,
                chains.slug as chain_slug,
                chains.name as chain_name,
                latest_prices.store_id,
                stores.slug as store_slug,
                stores.external_ref as store_external_ref,
                stores.name as store_name,
                stores.city,
                latest_prices.price_type,
                latest_prices.observation_id,
                latest_prices.price,
                latest_prices.regular_price,
                latest_prices.unit_price,
                latest_prices.currency,
                coalesce(observations.is_available, latest_prices.is_available) as is_available,
                latest_prices.observed_at,
                latest_prices.confidence,
                observations.promotion_text,
                observations.promotion_starts_on,
                observations.promotion_ends_on,
                observations.member_required,
                observations.valid_from,
                observations.valid_until,
                observations.retailer_product_ref,
                coalesce(observations.provenance, latest_prices.provenance) as provenance
         from latest_prices
         join observations on observations.id = latest_prices.observation_id
         join products on products.id = latest_prices.product_id
         join chains on chains.id = latest_prices.chain_id
         left join stores on stores.id = latest_prices.store_id
         where latest_prices.confidence >= $1
           and latest_prices.domain = 'grocery'
         order by latest_prices.observed_at desc, products.slug, chains.slug, stores.slug nulls last, latest_prices.price_type
         limit $2`,
        [minConfidence, limit]
      );
      return rows.map(mapSiteLatestPriceSnapshotRow);
    }
  };
}

export function createPostgresWeeklyPriceDropDigestReader(executor: QueryExecutor): PostgresWeeklyPriceDropDigestReader {
  return {
    async listWeeklyPriceDropDigest(filter) {
      const limit = Math.min(Math.max(filter.limit ?? 10, 1), 10);
      const rows = await executor.query<WeeklyPriceDropDigestRow>(
        `/* weekly_price_drop_digest */
         select latest_prices.product_id,
                products.slug as product_slug,
                products.canonical_name as product_name,
                products.brand,
                chains.slug as chain_slug,
                chains.name as chain_name,
                stores.slug as store_slug,
                stores.name as store_name,
                latest_prices.price_type,
                latest_prices.price,
                latest_prices.regular_price,
                round((latest_prices.regular_price - latest_prices.price)::numeric, 2) as savings_amount,
                round((((latest_prices.regular_price - latest_prices.price) / nullif(latest_prices.regular_price, 0)) * 100)::numeric, 2) as drop_percent,
                latest_prices.currency,
                latest_prices.observed_at,
                latest_prices.confidence
         from latest_prices
         join products on products.id = latest_prices.product_id
         join chains on chains.id = latest_prices.chain_id
         left join stores on stores.id = latest_prices.store_id
         where latest_prices.domain = 'grocery'
           and latest_prices.observed_at >= $1::timestamptz
           and latest_prices.observed_at < $2::timestamptz
           and latest_prices.regular_price is not null
           and latest_prices.regular_price > latest_prices.price
           and latest_prices.price >= 0
         order by drop_percent desc, savings_amount desc, latest_prices.observed_at desc, products.slug, chains.slug, stores.slug nulls last, latest_prices.price_type
         limit $3`,
        [filter.since, filter.until, limit]
      );
      return rows.map(mapWeeklyPriceDropDigestRow);
    }
  };
}

export function createPostgresTrendingPriceChangeReader(executor: QueryExecutor): PostgresTrendingPriceChangeReader {
  return {
    async listTrendingPriceChanges(filter) {
      const limit = Math.min(Math.max(filter.limit ?? 10, 1), 10);
      const rows = await executor.query<TrendingPriceChangeRow>(
        `/* trending_price_changes */
         with observed as (
           select observations.product_id,
                  products.slug as product_slug,
                  products.canonical_name as product_name,
                  products.brand,
                  products.category_path[1] as category_label,
                  observations.chain_id,
                  chains.slug as chain_slug,
                  chains.name as chain_name,
                  observations.store_id,
                  stores.slug as store_slug,
                  stores.name as store_name,
                  observations.price,
                  observations.currency,
                  observations.observed_at,
                  lag(observations.price) over (
                    partition by observations.product_id, observations.chain_id, observations.store_id, observations.price_type
                    order by observations.observed_at, observations.id
                  ) as previous_price
           from observations
           join products on products.id = observations.product_id
           join chains on chains.id = observations.chain_id
           left join stores on stores.id = observations.store_id
           where observations.domain = 'grocery'
             and observations.observed_at >= ($1::timestamptz - interval '31 days')
             and observations.observed_at < $2::timestamptz
             and observations.price >= 0
         ),
         changed as (
           select *
           from observed
           where observed_at >= $1::timestamptz
             and previous_price is not null
             and previous_price is distinct from price
         ),
         latest_change as (
           select distinct on (product_id)
                  product_id,
                  product_slug,
                  product_name,
                  brand,
                  category_label,
                  chain_slug,
                  chain_name,
                  store_slug,
                  store_name,
                  price as latest_price,
                  previous_price,
                  round((price - previous_price)::numeric, 2) as change_amount,
                  round((((price - previous_price) / nullif(previous_price, 0)) * 100)::numeric, 2) as change_percent,
                  currency,
                  observed_at as latest_observed_at
           from changed
           order by product_id, observed_at desc
         ),
         change_counts as (
           select product_id, count(*) as change_count
           from changed
           group by product_id
         ),
         observation_counts as (
           select product_id, count(*) as observation_count
           from observed
           where observed_at >= $1::timestamptz
           group by product_id
         ),
         ranked as (
           select latest_change.*,
                  change_counts.change_count,
                  observation_counts.observation_count
           from latest_change
           join change_counts on change_counts.product_id = latest_change.product_id
           join observation_counts on observation_counts.product_id = latest_change.product_id
         )
         select dense_rank() over (
                  order by change_count desc,
                           observation_count desc,
                           abs(change_amount) desc,
                           product_name
                ) as rank,
                product_id,
                product_slug,
                product_name,
                brand,
                category_label,
                change_count,
                observation_count,
                latest_price,
                previous_price,
                change_amount,
                change_percent,
                currency,
                latest_observed_at,
                chain_slug,
                chain_name,
                store_slug,
                store_name
         from ranked
         group by product_id, product_slug, product_name, brand, category_label, change_count, observation_count,
                  latest_price, previous_price, change_amount, change_percent, currency, latest_observed_at,
                  chain_slug, chain_name, store_slug, store_name
         order by rank, product_name
         limit $3`,
        [filter.since, filter.until, limit]
      );
      return rows.map(mapTrendingPriceChangeRow);
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
                is_available,
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
                is_available,
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

export function buildTimescaleDbEvaluationReport(input: TimescaleDbEvaluationProbe): TimescaleDbEvaluationReport {
  const hypertables = new Set(input.hypertables);
  const compressionPolicies = new Set(input.compressionPolicies);
  const retentionPolicies = new Set(input.retentionPolicies);
  const fallbackTables = new Set(input.fallbackTables);
  const fallbackFunctions = new Set(input.fallbackFunctions);
  const timescaleGaps: string[] = [];
  const blockers: string[] = [];
  const evidence: string[] = [];

  if (input.timescaleExtensionAvailable) {
    evidence.push('timescaledb_extension:available');
  } else {
    timescaleGaps.push('timescaledb_extension_not_installed');
  }

  for (const table of TIMESCALEDB_EVALUATION_HYPERTABLES) {
    if (hypertables.has(table)) evidence.push(`hypertable:${table}`);
    else timescaleGaps.push(`missing_hypertable:${table}`);
  }

  for (const table of TIMESCALEDB_EVALUATION_COMPRESSION_POLICIES) {
    if (compressionPolicies.has(table)) evidence.push(`compression_policy:${table}`);
    else timescaleGaps.push(`missing_compression_policy:${table}`);
  }

  for (const table of TIMESCALEDB_EVALUATION_RETENTION_POLICIES) {
    if (retentionPolicies.has(table)) evidence.push(`retention_policy:${table}`);
    else timescaleGaps.push(`missing_retention_policy:${table}`);
  }

  for (const table of TIMESCALEDB_EVALUATION_FALLBACK_TABLES) {
    if (fallbackTables.has(table)) evidence.push(`fallback_table:${table}`);
    else blockers.push(`missing_fallback_table:${table}`);
  }

  for (const routine of TIMESCALEDB_EVALUATION_FALLBACK_FUNCTIONS) {
    if (fallbackFunctions.has(routine)) evidence.push(`fallback_function:${routine}`);
    else blockers.push(`missing_fallback_function:${routine}`);
  }

  if (timescaleGaps.length === 0) {
    return {
      status: 'timescale_ready',
      blockers,
      timescaleGaps: [],
      evidence,
      recommendation: 'TimescaleDB is ready for observations_v2 hypertable compression and retention policies.',
      summary: blockers.length === 0 ? 'TimescaleDB evaluation is ready.' : 'TimescaleDB evaluation is blocked by missing fallback evidence.'
    };
  }

  if (blockers.length === 0) {
    return {
      status: 'fallback_ready',
      blockers: [],
      timescaleGaps,
      evidence,
      recommendation: 'Use declarative monthly partitions, BRIN pruning, price_daily/price_weekly rollups, and partition-drop retention until TimescaleDB is installed.',
      summary: 'TimescaleDB is not fully configured; the declarative partition fallback is ready.'
    };
  }

  return {
    status: 'blocked',
    blockers,
    timescaleGaps,
    evidence,
    recommendation: 'Block price-tape scale claims until either TimescaleDB policies or the declarative partition fallback are fully present.',
    summary: 'TimescaleDB evaluation is blocked.'
  };
}

export async function collectTimescaleDbEvaluationProbe(executor: QueryExecutor): Promise<TimescaleDbEvaluationProbe> {
  const extensionRows = await executor.query<{ installed_version: string | null }>(
    "select installed_version from pg_available_extensions where name = 'timescaledb'"
  );
  const timescaleExtensionAvailable = Boolean(extensionRows[0]?.installed_version);
  const fallbackTableRows = await executor.query<{ table_name: string }>(
    'select table_name from information_schema.tables where table_schema = current_schema() and table_name = any($1)',
    [[...TIMESCALEDB_EVALUATION_FALLBACK_TABLES]]
  );
  const fallbackFunctionRows = await executor.query<{ routine_name: string }>(
    'select routine_name from information_schema.routines where routine_schema = current_schema() and routine_name = any($1)',
    [[...TIMESCALEDB_EVALUATION_FALLBACK_FUNCTIONS]]
  );

  const probe: TimescaleDbEvaluationProbe = {
    timescaleExtensionAvailable,
    hypertables: [],
    compressionPolicies: [],
    retentionPolicies: [],
    fallbackTables: fallbackTableRows.map((row) => row.table_name),
    fallbackFunctions: fallbackFunctionRows.map((row) => row.routine_name)
  };

  if (!timescaleExtensionAvailable) return probe;

  try {
    const hypertableRows = await executor.query<{ hypertable_name: string }>(
      'select hypertable_name from timescaledb_information.hypertables where hypertable_name = any($1)',
      [[...TIMESCALEDB_EVALUATION_HYPERTABLES]]
    );
    probe.hypertables = hypertableRows.map((row) => row.hypertable_name);
  } catch {
    probe.hypertables = [];
  }

  try {
    const compressionRows = await executor.query<{ hypertable_name: string }>(
      "select hypertable_name from timescaledb_information.jobs where proc_name = 'policy_compression' and hypertable_name = any($1)",
      [[...TIMESCALEDB_EVALUATION_COMPRESSION_POLICIES]]
    );
    probe.compressionPolicies = compressionRows.map((row) => row.hypertable_name);
  } catch {
    probe.compressionPolicies = [];
  }

  try {
    const retentionRows = await executor.query<{ hypertable_name: string }>(
      "select hypertable_name from timescaledb_information.jobs where proc_name = 'policy_retention' and hypertable_name = any($1)",
      [[...TIMESCALEDB_EVALUATION_RETENTION_POLICIES]]
    );
    probe.retentionPolicies = retentionRows.map((row) => row.hypertable_name);
  } catch {
    probe.retentionPolicies = [];
  }

  return probe;
}

export function summarizePostgresIntegrationReadinessReport(
  report: PostgresIntegrationReadinessReport
): PostgresIntegrationReadinessSummary {
  return {
    status: report.status,
    blockers: report.blockers.reduce<PostgresIntegrationReadinessSummary['blockers']>(
      (summary, blocker) => {
        summary.total += 1;
        if (blocker.startsWith('missing_table:')) summary.missingTables += 1;
        if (blocker.startsWith('missing_migration:')) summary.missingMigrations += 1;
        if (blocker.startsWith('repository_check_fail:')) summary.repositoryFailures += 1;
        if (blocker.startsWith('repository_check_not_run:')) summary.repositoryNotRun += 1;
        return summary;
      },
      { total: 0, missingTables: 0, missingMigrations: 0, repositoryFailures: 0, repositoryNotRun: 0 }
    ),
    evidence: report.evidence.reduce<PostgresIntegrationReadinessSummary['evidence']>(
      (summary, entry) => {
        summary.total += 1;
        if (entry.startsWith('table:')) summary.tables += 1;
        if (entry.startsWith('migration:')) summary.migrations += 1;
        if (entry.startsWith('repository_check:')) summary.repositoryChecks += 1;
        return summary;
      },
      { total: 0, tables: 0, migrations: 0, repositoryChecks: 0 }
    )
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
