import { AdminOpsSurface } from '../../../../src/components/admin-ops-surface';

export default async function AdminModerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOpsSurface surface="moderation-detail" moderationCaseId={id} />;
}
