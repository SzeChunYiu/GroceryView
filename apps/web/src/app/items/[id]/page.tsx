import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams as generateProductStaticParams
} from '../../products/[slug]/page';

export async function generateStaticParams() {
  const params = await generateProductStaticParams();
  return params.map(({ slug }) => ({ id: slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return generateProductMetadata({ params: params.then(({ id }) => ({ slug: id })) });
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return ProductPage({ params: params.then(({ id }) => ({ slug: id })) });
}
