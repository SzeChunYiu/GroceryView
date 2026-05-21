import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('pantry')
@Controller('users/demo/pantry')
export class PantryController {
  @Get('replenishment')
  @ApiOkResponse({ description: 'Demo household pantry replenishment plan' })
  replenishment(@Query('asOf') asOf?: string) {
    return { ...groceryApi.getPantryReplenishment('demo', asOf), demo: true };
  }
}
