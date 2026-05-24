import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jsonResponse, query } from '../openapi.js';
import { groceryApi } from '../demo-data.js';

function optionalPositiveNumber(value: string | undefined, field: string) {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`${field} must be a positive number`);
  }
  return parsed;
}

@ApiTags('meal-plans')
@Controller('users/demo/meal-plans')
export class MealPlansController {
  @Get('suggestions')
  @jsonResponse('Deal-based meal suggestions for the demo household')
  @query('maxMealCost', false, 'Optional maximum meal spend floor guard.', undefined, 'number')
  @query('servings', false, 'Optional number of servings to optimize for.', undefined, 'number')
  suggestions(@Query('maxMealCost') maxMealCost?: string, @Query('servings') servings?: string) {
    return {
      ...groceryApi.getMealPlanSuggestionsReport('demo', {
        maxMealCost: optionalPositiveNumber(maxMealCost, 'maxMealCost'),
        servings: optionalPositiveNumber(servings, 'servings')
      }),
      demo: true
    };
  }
}
