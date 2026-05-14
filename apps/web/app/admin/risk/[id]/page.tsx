import { AdminOpsSurface } from '../../../../src/components/admin-ops-surface';

export default async function AdminRiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOpsSurface surface="risk-detail" riskCaseId={id} />;
}
