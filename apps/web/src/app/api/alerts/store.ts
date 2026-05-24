export type PriceAlert = {
  id: string;
  userEmail: string;
  productId: string;
  targetPrice: number;
  createdAt: string;
};

export type PriceAlertInput = {
  userEmail: string;
  productId: string;
  targetPrice: number;
};

type PriceAlertRow = {
  id: string;
  user_email: string;
  product_id: string;
  target_price: string | number;
  created_at: string | Date;
};

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

const priceAlerts = new Map<string, PriceAlert>();
let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(value: unknown): string {
  if (!isNonEmptyString(value)) throw new Error('userEmail is required.');
  if (!value.includes('@')) throw new Error('userEmail must be an email address.');
  return value.trim().toLowerCase();
}

function normalizeInput(input: unknown): PriceAlertInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Alert body must be an object.');
  }

  const candidate = input as Record<string, unknown>;
  const targetPrice = typeof candidate.targetPrice === 'string'
    ? Number(candidate.targetPrice)
    : candidate.targetPrice;

  if (!isNonEmptyString(candidate.productId)) throw new Error('productId is required.');
  if (typeof targetPrice !== 'number' || !Number.isFinite(targetPrice) || targetPrice < 0) {
    throw new Error('targetPrice must be a non-negative number.');
  }

  return {
    userEmail: normalizeEmail(candidate.userEmail),
    productId: candidate.productId.trim(),
    targetPrice
  };
}

function priceAlertFromRow(row: PriceAlertRow): PriceAlert {
  return {
    id: row.id,
    userEmail: row.user_email,
    productId: row.product_id,
    targetPrice: Number(row.target_price),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function poolForDatabaseUrl(databaseUrl: string): Promise<PgPoolLike> {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return cachedPool;
}

function databaseUrl() {
  return process.env.DATABASE_URL;
}

export async function listPriceAlerts(userEmail: string): Promise<PriceAlert[]> {
  const normalizedEmail = normalizeEmail(userEmail);
  const configuredDatabaseUrl = databaseUrl();
  if (configuredDatabaseUrl) {
    const pool = await poolForDatabaseUrl(configuredDatabaseUrl);
    const result = await pool.query(
      `select id::text, user_email, product_id, target_price, created_at
       from price_alerts
       where user_email = $1
       order by created_at desc, id`,
      [normalizedEmail]
    );
    return (result.rows as PriceAlertRow[]).map(priceAlertFromRow);
  }

  return [...priceAlerts.values()]
    .filter((alert) => alert.userEmail === normalizedEmail)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id));
}

export async function createPriceAlert(input: unknown): Promise<PriceAlert> {
  const alertInput = normalizeInput(input);
  const configuredDatabaseUrl = databaseUrl();
  if (configuredDatabaseUrl) {
    const pool = await poolForDatabaseUrl(configuredDatabaseUrl);
    const result = await pool.query(
      `insert into price_alerts(user_email, product_id, target_price)
       values ($1, $2, $3)
       returning id::text, user_email, product_id, target_price, created_at`,
      [alertInput.userEmail, alertInput.productId, alertInput.targetPrice]
    );
    const row = result.rows[0] as PriceAlertRow | undefined;
    if (!row) throw new Error('Price alert was not persisted.');
    return priceAlertFromRow(row);
  }

  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    ...alertInput,
    createdAt: new Date().toISOString()
  };
  priceAlerts.set(alert.id, alert);
  return alert;
}

export async function deletePriceAlert(id: string, userEmail: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(userEmail);
  const configuredDatabaseUrl = databaseUrl();
  if (configuredDatabaseUrl) {
    const pool = await poolForDatabaseUrl(configuredDatabaseUrl);
    const result = await pool.query(
      `delete from price_alerts
       where id::text = $1 and user_email = $2
       returning id::text`,
      [id, normalizedEmail]
    );
    return result.rows.length > 0;
  }

  const alert = priceAlerts.get(id);
  if (!alert || alert.userEmail !== normalizedEmail) return false;
  return priceAlerts.delete(id);
}
