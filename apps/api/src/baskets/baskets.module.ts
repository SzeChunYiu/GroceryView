import { Module } from '@nestjs/common';
import { BasketsController } from './baskets.controller';

@Module({
  controllers: [BasketsController],
})
export class BasketsModule {}
