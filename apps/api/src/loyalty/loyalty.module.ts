import { Module } from '@nestjs/common';
import { LoyaltyController } from './loyalty.controller.js';

@Module({ controllers: [LoyaltyController] })
export class LoyaltyModule {}
