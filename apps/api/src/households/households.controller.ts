import { BadRequestException, Body, Controller, Get, NotFoundException, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { groceryApi } from '../demo-data.js';

class HouseholdMemberDto {
  @IsString()
  userId!: string;

  @IsString()
  displayName!: string;
}

class HouseholdBasketItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsString()
  addedBy!: string;
}

class HouseholdWatchlistItemDto {
  @IsString()
  productId!: string;

  @IsString()
  addedBy!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;
}

class HouseholdPlanDto {
  @IsString()
  householdId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  weeklyBudget!: number;

  @IsNumber()
  @Min(0)
  approvalLimit!: number;

  @IsString()
  reviewer!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HouseholdMemberDto)
  members!: HouseholdMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HouseholdBasketItemDto)
  basketItems?: HouseholdBasketItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HouseholdWatchlistItemDto)
  watchlistItems?: HouseholdWatchlistItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sharedFavoriteStoreIds?: string[];
}

@ApiTags('households')
@Controller('users/demo/households')
export class HouseholdsController {
  @Get('current')
  @ApiOkResponse({ description: 'Current demo household plan' })
  current() {
    const plan = groceryApi.getHouseholdPlan('demo');
    if (!plan) throw new NotFoundException('Household plan not found');
    return { userId: 'demo', ...plan, demo: true };
  }

  @Put('current')
  @ApiOkResponse({ description: 'Create or replace the current demo household plan' })
  upsert(@Body() body: HouseholdPlanDto) {
    try {
      return { userId: 'demo', ...groceryApi.upsertHouseholdPlan('demo', body), demo: true };
    } catch (error) {
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
