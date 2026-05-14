import { Suspense } from 'react';
import { LoadingState } from '../../../src/components/loading-state';
import { OrderTrackingSurface } from '../../../src/components/order-surface';

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading order tracking" description="Preparing order tracking projection surface." />}>
      <OrderTrackingSurface />
    </Suspense>
  );
}
