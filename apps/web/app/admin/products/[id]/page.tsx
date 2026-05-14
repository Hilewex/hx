import { AdminOpsSurface } from '../../../../src/components/admin-ops-surface';

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOpsSurface surface="product-detail" productId={id} />;
}
