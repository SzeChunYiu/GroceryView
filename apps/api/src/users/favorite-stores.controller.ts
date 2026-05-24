import { Body, Controller, Delete, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { jsonArrayResponse, jsonCreatedResponse, jsonResponse, param } from '../openapi.js';
import { groceryApi } from '../demo-data.js';

class FavoriteStoreDto {
  @IsString()
  storeId!: string;
}

function demoFavoriteStores() {
  return groceryApi.getFavoriteStores('demo').map((store) => ({ ...store, demo: true }));
}

function asStoreNotFound(error: unknown) {
  if (error instanceof Error && /Unknown storeId/.test(error.message)) {
    throw new NotFoundException('Store not found');
  }
  throw error;
}

@ApiTags('favorite-stores')
@Controller('users/demo/favorite-stores')
export class FavoriteStoresController {
  @Get()
  @jsonArrayResponse('Demo user favorite stores')
  list() {
    return demoFavoriteStores();
  }

  @Post()
  @jsonCreatedResponse('Favorite store added')
  add(@Body() body: FavoriteStoreDto) {
    try {
      groceryApi.addFavoriteStore('demo', body.storeId);
      return demoFavoriteStores();
    } catch (error) {
      asStoreNotFound(error);
    }
  }

  @Delete(':storeId')
  @param('storeId', true, 'Store id for favorite removal scope.')
  @jsonResponse('Favorite store removed')
  remove(@Param('storeId') storeId: string) {
    try {
      groceryApi.removeFavoriteStore('demo', storeId);
      return demoFavoriteStores();
    } catch (error) {
      asStoreNotFound(error);
    }
  }
}
