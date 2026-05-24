import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jsonResponse, query } from '../openapi.js';
import { groceryApi } from '../demo-data.js';

@ApiTags('pantry')
@Controller('users/demo/pantry')
export class PantryController {
  @Get('replenishment')
  @jsonResponse('Demo household pantry replenishment plan')
  @query('asOf', false, 'Optional ISO-8601 timestamp that drives forecast horizon and stale stock age checks.')
  replenishment(@Query('asOf') asOf?: string) {
    return { ...groceryApi.getPantryReplenishment('demo', asOf), demo: true };
  }
}
