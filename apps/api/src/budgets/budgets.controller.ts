import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('budgets')
@Controller('users/demo/budget')
export class BudgetsController {
  @Get('summary')
  @ApiOkResponse({ description: 'Demo household budget summary with current basket estimate' })
  summary() {
    return { ...groceryApi.getBudgetSummary('demo'), demo: true };
  }
}
