import { Module } from '@nestjs/common';
import { WatchlistsController } from './watchlists.controller.js';

@Module({ controllers: [WatchlistsController] })
export class WatchlistsModule {}
