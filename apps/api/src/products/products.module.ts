import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';
import { ProductsController } from './products.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [RealCatalogService]
})
export class ProductsModule {}
