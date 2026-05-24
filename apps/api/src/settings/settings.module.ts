import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AuthenticatedSettingsController, SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

@Module({ imports: [DatabaseModule], controllers: [AuthenticatedSettingsController, SettingsController], providers: [SettingsService] })
export class SettingsModule {}
