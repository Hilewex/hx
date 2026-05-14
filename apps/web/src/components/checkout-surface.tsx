'use client';

import type { CheckoutLineItemReviewProjection, CheckoutSurfaceProjection } from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { readCheckoutProjection } from '../lib/bff/checkout';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { useSessionProjection } from '../providers/session-provider';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export function CheckoutSurface() {
  const session = useSessionProjection();
  const query = useQuery({
    queryKey: projectionQueryKeys.checkout(),
    queryFn: readCheckoutProjection,
    retry: 1,
    staleTime: 10_000,
  });

  if (query.isLoading) {
    return (
      <main className="page-stack checkout-page">
        <LoadingState title="Loading checkout projection" description="Waiting for BFF-owned checkout review projection." />
        <CheckoutSkeleton />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="page-stack checkout-page">
        <ErrorState title="Checkout projection failed" description="The checkout surface could not read projection state." />
        <Link className="state-action secondary" href="/cart">Return to cart</Link>
      </main>
    );
  }

  if (!query.data?.data) {
    return (
      <main className="page-stack checkout-page">
        <DegradedState
          title={query.data?.transport.status === 'timeout' ? 'Checkout read timeout' : 'Checkout unavailable'}
          description={query.data?.transport.error?.message ?? 'Checkout projection is unavailable. The browser does not synthesize checkout truth.'}
          action={query.data?.transport.retryable ? <button className="shell-action" type="button" onClick={() => void query.refetch()}>Retry</button> : <Link className="state-action secondary" href="/cart">Return to cart</Link>}
        />
      </main>
    );
  }

  return <CheckoutContent checkout={query.data.data} sessionKind={session.projection.kind} retry={() => void query.refetch()} />;
}

function CheckoutContent({
  checkout,
  sessionKind,
  retry,
}: {
  checkout: CheckoutSurfaceProjection;
  sessionKind: 'unknown' | 'guest' | 'authenticated';
  retry: () => void;
}) {
  const isDegraded = checkout.status !== 'available' && checkout.status !== 'empty' && checkout.status !== 'partial';

  return (
    <main className="page-stack checkout-page">
      <header className="route-title">
        <span className="placeholder-label">Checkout projection</span>
        <h1>Review checkout</h1>
        <p>{checkout.context.actorLabel}. Price, stock, coupon, shipping fee, readiness, payment, and order truth stay with their owners.</p>
      </header>

      <SessionBand checkout={checkout} sessionKind={sessionKind} />

      {isDegraded ? (
        <DegradedState
          title="Degraded checkout projection"
          description="One or more checkout sections are partial, stale, or blocked by owner projection feedback."
          action={<button className="shell-action" type="button" onClick={retry}>Retry</button>}
        />
      ) : null}

      {checkout.lines.length === 0 ? (
        <EmptyCheckout checkout={checkout} />
      ) : (
        <section className="checkout-layout" aria-labelledby="checkout-review-title">
          <div className="checkout-main-stack">
            <section className="checkout-panel" aria-labelledby="checkout-review-title">
              <div className="section-heading">
                <span className="placeholder-label">Review</span>
                <h2 id="checkout-review-title">Line review projection</h2>
              </div>
              <div className="checkout-line-list" role="list" aria-label="Checkout line review projections">
                {checkout.lines.map((line) => (
                  <CheckoutLine line={line} key={line.lineId} />
                ))}
              </div>
            </section>
            <AddressSection checkout={checkout} />
            <ShippingSection checkout={checkout} />
            <ValidationSection checkout={checkout} />
            <CouponSection checkout={checkout} />
          </div>
          <CheckoutHandoff checkout={checkout} />
        </section>
      )}
    </main>
  );
}

function SessionBand({ checkout, sessionKind }: { checkout: CheckoutSurfaceProjection; sessionKind: 'unknown' | 'guest' | 'authenticated' }) {
  return (
    <section className="checkout-session-band" aria-labelledby="checkout-session-title">
      <div>
        <span className="placeholder-label">Session</span>
        <h2 id="checkout-session-title">
          {sessionKind === 'unknown' ? 'Session projection loading' : sessionKind === 'guest' ? 'Guest checkout surface' : 'Authenticated checkout surface'}
        </h2>
      </div>
      <p>{checkout.context.checkoutStateText}</p>
      <p>{checkout.context.validationStateText}</p>
    </section>
  );
}

function EmptyCheckout({ checkout }: { checkout: CheckoutSurfaceProjection }) {
  return (
    <section className="checkout-empty" aria-labelledby="empty-checkout-title">
      <EmptyState title="Checkout is empty" description="No cart line projection is available for checkout review." />
      <p>{checkout.readiness.helperText}</p>
      <Link className="state-action" href={checkout.returnToCart.href}>{checkout.returnToCart.label}</Link>
    </section>
  );
}

