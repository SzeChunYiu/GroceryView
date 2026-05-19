import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: 'groceryview-api';
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'API liveness probe.' })
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'groceryview-api' };
  }
}
