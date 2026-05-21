import { Module } from '@nestjs/common';
import { HouseholdsController } from './households.controller.js';

@Module({ controllers: [HouseholdsController] })
export class HouseholdsModule {}
