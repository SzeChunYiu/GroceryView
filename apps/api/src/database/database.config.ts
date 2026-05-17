import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { PriceEvent } from '../prices/price-event.entity';
import { Product } from '../products/product.entity';
import { Store } from '../stores/store.entity';

export function isDatabaseEnabled(env: NodeJS.ProcessEnv): boolean {
  if (env.DATABASE_ENABLED !== undefined) {
    return ['1', 'true', 'yes', 'on'].includes(
      env.DATABASE_ENABLED.toLowerCase(),
    );
  }

  return Boolean(env.DATABASE_URL || env.DB_HOST);
}

export function createTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  const enabled = isDatabaseEnabled(env);
  const connectionOptions = env.DATABASE_URL
    ? { url: env.DATABASE_URL }
    : {
        host: env.DB_HOST ?? 'localhost',
        port: env.DB_PORT ? Number(env.DB_PORT) : 5432,
        username: env.DB_USER ?? 'groceryview',
        password: env.DB_PASSWORD ?? 'groceryview',
        database: env.DB_NAME ?? 'groceryview',
      };

  return {
    type: 'postgres',
    ...connectionOptions,
    entities: [Product, Store, PriceEvent],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: false,
    logging: env.TYPEORM_LOGGING === 'true',
    autoLoadEntities: true,
    manualInitialization: !enabled,
  } satisfies TypeOrmModuleOptions;
}

export function createDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const {
    autoLoadEntities: _autoLoadEntities,
    manualInitialization: _manualInitialization,
    ...options
  } = createTypeOrmOptions(env);

  return options as DataSourceOptions;
}
