import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';
import { SearchController } from './search.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [RealCatalogService]
})
export class SearchModule {}

