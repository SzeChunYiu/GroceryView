import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';

export { generateStaticParams };

const metadataForProduct = generateProductMetadata;

function productParamsFromItemParams(params: Promise<{ id: string }>) {
  // /items/:id is the public item alias used by share=deal links; keep the item URL open while rendering canonical product evidence.
  return params.then(({ id }) => ({ slug: id }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return metadataForProduct({ params: productParamsFromItemParams(params) });
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return ProductPage({ params: productParamsFromItemParams(params) });
}
