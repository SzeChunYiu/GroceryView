import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('loyalty')
@Controller('users/demo/loyalty')
export class LoyaltyController {
  @Get('offers')
  @ApiOkResponse({ description: 'Demo household loyalty offers with savings and action requirements' })
  offers() {
    return { ...groceryApi.getLoyaltyOfferReport('demo'), demo: true };
  }
}
