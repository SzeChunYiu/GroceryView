import { Body, Controller, Delete, Get, HttpCode, Patch, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { planAccountDeletion } from '@groceryview/core';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { AuthGuard, authenticatedSession, authenticatedUserId, type AuthenticatedRequest } from '../middleware/auth.js';
import { settingsRoutes } from '../routes/settings.js';
import { buildDemoUserDataExport } from './data-export.js';
import { allowedMyFlyerAlgorithmChoices, allowedNotificationChannels, allowedPreferenceCurrencies, SettingsService } from './settings.service.js';

class SettingsPatchDto {
  @IsOptional()
  @IsIn(allowedPreferenceCurrencies)
  currency?: (typeof allowedPreferenceCurrencies)[number];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Matches(/^[a-z0-9][a-z0-9-]*$/, { each: true })
  preferredStores?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(allowedNotificationChannels, { each: true })
  notificationChannels?: Array<(typeof allowedNotificationChannels)[number]>;

  @IsOptional()
  @IsIn(allowedMyFlyerAlgorithmChoices)
  algorithm_choice?: (typeof allowedMyFlyerAlgorithmChoices)[number];
}

class ProfilePatchDto {
  @IsString()
  @Length(1, 80)
  displayName!: string;
}

class PasswordPatchDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Length(12, 128)
  newPassword!: string;
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

  @Get(settingsRoutes.profile)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.profileReadDescription })
  async readProfile(@Req() request: AuthenticatedRequest) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to read authenticated profile.');
    }
    const session = authenticatedSession(request);
    return this.settings.readProfile(session.userId, session.email);
  }

  @Patch(settingsRoutes.profile)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.profileDescription })
  async updateProfile(@Req() request: AuthenticatedRequest, @Body() body: ProfilePatchDto) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to save authenticated profile.');
    }
    const session = authenticatedSession(request);
    return this.settings.saveProfile(session.userId, { displayName: body.displayName, email: session.email });
  }

  @Patch(settingsRoutes.profilePassword)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: settingsRoutes.profilePasswordDescription })
  async updatePassword(@Req() request: AuthenticatedRequest, @Body() body: PasswordPatchDto) {
    if (!this.settings.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to change authenticated profile password.');
    }
    return this.settings.changePassword(authenticatedUserId(request), body);
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
