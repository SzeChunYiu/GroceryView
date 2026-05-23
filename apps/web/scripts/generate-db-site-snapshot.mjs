import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const defaultOutputPath = resolve(appRoot, 'src/lib/ingested/db-site-snapshot.ts');

export const categoryLabels = {
  dairy: 'Dairy',
  breakfast: 'Breakfast',
  bread: 'Bread & Bakery',
  beverages: 'Beverages',
  'coffee-tea': 'Coffee & Tea',
  snacks: 'Snacks',
  sweets: 'Sweets & Ice cream',
  meat: 'Meat & Charcuterie',
  fish: 'Fish & Seafood',
  produce: 'Fruit & Vegetables',
  frozen: 'Frozen',
  pantry: 'Pantry',
  'plant-based': 'Plant-based',
  alcohol: 'Wine, Beer & Spirits',
  baby: 'Baby',
  pet: 'Pet',
  household: 'Cleaning & Household',
  'personal-care': 'Personal care'
};

const emptySnapshot = {
  meta: {
    generatedAt: '1970-01-01T00:00:00.000Z',
    source: 'fallback',
    latestPriceCount: 0,
    pricedProductCount: 0,
    observationCount: 0,
    newestObservedAt: null
  },
  sourceSummaries: [],
  latestPrices: [],
  pricedProducts: []
};

const productSnapshotSql = `
with stats as (
  select product_id,
         count(*)::int as observation_count,
         min(price)::float8 as price_min,
         percentile_cont(0.5) within group (order by price)::float8 as price_median,
         max(price)::float8 as price_max,
         max(observed_at) as last_observed_at
  from observations
  where currency = 'SEK'
  group by product_id
),
recent_observations as (
  select product_id,
         price::float8 as price,
         to_char(observed_at at time zone 'UTC', 'YYYY-MM-DD') as observed_date,
         row_number() over (partition by product_id order by observed_at desc, id desc) as rn
  from observations
  where currency = 'SEK'
),
history as (
  select product_id,
         jsonb_agg(
           jsonb_build_object('price', price, 'date', observed_date)
           order by observed_date desc
         ) as observations
  from recent_observations
  where rn <= 8
  group by product_id
)
select coalesce(nullif(p.barcode, ''), p.slug) as code,
       p.slug,
       p.canonical_name as name,
       coalesce(p.brand, '') as brands,
       coalesce(p.image_url, '') as image,
       case
         when p.package_size is not null and p.package_unit is not null
           then trim(to_char(p.package_size, 'FM999999990.###')) || ' ' || p.package_unit
         else ''
       end as quantity,
       coalesce(
         nullif(p.nutrition ->> 'nutriscore_grade', ''),
         nullif(p.nutrition ->> 'nutriscore', ''),
         nullif(p.nutrition ->> 'nutriscoreGrade', ''),
         'unknown'
       ) as nutriscore,
       p.category_path as categories,
       stats.price_min,
       stats.price_median,
       stats.price_max,
       stats.observation_count,
       to_char(stats.last_observed_at at time zone 'UTC', 'YYYY-MM-DD') as last_observed_at,
       coalesce(history.observations, '[]'::jsonb) as observations
from stats
join products p on p.id = stats.product_id
left join history on history.product_id = stats.product_id
order by stats.observation_count desc, stats.last_observed_at desc, p.canonical_name
limit $1
`;

const latestPriceSnapshotSql = `
select coalesce(nullif(p.barcode, ''), p.slug) as code,
       p.slug as product_slug,
       p.canonical_name as product_name,
       coalesce(p.brand, '') as brand,
       coalesce(p.image_url, '') as image_url,
       c.slug as chain_slug,
       c.name as chain_name,
       s.slug as store_slug,
       s.name as store_name,
       lp.price::float8 as price,
       lp.regular_price::float8 as regular_price,
       lp.unit_price::float8 as unit_price,
       lp.currency,
       lp.price_type,
       lp.observed_at,
       lp.confidence::float8 as confidence,
       o.quantity::float8 as quantity,
       o.quantity_unit,
       o.promotion_text,
       o.member_required,
       o.retailer_product_ref,
       lp.provenance
from latest_prices lp
join observations o on o.id = lp.observation_id
join products p on p.id = lp.product_id
join chains c on c.id = lp.chain_id
left join stores s on s.id = lp.store_id
where lp.currency = 'SEK'
order by lp.observed_at desc, c.slug, s.slug nulls last, p.canonical_name
limit $1
`;

const sourceSummarySql = `
select c.slug as source,
       c.name as label,
       count(*)::int as row_count,
       max(lp.observed_at) as retrieved_at
from latest_prices lp
join chains c on c.id = lp.chain_id
where lp.currency = 'SEK'
group by c.slug, c.name
order by row_count desc, c.slug
`;

