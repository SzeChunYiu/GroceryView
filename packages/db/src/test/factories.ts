import { randomUUID } from 'node:crypto';
import { tableHasColumn, type PrismaFactoryClient } from './setup.js';

export type PrismaProductFactoryResult = {
  id: string;
  slug: string;
};

export type PrismaChainFactoryResult = {
  id: string;
  slug: string;
};

export type PrismaStoreFactoryResult = {
  id: string;
  slug: string;
  chainId: string;
};

export type PrismaPriceSnapshotFactoryResult = {
  id: string;
  observationId: string;
  productId: string;
  chainId: string;
  storeId: string;
};

export type PrismaAlertFactoryResult = {
  id: string;
  productId: string;
};

type IdRow = {
  id: string;
};

function smokeSlug(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export async function createProductFactory(
  prisma: PrismaFactoryClient,
  overrides: Partial<{ id: string; slug: string; canonicalName: string }> = {}
): Promise<PrismaProductFactoryResult> {
  const id = overrides.id ?? randomUUID();
  const slug = overrides.slug ?? smokeSlug('factory-product');

  const rows = await prisma.$queryRawUnsafe<IdRow[]>(
    `insert into products (id, slug, canonical_name, brand, category_path, comparable_unit, image_url, updated_at)
     values ($1::uuid, $2, $3, $4, $5::text[], $6, $7, now())
     returning id::text`,
    id,
    slug,
    overrides.canonicalName ?? 'Factory smoke product',
    'Factory Brand',
    ['factory-smoke'],
    'kg',
    null
  );

  return { id: rows[0]!.id, slug };
}

export async function createChainFactory(
  prisma: PrismaFactoryClient,
  overrides: Partial<{ id: string; slug: string; name: string }> = {}
): Promise<PrismaChainFactoryResult> {
  const id = overrides.id ?? randomUUID();
  const slug = overrides.slug ?? smokeSlug('factory-chain');

  const rows = await prisma.$queryRawUnsafe<IdRow[]>(
    `insert into chains (id, slug, name, country_code, website_url)
     values ($1::uuid, $2, $3, 'SE', $4)
     returning id::text`,
    id,
    slug,
    overrides.name ?? 'Factory Smoke Chain',
    `https://${slug}.example.test/`
  );

  return { id: rows[0]!.id, slug };
}

export async function createStoreFactory(
  prisma: PrismaFactoryClient,
  chain: PrismaChainFactoryResult,
  overrides: Partial<{ id: string; slug: string; name: string }> = {}
): Promise<PrismaStoreFactoryResult> {
  const hasInfraAddress = await tableHasColumn(prisma, 'stores', 'address_line1');
  const id = overrides.id ?? randomUUID();
  const slug = overrides.slug ?? smokeSlug('factory-store');
  const name = overrides.name ?? 'Factory Smoke Store';

  if (hasInfraAddress) {
    const rows = await prisma.$queryRawUnsafe<IdRow[]>(
      `insert into stores (id, chain_id, slug, external_ref, name, address_line1, city, country_code, store_type)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, 'SE', 'supermarket')
       returning id::text`,
      id,
      chain.id,
      slug,
      slug,
      name,
      'Factorygatan 1',
      'Stockholm'
    );

    return { id: rows[0]!.id, slug, chainId: chain.id };
  }

  const rows = await prisma.$queryRawUnsafe<IdRow[]>(
    `insert into stores (id, chain_id, name, address, city, domain, store_type)
     values ($1, $2, $3, $4, $5, 'grocery', 'supermarket')
     returning id::text`,
    id,
    chain.id,
    name,
    'Factorygatan 1',
    'Stockholm'
  );

  return { id: rows[0]!.id, slug, chainId: chain.id };
}

export async function createPriceSnapshotFactory(
  prisma: PrismaFactoryClient,
  input: { productId: string; chainId: string; storeId: string }
): Promise<PrismaPriceSnapshotFactoryResult> {
  const observationRows = await prisma.$queryRawUnsafe<IdRow[]>(
    `insert into observations (
       product_id, chain_id, store_id, price_type, price, regular_price, unit_price,
       currency, observed_at, confidence, provenance
     )
     values (
       $1::uuid, $2::uuid, $3::uuid, 'shelf', 19.90, 24.90, 39.80,
       'SEK', now(), 0.9900, $4::jsonb
     )
     returning id::text`,
    input.productId,
    input.chainId,
    input.storeId,
    JSON.stringify({ source: 'prisma-factory-smoke' })
  );
  const observationId = observationRows[0]!.id;

  const priceRows = await prisma.$queryRawUnsafe<IdRow[]>(
    `insert into latest_prices (
       product_id, chain_id, store_id, price_type, observation_id, price, regular_price,
       unit_price, currency, observed_at, confidence, provenance
     )
     values (
       $1::uuid, $2::uuid, $3::uuid, 'shelf', $4::uuid, 19.90, 24.90,
       39.80, 'SEK', now(), 0.9900, $5::jsonb
     )
     returning id::text`,
    input.productId,
    input.chainId,
    input.storeId,
    observationId,
    JSON.stringify({ source: 'prisma-factory-smoke' })
  );

  return {
    id: priceRows[0]!.id,
    observationId,
    productId: input.productId,
    chainId: input.chainId,
    storeId: input.storeId
  };
}

export async function createAlertFactory(
  prisma: PrismaFactoryClient,
  input: { productId: string; userEmail?: string; targetPrice?: number }
): Promise<PrismaAlertFactoryResult> {
  const rows = await prisma.$queryRawUnsafe<IdRow[]>(
    `insert into price_alerts (user_email, product_id, target_price)
     values ($1, $2, $3)
     returning id::text`,
    input.userEmail ?? `factory-${randomUUID()}@example.test`,
    input.productId,
    input.targetPrice ?? 15.5
  );

  return { id: rows[0]!.id, productId: input.productId };
}
