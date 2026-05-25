import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createAlertFactory,
  createChainFactory,
  createPriceSnapshotFactory,
  createProductFactory,
  createStoreFactory
} from '../test/factories.js';
import { cleanupPrismaFactoryRows, createPrismaSmokeClient, type PrismaFactoryClient } from '../test/setup.js';

type CountRow = {
  count: string;
};

async function countRows(prisma: PrismaFactoryClient, tableName: string, id: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(`select count(*)::text as count from ${tableName} where id::text = $1`, id);
  return Number(rows[0]?.count ?? 0);
}

describe('Prisma live factories', () => {
  it('creates product, store, price snapshot, and alert rows, then cleans them up in dependency order', async (t) => {
    if (!process.env.DATABASE_URL) {
      t.skip('DATABASE_URL is required for live Prisma factory smoke tests.');
      return;
    }

    const prisma = await createPrismaSmokeClient();
    const cleanupIds = {
      alertIds: [] as string[],
      priceSnapshotIds: [] as string[],
      observationIds: [] as string[],
      storeIds: [] as string[],
      chainIds: [] as string[],
      productIds: [] as string[]
    };

    try {
      const product = await createProductFactory(prisma);
      cleanupIds.productIds.push(product.id);

      const chain = await createChainFactory(prisma);
      cleanupIds.chainIds.push(chain.id);

      const store = await createStoreFactory(prisma, chain);
      cleanupIds.storeIds.push(store.id);

      const priceSnapshot = await createPriceSnapshotFactory(prisma, {
        productId: product.id,
        chainId: chain.id,
        storeId: store.id
      });
      cleanupIds.priceSnapshotIds.push(priceSnapshot.id);
      cleanupIds.observationIds.push(priceSnapshot.observationId);

      const alert = await createAlertFactory(prisma, { productId: product.id });
      cleanupIds.alertIds.push(alert.id);

      assert.equal(await countRows(prisma, 'products', product.id), 1);
      assert.equal(await countRows(prisma, 'stores', store.id), 1);
      assert.equal(await countRows(prisma, 'latest_prices', priceSnapshot.id), 1);
      assert.equal(await countRows(prisma, 'price_alerts', alert.id), 1);

      await cleanupPrismaFactoryRows(prisma, cleanupIds);

      assert.equal(await countRows(prisma, 'price_alerts', alert.id), 0);
      assert.equal(await countRows(prisma, 'latest_prices', priceSnapshot.id), 0);
      assert.equal(await countRows(prisma, 'observations', priceSnapshot.observationId), 0);
      assert.equal(await countRows(prisma, 'stores', store.id), 0);
      assert.equal(await countRows(prisma, 'chains', chain.id), 0);
      assert.equal(await countRows(prisma, 'products', product.id), 0);
    } finally {
      await cleanupPrismaFactoryRows(prisma, cleanupIds);
      await prisma.$disconnect?.();
    }
  });
});
