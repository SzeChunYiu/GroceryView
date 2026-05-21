import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller.js';

@Module({ controllers: [BudgetsController] })
export class BudgetsModule {}
