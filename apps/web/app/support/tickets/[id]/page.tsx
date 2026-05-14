import { Suspense } from 'react';
import { LoadingState } from '../../../../src/components/loading-state';
import { SupportTicketDetailSurface } from '../../../../src/components/return-support-surface';

export default function SupportTicketDetailPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading support ticket" description="Preparing support ticket projection surface." />}>
      <SupportTicketDetailSurface />
    </Suspense>
  );
}
