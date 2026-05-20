import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('alerts')
@Controller('users/demo/alerts')
export class AlertsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user alert stream' })
  list() {
    return groceryApi.getWatchlist('demo').alerts;
  }
}
