import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { settingsRoutes } from '../routes/settings.js';
import { buildDemoUserDataExport } from './data-export.js';

@ApiTags('settings')
@Controller(settingsRoutes.demoUserSettings)
export class SettingsController {
  @Get(settingsRoutes.dataExport)
  @ApiOkResponse({ description: settingsRoutes.dataExportDescription })
  dataExport() {
    return buildDemoUserDataExport();
  }
}
