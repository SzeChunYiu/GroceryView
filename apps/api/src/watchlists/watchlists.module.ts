import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { WatchlistsController } from './watchlists.controller.js';
import { WatchlistsService } from './watchlists.service.js';

@Module({ imports: [DatabaseModule], controllers: [WatchlistsController], providers: [WatchlistsService] })
export class WatchlistsModule {}
