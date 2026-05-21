import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsModule } from './alerts/alerts.module.js';
import { AppController } from './app.controller.js';
import { BasketsModule } from './baskets/baskets.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { validateEnvironment } from './config/env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { MarketModule } from './market/market.module.js';
import { MealPlansModule } from './meal-plans/meal-plans.module.js';
import { PantryModule } from './pantry/pantry.module.js';
import { PricesModule } from './prices/prices.module.js';
import { ProductsModule } from './products/products.module.js';
import { StoresModule } from './stores/stores.module.js';
import { UsersModule } from './users/users.module.js';
import { WatchlistsModule } from './watchlists/watchlists.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    HealthModule,
    MarketModule,
    MealPlansModule,
    PantryModule,
    ProductsModule,
    StoresModule,
    PricesModule,
    UsersModule,
    WatchlistsModule,
    BasketsModule,
    CategoriesModule,
    AlertsModule
  ],
  controllers: [AppController]
})
export class AppModule {}
