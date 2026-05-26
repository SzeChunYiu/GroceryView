import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { TrendingController } from './trending.controller.js';
import { TrendingService } from './trending.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TrendingController],
  providers: [TrendingService]
})
export class TrendingModule {}
