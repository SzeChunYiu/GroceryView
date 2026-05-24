import { NotFoundException, Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export type RecipeIngredientDto = {
  id: string;
  name: string;
  quantity: string;
  productSlug: string;
  matchedProductName: string;
  bestStore: string;
  bestPriceSek: number;
  comparison: Array<{
    store: string;
    priceSek: number;
    priceType: 'shelf' | 'online' | 'weekly deal' | 'member promo';
  }>;
};

export type RecipeDto = {
  id: string;
  title: string;
  servings: number;
  summary: string;
  ingredients: RecipeIngredientDto[];
};

export const recipeFixtures: RecipeDto[] = [
  {
    id: 'budget-pasta-night',
    title: 'Budget pasta night',
    servings: 4,
    summary: 'A route-ready dinner built from visible GroceryView price rows. Add every ingredient to the shopping list, then compare the best store for each row.',
    ingredients: [
      {
        id: 'barilla-spaghetti-1kg',
        name: 'Spaghetti',
        quantity: '1 kg pack',
        productSlug: 'barilla-spaghetti-1kg',
        matchedProductName: 'Barilla Spaghetti 1kg',
        bestStore: 'City Gross Stockholm',
        bestPriceSek: 27.9,
        comparison: [
          { store: 'City Gross Stockholm', priceSek: 27.9, priceType: 'online' },
          { store: 'Hemköp Stockholm', priceSek: 31.9, priceType: 'shelf' }
        ]
      },
      {
        id: 'felix-ketchup-1kg',
        name: 'Tomato base',
        quantity: '1 bottle',
        productSlug: 'felix-ketchup-1kg',
        matchedProductName: 'Felix Tomatketchup 1kg',
        bestStore: 'Hemköp Stockholm',
        bestPriceSek: 32,
        comparison: [
          { store: 'Hemköp Stockholm', priceSek: 32, priceType: 'weekly deal' },
          { store: 'ICA Nära Sergels Torg', priceSek: 36.9, priceType: 'shelf' }
        ]
      },
      {
        id: 'zeta-olivolja-classico-500ml',
        name: 'Olive oil',
        quantity: '500 ml bottle',
        productSlug: 'zeta-olivolja-classico-500ml',
        matchedProductName: 'Zeta Olivolja Classico 500ml',
        bestStore: 'Coop Swedenborgsgatan',
        bestPriceSek: 79.9,
        comparison: [
          { store: 'Coop Swedenborgsgatan', priceSek: 79.9, priceType: 'member promo' },
          { store: 'Willys Odenplan', priceSek: 84.9, priceType: 'shelf' }
        ]
      }
    ]
  }
];

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  @Get(':id')
  @ApiOkResponse({ description: 'Recipe ingredients with shopping-list and store-comparison metadata' })
  recipe(@Param('id') id: string) {
    const recipe = recipeFixtures.find((item) => item.id === id);
    if (!recipe) throw new NotFoundException('Recipe not found');
    return { ...recipe, addAllToList: true, demo: true };
  }
}
