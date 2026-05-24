import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FavoritesSortMode } from '@groceryview/db';
import { jsonResponse, param, query } from '../openapi.js';
import { validateNoUnexpectedQueryParameters } from '../middleware/validate.js';
import { favoritesRoutes } from '../routes/favorites.js';
import { FavoritesService } from './favorites.service.js';

function normalizeSort(value: unknown): FavoritesSortMode {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === '') return 'name';
  if (raw === 'name' || raw === 'price') return raw;
  throw new BadRequestException('sort must be one of: name, price');
}

@ApiTags('favorites')
@Controller()
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get(favoritesRoutes.accountUserFavoritesPath)
  @jsonResponse(favoritesRoutes.description)
  @param('userId', true, 'User id for demo favorites scope.')
  @query('sort', false, 'Optional sort mode; one of name or price.')
  async list(@Param('userId') userId: string, @Query() query: Record<string, unknown>) {
    validateNoUnexpectedQueryParameters(query, favoritesRoutes.queryParams, favoritesRoutes.accountUserFavoritesPath);
    return this.favorites.list(userId, normalizeSort(query.sort));
  }
}
