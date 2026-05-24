import { createGroceryViewApi, type ProductDetail, type Store } from '@groceryview/api';
import { randomUUID } from 'node:crypto';

export const groceryApi = createGroceryViewApi();
const productViewCounts = new Map<string, number>();

export type ProductPriceDto = ProductDetail['currentPrices'][number] & {
  productId: string;
  currency: 'SEK';
  priceType: 'shelf';
  confidence: 'high' | 'medium' | 'low';
  observedAt: string;
  sourceType: 'demo_seed';
  provenance: string;
};

export function productPrices(productId: string): ProductPriceDto[] {
  const product = groceryApi.getProduct(productId);
  if (!product) return [];
  return product.currentPrices.map((price, index) => ({
    ...price,
    productId,
    currency: 'SEK',
    priceType: 'shelf',
    confidence: index === 0 ? 'high' : 'medium',
    observedAt: '2026-05-19T09:00:00Z',
    sourceType: 'demo_seed',
    provenance: `demo://prices/${productId}/${price.storeId}`
  }));
}

export function allProducts(query = '') {
  const products = query ? groceryApi.searchProducts(query) : groceryApi.searchProducts('');
  return products.map((product) => ({
    ...product,
    currentPrices: productPrices(product.id),
    demo: true
  }));
}

export function productById(id: string) {
  return groceryApi.getProduct(id);
}

export function incrementProductViewCount(id: string): number {
  const nextCount = (productViewCounts.get(id) ?? 0) + 1;
  productViewCounts.set(id, nextCount);
  return nextCount;
}

export function getProductViewCount(id: string): number {
  return productViewCounts.get(id) ?? 0;
}

export function allStores(): Array<Store & { demo: true }> {
  return groceryApi.getStores().map((store) => ({ ...store, demo: true }));
}

export type RecipeIngredientMap = {
  ingredient: string;
  amount: string;
  unit: string;
  mappedProductId: string;
};

export type RecipeUpload = {
  id: string;
  title: string;
  instructions: string;
  ingredientsText: string;
  ingredientMappings: RecipeIngredientMap[];
  createdAt: string;
};

const recipeCatalog: Map<string, RecipeUpload> = new Map();

export function saveRecipeUpload(payload: {
  title: string;
  instructions: string;
  ingredientsText: string;
  ingredientMappings: RecipeIngredientMap[];
}) {
  const id = randomUUID();
  const recipe: RecipeUpload = {
    id,
    title: payload.title.trim(),
    instructions: payload.instructions.trim(),
    ingredientsText: payload.ingredientsText.trim(),
    ingredientMappings: payload.ingredientMappings.map((mapping) => ({
      ingredient: mapping.ingredient.trim(),
      amount: mapping.amount.trim(),
      unit: mapping.unit.trim(),
      mappedProductId: mapping.mappedProductId.trim()
    })),
    createdAt: new Date().toISOString()
  };
  recipeCatalog.set(id, recipe);
  return recipe;
}

export function listRecipeUploads(): RecipeUpload[] {
  return [...recipeCatalog.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
