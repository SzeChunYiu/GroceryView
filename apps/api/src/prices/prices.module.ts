import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller.js';

@Module({ controllers: [PricesController] })
export class PricesModule {}
