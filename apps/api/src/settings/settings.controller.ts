import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { planAccountDeletion } from '@groceryview/core';
import { settingsRoutes } from '../routes/settings.js';
import { buildDemoUserDataExport } from './data-export.js';
import { groceryApi } from '../demo-data.js';

class HiddenPreferencesDto {
  hiddenProductIds?: string[];
  hiddenStoreIds?: string[];
}

@ApiTags('settings')
@Controller(settingsRoutes.demoUserSettings)
export class SettingsController {
  @Get(settingsRoutes.hidden)
  @ApiOkResponse({ description: settingsRoutes.hiddenDescription })
  hidden() {
    return groceryApi.getHiddenPreferences('demo');
  }

  @Put(settingsRoutes.hidden)
  @ApiOkResponse({ description: settingsRoutes.hiddenDescription })
  replaceHidden(@Body() body: HiddenPreferencesDto) {
    return groceryApi.setHiddenPreferences('demo', {
      hiddenProductIds: body.hiddenProductIds ?? [],
      hiddenStoreIds: body.hiddenStoreIds ?? []
    });
  }

  @Post(settingsRoutes.hiddenItems)
  @ApiOkResponse({ description: settingsRoutes.hiddenDescription })
  hideItem(@Body() body: { productId?: string }) {
    return groceryApi.hideProduct('demo', body.productId ?? '');
  }

  @Delete(settingsRoutes.hiddenItem)
  @HttpCode(200)
  @ApiOkResponse({ description: settingsRoutes.hiddenDescription })
  showItem(@Param('productId') productId: string) {
    return groceryApi.showProduct('demo', productId);
  }

  @Post(settingsRoutes.hiddenStores)
  @ApiOkResponse({ description: settingsRoutes.hiddenDescription })
  hideStore(@Body() body: { storeId?: string }) {
    return groceryApi.hideStore('demo', body.storeId ?? '');
  }

  @Delete(settingsRoutes.hiddenStore)
  @HttpCode(200)
  @ApiOkResponse({ description: settingsRoutes.hiddenDescription })
  showStore(@Param('storeId') storeId: string) {
    return groceryApi.showStore('demo', storeId);
  }

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
