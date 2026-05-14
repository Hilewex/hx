import { Suspense } from 'react';
import { LoadingState } from '../../src/components/loading-state';
import { ReturnsSurface } from '../../src/components/return-support-surface';

export default function ReturnsPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading returns" description="Preparing return projection surface." />}>
      <ReturnsSurface />
    </Suspense>
  );
}