const metaSql = `
select count(*)::int as observation_count,
       max(observed_at) as newest_observed_at
from observations
where currency = 'SEK'
`;

function coerceLimit(value) {
  const parsed = Number(value ?? 500);
  if (!Number.isInteger(parsed) || parsed < 1) return 500;
  return Math.min(parsed, 5000);
}

function toIsoDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function roundMoney(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100) / 100;
}

function roundUnitPrice(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 10000) / 10000;
}

function slugify(value) {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/å|ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'product';
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((item) => String(item).trim()).filter(Boolean);
}

function inferCategory(categories) {
  const haystack = categories.join(' ').toLowerCase();
  if (/coffee|kaffe|tea|te\b/.test(haystack)) return 'coffee-tea';
  if (/milk|cheese|yogurt|dairy|mjolk|ost|mejeri/.test(haystack)) return 'dairy';
  if (/bread|bakery|brod|bageri/.test(haystack)) return 'bread';
  if (/beverage|drink|juice|soda|dryck/.test(haystack)) return 'beverages';
  if (/breakfast|cereal|granola|frukost/.test(haystack)) return 'breakfast';
  if (/snack|chips|nuts|crisps/.test(haystack)) return 'snacks';
  if (/sweet|ice|chocolate|candy|glass|godis/.test(haystack)) return 'sweets';
  if (/meat|charcuterie|beef|pork|chicken|kott|kyckling/.test(haystack)) return 'meat';
  if (/fish|seafood|fisk/.test(haystack)) return 'fish';
  if (/fruit|vegetable|produce|gronsak|frukt/.test(haystack)) return 'produce';
  if (/frozen|fryst/.test(haystack)) return 'frozen';
  if (/plant-based|vegan|vegetarian|vaxtbas/.test(haystack)) return 'plant-based';
  if (/beer|wine|spirit|alcohol|ol|vin/.test(haystack)) return 'alcohol';
  if (/baby|infant|barn/.test(haystack)) return 'baby';
  if (/pet|dog|cat|husdjur/.test(haystack)) return 'pet';
  if (/clean|household|detergent|paper|stad|hushall/.test(haystack)) return 'household';
  if (/personal|beauty|hygiene|skin|hair/.test(haystack)) return 'personal-care';
  return 'pantry';
}

function mapPricedProduct(row) {
  const categories = normalizeCategories(row.categories);
  const code = String(row.code || row.slug);
  return {
    code,
    slug: row.slug || `${slugify(row.name)}-${slugify(code)}`,
    name: String(row.name || 'Unknown product'),
    brands: String(row.brands || ''),
    image: String(row.image || ''),
    quantity: String(row.quantity || ''),
    nutriscore: String(row.nutriscore || 'unknown').toLowerCase(),
    category: inferCategory(categories),
    categories,
    priceMin: roundMoney(row.price_min) ?? 0,
    priceMedian: roundMoney(row.price_median) ?? 0,
    priceMax: roundMoney(row.price_max) ?? 0,
    observationCount: Number(row.observation_count ?? 0),
    lastObservedAt: String(row.last_observed_at || ''),
    observations: Array.isArray(row.observations)
      ? row.observations.map((observation) => ({
          price: roundMoney(observation.price) ?? 0,
          date: String(observation.date || '')
        }))
      : []
  };
}

function mapLatestPrice(row) {
  return {
    code: String(row.code || row.product_slug),
    productSlug: String(row.product_slug || ''),
    productName: String(row.product_name || 'Unknown product'),
    brand: String(row.brand || ''),
    imageUrl: String(row.image_url || ''),
    chainSlug: String(row.chain_slug || ''),
    chainName: String(row.chain_name || ''),
    storeSlug: row.store_slug ? String(row.store_slug) : null,
    storeName: row.store_name ? String(row.store_name) : null,
    price: roundMoney(row.price) ?? 0,
    regularPrice: roundMoney(row.regular_price),
    unitPrice: roundUnitPrice(row.unit_price),
    currency: String(row.currency || 'SEK'),
    priceType: String(row.price_type || 'shelf'),
    observedAt: toIsoDateTime(row.observed_at) ?? '',
    confidence: Number(row.confidence ?? 0),
    quantity: row.quantity === null || row.quantity === undefined ? null : Number(row.quantity),
    quantityUnit: row.quantity_unit ? String(row.quantity_unit) : null,
    promotionText: row.promotion_text ? String(row.promotion_text) : null,
    memberRequired: Boolean(row.member_required),
    retailerProductRef: row.retailer_product_ref ? String(row.retailer_product_ref) : null,
    provenance: row.provenance && typeof row.provenance === 'object' ? row.provenance : {}
  };
}

