'use client';

import type { PaymentSurfaceProjection } from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { readPaymentProjection } from '../lib/bff/payment';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export function PaymentSurface() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkoutId') ?? undefined;
  const paymentId = searchParams.get('paymentId') ?? undefined;
  const paymentAttemptId = searchParams.get('paymentAttemptId') ?? undefined;
  const state = searchParams.get('state') ?? undefined;
  const query = useQuery({
    queryKey: projectionQueryKeys.payment(checkoutId, paymentId, paymentAttemptId, state),
    queryFn: () => readPaymentProjection({ checkoutId, paymentId, paymentAttemptId, state }),
    retry: 1,
    staleTime: 8_000,
  });

  if (query.isLoading) {
    return (
      <main className="page-stack payment-page">
        <LoadingState title="Loading payment projection" description="Waiting for payment owner projection." />
        <PaymentSkeleton />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="page-stack payment-page">
        <ErrorState title="Payment projection failed" description="The payment surface could not read projection state." />
        <Link className="state-action secondary" href="/checkout">Return to checkout</Link>
      </main>
    );
  }

  if (!query.data?.data) {
    return (
      <main className="page-stack payment-page">
        <DegradedState
          title={query.data?.transport.status === 'timeout' ? 'Payment read timeout' : 'Payment unavailable'}
          description={query.data?.transport.error?.message ?? 'Payment projection is unavailable. The browser does not synthesize payment truth.'}
          action={query.data?.transport.retryable ? <button className="shell-action" type="button" onClick={() => void query.refetch()}>Retry</button> : <Link className="state-action secondary" href="/checkout">Return to checkout</Link>}
        />
      </main>
    );
  }

  return <PaymentContent payment={query.data.data} retry={() => void query.refetch()} />;
}

function PaymentContent({ payment, retry }: { payment: PaymentSurfaceProjection; retry: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUnsafeToRetry = payment.status === 'pending' || payment.status === 'unknown_result' || payment.status === 'support_required';
  const canPrepareHandoff = payment.status === 'initiation_ready' && !isSubmitting;

  return (
    <main className="page-stack payment-page">
      <header className="route-title">
        <span className="placeholder-label">Payment projection</span>
        <h1>Payment status</h1>
        <p>Payment, provider finality, order creation, settlement, refund, and payout truth stay with their owners.</p>
      </header>

      <section className="payment-status-band" data-status={payment.status} role="status" aria-live="polite" aria-labelledby="payment-status-title">
        <div>
          <span className="placeholder-label">{payment.stateGuidance.severity}</span>
          <h2 id="payment-status-title">{payment.stateGuidance.title}</h2>
        </div>
        <p>{payment.stateGuidance.message}</p>
        {isUnsafeToRetry ? <p className="payment-warning">{payment.stateGuidance.duplicateSubmitWarning}</p> : null}
      </section>

      <section className="payment-layout" aria-labelledby="payment-surface-title">
        <div className="payment-main-stack">
          <section className="payment-panel" aria-labelledby="payment-surface-title">
            <div className="section-heading">
              <span className="placeholder-label">Context</span>
              <h2 id="payment-surface-title">Payment context projection</h2>
            </div>
            <dl className="payment-facts">
              <PaymentFact label="Checkout" value={payment.checkoutReference.label} />
              <PaymentFact label="Payment attempt" value={payment.attemptReference.label} />
              <PaymentFact label="Amount" value={payment.checkoutReference.amountDisplayText ?? 'Owner safe amount text unavailable'} />
              <PaymentFact label="State" value={payment.context.statusText} />
            </dl>
          </section>

          <section className="payment-panel" aria-labelledby="payment-provider-title">
            <div className="section-heading">
              <span className="placeholder-label">Provider</span>
              <h2 id="payment-provider-title">{payment.providerRedirect.label}</h2>
            </div>
            <p>{payment.providerRedirect.helperText}</p>
            <button
              type="button"
              aria-label={isSubmitting ? 'Payment initiation placeholder in progress' : 'Start payment placeholder'}
              disabled={!canPrepareHandoff}
              onClick={() => setIsSubmitting(true)}
            >
              {isSubmitting ? 'Payment initiation placeholder in progress' : 'Start payment placeholder'}
            </button>
            {isSubmitting ? <p className="payment-warning" role="status">Processing placeholder is active. Duplicate submit is disabled in this UI.</p> : null}
          </section>

          <section className="payment-panel" aria-labelledby="payment-guidance-title">
            <div className="section-heading">
              <span className="placeholder-label">Guidance</span>
              <h2 id="payment-guidance-title">Safe next steps</h2>
            </div>
            <p>{payment.retryGuidance.retryText}</p>
            <p>{payment.retryGuidance.supportText}</p>
            {payment.warnings?.length ? <p className="payment-warning" role="status">{payment.warnings[0]}</p> : null}
          </section>
        </div>

        <aside className="payment-actions" aria-labelledby="payment-actions-title">
          <div className="section-heading">
            <span className="placeholder-label">Support</span>
            <h2 id="payment-actions-title">Reference and actions</h2>
          </div>
          <dl className="payment-facts">
            <PaymentFact label="Payment reference" value={payment.supportGuidance.referenceText} />
            <PaymentFact label="Checkout reference" value={payment.supportGuidance.checkoutReferenceText} />
          </dl>
          <p>{payment.supportGuidance.helperText}</p>
          <div className="payment-action-list">
            <button className="state-action secondary" type="button" onClick={retry}>Refresh projection</button>
            <Link className="state-action secondary" href={payment.navigation.returnToCheckout.href}>{payment.navigation.returnToCheckout.label}</Link>
            <Link className="state-action secondary" href={payment.navigation.goToOrders.href}>{payment.navigation.goToOrders.label}</Link>
            <Link className="state-action" href={payment.navigation.contactSupport.href}>{payment.navigation.contactSupport.label}</Link>
            <Link className="state-action secondary" href={payment.navigation.continueBrowsing.href}>{payment.navigation.continueBrowsing.label}</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PaymentFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <section className="payment-layout" aria-label="Payment loading skeleton">
      <div className="payment-main-stack">
        <div className="payment-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
        <div className="payment-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
      <aside className="payment-actions">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </aside>
    </section>
  );
}
