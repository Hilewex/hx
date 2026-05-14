import type { PublicProjectionEnvelope, SupportSurfaceProjection, SupportSurfaceStatus, SupportTimelineStepProjection } from '@hx/contracts';
import { readBffProjectionState } from './read';

export interface SupportProjectionReadInput {
  ticketId?: string;
  orderId?: string;
  orderRef?: string;
  paymentId?: string;
  returnId?: string;
  refundId?: string;
  state?: string;
  escalationState?: string;
}

export async function readSupportProjection(
  input: SupportProjectionReadInput,
): Promise<PublicProjectionEnvelope<SupportSurfaceProjection>> {
  const params = new URLSearchParams();
  if (input.ticketId) params.set('ticketId', input.ticketId);
  if (input.orderId) params.set('orderId', input.orderId);
  if (input.orderRef) params.set('orderRef', input.orderRef);
  if (input.paymentId) params.set('paymentId', input.paymentId);
  if (input.returnId) params.set('returnId', input.returnId);
  if (input.refundId) params.set('refundId', input.refundId);

  const ownerProjection = await readBffProjectionState<SupportSurfaceProjection>(
    `/support/projection${params.size ? `?${params.toString()}` : ''}`,
  );

  if (ownerProjection.data) {
    return ownerProjection;
  }

  const status = normalizeSupportStatus(input, ownerProjection.transport.status);
  const data = createSupportSurfaceProjection({
    ...input,
    status,
    warnings: compactStrings([
      ...(ownerProjection.transport.warnings ?? []),
      ownerProjection.transport.error?.message,
      'SUPPORT_OWNER_READ_ENDPOINT_UNAVAILABLE_SAFE_PLACEHOLDER',
    ]),
  });

  return {
    data,
    transport: {
      ...ownerProjection.transport,
      status: status === 'timeout' ? 'timeout' : status === 'unavailable' ? 'unavailable' : 'degraded',
      warnings: data.warnings,
      retryable: true,
    },
  };
}

function normalizeSupportStatus(input: SupportProjectionReadInput, transportStatus: string): SupportSurfaceStatus {
  if (transportStatus === 'timeout') return 'timeout';
  if (input.state === 'degraded') return 'degraded';

  switch (input.state) {
    case 'empty':
      return 'empty';
    case 'ticket-opened':
    case 'ticket_opened':
    case 'open':
      return 'ticket_opened';
    case 'triaged':
    case 'triaged-projection':
    case 'triaged_projection':
      return 'triaged_projection';
    case 'waiting-for-customer':
    case 'waiting_for_customer_projection':
      return 'waiting_for_customer_projection';
    case 'escalated':
    case 'escalated-projection':
    case 'escalated_projection':
      return 'escalated_projection';
    case 'resolved':
    case 'resolved-projection':
    case 'resolved_projection':
      return 'resolved_projection';
    case 'closed':
    case 'closed-projection':
    case 'closed_projection':
      return 'closed_projection';
    case 'unavailable':
      return 'unavailable';
    case 'error':
      return 'error';
    default:
      return input.ticketId ? 'ticket_opened' : 'empty';
  }
}

function createSupportSurfaceProjection(
  input: SupportProjectionReadInput & { status: SupportSurfaceStatus; warnings?: string[] },
): SupportSurfaceProjection {
  const ticketText = input.ticketId ?? 'Ticket reference unavailable';

  return {
    status: input.status,
    ticket: {
      ticketId: input.ticketId,
      status: input.status,
      categoryText: categoryText(input),
      subjectText: input.ticketId ? 'Support ticket projection' : 'Support guidance projection',
      latestMessagePreview: input.ticketId
        ? 'Customer message preview is minimized and does not expose internal notes.'
        : 'No ticket projection is selected. Support guidance can still show next steps.',
      statusLabel: statusLabel(input.status),
      helperText: input.status === 'resolved_projection'
        ? 'Resolved is an owner projection. Ticket opened is not issue resolved.'
        : 'Ticket state is projection-only. The browser does not resolve support issues.',
      ticketOpenedTruth: false,
      issueResolvedTruth: false,
      warnings: input.warnings,
    },
    orderContext: {
      orderId: input.orderId,
      orderNumber: input.orderRef,
      paymentReferenceText: input.paymentId ?? 'Payment reference unavailable',
      returnReferenceText: input.returnId ?? 'Return reference unavailable',
      refundReferenceText: input.refundId ?? 'Refund reference unavailable',
      helperText: 'Order, payment, return, and refund references are safe display projections only.',
      orderTruth: false,
      paymentTruth: false,
      returnTruth: false,
      refundTruth: false,
      rawProviderPayloadExposed: false,
    },
    guidance: {
      title: 'Support guidance',
      helperText: 'Share customer-visible references; support resolution remains with the support owner.',
      escalationText: escalationText(input.status),
      ctaLabel: 'Open support guidance',
      ctaHref: '/support',
      supportResolutionTruth: false,
      ticketMutationTruth: false,
    },
    escalation: mapEscalation(input.status, input.escalationState),
    timeline: createTimeline(input.status),
    navigation: {
      goToSupport: { href: '/support', label: 'Go to support' },
      goToReturns: { href: '/returns', label: 'Go to returns' },
      goToOrders: { href: '/orders', label: 'Go to orders' },
    },
    boundaryFlags: {
      projectionTruth: false,
      queryCacheTruth: false,
      supportTicketTruth: false,
      supportResolutionTruth: false,
      escalationDecisionTruth: false,
      moderationTruth: false,
      fraudTruth: false,
      orderTruth: false,
      paymentTruth: false,
      returnTruth: false,
      refundTruth: false,
      rawFinancePayloadExposed: false,
      rawProviderPayloadExposed: false,
      adminNotesExposed: false,
    },
    warnings: input.warnings,
  };
}

