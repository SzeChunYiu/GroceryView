import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';

export { generateStaticParams };

const metadataForProduct = generateProductMetadata;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return metadataForProduct({ params: params.then(({ id }) => ({ slug: id })) });
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return ProductPage({ params: params.then(({ id }) => ({ slug: id })) });
}
