import type {
  PublicProjectionEnvelope,
  RefundProjectionStatus,
  ReturnSurfaceProjection,
  ReturnSurfaceStatus,
  ReturnTimelineStepProjection,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

export interface ReturnProjectionReadInput {
  returnId?: string;
  orderId?: string;
  orderRef?: string;
  refundId?: string;
  state?: string;
  refundState?: string;
  escalationState?: string;
}

export async function readReturnProjection(
  input: ReturnProjectionReadInput,
): Promise<PublicProjectionEnvelope<ReturnSurfaceProjection>> {
  const params = new URLSearchParams();
  if (input.returnId) params.set('returnId', input.returnId);
  if (input.orderId) params.set('orderId', input.orderId);
  if (input.orderRef) params.set('orderRef', input.orderRef);
  if (input.refundId) params.set('refundId', input.refundId);

  const ownerProjection = await readBffProjectionState<ReturnSurfaceProjection>(
    `/returns/projection${params.size ? `?${params.toString()}` : ''}`,
  );

  if (ownerProjection.data) {
    return ownerProjection;
  }

  const status = normalizeReturnStatus(input, ownerProjection.transport.status);
  const data = createReturnSurfaceProjection({
    ...input,
    status,
    warnings: compactStrings([
      ...(ownerProjection.transport.warnings ?? []),
      ownerProjection.transport.error?.message,
      'RETURN_OWNER_READ_ENDPOINT_UNAVAILABLE_SAFE_PLACEHOLDER',
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

function normalizeReturnStatus(input: ReturnProjectionReadInput, transportStatus: string): ReturnSurfaceStatus {
  if (transportStatus === 'timeout') return 'timeout';
  if (input.state === 'degraded' || input.refundState === 'degraded') return 'degraded';

  switch (input.state) {
    case 'empty':
      return 'empty';
    case 'return-requested':
    case 'return_requested':
      return 'return_requested';
    case 'review-pending':
    case 'review_pending':
      return 'review_pending';
    case 'approved':
    case 'approved-projection':
    case 'approved_projection':
      return 'approved_projection';
    case 'rejected':
    case 'rejected-projection':
    case 'rejected_projection':
      return 'rejected_projection';
    case 'refund-pending':
    case 'refund_pending':
      return 'refund_pending';
    case 'refund-processing':
    case 'refund_processing':
      return 'refund_processing';
    case 'refund-completed-projection':
    case 'refund_completed_projection':
      return 'refund_completed_projection';
    case 'support-escalation':
    case 'support_escalation':
      return 'support_escalation';
    case 'unavailable':
      return 'unavailable';
    case 'error':
      return 'error';
    default:
      return input.returnId || input.orderId || input.orderRef ? 'return_requested' : 'empty';
  }
}

function createReturnSurfaceProjection(
  input: ReturnProjectionReadInput & { status: ReturnSurfaceStatus; warnings?: string[] },
): ReturnSurfaceProjection {
  const referenceText = input.returnId ?? input.orderRef ?? input.orderId ?? 'Return reference unavailable';

  return {
    status: input.status,
    reference: {
      returnId: input.returnId,
      orderId: input.orderId,
      orderNumber: input.orderRef,
      label: referenceText,
      helperText:
        input.status === 'empty'
          ? 'Return request list projection is empty or unavailable.'
          : 'Return request is a read projection. Requested does not mean approved.',
      returnApprovedTruth: false,
      logisticsTruth: false,
      warnings: input.warnings,
    },
    refund: mapRefund(input.status, input.refundId, input.refundState, input.warnings),
    supportGuidance: {
      href: '/support',
      label: 'Contact support',
      referenceText,
      refundReferenceText: input.refundId ?? 'Refund reference waits for owner projection',
      helperText: 'Support can compare return and refund projections without treating either as final truth.',
      escalationText: escalationText(input.status),
      ticketCreationTruth: false,
      issueResolvedTruth: false,
    },
    escalation: mapEscalation(input.status, input.escalationState),
    timeline: createTimeline(input.status),
    items: [
      {
        lineId: 'return-line-projection',
        productId: 'projection-product',
        title: 'Return item preview projection',
        quantityText: 'Quantity waits for return owner projection',
        reasonText: 'Reason preview is customer-facing projection only',
        summaryText: 'Item preview does not approve return, execute refund, or mutate settlement.',
        refundTruth: false,
        settlementTruth: false,
        warnings: input.warnings,
      },
    ],
    navigation: {
      goToReturns: { href: '/returns', label: 'Go to returns' },
      contactSupport: { href: '/support', label: 'Contact support' },
    },
    boundaryFlags: {
      projectionTruth: false,
      queryCacheTruth: false,
      returnApprovalTruth: false,
      refundCompletedTruth: false,
      settlementTruth: false,
      payoutTruth: false,
      logisticsTruth: false,
      supportResolutionTruth: false,
      moderationTruth: false,
      fraudTruth: false,
      rawFinancePayloadExposed: false,
      rawProviderPayloadExposed: false,
    },
    warnings: input.warnings,
  };
}

function mapRefund(
  status: ReturnSurfaceStatus,
  refundId?: string,
  refundState?: string,
  warnings?: string[],
): ReturnSurfaceProjection['refund'] {
  const refundStatus: RefundProjectionStatus =
    refundState === 'settlement-pending' || refundState === 'settlement_pending'
      ? 'settlement_pending'
      : refundState === 'processing' || status === 'refund_processing'
        ? 'processing'
        : refundState === 'completed-projection' || refundState === 'completed_projection' || status === 'refund_completed_projection'
          ? 'completed_projection'
          : refundState === 'degraded' || status === 'degraded'
            ? 'degraded'
            : status === 'refund_pending' || status === 'approved_projection'
              ? 'pending'
              : status === 'unavailable' || status === 'timeout' || status === 'error'
                ? 'unavailable'
                : 'not_started';

  const copy: Record<RefundProjectionStatus, { label: string; helperText: string }> = {
    not_started: {
      label: 'Refund not started projection',
      helperText: 'Return requested is not refund initiated.',
    },
    pending: {
      label: 'Refund pending projection',
      helperText: 'Return approved projection is separate from refund processing and refund completion.',
    },
    processing: {
      label: 'Refund processing projection',
      helperText: 'Refund processing does not mean settlement or payout is complete.',
    },
    completed_projection: {
      label: 'Refund completed projection',
      helperText: 'Completed appears only as owner projection; settlement and payout remain separate.',
    },
    settlement_pending: {
      label: 'Settlement pending projection',
      helperText: 'Refund initiated or processed is not settled payout truth.',
    },
    degraded: {
      label: 'Degraded refund projection',
      helperText: 'Refund state is partial. The browser does not infer completion.',
    },
    unavailable: {
      label: 'Refund projection unavailable',
      helperText: 'Refund state waits for refund owner projection.',
    },
  };

  return {
    refundId,
    status: refundStatus,
    label: copy[refundStatus].label,
    helperText: copy[refundStatus].helperText,
    refundCompletedTruth: false,
    settlementTruth: false,
    payoutTruth: false,
    rawProviderPayloadExposed: false,
    warnings,
  };
}

function mapEscalation(status: ReturnSurfaceStatus, escalationState?: string): ReturnSurfaceProjection['escalation'] {
  const escalated = status === 'support_escalation' || escalationState === 'required';
  const degraded = status === 'degraded' || status === 'timeout' || status === 'unavailable';
  return {
    status: escalated ? 'required' : degraded ? 'degraded' : status === 'refund_pending' ? 'recommended' : 'none',
    label: escalated ? 'Escalation required projection' : degraded ? 'Escalation guidance degraded' : 'Support guidance projection',
    helperText: escalated
      ? 'Support escalation is projected, not locally decided by this UI.'
      : 'Use support when return or refund projections are delayed, partial, or unclear.',
    escalationDecisionTruth: false,
    moderationTruth: false,
    fraudTruth: false,
  };
}

function createTimeline(status: ReturnSurfaceStatus): ReturnTimelineStepProjection[] {
  const steps = ['requested', 'review', 'approval', 'refund', 'settlement', 'support'];
  const current = currentIndex(status);

  return steps.map((stepId, index) => {
    const copy = timelineCopy(stepId);
    const stepStatus =
      status === 'degraded' || status === 'support_escalation'
        ? index < current
          ? 'complete_projection'
          : stepId === 'support'
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
      returnApprovalTruth: false,
      refundTruth: false,
      settlementTruth: false,
      logisticsTruth: false,
    };
  });
}

function currentIndex(status: ReturnSurfaceStatus): number {
  switch (status) {
    case 'return_requested':
    case 'empty':
      return 0;
    case 'review_pending':
      return 1;
    case 'approved_projection':
    case 'rejected_projection':
      return 2;
    case 'refund_pending':
    case 'refund_processing':
    case 'refund_completed_projection':
      return 3;
    case 'support_escalation':
    case 'degraded':
      return 5;
    default:
      return 0;
  }
}

function timelineCopy(stepId: string): { title: string; description: string } {
  switch (stepId) {
    case 'requested':
      return { title: 'Return requested projection', description: 'Return requested does not mean return approved.' };
    case 'review':
      return { title: 'Return review pending', description: 'Review state waits for owner projection.' };
    case 'approval':
      return { title: 'Return approved projection', description: 'Return approved does not mean refund completed.' };
    case 'refund':
      return { title: 'Refund processing projection', description: 'Refund pending and refund processing are separate from settlement.' };
    case 'settlement':
      return { title: 'Settlement pending projection', description: 'Refund initiated is not settled payout truth.' };
    default:
      return { title: 'Support escalation', description: 'Support can review degraded or delayed return and refund projections.' };
  }
}

function escalationText(status: ReturnSurfaceStatus): string {
  if (status === 'support_escalation' || status === 'degraded') {
    return 'Escalation guidance is visible because the projection is degraded or requires review.';
  }

  return 'Escalate only when the owner projection says review is needed or the state remains unavailable.';
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
