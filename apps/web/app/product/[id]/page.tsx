import { ProductDecisionSurface } from '../../../src/components/product-decision-surface';

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ storefrontId?: string }>;
}) {
  const { id } = await params;
  const { storefrontId } = await searchParams;
  return <ProductDecisionSurface productId={id} storefrontId={storefrontId ?? 's_feno_1'} />;
}
