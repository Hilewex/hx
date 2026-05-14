import { Suspense } from 'react';
import { LoadingState } from '../../src/components/loading-state';
import { SupportSurface } from '../../src/components/return-support-surface';

export default function SupportPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading support" description="Preparing support projection surface." />}>
      <SupportSurface />
    </Suspense>
  );
}
