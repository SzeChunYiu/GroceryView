import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOkResponse({ description: 'API entrypoint' })
  root() {
    return {
      service: 'groceryview-api',
      docs: '/api',
      health: '/health'
    };
  }
}
