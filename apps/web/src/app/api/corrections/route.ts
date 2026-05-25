import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type CorrectionPayload = {
  listing?: unknown;
  store?: unknown;
  observed_price?: unknown;
  photo?: unknown;
};

type PgPoolLike = {
  query(text: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

const memoryFindings: Array<{ listing: string; store: string; observedPrice: number; photo?: string; createdAt: string }> = [];
let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function textField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validatePayload(payload: CorrectionPayload) {
  const listing = textField(payload.listing);
  const store = textField(payload.store);
  const photo = textField(payload.photo);
  const observedPrice = Number(payload.observed_price);
  const errors: string[] = [];
  if (!listing) errors.push('listing_required');
  if (!store) errors.push('store_required');
  if (!Number.isFinite(observedPrice) || observedPrice < 0) errors.push('observed_price_invalid');
  return { listing, store, observedPrice, ...(photo ? { photo } : {}), errors };
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function poolForDatabaseUrl(databaseUrl: string) {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return cachedPool;
}

async function persistQaFinding(input: { listing: string; store: string; observedPrice: number; photo?: string; createdAt: string }) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const pool = await poolForDatabaseUrl(databaseUrl);
  await pool.query(`create table if not exists qa_findings (
    id bigserial primary key,
    listing text not null,
    store text not null,
    observed_price numeric not null,
    photo text,
    status text not null default 'pending',
    created_at timestamptz not null default now()
  )`);
  await pool.query(
    'insert into qa_findings(listing, store, observed_price, photo, created_at) values ($1, $2, $3, $4, $5::timestamptz)',
    [input.listing, input.store, input.observedPrice, input.photo ?? null, input.createdAt]
  );
  const result = await pool.query(
    `select count(*)::int as confirmations
     from qa_findings
     where listing = $1 and store = $2 and observed_price = $3 and status in ('pending', 'confirmed', 'staff_reviewed')`,
    [input.listing, input.store, input.observedPrice]
  );
  return Number(result.rows[0]?.confirmations ?? 1);
}

export async function POST(request: Request) {
  let payload: CorrectionPayload;
  try {
    payload = await request.json() as CorrectionPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = validatePayload(payload);
  if (parsed.errors.length > 0) return NextResponse.json({ error: 'invalid_correction', issues: parsed.errors }, { status: 400 });
  const createdAt = new Date().toISOString();
  const finding = { listing: parsed.listing, store: parsed.store, observedPrice: parsed.observedPrice, ...(parsed.photo ? { photo: parsed.photo } : {}), createdAt };

  let confirmations: number | null = null;
  try {
    confirmations = await persistQaFinding(finding);
  } catch (error) {
    console.error('qa_findings persistence failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
  }

  if (confirmations === null) {
    memoryFindings.push(finding);
    confirmations = memoryFindings.filter((row) => row.listing === finding.listing && row.store === finding.store && row.observedPrice === finding.observedPrice).length;
  }

  const status = confirmations >= 3 ? 'ready_for_observation_update' : 'qa_pending';
  return NextResponse.json({ status, confirmations, message: confirmations >= 3 ? 'Correction has 3+ confirmations and is ready for staff or observation update.' : 'Correction sent to qa_findings for review.' }, { status: 202 });
}
