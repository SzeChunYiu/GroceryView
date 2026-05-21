import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller.js';

@Module({ controllers: [AdsController] })
export class AdsModule {}
