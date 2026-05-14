import { Suspense } from 'react';
import { LoadingState } from '../../../src/components/loading-state';
import { ReturnDetailSurface } from '../../../src/components/return-support-surface';

export default function ReturnDetailPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading return detail" description="Preparing return detail projection surface." />}>
      <ReturnDetailSurface />
    </Suspense>
  );
}
