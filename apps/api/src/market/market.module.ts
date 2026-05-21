import { Module } from '@nestjs/common';
import { CategoryMarketController } from './category-market.controller.js';
import { IndicesController } from './indices.controller.js';
import { MarketController } from './market.controller.js';

@Module({
  controllers: [MarketController, IndicesController, CategoryMarketController]
})
export class MarketModule {}
