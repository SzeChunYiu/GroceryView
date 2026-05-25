import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';
import { ItemDetailListShortcut } from '@/components/item-detail-list-shortcut';
import { findProduct } from '@/lib/verified-data';

export { generateStaticParams };

const metadataForProduct = generateProductMetadata;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return metadataForProduct({ params: params.then(({ id }) => ({ slug: id })) });
}

function productQuantity(product: NonNullable<ReturnType<typeof findProduct>>) {
  return 'lowestPrice' in product ? product.subline : product.quantity;
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  const renderedProductPage = await ProductPage({ params: Promise.resolve({ slug: id }) });

  return (
    <>
      {renderedProductPage}
      <ItemDetailListShortcut
        productId={id}
        productName={product?.name ?? id}
        quantity={product ? productQuantity(product) : undefined}
      />
    </>
  );
}
