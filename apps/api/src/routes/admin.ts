import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested
} from 'class-validator';
import {
  listRecipeUploads,
  saveRecipeUpload,
  type RecipeIngredientMap
} from '../demo-data.js';

class RecipeIngredientMapDto {
  @IsString()
  @IsNotEmpty()
  ingredient!: string;

  @IsString()
  @IsNotEmpty()
  amount!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsString()
  @IsNotEmpty()
  mappedProductId!: string;
}

class AdminRecipePayloadDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  ingredientsText!: string;

  @IsString()
  instructions!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientMapDto)
  ingredientMappings!: RecipeIngredientMapDto[];
}

@ApiTags('admin')
@Controller('admin')
export class AdminRecipesController {
  @Post('recipes')
  @ApiCreatedResponse({ description: 'Recipe upload saved in demo catalog' })
  create(@Body() payload: AdminRecipePayloadDto) {
    return saveRecipeUpload({
      title: payload.title,
      ingredientsText: payload.ingredientsText,
      instructions: payload.instructions,
      ingredientMappings: payload.ingredientMappings as RecipeIngredientMap[]
    });
  }

  @Get('recipes')
  @ApiOkResponse({ description: 'Demo recipe catalog with ingredient-product mappings' })
  list() {
    return { recipes: listRecipeUploads() };
  }
}
