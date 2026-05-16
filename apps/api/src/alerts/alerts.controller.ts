import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface AlertResponse {
  id: string;
  productSlug: string;
  type: 'target_price';
  targetPrice: number;
  currency: 'SEK';
  channel: 'push';
  enabled: boolean;
  dataStatus: 'seed_demo';
}

const demoAlerts: AlertResponse[] = [
  {
    id: 'alert_zoegas_below_50',
    productSlug: 'zoegas-skane-450g',
    type: 'target_price',
    targetPrice: 50,
    currency: 'SEK',
    channel: 'push',
    enabled: true,
    dataStatus: 'seed_demo',
  },
];

@Controller('me/alerts')
@ApiTags('alerts')
export class AlertsController {
  @Get()
  @ApiOperation({ summary: 'List demo user alerts' })
  listAlerts(): AlertResponse[] {
    return demoAlerts;
  }
}
