import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AlertsModule } from './alerts/alerts.module';
import { BasketsModule } from './baskets/baskets.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PricesModule } from './prices/prices.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { WatchlistsModule } from './watchlists/watchlists.module';
import { validateEnvironment } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    AlertsModule,
    BasketsModule,
    PricesModule,
    ProductsModule,
    StoresModule,
    UsersModule,
    WatchlistsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
