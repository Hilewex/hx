'use client';

import type {
  ReturnItemPreviewProjection,
  ReturnSurfaceProjection,
  ReturnTimelineStepProjection,
  SupportSurfaceProjection,
  SupportTimelineStepProjection,
} from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { readReturnProjection } from '../lib/bff/returns';
import { readSupportProjection } from '../lib/bff/support';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export function ReturnsSurface() {
  const searchParams = useSearchParams();
  return (
    <ReturnProjectionReader
      scope="list"
      input={{
        orderId: searchParams.get('orderId') ?? undefined,
        orderRef: searchParams.get('orderRef') ?? undefined,
        state: searchParams.get('state') ?? 'return-requested',
        refundState: searchParams.get('refundState') ?? undefined,
      }}
      title="Returns"
      intro="Return requests, approvals, refund processing, settlement, and support resolution stay separate owner projections."
    />
  );
}

export function ReturnDetailSurface() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  return (
    <ReturnProjectionReader
      scope="detail"
      input={{
        returnId: typeof params.id === 'string' ? params.id : undefined,
        orderId: searchParams.get('orderId') ?? undefined,
        orderRef: searchParams.get('orderRef') ?? undefined,
        refundId: searchParams.get('refundId') ?? undefined,
        state: searchParams.get('state') ?? undefined,
        refundState: searchParams.get('refundState') ?? undefined,
        escalationState: searchParams.get('escalationState') ?? undefined,
      }}
      title="Return detail"
      intro="This timeline keeps return requested, return approved, refund processing, and settlement pending as separate states."
    />
  );
}

export function SupportSurface() {
  const searchParams = useSearchParams();
  return (
    <SupportProjectionReader
      scope="home"
      input={{
        orderId: searchParams.get('orderId') ?? undefined,
        orderRef: searchParams.get('orderRef') ?? undefined,
        paymentId: searchParams.get('paymentId') ?? undefined,
        returnId: searchParams.get('returnId') ?? undefined,
        refundId: searchParams.get('refundId') ?? undefined,
        state: searchParams.get('state') ?? undefined,
        escalationState: searchParams.get('escalationState') ?? undefined,
      }}
      title="Support"
      intro="Support guidance is projection-safe: a ticket can be opened without the issue being resolved."
    />
  );
}

export function SupportTicketDetailSurface() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  return (
    <SupportProjectionReader
      scope="ticket"
      input={{
        ticketId: typeof params.id === 'string' ? params.id : undefined,
        orderId: searchParams.get('orderId') ?? undefined,
        orderRef: searchParams.get('orderRef') ?? undefined,
        paymentId: searchParams.get('paymentId') ?? undefined,
        returnId: searchParams.get('returnId') ?? undefined,
        refundId: searchParams.get('refundId') ?? undefined,
        state: searchParams.get('state') ?? undefined,
        escalationState: searchParams.get('escalationState') ?? undefined,
      }}
      title="Support ticket"
      intro="Ticket timeline, messages, order references, and escalation guidance are read projections only."
    />
  );
}

function ReturnProjectionReader({
  scope,
  input,
  title,
  intro,
}: {
  scope: 'list' | 'detail';
  input: Parameters<typeof readReturnProjection>[0];
  title: string;
  intro: string;
}) {
  const query = useQuery({
    queryKey: projectionQueryKeys.returns(scope, input.returnId, input.orderId, input.refundId, input.state, input.refundState),
    queryFn: () => readReturnProjection(input),
    retry: 1,
    staleTime: 8_000,
  });

  if (query.isLoading) {
    return (
      <main className="page-stack return-page">
        <LoadingState title="Loading return projection" description="Waiting for return owner read projection." />
        <ProjectionSkeleton />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="page-stack return-page">
        <ErrorState title="Return projection failed" description="The return surface could not read projection state." />
        <Link className="state-action secondary" href="/support">Contact support</Link>
      </main>
    );
  }

  if (!query.data?.data) {
    return (
      <main className="page-stack return-page">
        <DegradedState
          title={query.data?.transport.status === 'timeout' ? 'Return read timeout' : 'Return unavailable'}
          description={query.data?.transport.error?.message ?? 'Return projection is unavailable. The browser does not synthesize return or refund truth.'}
          action={<Link className="state-action secondary" href="/support">Contact support</Link>}
        />
      </main>
    );
  }

  return <ReturnContent returns={query.data.data} title={title} intro={intro} retry={() => void query.refetch()} />;
}

