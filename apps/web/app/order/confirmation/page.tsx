import { Suspense } from 'react';
import { LoadingState } from '../../../src/components/loading-state';
import { OrderConfirmationSurface } from '../../../src/components/order-surface';

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading order confirmation" description="Preparing order confirmation projection surface." />}>
      <OrderConfirmationSurface />
    </Suspense>
  );
}
