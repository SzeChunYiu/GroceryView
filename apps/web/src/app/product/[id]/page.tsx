import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';

export { generateStaticParams };

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return generateProductMetadata({ params: params.then(({ id }) => ({ slug: id })) });
}

export default async function SingularProductPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return ProductPage({ params: params.then(({ id }) => ({ slug: id })) });
}