function ReturnContent({
  returns,
  title,
  intro,
  retry,
}: {
  returns: ReturnSurfaceProjection;
  title: string;
  intro: string;
  retry: () => void;
}) {
  const isDegraded = ['degraded', 'support_escalation', 'timeout', 'unavailable', 'error'].includes(returns.status);

  return (
    <main className="page-stack return-page">
      <header className="route-title">
        <span className="placeholder-label">Return projection</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>

      <section className="return-status-band" data-status={returns.status} role="status" aria-live="polite" aria-labelledby="return-status-title">
        <div>
          <span className="placeholder-label">{returns.status.replace(/_/g, ' ')}</span>
          <h2 id="return-status-title">{returns.reference.label}</h2>
        </div>
        <p>{returns.reference.helperText}</p>
        <p className="return-warning">Return approved is not refund completed. Refund pending is not refund settled.</p>
      </section>

      {isDegraded ? (
        <DegradedState
          title={returns.status === 'support_escalation' ? 'Support escalation recommended' : 'Degraded return projection'}
          description="Return, refund, settlement, or support guidance projection is partial, unavailable, or delayed."
          action={<button className="shell-action" type="button" onClick={retry}>Refresh projection</button>}
        />
      ) : null}

      <section className="return-layout" aria-labelledby="return-timeline-title">
        <div className="return-main-stack">
          <ReturnTimeline steps={returns.timeline} />
          <RefundPanel returns={returns} />
          <ReturnItems items={returns.items} />
        </div>
        <ReturnSupportPanel returns={returns} retry={retry} />
      </section>
    </main>
  );
}

