import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export class AlertResponse {
  id!: string;
  type!: 'target_price' | 'basket_drop';
  title!: string;
  productSlug!: string | null;
  thresholdAmount!: number | null;
  currency!: 'SEK';
  active!: boolean;
  lastTriggeredAt!: string | null;
  demo!: true;
}

const DEMO_ALERTS: AlertResponse[] = [
  {
    id: 'demo-alert-zoegas-target-price',
    type: 'target_price',
    title: 'Zoégas below 50 kr',
    productSlug: 'zoegas-skane-mellanrost-450g',
    thresholdAmount: 50,
    currency: 'SEK',
    active: true,
    lastTriggeredAt: '2026-05-16T09:30:00.000Z',
    demo: true,
  },
];

@ApiTags('alerts')
@Controller('me/alerts')
export class AlertsController {
  @Get()
  @ApiOkResponse({ type: AlertResponse, isArray: true })
  findMine(): AlertResponse[] {
    return DEMO_ALERTS;
  }
}
