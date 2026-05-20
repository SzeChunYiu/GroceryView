import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { demoAlerts } from '../demo-data';

@ApiTags('alerts')
@Controller('me/alerts')
export class AlertsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user alert rules.' })
  getAlerts() {
    return demoAlerts;
  }
}
