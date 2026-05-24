import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { planAccountDeletion } from '@groceryview/core';
import { groceryApi } from '../demo-data.js';
import { normalizePreferredStoreIds, settingsRoutes } from '../routes/settings.js';
import { buildDemoUserDataExport } from './data-export.js';

let demoPreferredStoreIds = ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan'];

function preferredStoresPayload() {
  return {
    userId: 'demo',
    storeIds: demoPreferredStoreIds,
    stores: demoPreferredStoreIds.map((storeId) => groceryApi.getStore(storeId)).filter(Boolean),
    minStores: 1,
    maxStores: 5,
    demo: true
  };
}

function requireValidPreferredStoreIds(storeIds: unknown) {
  if (!Array.isArray(storeIds)) {
    throw new BadRequestException('storeIds must be an array.');
  }
  const requestedStoreIds = [...new Set(storeIds.map((storeId) => String(storeId).trim()).filter(Boolean))];
  const normalized = normalizePreferredStoreIds(storeIds.map((storeId) => String(storeId)));
  if (requestedStoreIds.length < 1 || requestedStoreIds.length > 5) {
    throw new BadRequestException('Select between 1 and 5 preferred stores.');
  }
  return normalized;
}

@ApiTags('settings')
@Controller(settingsRoutes.demoUserSettings)
export class SettingsController {
  @Get(settingsRoutes.preferredStores)
  @ApiOkResponse({ description: settingsRoutes.preferredStoresDescription })
  preferredStores() {
    return preferredStoresPayload();
  }

  @Put(settingsRoutes.preferredStores)
  @ApiOkResponse({ description: settingsRoutes.preferredStoresDescription })
  updatePreferredStores(@Body() body: { storeIds?: unknown }) {
    demoPreferredStoreIds = requireValidPreferredStoreIds(body.storeIds);
    return preferredStoresPayload();
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