function ReturnTimeline({ steps }: { steps: ReturnTimelineStepProjection[] }) {
  return (
    <section className="return-panel" aria-labelledby="return-timeline-title">
      <div className="section-heading">
        <span className="placeholder-label">Timeline</span>
        <h2 id="return-timeline-title">Return timeline</h2>
      </div>
      <ol className="return-timeline" aria-label="Return and refund projection timeline">
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

function RefundPanel({ returns }: { returns: ReturnSurfaceProjection }) {
  return (
    <section className="return-panel" aria-labelledby="refund-title">
      <div className="section-heading">
        <span className="placeholder-label">Refund</span>
        <h2 id="refund-title">{returns.refund.label}</h2>
      </div>
      <dl className="return-facts">
        <Fact label="Refund reference" value={returns.refund.refundId ?? 'Refund reference unavailable'} />
        <Fact label="Refund state" value={returns.refund.status.replace(/_/g, ' ')} />
        <Fact label="Escalation" value={returns.escalation.label} />
      </dl>
      <p>{returns.refund.helperText}</p>
      <p className="return-warning" role="status">Refund initiated or processed is not settlement or payout truth.</p>
    </section>
  );
}

function ReturnItems({ items }: { items: ReturnItemPreviewProjection[] }) {
  return (
    <section className="return-panel" aria-labelledby="return-items-title">
      <div className="section-heading">
        <span className="placeholder-label">Items</span>
        <h2 id="return-items-title">Return request list projection</h2>
      </div>
      <div className="return-item-list" role="list" aria-label="Return item preview projections">
        {items.map((item) => (
          <article className="return-item" role="listitem" key={item.lineId} aria-labelledby={`return-item-${item.lineId}`}>
            <div className="return-item-media" aria-hidden="true">HX</div>
            <div>
              <h3 id={`return-item-${item.lineId}`}>{item.title}</h3>
              <p>{item.quantityText}</p>
              <p>{item.reasonText}</p>
              <p>{item.summaryText}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReturnSupportPanel({ returns, retry }: { returns: ReturnSurfaceProjection; retry: () => void }) {
  return (
    <aside className="return-support" aria-labelledby="return-support-title">
      <div className="section-heading">
        <span className="placeholder-label">Support</span>
        <h2 id="return-support-title">Escalation guidance</h2>
      </div>
      <dl className="return-facts">
        <Fact label="Return reference" value={returns.supportGuidance.referenceText} />
        <Fact label="Refund reference" value={returns.supportGuidance.refundReferenceText} />
        <Fact label="Guidance" value={returns.escalation.status.replace(/_/g, ' ')} />
      </dl>
      <p>{returns.supportGuidance.helperText}</p>
      <p>{returns.supportGuidance.escalationText}</p>
      <div className="return-action-list">
        <button className="state-action secondary" type="button" onClick={retry}>Refresh projection</button>
        <Link className="state-action" href={returns.navigation.contactSupport.href}>{returns.navigation.contactSupport.label}</Link>
        <Link className="state-action secondary" href={returns.navigation.goToReturns.href}>{returns.navigation.goToReturns.label}</Link>
      </div>
    </aside>
  );
}

function SupportProjectionReader({
  scope,
  input,
  title,
  intro,
}: {
  scope: 'home' | 'ticket';
  input: Parameters<typeof readSupportProjection>[0];
  title: string;
  intro: string;
}) {
  const query = useQuery({
    queryKey: projectionQueryKeys.support(scope, input.ticketId, input.orderId, input.returnId, input.state),
    queryFn: () => readSupportProjection(input),
    retry: 1,
    staleTime: 8_000,
  });

  if (query.isLoading) {
    return (
      <main className="page-stack support-page">
        <LoadingState title="Loading support projection" description="Waiting for support owner read projection." />
        <ProjectionSkeleton />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="page-stack support-page">
        <ErrorState title="Support projection failed" description="The support surface could not read projection state." />
      </main>
    );
  }

  if (!query.data?.data) {
    return (
      <main className="page-stack support-page">
        <DegradedState
          title={query.data?.transport.status === 'timeout' ? 'Support read timeout' : 'Support unavailable'}
          description={query.data?.transport.error?.message ?? 'Support projection is unavailable. The browser does not synthesize support resolution truth.'}
        />
      </main>
    );
  }

  return <SupportContent support={query.data.data} title={title} intro={intro} retry={() => void query.refetch()} />;
}

function SupportContent({
  support,
  title,
  intro,
  retry,
}: {
  support: SupportSurfaceProjection;
  title: string;
  intro: string;
  retry: () => void;
}) {
  const isDegraded = ['degraded', 'escalated_projection', 'timeout', 'unavailable', 'error'].includes(support.status);

  return (
    <main className="page-stack support-page">
      <header className="route-title">
        <span className="placeholder-label">Support projection</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>

      <section className="support-status-band" data-status={support.status} role="status" aria-live="polite" aria-labelledby="support-status-title">
        <div>
          <span className="placeholder-label">{support.status.replace(/_/g, ' ')}</span>
          <h2 id="support-status-title">{support.ticket.statusLabel}</h2>
        </div>
        <p>{support.ticket.helperText}</p>
        <p className="support-warning">Support ticket opened is not issue resolved.</p>
      </section>

      {isDegraded ? (
        <DegradedState
          title={support.status === 'escalated_projection' ? 'Escalation guidance render' : 'Degraded support state'}
          description="Support, ticket, order-linked context, or escalation projection is partial, unavailable, or delayed."
          action={<button className="shell-action" type="button" onClick={retry}>Refresh projection</button>}
        />
      ) : null}

      <section className="support-layout" aria-labelledby="support-timeline-title">
        <div className="support-main-stack">
          <SupportTimeline steps={support.timeline} />
          <SupportTicketPanel support={support} />
          <SupportContextPanel support={support} />
        </div>
        <SupportGuidancePanel support={support} retry={retry} />
      </section>
    </main>
  );
}

function SupportTimeline({ steps }: { steps: SupportTimelineStepProjection[] }) {
  return (
    <section className="support-panel" aria-labelledby="support-timeline-title">
      <div className="section-heading">
        <span className="placeholder-label">Timeline</span>
        <h2 id="support-timeline-title">Ticket timeline projection</h2>
      </div>
      <ol className="support-timeline" aria-label="Support ticket projection timeline">
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

function SupportTicketPanel({ support }: { support: SupportSurfaceProjection }) {
  return (
    <section className="support-panel" aria-labelledby="ticket-preview-title">
      <div className="section-heading">
        <span className="placeholder-label">Ticket</span>
        <h2 id="ticket-preview-title">Support ticket preview</h2>
      </div>
      <dl className="support-facts">
        <Fact label="Ticket reference" value={support.ticket.ticketId ?? 'Ticket reference unavailable'} />
        <Fact label="Category" value={support.ticket.categoryText} />
        <Fact label="Status" value={support.ticket.statusLabel} />
      </dl>
      <p>{support.ticket.latestMessagePreview}</p>
    </section>
  );
}

function SupportContextPanel({ support }: { support: SupportSurfaceProjection }) {
  return (
    <section className="support-panel" aria-labelledby="support-context-title">
      <div className="section-heading">
        <span className="placeholder-label">Context</span>
        <h2 id="support-context-title">Order-linked support preview</h2>
      </div>
      <dl className="support-facts">
        <Fact label="Order reference" value={support.orderContext.orderNumber ?? support.orderContext.orderId ?? 'Order reference unavailable'} />
        <Fact label="Payment reference" value={support.orderContext.paymentReferenceText} />
        <Fact label="Return reference" value={support.orderContext.returnReferenceText} />
        <Fact label="Refund reference" value={support.orderContext.refundReferenceText} />
      </dl>
      <p>{support.orderContext.helperText}</p>
    </section>
  );
}

function SupportGuidancePanel({ support, retry }: { support: SupportSurfaceProjection; retry: () => void }) {
  return (
    <aside className="support-guidance" aria-labelledby="support-guidance-title">
      <div className="section-heading">
        <span className="placeholder-label">Guidance</span>
        <h2 id="support-guidance-title">{support.guidance.title}</h2>
      </div>
      <dl className="support-facts">
        <Fact label="Escalation" value={support.escalation.label} />
        <Fact label="Resolution boundary" value="Support owner projection required" />
      </dl>
      <p>{support.guidance.helperText}</p>
      <p>{support.escalation.helperText}</p>
      <p>{support.guidance.escalationText}</p>
      <div className="support-action-list">
        <button className="state-action secondary" type="button" onClick={retry}>Refresh projection</button>
        <Link className="state-action" href={support.navigation.goToSupport.href}>{support.navigation.goToSupport.label}</Link>
        <Link className="state-action secondary" href={support.navigation.goToReturns.href}>{support.navigation.goToReturns.label}</Link>
        <Link className="state-action secondary" href={support.navigation.goToOrders.href}>{support.navigation.goToOrders.label}</Link>
      </div>
    </aside>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ProjectionSkeleton() {
  return (
    <section className="return-layout" aria-label="Projection loading skeleton">
      <div className="return-main-stack">
        <div className="return-panel">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
      <aside className="return-support">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </aside>
    </section>
  );
}
