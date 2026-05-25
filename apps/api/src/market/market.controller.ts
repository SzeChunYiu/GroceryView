import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

type NutritionMetric = 'protein' | 'calories' | 'fiber';
type MarketCode = 'SE' | 'NO' | 'IS';

function optionalNutritionMetric(value?: string): NutritionMetric {
  if (value === undefined || value === '') return 'protein';
  if (value === 'protein' || value === 'calories' || value === 'fiber') return value;
  throw new BadRequestException('metric must be protein, calories, or fiber');
}

function optionalMarket(value?: string): MarketCode {
  const normalized = (value || 'SE').toUpperCase();
  if (normalized === 'SE' || normalized === 'NO' || normalized === 'IS') return normalized;
  throw new BadRequestException('market must be SE, NO, or IS');
}

@ApiTags('market')
@Controller()
export class MarketController {
  @Get('market/overview')
  @ApiOkResponse({ description: 'Country-scoped grocery market overview' })
  overview(@Query('market') market?: string) {
    const marketCode = optionalMarket(market);
    return {
      ...groceryApi.getMarketOverview(),
      market: marketCode,
      countryCode: marketCode,
      domain: 'grocery',
      demo: true
    };
  }

  @Get('nutrition/value')
  @ApiOkResponse({ description: 'Nutrition per krona rankings with guardrails' })
  nutritionValue(@Query('metric') metric?: string) {
    return { ...groceryApi.getNutritionValueReport(optionalNutritionMetric(metric)), demo: true };
  }
}
