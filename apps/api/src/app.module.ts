import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module.js';
import { AdsModule } from './ads/ads.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { AppController } from './app.controller.js';
import { BasketsModule } from './baskets/baskets.module.js';
import { BudgetsModule } from './budgets/budgets.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { validateEnvironment } from './config/env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { DealsModule } from './deals/deals.module.js';
import { ExpiryDealsModule } from './expiry-deals/expiry-deals.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { HealthModule } from './health/health.module.js';
import { HouseholdsModule } from './households/households.module.js';
import { LoyaltyModule } from './loyalty/loyalty.module.js';
import { MarketModule } from './market/market.module.js';
import { MealPlansModule } from './meal-plans/meal-plans.module.js';
import { PantryModule } from './pantry/pantry.module.js';
import { PricesModule } from './prices/prices.module.js';
import { PrivacyModule } from './privacy/privacy.module.js';
import { ProductsModule } from './products/products.module.js';
import { ReceiptsModule } from './receipts/receipts.module.js';
import { RecipesController } from './routes/recipes.js';
import { RetailersModule } from './retailers/retailers.module.js';
import { ScreenerModule } from './screener/screener.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { StoresModule } from './stores/stores.module.js';
import { UsersModule } from './users/users.module.js';
import { WatchlistsModule } from './watchlists/watchlists.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    AccountModule,
    AdsModule,
    DatabaseModule,
    DealsModule,
    ExpiryDealsModule,
    FavoritesModule,
    HealthModule,
    HouseholdsModule,
    LoyaltyModule,
    MarketModule,
    MealPlansModule,
    PantryModule,
    ProductsModule,
    PrivacyModule,
    RetailersModule,
    ScreenerModule,
    SettingsModule,
    StoresModule,
    PricesModule,
    UsersModule,
    ReceiptsModule,
    WatchlistsModule,
    BasketsModule,
    BudgetsModule,
    CategoriesModule,
    AlertsModule
  ],
  controllers: [AppController, RecipesController]
})
export class AppModule {}
