import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { query, jsonResponse } from '../openapi.js';
import { groceryApi } from '../demo-data.js';

@ApiTags('account')
@Controller('users/demo/account')
export class AccountController {
  @Get('subscription-access')
  @jsonResponse('Demo account subscription access policy')
  @query('now', false, 'Optional ISO-8601 date-time used for entitlement snapshots.')
  subscriptionAccess(@Query('now') now?: string) {
    return { ...groceryApi.getSubscriptionAccess('demo', now), demo: true };
  }

  @Get('subscription-entitlement')
  @jsonResponse('Demo account subscription entitlement snapshot')
  subscriptionEntitlement() {
    return { userId: 'demo', entitlement: groceryApi.getSubscriptionEntitlement('demo'), demo: true };
  }
}
