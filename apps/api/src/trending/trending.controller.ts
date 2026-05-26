import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { optionalBoundedIntegerQueryParameter, validateNoUnexpectedQueryParameters } from '../middleware/validate.js';
import { trendingRoutes } from '../routes/trending.js';
import { TrendingService } from './trending.service.js';

@ApiTags('trending')
@Controller(trendingRoutes.controllerPath)
export class TrendingController {
  constructor(private readonly trending: TrendingService) {}

  @Get()
  @ApiOkResponse({ description: trendingRoutes.description })
  trendingItems(@Query() query: Record<string, unknown>) {
    validateNoUnexpectedQueryParameters(query, [trendingRoutes.limitQueryParam], trendingRoutes.controllerPath);
    return this.trending.trendingItems({
      limit: optionalBoundedIntegerQueryParameter(query, trendingRoutes.limitQueryParam, {
        defaultValue: trendingRoutes.defaultLimit,
        max: trendingRoutes.maxLimit,
        min: 1
      })
    });
  }
}
