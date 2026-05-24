import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DealsModule } from '../deals/deals.module.js';
import { NearestStoresService } from './nearest-stores.service.js';
import { StoresController } from './stores.controller.js';
import { StoreRatingsService } from './store-ratings.service.js';

@Module({ imports: [DatabaseModule, DealsModule], controllers: [StoresController], providers: [NearestStoresService, StoreRatingsService] })
export class StoresModule {}
