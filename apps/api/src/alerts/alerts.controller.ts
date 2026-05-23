import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';
import { alertsRoutes } from '../routes/alerts.js';

@ApiTags('alerts')
@Controller(alertsRoutes.demoUserAlerts)
export class AlertsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user alert stream' })
  list() {
    return groceryApi.getWatchlist('demo').alerts;
  }

  @Get(alertsRoutes.demoUserAlertInbox)
  @ApiOkResponse({ description: 'Demo user notification inbox queue' })
  inbox() {
    return { ...groceryApi.getNotificationInboxReport('demo'), demo: true };
  }
}
