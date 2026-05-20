import { Module } from '@nestjs/common';
import { DealscoreController } from './dealscore.controller';

@Module({
  controllers: [DealscoreController],
})
export class DealscoreModule {}