function mapSourceSummary(row) {
  return {
    source: String(row.source || 'unknown'),
    label: String(row.label || row.source || 'Unknown'),
    rowCount: Number(row.row_count ?? 0),
    retrievedAt: toIsoDateTime(row.retrieved_at) ?? ''
  };
}

export async function buildDbSiteSnapshot({ pool, limit = 500, now = new Date() }) {
  const [productResult, latestResult, sourceResult, metaResult] = await Promise.all([
    pool.query(productSnapshotSql, [limit]),
    pool.query(latestPriceSnapshotSql, [limit]),
    pool.query(sourceSummarySql, []),
    pool.query(metaSql, [])
  ]);

  const pricedProducts = productResult.rows.map(mapPricedProduct);
  const latestPrices = latestResult.rows.map(mapLatestPrice);
  const sourceSummaries = sourceResult.rows.map(mapSourceSummary);
  const metaRow = metaResult.rows[0] ?? {};

  return {
    meta: {
      generatedAt: now.toISOString(),
      source: 'postgres',
      latestPriceCount: latestPrices.length,
      pricedProductCount: pricedProducts.length,
      observationCount: Number(metaRow.observation_count ?? 0),
      newestObservedAt: toIsoDateTime(metaRow.newest_observed_at)
    },
    sourceSummaries,
    latestPrices,
    pricedProducts
  };
}

export function renderSnapshotModule(snapshot) {
  return `// AUTO-GENERATED by apps/web/scripts/generate-db-site-snapshot.mjs.
// Build-time snapshot of Postgres latest_prices and observations for static web rendering.

export type PriceObservation = { price: number; date: string };
export type PricedProduct = {
  code: string; slug: string; name: string; brands: string; image: string;
  quantity: string; nutriscore: string; category: string;
  categories: string[];
  priceMin: number; priceMedian: number; priceMax: number;
  observationCount: number; lastObservedAt: string;
  observations: PriceObservation[];
};

export type DbLatestPrice = {
  code: string;
  productSlug: string;
  productName: string;
  brand: string;
  imageUrl: string;
  chainSlug: string;
  chainName: string;
  storeSlug: string | null;
  storeName: string | null;
  price: number;
  regularPrice: number | null;
  unitPrice: number | null;
  currency: string;
  priceType: string;
  observedAt: string;
  confidence: number;
  quantity: number | null;
  quantityUnit: string | null;
  promotionText: string | null;
  memberRequired: boolean;
  retailerProductRef: string | null;
  provenance: Record<string, unknown>;
};

export type DbSourceSummary = {
  source: string;
  label: string;
  rowCount: number;
  retrievedAt: string;
};

export type DbSiteSnapshotMeta = {
  generatedAt: string;
  source: 'postgres' | 'fallback';
  latestPriceCount: number;
  pricedProductCount: number;
  observationCount: number;
  newestObservedAt: string | null;
};

export const categoryLabels: Record<string,string> = ${JSON.stringify(categoryLabels, null, 2)};

export const dbSiteSnapshotMeta: DbSiteSnapshotMeta = ${JSON.stringify(snapshot.meta, null, 2)};

export const dbSourceSummaries: DbSourceSummary[] = ${JSON.stringify(snapshot.sourceSummaries, null, 2)};

export const dbLatestPrices: DbLatestPrice[] = ${JSON.stringify(snapshot.latestPrices, null, 2)};

export const pricedProducts: PricedProduct[] = ${JSON.stringify(snapshot.pricedProducts, null, 2)};
`;
}

async function writeIfChanged(outputPath, content) {
  await mkdir(dirname(outputPath), { recursive: true });
  let existing = null;
  try {
    existing = await readFile(outputPath, 'utf8');
  } catch {
    existing = null;
  }
  if (existing === content) return false;
  await writeFile(outputPath, content);
  return true;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const outputPath = resolve(process.env.DB_SITE_SNAPSHOT_OUTPUT_PATH || defaultOutputPath);
  const limit = coerceLimit(process.env.DB_SITE_SNAPSHOT_LIMIT);

  if (!databaseUrl) {
    const content = renderSnapshotModule(emptySnapshot);
    await writeIfChanged(outputPath, content);
    console.error(`DB site snapshot skipped: DATABASE_URL is not set; fallback snapshot is available at ${outputPath}`);
    return;
  }

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: Number(process.env.DB_SITE_SNAPSHOT_CONNECT_TIMEOUT_MS || 5000)
  });

  try {
    const snapshot = await buildDbSiteSnapshot({ pool, limit, now: new Date() });
    const content = renderSnapshotModule(snapshot);
    const changed = await writeIfChanged(outputPath, content);
    console.error(
      `DB site snapshot ${changed ? 'written' : 'unchanged'}: ${snapshot.meta.latestPriceCount} latest prices, ` +
        `${snapshot.meta.pricedProductCount} priced products, ${snapshot.meta.observationCount} observations`
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
