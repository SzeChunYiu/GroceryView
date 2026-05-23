import { Module } from '@nestjs/common';
import { ExpiryDealsController } from './expiry-deals.controller.js';

@Module({ controllers: [ExpiryDealsController] })
export class ExpiryDealsModule {}
