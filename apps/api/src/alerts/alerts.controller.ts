import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

export class AlertDto {
  id!: string;
  productSlug!: string;
  triggerType!: 'target_price';
  targetPriceAmount!: number;
  currency!: 'SEK';
  enabled!: boolean;
  demo!: true;
}

const ALERTS: AlertDto[] = [
  {
    id: 'demo-alert-zoegas',
    productSlug: 'zoegas-skane-mellanrost-450g',
    triggerType: 'target_price',
    targetPriceAmount: 45,
    currency: 'SEK',
    enabled: true,
    demo: true,
  },
];

@Controller('me/alerts')
@ApiTags('alerts')
export class AlertsController {
  @Get()
  @ApiOperation({ summary: 'List demo alerts for the current user' })
  @ApiOkResponse({ type: AlertDto, isArray: true })
  listAlerts(): AlertDto[] {
    return ALERTS;
  }
}
