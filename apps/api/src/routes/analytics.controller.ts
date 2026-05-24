import { BadRequestException, Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  isConsentTokenGranted,
  parseAnalyticsConsentToken,
  resolveAnalyticsConsentSecret,
  type AnalyticsConsentPayload
} from './analytics-consent.js';

class ItemCardImpressionDto {
  @IsString()
  productId!: string;

  @IsString()
  storeId!: string;

  @IsInt()
  position!: number;
}

class ItemCardImpressionsRequestDto {
  @IsString()
  consentToken?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemCardImpressionDto)
  itemCards!: ItemCardImpressionDto[];
}

function resolveConsentToken(consentTokenHeader: string | undefined, consentTokenBody?: string | undefined): string {
  if (consentTokenHeader?.trim()) {
    return consentTokenHeader.trim();
  }

  if (consentTokenBody?.trim()) {
    return consentTokenBody.trim();
  }

  throw new ForbiddenException('Analytics consent token is required.');
}

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  @Post('item-card-impressions')
  @ApiCreatedResponse({ description: 'Accepted analytics item-card impression batch.' })
  @ApiBadRequestResponse({ description: 'Invalid consent token or item-card-impressions payload.' })
  @ApiForbiddenResponse({ description: 'Missing analytics consent token.' })
  createItemCardImpressions(
    @Body() body: ItemCardImpressionsRequestDto,
    @Headers('x-analytics-consent') consentTokenHeader?: string
  ) {
    const consentToken = resolveConsentToken(consentTokenHeader, body?.consentToken);

    try {
      const payload: AnalyticsConsentPayload = parseAnalyticsConsentToken(consentToken, resolveAnalyticsConsentSecret(process.env.ANALYTICS_CONSENT_TOKEN_SECRET));
      if (!isConsentTokenGranted(payload)) {
        throw new BadRequestException('Analytics consent has not been granted.');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Analytics consent has not been granted.') {
        throw error;
      }
      throw new ForbiddenException(error instanceof Error ? error.message : 'Invalid analytics consent token.');
    }

    if (body.itemCards.length === 0) {
      throw new ForbiddenException('Item-card impressions batch is empty.');
    }

    return {
      accepted: body.itemCards.length
    };
  }
}
