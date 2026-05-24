import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DealsModule } from '../deals/deals.module.js';
import { NearestStoresService } from './nearest-stores.service.js';
import { StoresController } from './stores.controller.js';

@Module({ imports: [DatabaseModule, DealsModule], controllers: [StoresController], providers: [NearestStoresService] })
export class StoresModule {}
