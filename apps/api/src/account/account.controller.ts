import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('account')
@Controller('users/demo/account')
export class AccountController {
  @Get('subscription-access')
  @ApiOkResponse({ description: 'Demo account subscription access policy' })
  subscriptionAccess(@Query('now') now?: string) {
    return { ...groceryApi.getSubscriptionAccess('demo', now), demo: true };
  }

  @Get('subscription-entitlement')
  @ApiOkResponse({ description: 'Demo account subscription entitlement snapshot' })
  subscriptionEntitlement() {
    return { userId: 'demo', entitlement: groceryApi.getSubscriptionEntitlement('demo'), demo: true };
  }
}
