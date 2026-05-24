import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  groceryViewPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.groceryViewPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.groceryViewPrisma = prisma;
}

export type { Product } from '@prisma/client';
