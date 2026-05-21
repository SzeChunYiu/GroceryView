import { Module } from '@nestjs/common';
import { IndicesController } from './indices.controller.js';
import { MarketController } from './market.controller.js';

@Module({
  controllers: [MarketController, IndicesController]
})
export class MarketModule {}
