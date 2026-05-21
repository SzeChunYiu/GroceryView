import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller.js';

@Module({ controllers: [MealPlansController] })
export class MealPlansModule {}
