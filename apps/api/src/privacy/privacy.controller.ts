import {
  buildPrivacyExport,
  planAccountDeletion,
  planPrivacyRequestFulfillment,
  type PrivacyRequestStatus,
  type PrivacyRequestType
} from '@groceryview/core';
import { BadRequestException, Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { groceryApi } from '../demo-data.js';

const demoGeneratedAt = '2026-05-20T12:00:00.000Z';
const privacyRequestTypes = ['data_export', 'account_deletion', 'ad_data_opt_out'] as const;
const privacyRequestStatuses = ['received', 'in_progress', 'fulfilled', 'rejected'] as const;

class PrivacyRequestDto {
  @IsString()
  id!: string;

  @IsString()
  userId!: string;

  @IsIn(privacyRequestTypes)
  type!: PrivacyRequestType;

  @IsString()
  receivedAt!: string;

  @IsIn(privacyRequestStatuses)
  status!: PrivacyRequestStatus;
}

class PrivacyRequestFulfillmentDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  slaDays = 30;

  @IsOptional()
  @IsNumber()
  @Min(0)
  alertBeforeDays = 5;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrivacyRequestDto)
  requests!: PrivacyRequestDto[];
}

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

  @Post('request-fulfillment')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Demo user privacy request fulfillment plan' })
  requestFulfillment(@Body() body: PrivacyRequestFulfillmentDto) {
    try {
      return {
        ...planPrivacyRequestFulfillment({
          now: demoGeneratedAt,
          slaDays: body.slaDays,
          alertBeforeDays: body.alertBeforeDays,
          requests: body.requests.map((request, index) => {
            if (request.userId !== 'demo') {
              throw new BadRequestException(`requests[${index}].userId must match requested user.`);
            }
            return request;
          })
        }),
        demo: true
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
