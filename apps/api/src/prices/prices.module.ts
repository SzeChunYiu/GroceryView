import { Module } from '@nestjs/common';
import { PriceFreshnessController } from './freshness.controller.js';
import { PricesController } from './prices.controller.js';

@Module({ controllers: [PricesController, PriceFreshnessController] })
export class PricesModule {}
