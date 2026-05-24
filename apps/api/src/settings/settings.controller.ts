import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { planAccountDeletion } from '@groceryview/core';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthGuard, authenticatedUserId, type AuthenticatedRequest } from '../middleware/auth.js';
import { settingsRoutes } from '../routes/settings.js';
import { buildDemoUserDataExport } from './data-export.js';
import { allowedNotificationChannels, allowedPreferenceCurrencies, SettingsService } from './settings.service.js';

class ApiKeyCreateDto {
  @IsString()
  @IsNotEmpty()
  label!: string;
}

class SettingsPatchDto {
  @IsOptional()
  @IsIn(allowedPreferenceCurrencies)
  currency?: (typeof allowedPreferenceCurrencies)[number];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStores?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(allowedNotificationChannels, { each: true })
  notificationChannels?: Array<(typeof allowedNotificationChannels)[number]>;
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller(settingsRoutes.settings)
export class AuthenticatedSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.preferencesReadDescription })
  async readPreferences(@Req() request: AuthenticatedRequest) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to read authenticated settings.');
    }
    return this.settings.readPreferences(authenticatedUserId(request));
  }

  @Patch()
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.preferencesDescription })
  async updatePreferences(@Req() request: AuthenticatedRequest, @Body() body: SettingsPatchDto) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to save authenticated settings.');
    }
    return this.settings.savePreferences(authenticatedUserId(request), body);
  }

  @Get(settingsRoutes.apiKeys)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.apiKeysReadDescription })
  async listApiKeys(@Req() request: AuthenticatedRequest) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to read authenticated API keys.');
    }
    return this.settings.listApiKeys(authenticatedUserId(request));
  }

  @Post(settingsRoutes.apiKeys)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.apiKeysCreateDescription })
  async createApiKey(@Req() request: AuthenticatedRequest, @Body() body: ApiKeyCreateDto) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to create authenticated API keys.');
    }
    return this.settings.createApiKey(authenticatedUserId(request), body.label);
  }

  @Delete(settingsRoutes.apiKey)
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.apiKeysRevokeDescription })
  async revokeApiKey(@Req() request: AuthenticatedRequest, @Param('keyId') keyId: string) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to revoke authenticated API keys.');
    }
    return this.settings.revokeApiKey(authenticatedUserId(request), keyId);
  }
}

@ApiTags('settings')
@Controller(settingsRoutes.demoUserSettings)
export class SettingsController {
  @Get(settingsRoutes.dataExport)
  @ApiOkResponse({ description: settingsRoutes.dataExportDescription })
  dataExport() {
    return buildDemoUserDataExport();
  }

  @Delete(settingsRoutes.account)
  @HttpCode(200)
  @ApiOkResponse({ description: settingsRoutes.accountDeletionDescription })
  accountDeletion(@Body() body: { confirmation?: string }) {
    return {
      ...planAccountDeletion('demo'),
      deleted: false,
      destructiveAction: false,
      requiresConfirmation: 'DELETE ACCOUNT',
      confirmationReceived: body.confirmation === 'DELETE ACCOUNT',
      demo: true
    };
  }
}
