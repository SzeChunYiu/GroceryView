import { Module } from '@nestjs/common';
import { FavoriteStoresController } from './favorite-stores.controller.js';

@Module({ controllers: [FavoriteStoresController] })
export class UsersModule {}
