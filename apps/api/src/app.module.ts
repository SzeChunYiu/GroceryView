import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsModule } from './alerts/alerts.module';
import { BasketsModule } from './baskets/baskets.module';
import { validateEnv } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PricesModule } from './prices/prices.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { WatchlistsModule } from './watchlists/watchlists.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    HealthModule,
    ProductsModule,
    StoresModule,
    PricesModule,
    UsersModule,
    WatchlistsModule,
    BasketsModule,
    AlertsModule
  ]
})
export class AppModule {}
