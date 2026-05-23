import { Module } from '@nestjs/common';
import { DealsModule } from '../deals/deals.module.js';
import { StoresController } from './stores.controller.js';

@Module({ imports: [DealsModule], controllers: [StoresController] })
export class StoresModule {}
