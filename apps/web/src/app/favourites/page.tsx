import { FavouriteProductsPageClient, type FavouriteProductCatalogItem } from '@/components/favourite-products-page-client';
import { PageShell } from '@/components/data-ui';
import { adaptiveProductCards } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

const favouriteProductCatalogue: FavouriteProductCatalogItem[] = adaptiveProductCards.map((card) => ({
  slug: card.slug,
  name: card.name,
  brand: card.brand,
  imageUrl: card.imageUrl,
  imageAlt: card.imageAlt,
  productKind: card.productKind,
  totalPriceLabel: card.totalPriceLabel,
  unitPriceLabel: card.unitPriceLabel,
  packageLabel: card.packageLabel,
  sourceLabel: card.sourceLabel,
  confidenceLabel: card.confidenceLabel,
  priceDropBadge: card.priceDropBadge,
  isAvailable: card.isAvailable,
  totalSortPrice: card.totalSortPrice
}));

export function generateMetadata() {
  return routeMetadata('/favourites');
}

export default function FavouritesPage() {
  return (
    <PageShell>
      <FavouriteProductsPageClient productCatalogue={favouriteProductCatalogue} />
    </PageShell>
  );
}
