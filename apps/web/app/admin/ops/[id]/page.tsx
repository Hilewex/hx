import { AdminOpsSurface } from '../../../../src/components/admin-ops-surface';

export default async function AdminOperationalQueueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOpsSurface surface="ops-detail" opsIntentId={id} />;
}
