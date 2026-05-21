import { Module } from '@nestjs/common';
import { PantryController } from './pantry.controller.js';

@Module({ controllers: [PantryController] })
export class PantryModule {}
