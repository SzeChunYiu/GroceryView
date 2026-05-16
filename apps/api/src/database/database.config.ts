import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PriceEvent } from '../prices/price-event.entity';
import { Product } from '../products/product.entity';
import { Store } from '../stores/store.entity';

function getNumber(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const value = configService.get<string | number>(key);
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return Number(value);
}

function getSsl(
  configService: ConfigService,
): false | { rejectUnauthorized: boolean } {
  return configService.get<string>('DB_SSL') === 'true'
    ? { rejectUnauthorized: false }
    : false;
}

export function isDatabaseEnabled(): boolean {
  return (
    process.env.DATABASE_ENABLED === 'true' ||
    Boolean(process.env.DATABASE_URL) ||
    Boolean(process.env.DB_HOST)
  );
}

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const commonOptions = {
    type: 'postgres' as const,
    entities: [Product, Store, PriceEvent],
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
    synchronize: false,
    autoLoadEntities: true,
    retryAttempts: getNumber(configService, 'DB_RETRY_ATTEMPTS', 1),
    retryDelay: getNumber(configService, 'DB_RETRY_DELAY_MS', 1000),
    ssl: getSsl(configService),
  };

  const databaseUrl = configService.get<string>('DATABASE_URL');
  if (databaseUrl) {
    return {
      ...commonOptions,
      url: databaseUrl,
    };
  }

  return {
    ...commonOptions,
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: getNumber(configService, 'DB_PORT', 5432),
    username: configService.get<string>('DB_USER', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'groceryview'),
  };
}
