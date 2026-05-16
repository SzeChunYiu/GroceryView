import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PriceEvent } from '../prices/price-event.entity';
import { Product } from '../products/product.entity';
import { Store } from '../stores/store.entity';

function getDataSourceOptions(): DataSourceOptions {
  const commonOptions = {
    type: 'postgres' as const,
    entities: [Product, Store, PriceEvent],
    migrations: ['src/database/migrations/*{.ts,.js}'],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...commonOptions,
      url: process.env.DATABASE_URL,
    };
  }

  return {
    ...commonOptions,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'groceryview',
  };
}

export const AppDataSource = new DataSource(getDataSourceOptions());

export default AppDataSource;