function CheckoutLine({ line }: { line: CheckoutLineItemReviewProjection }) {
  return (
    <article className="checkout-line" role="listitem" aria-labelledby={`checkout-line-${line.lineId}`} data-status={line.status}>
      <div>
        <span className="placeholder-label">Item</span>
        <h3 id={`checkout-line-${line.lineId}`}>{line.title}</h3>
      </div>
      <dl>
        <div>
          <dt>Quantity</dt>
          <dd>{line.quantityText}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{line.priceProjectionText}</dd>
        </div>
        <div>
          <dt>Stock</dt>
          <dd>{line.stockProjectionText}</dd>
        </div>
        <div>
          <dt>Validation</dt>
          <dd>{line.validationText}</dd>
        </div>
      </dl>
      {line.warnings?.length ? (
        <p className="checkout-warning" role="status" aria-label={`Checkout line warning: ${line.warnings[0]}`}>{line.warnings[0]}</p>
      ) : null}
    </article>
  );
}

function AddressSection({ checkout }: { checkout: CheckoutSurfaceProjection }) {
  return (
    <section className="checkout-panel" aria-labelledby="checkout-address-title">
      <div className="section-heading">
        <span className="placeholder-label">Address</span>
        <h2 id="checkout-address-title">{checkout.address.title}</h2>
      </div>
      <fieldset className="checkout-choice-set">
        <legend className="sr-only">Checkout address projection</legend>
        <label>
          <input type="radio" name="checkout-address" checked readOnly />
          <span>{checkout.address.detailText}</span>
        </label>
      </fieldset>
      <p>{checkout.address.helperText}</p>
      {checkout.address.warnings?.length ? <p className="checkout-warning" role="status">{checkout.address.warnings[0]}</p> : null}
    </section>
  );
}

function ShippingSection({ checkout }: { checkout: CheckoutSurfaceProjection }) {
  return (
    <section className="checkout-panel" aria-labelledby="checkout-shipping-title">
      <div className="section-heading">
        <span className="placeholder-label">Shipping</span>
        <h2 id="checkout-shipping-title">Shipping selection projection</h2>
      </div>
      <div className="checkout-choice-set" role="radiogroup" aria-label="Shipping option projections">
        {checkout.shippingOptions.map((option) => (
          <label key={option.optionId} data-status={option.status}>
            <input type="radio" name="checkout-shipping" checked={option.selected} readOnly />
            <span>
              <strong>{option.label}</strong>
              {option.estimatedDeliveryText}
              {option.feeProjectionText}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function ValidationSection({ checkout }: { checkout: CheckoutSurfaceProjection }) {
  return (
    <section className="checkout-panel" aria-labelledby="checkout-validation-title">
      <div className="section-heading">
        <span className="placeholder-label">Feedback</span>
        <h2 id="checkout-validation-title">Validation feedback projection</h2>
      </div>
      <div className="checkout-feedback-list" role="list" aria-live="polite">
        {checkout.validationFeedback.map((item) => (
          <article className="checkout-feedback" role="listitem" data-severity={item.severity} key={item.feedbackId}>
            <h3>{item.title}</h3>
            <p>{item.message}</p>
          </article>
        ))}
      </div>
      {checkout.staleWarning.isStale ? (
        <p className="checkout-warning" role="status">{checkout.staleWarning.message ?? 'Checkout projection may be stale.'}</p>
      ) : null}
    </section>
  );
}

function CouponSection({ checkout }: { checkout: CheckoutSurfaceProjection }) {
  return (
    <section className="checkout-panel" aria-labelledby="checkout-coupon-title">
      <div className="section-heading">
        <span className="placeholder-label">Coupon</span>
        <h2 id="checkout-coupon-title">{checkout.coupon.label}</h2>
      </div>
      <label className="checkout-coupon-input" htmlFor="checkout-coupon-code">
        Coupon code
        <input id="checkout-coupon-code" name="checkout-coupon-code" placeholder="Owner validated later" disabled />
      </label>
      <p>{checkout.coupon.helperText}</p>
    </section>
  );
}

function CheckoutHandoff({ checkout }: { checkout: CheckoutSurfaceProjection }) {
  return (
    <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
      <div className="section-heading">
        <span className="placeholder-label">Handoff</span>
        <h2 id="checkout-summary-title">Payment handoff placeholder</h2>
      </div>
      <dl>
        <div>
          <dt>Items</dt>
          <dd>{checkout.cartSummary.itemCountText}</dd>
        </div>
        <div>
          <dt>Subtotal</dt>
          <dd>{checkout.cartSummary.subtotalProjectionText}</dd>
        </div>
        <div>
          <dt>Payable total</dt>
          <dd>{checkout.cartSummary.payableTotalProjectionText}</dd>
        </div>
      </dl>
      <section className="checkout-handoff" data-status={checkout.paymentHandoff.status} aria-labelledby="payment-handoff-title">
        <h3 id="payment-handoff-title">{checkout.paymentHandoff.ctaText}</h3>
        <p>{checkout.paymentHandoff.helperText}</p>
        <button type="button" aria-label="Proceed to payment placeholder" disabled>
          Proceed to payment
        </button>
        <Link className="state-action secondary" href={checkout.returnToCart.href}>{checkout.returnToCart.label}</Link>
      </section>
    </aside>
  );
}

function CheckoutSkeleton() {
  return (
    <section className="checkout-layout" aria-label="Checkout loading skeleton">
      <div className="checkout-main-stack">
        <div className="checkout-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
        <div className="checkout-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
      <aside className="checkout-summary">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </aside>
    </section>
  );
}
