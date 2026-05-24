import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CompareController } from './compare.controller.js';
import { CompareService } from './compare.service.js';

@Module({ imports: [DatabaseModule], controllers: [CompareController], providers: [CompareService] })
export class CompareModule {}
