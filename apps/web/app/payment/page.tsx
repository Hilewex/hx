import { Suspense } from 'react';
import { LoadingState } from '../../src/components/loading-state';
import { PaymentSurface } from '../../src/components/payment-surface';

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading payment surface" description="Preparing payment projection surface." />}>
      <PaymentSurface />
    </Suspense>
  );
}
