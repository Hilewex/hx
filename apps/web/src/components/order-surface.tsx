'use client';

import type { OrderItemPreviewProjection, OrderSurfaceProjection, OrderTimelineStepProjection } from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { readOrderProjection } from '../lib/bff/orders';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export function OrderConfirmationSurface() {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get('orderRef') ?? searchParams.get('reference') ?? undefined;
  const checkoutId = searchParams.get('checkoutId') ?? undefined;
  const paymentId = searchParams.get('paymentId') ?? undefined;
  const paymentAttemptId = searchParams.get('paymentAttemptId') ?? undefined;
  const state = searchParams.get('state') ?? 'payment-succeeded-order-pending';
  const paymentState = searchParams.get('paymentState') ?? undefined;
  const shipmentState = searchParams.get('shipmentState') ?? undefined;

  return (
    <OrderProjectionReader
      scope="confirmation"
      input={{ orderRef, checkoutId, paymentId, paymentAttemptId, state, paymentState, shipmentState }}
      title="Order confirmation"
      intro="Payment received, order creation, shipment, delivery, refund, settlement, and payout truth remain separate owner projections."
    />
  );
}

export function OrderTrackingSurface() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const orderId = typeof params.id === 'string' ? params.id : undefined;
  const orderRef = searchParams.get('orderRef') ?? undefined;
  const state = searchParams.get('state') ?? undefined;
  const paymentState = searchParams.get('paymentState') ?? undefined;
  const shipmentState = searchParams.get('shipmentState') ?? undefined;

  return (
    <OrderProjectionReader
      scope="tracking"
      input={{ orderId, orderRef, state, paymentState, shipmentState }}
      title="Track order"
      intro="Tracking is projection-safe: shipped is not delivered, and delivery is not guaranteed by this browser surface."
    />
  );
}

export function GuestOrderLookupSurface() {
  const query = useQuery({
    queryKey: projectionQueryKeys.order('lookup'),
    queryFn: () => readOrderProjection({}),
    retry: 0,
    staleTime: 10_000,
  });

  const order = query.data?.data;

  return (
    <main className="page-stack order-page">
      <header className="route-title">
        <span className="placeholder-label">Order lookup</span>
        <h1>Find an order</h1>
        <p>Guest lookup is a foundation surface. Verification, order truth, payment truth, and tracking truth stay outside the browser.</p>
      </header>

      <section className="order-panel" aria-labelledby="guest-lookup-title">
        <div className="section-heading">
          <span className="placeholder-label">Guest</span>
          <h2 id="guest-lookup-title">{order?.guestLookup?.title ?? 'Guest order lookup'}</h2>
        </div>
        <label className="order-input" htmlFor="guest-order-email">
          Email
          <input id="guest-order-email" placeholder={order?.guestLookup?.emailPlaceholder ?? 'Email used at checkout'} disabled />
        </label>
        <label className="order-input" htmlFor="guest-order-reference">
          Reference
          <input id="guest-order-reference" placeholder={order?.guestLookup?.referencePlaceholder ?? 'Order or payment reference'} disabled />
        </label>
        <p>{order?.guestLookup?.helperText ?? 'Lookup projection unavailable.'}</p>
        <button type="button" disabled aria-label="Lookup order projection placeholder">Lookup order projection</button>
      </section>
    </main>
  );
}

function OrderProjectionReader({
  scope,
  input,
  title,
  intro,
}: {
  scope: 'confirmation' | 'tracking';
  input: Parameters<typeof readOrderProjection>[0];
  title: string;
  intro: string;
}) {
  const query = useQuery({
    queryKey: projectionQueryKeys.order(scope, input.orderId, input.orderRef, input.paymentId, input.state, input.shipmentState),
    queryFn: () => readOrderProjection(input),
    retry: 1,
    staleTime: 8_000,
  });

  if (query.isLoading) {
    return (
      <main className="page-stack order-page">
        <LoadingState title="Loading order projection" description="Waiting for order owner read projection." />
        <OrderSkeleton />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="page-stack order-page">
        <ErrorState title="Order projection failed" description="The order surface could not read projection state." />
        <Link className="state-action secondary" href="/support">Contact support</Link>
      </main>
    );
  }

  if (!query.data?.data) {
    return (
      <main className="page-stack order-page">
        <DegradedState
          title={query.data?.transport.status === 'timeout' ? 'Order read timeout' : 'Order unavailable'}
          description={query.data?.transport.error?.message ?? 'Order projection is unavailable. The browser does not synthesize order truth.'}
          action={query.data?.transport.retryable ? <button className="shell-action" type="button" onClick={() => void query.refetch()}>Retry</button> : <Link className="state-action secondary" href="/support">Contact support</Link>}
        />
      </main>
    );
  }

  return <OrderContent order={query.data.data} title={title} intro={intro} retry={() => void query.refetch()} />;
}

