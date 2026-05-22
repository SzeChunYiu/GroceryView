import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';
import { BasketsController, RealBasketsController } from './baskets.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BasketsController, RealBasketsController],
  providers: [RealCatalogService]
})
export class BasketsModule {}
