import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller.js';
import { PriceStreamController } from '../routes/sse.js';

@Module({ controllers: [PricesController, PriceStreamController] })
export class PricesModule {}
