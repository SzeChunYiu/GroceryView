import { Module } from '@nestjs/common';
import { ItemsController } from './items.js';

@Module({
  controllers: [ItemsController]
})
export class ItemsModule {}
