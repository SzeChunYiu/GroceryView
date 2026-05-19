import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  @Get()
  @ApiOkResponse({ description: 'List price alerts for a user.' })
  getAlerts(@Query('userId') userId: string) {
    return { userId, items: [] };
  }

  @Post()
  @ApiCreatedResponse({ description: 'Create a price alert.' })
  createAlert(@Body() body: Record<string, unknown>) {
    return { accepted: true, alert: body };
  }
}
