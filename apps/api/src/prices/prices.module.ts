import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PriceFreshnessController } from './freshness.controller.js';
import { PriceHistoryService } from './price-history.service.js';
import { PricesController } from './prices.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PricesController, PriceFreshnessController],
  providers: [PriceHistoryService]
})
export class PricesModule {}
