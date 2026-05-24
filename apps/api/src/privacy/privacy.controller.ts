import { planAccountDeletion } from '@groceryview/core';
import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { buildDemoUserDataExport } from '../settings/data-export.js';

@ApiTags('privacy')
@Controller('users/demo/privacy')
export class PrivacyController {
  @Get('export')
  @ApiOkResponse({ description: 'Demo user privacy export summary' })
  export() {
    return buildDemoUserDataExport();
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
