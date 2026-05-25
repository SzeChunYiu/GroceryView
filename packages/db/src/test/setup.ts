export type PrismaFactoryClient = {
  $executeRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $disconnect?: () => Promise<void>;
};

export type PrismaFactoryCleanupIds = {
  alertIds?: readonly string[];
  priceSnapshotIds?: readonly string[];
  observationIds?: readonly string[];
  storeIds?: readonly string[];
  chainIds?: readonly string[];
  productIds?: readonly string[];
};

type TableColumnRow = {
  column_name: string;
};

const prismaModuleName = '@prisma/client';

export async function createPrismaSmokeClient(): Promise<PrismaFactoryClient> {
  const { PrismaClient } = (await import(prismaModuleName)) as {
    PrismaClient: new () => PrismaFactoryClient;
  };

  return new PrismaClient();
}

export async function tableHasColumn(
  prisma: PrismaFactoryClient,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<TableColumnRow[]>(
    `select column_name
       from information_schema.columns
      where table_schema = current_schema()
        and table_name = $1
        and column_name = $2`,
    tableName,
    columnName
  );

  return rows.length > 0;
}

export async function cleanupPrismaFactoryRows(
  prisma: PrismaFactoryClient,
  ids: PrismaFactoryCleanupIds
): Promise<void> {
  for (const alertId of ids.alertIds ?? []) {
    await prisma.$executeRawUnsafe('delete from price_alerts where id = $1::uuid', alertId);
  }

  for (const priceSnapshotId of ids.priceSnapshotIds ?? []) {
    await prisma.$executeRawUnsafe('delete from latest_prices where id = $1::uuid', priceSnapshotId);
  }

  for (const observationId of ids.observationIds ?? []) {
    await prisma.$executeRawUnsafe('delete from observations where id = $1::uuid', observationId);
  }

  for (const storeId of ids.storeIds ?? []) {
    await prisma.$executeRawUnsafe('delete from stores where id::text = $1', storeId);
  }

  for (const chainId of ids.chainIds ?? []) {
    await prisma.$executeRawUnsafe('delete from chains where id::text = $1', chainId);
  }

  for (const productId of ids.productIds ?? []) {
    await prisma.$executeRawUnsafe('delete from products where id::text = $1', productId);
  }
}
