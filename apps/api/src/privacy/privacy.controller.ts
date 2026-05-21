import { buildPrivacyExport, planAccountDeletion } from '@groceryview/core';
import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

const demoGeneratedAt = '2026-05-20T12:00:00.000Z';

@ApiTags('privacy')
@Controller('users/demo/privacy')
export class PrivacyController {
  @Get('export')
  @ApiOkResponse({ description: 'Demo user privacy export summary' })
  export() {
    const householdPlan = groceryApi.getHouseholdPlan('demo');
    return {
      ...buildPrivacyExport(
        {
          userId: 'demo',
          favoriteStoreIds: groceryApi.getFavoriteStores('demo').map((store) => store.id),
          watchlistProductIds: groceryApi.getWatchlist('demo').items.map((item) => item.productId),
          receiptIds: [],
          householdIds: householdPlan ? [householdPlan.household.id] : []
        },
        demoGeneratedAt
      ),
      demo: true
    };
  }

  @Post('deletion-plan')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Demo user account deletion plan without destructive action' })
  deletionPlan() {
    return {
      ...planAccountDeletion('demo'),
      destructiveAction: false,
      requiresReauthentication: true,
      demo: true
    };
  }
}
