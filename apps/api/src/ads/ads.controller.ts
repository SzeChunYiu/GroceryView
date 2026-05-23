import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('ads')
@Controller('users/demo/ads')
export class AdsController {
  @Get('disclosure')
  @ApiOkResponse({ description: 'Demo account ad disclosure status and ranking separation guardrails' })
  disclosure() {
    return { ...groceryApi.getAdDisclosureReport('demo'), demo: true };
  }
}
