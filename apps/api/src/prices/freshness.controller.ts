import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jsonResponse, query } from '../openapi.js';
import { groceryApi } from '../demo-data.js';

@ApiTags('prices')
@Controller('prices')
export class PriceFreshnessController {
  @Get('freshness')
  @query('asOf', false, 'Optional ISO-8601 timestamp used to evaluate freshness queue age.')
  @jsonResponse('Price freshness and stale-price backfill queue')
  freshness(@Query('asOf') asOf?: string) {
    return { ...groceryApi.getPriceFreshnessReport(asOf), demo: true };
  }
}
