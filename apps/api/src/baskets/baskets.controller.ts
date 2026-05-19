import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('baskets')
@Controller('baskets')
export class BasketsController {
  @Get()
  @ApiOkResponse({ description: 'List saved baskets for a user.' })
  getBaskets(@Query('userId') userId: string) {
    return { userId, items: [] };
  }

  @Post()
  @ApiCreatedResponse({ description: 'Create or update a basket.' })
  upsertBasket(@Body() body: Record<string, unknown>) {
    return { accepted: true, basket: body };
  }
}