function categoryText(input: SupportProjectionReadInput): string {
  if (input.returnId || input.refundId) return 'Return and refund support projection';
  if (input.paymentId) return 'Payment support projection';
  if (input.orderId || input.orderRef) return 'Order-linked support projection';
  return 'General support projection';
}

function statusLabel(status: SupportSurfaceStatus): string {
  switch (status) {
    case 'ticket_opened':
      return 'Ticket opened projection';
    case 'triaged_projection':
      return 'Triaged projection';
    case 'waiting_for_customer_projection':
      return 'Waiting for customer projection';
    case 'escalated_projection':
      return 'Escalated projection';
    case 'resolved_projection':
      return 'Resolved projection';
    case 'closed_projection':
      return 'Closed projection';
    case 'degraded':
      return 'Degraded support projection';
    case 'timeout':
      return 'Support read timeout';
    case 'unavailable':
      return 'Support unavailable';
    case 'error':
      return 'Support projection error';
    default:
      return 'Support ticket preview';
  }
}

function mapEscalation(status: SupportSurfaceStatus, escalationState?: string): SupportSurfaceProjection['escalation'] {
  const required = status === 'escalated_projection' || escalationState === 'required';
  const degraded = status === 'degraded' || status === 'timeout' || status === 'unavailable';
  return {
    status: required ? 'required' : degraded ? 'degraded' : status === 'ticket_opened' ? 'recommended' : 'none',
    label: required ? 'Escalation required projection' : degraded ? 'Degraded support escalation' : 'Escalation guidance projection',
    helperText: required
      ? 'Escalation is projected by support state, not decided locally.'
      : 'Escalate when support projection says review is needed or the ticket is degraded.',
    escalationDecisionTruth: false,
    moderationTruth: false,
    fraudTruth: false,
  };
}

function createTimeline(status: SupportSurfaceStatus): SupportTimelineStepProjection[] {
  const steps = ['opened', 'triage', 'customer', 'escalation', 'resolution'];
  const current = currentIndex(status);

  return steps.map((stepId, index) => {
    const copy = timelineCopy(stepId);
    const stepStatus =
      status === 'degraded' || status === 'escalated_projection'
        ? index < current
          ? 'complete_projection'
          : stepId === 'escalation'
            ? 'current_projection'
            : 'degraded_projection'
        : index < current
          ? 'complete_projection'
          : index === current
            ? 'current_projection'
            : 'pending_projection';

    return {
      stepId,
      title: copy.title,
      description: copy.description,
      status: stepStatus,
      ariaText: `${copy.title}: ${stepStatus.replace(/_/g, ' ')}`,
      ticketTruth: false,
      resolutionTruth: false,
      moderationTruth: false,
      fraudTruth: false,
    };
  });
}

function currentIndex(status: SupportSurfaceStatus): number {
  switch (status) {
    case 'ticket_opened':
    case 'empty':
      return 0;
    case 'triaged_projection':
      return 1;
    case 'waiting_for_customer_projection':
      return 2;
    case 'escalated_projection':
    case 'degraded':
      return 3;
    case 'resolved_projection':
    case 'closed_projection':
      return 4;
    default:
      return 0;
  }
}

function timelineCopy(stepId: string): { title: string; description: string } {
  switch (stepId) {
    case 'opened':
      return { title: 'Ticket opened projection', description: 'Ticket opened does not mean issue resolved.' };
    case 'triage':
      return { title: 'Triage projection', description: 'Support triage is read-only on this surface.' };
    case 'customer':
      return { title: 'Customer response projection', description: 'Message preview is minimized and customer-visible.' };
    case 'escalation':
      return { title: 'Support escalation projection', description: 'Escalation guidance does not expose internal fraud or moderation decisions.' };
    default:
      return { title: 'Resolution projection', description: 'Resolved appears only when projected by support owner.' };
  }
}

function escalationText(status: SupportSurfaceStatus): string {
  if (status === 'escalated_projection' || status === 'degraded') {
    return 'Use escalation guidance while the ticket projection is escalated or degraded.';
  }

  return 'Ticket opened is not issue resolved; continue with support owner guidance.';
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
