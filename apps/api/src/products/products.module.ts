import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductItemsController } from '../routes/items.js';

@Module({ controllers: [ProductsController, ProductItemsController] })
export class ProductsModule {}
