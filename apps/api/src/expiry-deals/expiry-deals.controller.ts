import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

function optionalPositiveNumber(value: string | undefined, field: string) {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`${field} must be a positive number`);
  }
  return parsed;
}

function categoryFilter(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.flatMap((entry) => entry.split(',').map((item) => item.trim()).filter(Boolean));
}

@ApiTags('expiry-deals')
@Controller('users/demo/expiry-deals')
export class ExpiryDealsController {
  @Get('radar')
  @ApiOkResponse({ description: 'Demo expiry markdown radar with category, distance, and verification guardrails' })
  radar(@Query('now') now?: string, @Query('category') category?: string | string[], @Query('maxDistanceKm') maxDistanceKm?: string) {
    return {
      ...groceryApi.getExpiryDealRadarReport('demo', {
        now,
        categoryFilter: categoryFilter(category),
        maxDistanceKm: optionalPositiveNumber(maxDistanceKm, 'maxDistanceKm')
      }),
      demo: true
    };
  }
}
