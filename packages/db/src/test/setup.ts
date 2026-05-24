import { PrismaClient } from '@prisma/client';
import { createDbTestFactories, createTestPrismaClient } from './factories.js';

export const prisma = createTestPrismaClient();
export const dbFactories = createDbTestFactories({ prisma });

export async function resetTestDatabase(client: PrismaClient = prisma): Promise<void> {
  await client.alert.deleteMany();
  await client.priceSnapshot.deleteMany();
  await client.observation.deleteMany();
  await client.watchlist.deleteMany();
  await client.store.deleteMany();
  await client.chain.deleteMany();
  await client.product.deleteMany();
  await client.user.deleteMany();
}

export async function disconnectTestDatabase(client: PrismaClient = prisma): Promise<void> {
  await client.$disconnect();
}

declare const beforeEach: undefined | ((fn: () => Promise<void>) => void);
declare const afterAll: undefined | ((fn: () => Promise<void>) => void);

if (typeof beforeEach === 'function') {
  beforeEach(async () => {
    await resetTestDatabase();
  });
}

if (typeof afterAll === 'function') {
  afterAll(async () => {
    await disconnectTestDatabase();
  });
}
