import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminController } from './admin.controller.js';

@Module({ imports: [DatabaseModule], controllers: [AdminController] })
export class AdminModule {}
