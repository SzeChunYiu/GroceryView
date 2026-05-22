import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CheapestNowService } from './cheapest-now.service.js';
import { PriceFreshnessController } from './freshness.controller.js';
import { PriceHistoryService } from './price-history.service.js';
import { PricesController } from './prices.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PricesController, PriceFreshnessController],
  providers: [CheapestNowService, PriceHistoryService]
})
export class PricesModule {}