function OrderContent({
  order,
  title,
  intro,
  retry,
}: {
  order: OrderSurfaceProjection;
  title: string;
  intro: string;
  retry: () => void;
}) {
  const isDegraded = order.status === 'degraded' || order.status === 'support_required' || order.status === 'timeout' || order.status === 'unavailable';

  return (
    <main className="page-stack order-page">
      <header className="route-title">
        <span className="placeholder-label">Order projection</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>

      <section className="order-status-band" data-status={order.status} role="status" aria-live="polite" aria-labelledby="order-status-title">
        <div>
          <span className="placeholder-label">{order.status.replace(/_/g, ' ')}</span>
          <h2 id="order-status-title">{order.orderState.label}</h2>
        </div>
        <p>{order.orderState.helperText}</p>
        <p className="order-warning">Payment received is not order created. Shipped is not delivered.</p>
      </section>

      {isDegraded ? (
        <DegradedState
          title={order.status === 'support_required' ? 'Support escalation recommended' : 'Degraded order projection'}
          description="One or more order, shipment, delivery, or tracking projections are partial, unavailable, or require support review."
          action={<button className="shell-action" type="button" onClick={retry}>Refresh projection</button>}
        />
      ) : null}

      <section className="order-layout" aria-labelledby="order-timeline-title">
        <div className="order-main-stack">
          <OrderTimeline steps={order.timeline} />
          <ShipmentSection order={order} />
          <OrderItems items={order.items} />
        </div>
        <OrderSupportPanel order={order} retry={retry} />
      </section>
    </main>
  );
}

function OrderTimeline({ steps }: { steps: OrderTimelineStepProjection[] }) {
  return (
    <section className="order-panel" aria-labelledby="order-timeline-title">
      <div className="section-heading">
        <span className="placeholder-label">Timeline</span>
        <h2 id="order-timeline-title">Order tracking timeline</h2>
      </div>
      <ol className="order-timeline" aria-label="Order tracking projection timeline">
        {steps.map((step) => (
          <li key={step.stepId} data-status={step.status} aria-label={step.ariaText}>
            <span aria-hidden="true" />
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShipmentSection({ order }: { order: OrderSurfaceProjection }) {
  return (
    <section className="order-panel" aria-labelledby="shipment-title">
      <div className="section-heading">
        <span className="placeholder-label">Shipment</span>
        <h2 id="shipment-title">{order.shipment.label}</h2>
      </div>
      <dl className="order-facts">
        <OrderFact label="Carrier" value={order.shipment.carrierText} />
        <OrderFact label="Tracking" value={order.shipment.trackingText} />
        <OrderFact label="Delivery estimate" value={order.shipment.estimatedDeliveryText} />
        <OrderFact label="Delivery state" value={order.delivery.label} />
      </dl>
      <p>{order.delivery.helperText}</p>
      {order.shipment.status === 'degraded' ? <p className="order-warning" role="status">Tracking projection is degraded. Contact support with the order reference.</p> : null}
    </section>
  );
}

function OrderItems({ items }: { items: OrderItemPreviewProjection[] }) {
  return (
    <section className="order-panel" aria-labelledby="order-items-title">
      <div className="section-heading">
        <span className="placeholder-label">Items</span>
        <h2 id="order-items-title">Order item previews</h2>
      </div>
      <div className="order-item-list" role="list" aria-label="Order item preview projections">
        {items.map((item) => (
          <article className="order-item" role="listitem" key={item.lineId} aria-labelledby={`order-item-${item.lineId}`}>
            <div className="order-item-media" aria-label={item.mediaAltText}>HX</div>
            <div>
              <h3 id={`order-item-${item.lineId}`}>{item.title}</h3>
              <p>{item.quantityText}</p>
              <p>{item.creatorStoreText}</p>
              <p>{item.summaryText}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrderSupportPanel({ order, retry }: { order: OrderSurfaceProjection; retry: () => void }) {
  return (
    <aside className="order-support" aria-labelledby="order-support-title">
      <div className="section-heading">
        <span className="placeholder-label">Support</span>
        <h2 id="order-support-title">Reference and help</h2>
      </div>
      <dl className="order-facts">
        <OrderFact label="Order reference" value={order.supportGuidance.referenceText} />
        <OrderFact label="Payment reference" value={order.supportGuidance.paymentReferenceText} />
        <OrderFact label="Payment state" value={order.payment.label} />
        <OrderFact label="Order state" value={order.orderState.label} />
      </dl>
      <p>{order.payment.helperText}</p>
      <p>{order.supportGuidance.helperText}</p>
      <div className="order-action-list">
        <button className="state-action secondary" type="button" onClick={retry}>Refresh projection</button>
        <Link className="state-action" href={order.navigation.contactSupport.href}>{order.navigation.contactSupport.label}</Link>
        <Link className="state-action secondary" href={order.navigation.goToOrders.href}>{order.navigation.goToOrders.label}</Link>
        <Link className="state-action secondary" href={order.navigation.continueBrowsing.href}>{order.navigation.continueBrowsing.label}</Link>
      </div>
    </aside>
  );
}

function OrderFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <section className="order-layout" aria-label="Order loading skeleton">
      <div className="order-main-stack">
        <div className="order-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
        <div className="order-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
      <aside className="order-support">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </aside>
    </section>
  );
}
