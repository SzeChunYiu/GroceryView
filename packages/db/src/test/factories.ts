import { Prisma, PrismaClient } from '@prisma/client';

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export type TestPrismaClient = PrismaClient;

export type TestFactoryOptions = {
  prisma: TestPrismaClient;
};

export type ProductFactoryInput = Partial<Prisma.ProductCreateInput>;
export type ChainFactoryInput = Partial<Prisma.ChainCreateInput>;
export type StoreFactoryInput = Partial<Omit<Prisma.StoreCreateInput, 'chain'>> & {
  chain?: ChainFactoryInput;
};
export type PriceSnapshotFactoryInput = Partial<
  Omit<Prisma.PriceSnapshotUncheckedCreateInput, 'productId' | 'chainId' | 'storeId' | 'observationId'>
> & {
  product?: ProductFactoryInput;
  chain?: ChainFactoryInput;
  store?: Partial<Omit<Prisma.StoreUncheckedCreateInput, 'chainId'>>;
  observation?: Partial<Omit<Prisma.ObservationUncheckedCreateInput, 'productId' | 'chainId' | 'storeId'>>;
};
export type AlertFactoryInput = Partial<Omit<Prisma.AlertUncheckedCreateInput, 'userId' | 'productId' | 'storeId' | 'watchlistId'>> & {
  user?: Partial<Prisma.UserCreateInput>;
  product?: ProductFactoryInput;
  store?: StoreFactoryInput;
};

export function createTestPrismaClient(databaseUrl = process.env.DATABASE_URL): TestPrismaClient {
  return new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);
}

export function createDbTestFactories({ prisma }: TestFactoryOptions) {
  async function product(input: ProductFactoryInput = {}) {
    const slug = input.slug ?? nextId('product');

    return prisma.product.create({
      data: {
        slug,
        canonicalName: input.canonicalName ?? `Test Product ${slug}`,
        comparableUnit: input.comparableUnit ?? 'kg',
        ...input
      }
    });
  }

  async function chain(input: ChainFactoryInput = {}) {
    const slug = input.slug ?? nextId('chain');

    return prisma.chain.create({
      data: {
        slug,
        name: input.name ?? `Test Chain ${slug}`,
        ...input
      }
    });
  }

  async function store(input: StoreFactoryInput = {}) {
    const slug = input.slug ?? nextId('store');
    const { chain: chainInput, ...storeInput } = input;

    return prisma.store.create({
      data: {
        slug,
        name: input.name ?? `Test Store ${slug}`,
        addressLine1: input.addressLine1 ?? 'Testgatan 1',
        city: input.city ?? 'Stockholm',
        chain: {
          create: {
            slug: nextId('chain'),
            name: 'Test Chain',
            ...chainInput
          }
        },
        ...storeInput
      }
    });
  }

  async function priceSnapshot(input: PriceSnapshotFactoryInput = {}) {
    const observedAt = input.observedAt ?? new Date();
    const price = input.price ?? new Prisma.Decimal('29.90');
    const unitPrice = input.unitPrice ?? price;
    const confidence = input.confidence ?? new Prisma.Decimal('0.9500');
    const priceType = input.priceType ?? 'shelf';
    const createdProduct = await product(input.product);
    const createdChain = await chain(input.chain);
    const storeSlug = input.store?.slug ?? nextId('store');
    const createdStore = await prisma.store.create({
      data: {
        chainId: createdChain.id,
        slug: storeSlug,
        name: input.store?.name ?? `Test Store ${storeSlug}`,
        addressLine1: input.store?.addressLine1 ?? 'Testgatan 1',
        city: input.store?.city ?? 'Stockholm',
        ...input.store
      }
    });
    const createdObservation = await prisma.observation.create({
      data: {
        productId: createdProduct.id,
        chainId: createdChain.id,
        storeId: createdStore?.id,
        priceType,
        price,
        unitPrice,
        observedAt,
        confidence,
        ...input.observation
      }
    });
    const { product: _product, chain: _chain, store: _store, observation: _observation, ...snapshotInput } = input;

    return prisma.priceSnapshot.create({
      data: {
        productId: createdProduct.id,
        chainId: createdChain.id,
        storeId: createdStore?.id,
        priceType,
        observationId: createdObservation.id,
        price,
        unitPrice,
        observedAt,
        confidence,
        ...snapshotInput
      }
    });
  }

  async function alert(input: AlertFactoryInput = {}) {
    const createdUser = await prisma.user.create({
      data: {
        email: `${nextId('user')}@example.test`,
        ...input.user
      }
    });
    const createdProduct = await product(input.product);
    const createdStore = input.store ? await store(input.store) : null;
    const { user: _user, product: _product, store: _store, ...alertInput } = input;

    return prisma.alert.create({
      data: {
        userId: createdUser.id,
        productId: createdProduct.id,
        storeId: createdStore?.id,
        alertType: input.alertType ?? 'target_price',
        targetPrice: input.targetPrice ?? new Prisma.Decimal('25.00'),
        ...alertInput
      }
    });
  }

  return {
    alert,
    chain,
    priceSnapshot,
    product,
    store
  };
}
