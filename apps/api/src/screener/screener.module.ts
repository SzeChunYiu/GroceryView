import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ScreenerController } from './screener.controller.js';
import { ScreenerService } from './screener.service.js';

@Module({ imports: [DatabaseModule], controllers: [ScreenerController], providers: [ScreenerService] })
export class ScreenerModule {}
