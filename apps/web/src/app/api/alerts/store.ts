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

export type StalePriceWarning = {
  userEmail: string;
  productId: string;
  recipient: string;
  userId?: string;
  productName?: string;
  staleSince?: string;
};

export type StalePriceWarningPushTask = {
  id: string;
  channel: 'push';
  type: 'stale_price_warning';
  title: string;
  body: string;
  priority: 'normal';
  sendAt: string;
  recipient: string;
  attemptCount: number;
  maxAttempts: number;
  status: 'queued';
  sourceUserId: string;
  sourceProductId: string;
};

export type PersistStalePriceWarningPushTasksResult = {
  tasks: StalePriceWarningPushTask[];
  suppressed: Array<{ warning: StalePriceWarning; reason: 'duplicate_input' | 'suppression_window' }>;
};

const stalePriceWarningTasks = new Map<string, StalePriceWarningPushTask>();

function normalizeStalePriceWarning(warning: StalePriceWarning): StalePriceWarning {
  const userEmail = normalizeEmail(warning.userEmail);
  if (!isNonEmptyString(warning.productId)) throw new Error('productId is required.');
  if (!isNonEmptyString(warning.recipient)) throw new Error('recipient is required.');
  return {
    userEmail,
    productId: warning.productId.trim(),
    recipient: warning.recipient.trim(),
    ...(warning.userId?.trim() ? { userId: warning.userId.trim() } : {}),
    ...(warning.productName?.trim() ? { productName: warning.productName.trim() } : {}),
    ...(warning.staleSince?.trim() ? { staleSince: warning.staleSince.trim() } : {})
  };
}

function staleWarningSourceUser(warning: StalePriceWarning): string {
  return warning.userId ?? warning.userEmail;
}

function staleWarningBody(warning: StalePriceWarning): string {
  const product = warning.productName ?? warning.productId;
  return warning.staleSince
    ? `We have not seen a fresh price for ${product} since ${warning.staleSince}.`
    : `We have not seen a fresh price for ${product} recently.`;
}

function staleWarningTask(warning: StalePriceWarning, now: string, maxAttempts: number): StalePriceWarningPushTask {
  return {
    id: crypto.randomUUID(),
    channel: 'push',
    type: 'stale_price_warning',
    title: 'Price data may be stale',
    body: staleWarningBody(warning),
    priority: 'normal',
    sendAt: now,
    recipient: warning.recipient,
    attemptCount: 0,
    maxAttempts,
    status: 'queued',
    sourceUserId: staleWarningSourceUser(warning),
    sourceProductId: warning.productId
  };
}

export async function persistStalePriceWarningPushTasks(input: {
  stalePriceWarnings: StalePriceWarning[];
  now?: string;
  suppressionWindowHours?: number;
  maxAttempts?: number;
}): Promise<PersistStalePriceWarningPushTasksResult> {
  const now = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  const suppressionWindowHours = input.suppressionWindowHours ?? 24;
  if (!Number.isFinite(suppressionWindowHours) || suppressionWindowHours <= 0) throw new Error('suppressionWindowHours must be positive.');
  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts <= 0) throw new Error('maxAttempts must be a positive integer.');

  const cutoff = new Date(nowMs - suppressionWindowHours * 60 * 60 * 1000).toISOString();
  const configuredDatabaseUrl = databaseUrl();
  const pool = configuredDatabaseUrl ? await poolForDatabaseUrl(configuredDatabaseUrl) : null;
  const seen = new Set<string>();
  const tasks: StalePriceWarningPushTask[] = [];
  const suppressed: PersistStalePriceWarningPushTasksResult['suppressed'] = [];

  for (const rawWarning of input.stalePriceWarnings) {
    const warning = normalizeStalePriceWarning(rawWarning);
    const sourceUserId = staleWarningSourceUser(warning);
    const key = `${sourceUserId}:${warning.productId}`;
    if (seen.has(key)) {
      suppressed.push({ warning, reason: 'duplicate_input' });
      continue;
    }
    seen.add(key);

    if (pool) {
      const recent = await pool.query(
        `select id
         from notification_tasks
         where type = $1 and source_user_id = $2 and source_product_id = $3 and send_at >= $4 and send_at <= $5
         limit 1`,
        ['stale_price_warning', sourceUserId, warning.productId, cutoff, now]
      );
      if (recent.rows.length > 0) {
        suppressed.push({ warning, reason: 'suppression_window' });
        continue;
      }
    } else if ([...stalePriceWarningTasks.values()].some((task) => {
      const sendAtMs = Date.parse(task.sendAt);
      return task.sourceUserId === sourceUserId &&
        task.sourceProductId === warning.productId &&
        !Number.isNaN(sendAtMs) &&
        sendAtMs >= Date.parse(cutoff) &&
        sendAtMs <= nowMs;
    })) {
      suppressed.push({ warning, reason: 'suppression_window' });
      continue;
    }

    const task = staleWarningTask(warning, now, maxAttempts);
    if (pool) {
      await pool.query(
        `insert into notification_tasks(
           id, channel, type, title, body, priority, send_at, recipient, attempt_count, max_attempts, status, source_user_id, source_product_id
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         on conflict (id) do nothing`,
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
          task.status,
          task.sourceUserId,
          task.sourceProductId
        ]
      );
    } else {
      stalePriceWarningTasks.set(task.id, task);
    }
    tasks.push(task);
  }

  return { tasks, suppressed };
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
