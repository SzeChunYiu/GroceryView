import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

type NutritionMetric = 'protein' | 'calories' | 'fiber';

function optionalNutritionMetric(value?: string): NutritionMetric {
  if (value === undefined || value === '') return 'protein';
  if (value === 'protein' || value === 'calories' || value === 'fiber') return value;
  throw new BadRequestException('metric must be protein, calories, or fiber');
}

@ApiTags('market')
@Controller()
export class MarketController {
  @Get('market/overview')
  @ApiOkResponse({ description: 'Stockholm grocery market overview' })
  overview() {
    return { ...groceryApi.getMarketOverview(), demo: true };
  }

  @Get('nutrition/value')
  @ApiOkResponse({ description: 'Nutrition per krona rankings with guardrails' })
  nutritionValue(@Query('metric') metric?: string) {
    return { ...groceryApi.getNutritionValueReport(optionalNutritionMetric(metric)), demo: true };
  }
}
