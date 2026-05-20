import { Module } from '@nestjs/common';
import { BasketsController } from './baskets.controller.js';

@Module({ controllers: [BasketsController] })
export class BasketsModule {}
