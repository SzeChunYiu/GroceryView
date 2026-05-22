import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CategoryMarketController } from './category-market.controller.js';
import { IndicesController } from './indices.controller.js';
import { IndicesService } from './indices.service.js';
import { MarketController } from './market.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketController, IndicesController, CategoryMarketController],
  providers: [IndicesService]
})
export class MarketModule {}
