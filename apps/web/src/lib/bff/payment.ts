import type {
  PaymentSurfaceProjection,
  PaymentSurfaceStatus,
  PublicProjectionEnvelope,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

export interface PaymentProjectionReadInput {
  checkoutId?: string;
  paymentId?: string;
  paymentAttemptId?: string;
  state?: string;
}

export async function readPaymentProjection(
  input: PaymentProjectionReadInput,
): Promise<PublicProjectionEnvelope<PaymentSurfaceProjection>> {
  if (!input.checkoutId && !input.paymentId && !input.paymentAttemptId) {
    const data = createPaymentSurfaceProjection({
      ...input,
      status: 'no_context',
      warnings: ['PAYMENT_CONTEXT_MISSING'],
    });

    return {
      data,
      transport: {
        status: 'empty',
        retryable: false,
        warnings: data.warnings,
      },
    };
  }

  const params = new URLSearchParams();
  if (input.checkoutId) params.set('checkoutId', input.checkoutId);
  if (input.paymentId) params.set('paymentId', input.paymentId);
  if (input.paymentAttemptId) params.set('paymentAttemptId', input.paymentAttemptId);

  const ownerProjection = await readBffProjectionState<PaymentSurfaceProjection>(
    `/payment/projection${params.size ? `?${params.toString()}` : ''}`,
  );

  if (ownerProjection.data) {
    return ownerProjection;
  }

  const status = normalizeRequestedStatus(input.state, ownerProjection.transport.status);
  const data = createPaymentSurfaceProjection({
    ...input,
    status,
    warnings: compactStrings([
      ...(ownerProjection.transport.warnings ?? []),
      ownerProjection.transport.error?.message,
      'PAYMENT_OWNER_READ_ENDPOINT_UNAVAILABLE_SAFE_PLACEHOLDER',
    ]),
  });

  return {
    data,
    transport: {
      ...ownerProjection.transport,
      status: data.status === 'timeout' ? 'timeout' : data.status === 'unavailable' ? 'unavailable' : 'degraded',
      warnings: data.warnings,
      retryable: true,
    },
  };
}

function normalizeRequestedStatus(state: string | undefined, transportStatus: string): PaymentSurfaceStatus {
  if (transportStatus === 'timeout') {
    return 'timeout';
  }

  switch (state) {
    case 'pending':
      return 'pending';
    case 'failed':
      return 'failed';
    case 'unknown-result':
    case 'unknown_result':
      return 'unknown_result';
    case 'support-required':
      return 'support_required';
    case 'provider-degraded':
      return 'provider_degraded';
    case 'unavailable':
      return 'unavailable';
    case 'error':
      return 'error';
    case 'initiation-ready':
    default:
      return 'initiation_ready';
  }
}

function createPaymentSurfaceProjection(input: {
  checkoutId?: string;
  paymentId?: string;
  paymentAttemptId?: string;
  status: PaymentSurfaceStatus;
  warnings?: string[];
}): PaymentSurfaceProjection {
  const guidance = createStateGuidance(input.status, input.warnings);

  return {
    status: input.status,
    context: {
      checkoutId: input.checkoutId,
      paymentId: input.paymentId,
      paymentAttemptId: input.paymentAttemptId,
      statusText: statusText(input.status),
      paymentContextTruth: false,
      checkoutReferenceTruth: false,
      paymentAttemptTruth: false,
      warnings: input.warnings,
    },
    checkoutReference: {
      checkoutId: input.checkoutId,
      label: input.checkoutId ? `Checkout reference ${input.checkoutId}` : 'Checkout reference unavailable',
      amountDisplayText: 'Amount and currency display wait for owner-provided safe text.',
      checkoutReadinessText: 'Checkout readiness is not decided by the payment UI.',
      checkoutReadinessTruth: false,
      amountCurrencyTruth: false,
      orderTruth: false,
      warnings: input.warnings,
    },
    attemptReference: {
      paymentId: input.paymentId,
      paymentAttemptId: input.paymentAttemptId,
      label: input.paymentAttemptId ? `Payment attempt reference ${input.paymentAttemptId}` : 'Payment attempt reference unavailable',
      stateText: statusText(input.status),
      paymentFinalityTruth: false,
      providerFinalityTruth: false,
      duplicatePaymentEngineTruth: false,
      warnings: input.warnings,
    },
    providerRedirect: {
      status: input.status === 'initiation_ready' ? 'placeholder' : input.status === 'provider_degraded' ? 'degraded' : 'unavailable',
      label: input.status === 'initiation_ready' ? 'Provider redirect placeholder' : 'Provider redirect unavailable',
      helperText: 'This surface does not call a real payment provider or expose provider secrets.',
      providerRedirectTruth: false,
      providerSecretExposed: false,
      providerFinalityTruth: false,
      warnings: input.warnings,
    },
    stateGuidance: guidance,
    retryGuidance: guidance,
    supportGuidance: {
      href: '/support',
      label: 'Contact support',
      referenceText: input.paymentAttemptId ?? input.paymentId ?? 'Payment reference unavailable',
      checkoutReferenceText: input.checkoutId ?? 'Checkout reference unavailable',
      helperText: 'Include these references before retrying a payment when the result is pending or unknown.',
      ticketCreationTruth: false,
    },
    navigation: {
      returnToCheckout: {
        href: '/checkout',
        label: 'Return to checkout',
      },
      goToOrders: {
        href: '/orders',
        label: 'Go to orders',
        orderCreatedTruth: false,
      },
      contactSupport: {
        href: '/support',
        label: 'Contact support',
      },
      continueBrowsing: {
        href: '/',
        label: 'Continue browsing',
      },
    },
    boundaryFlags: {
      projectionTruth: false,
      paymentSuccessTruth: false,
      paymentFailureTruth: false,
      paymentFinalityTruth: false,
      providerFinalityTruth: false,
      orderCreatedTruth: false,
      checkoutReadinessTruth: false,
      amountCurrencyTruth: false,
      duplicatePaymentEngineTruth: false,
      settlementTruth: false,
      refundTruth: false,
      payoutTruth: false,
      rawProviderPayloadExposed: false,
      providerSecretExposed: false,
    },
    warnings: input.warnings,
  };
}

function createStateGuidance(
  status: PaymentSurfaceStatus,
  warnings?: string[],
): PaymentSurfaceProjection['stateGuidance'] {
  switch (status) {
    case 'pending':
      return guidance('Payment result pending', 'The payment result is not final yet. Wait for the owner projection or contact support with the payment reference.', 'info', warnings);
    case 'failed':
      return guidance('Payment could not continue', 'The payment projection reports a failed state. Retry only through a fresh owner-guided checkout flow.', 'blocking', warnings);
    case 'unknown_result':
      return guidance('Payment result unknown', 'The payment result is not certain right now. Check the status before attempting another payment.', 'warning', warnings);
    case 'support_required':
      return guidance('Support review required', 'This payment projection needs support follow-up before another payment attempt.', 'warning', warnings);
    case 'provider_degraded':
      return guidance('Provider status degraded', 'Provider redirect or status projection is degraded. Do not assume a final payment result.', 'warning', warnings);
    case 'timeout':
      return guidance('Payment projection timed out', 'The payment projection read timed out. Refresh the projection or contact support before retrying.', 'warning', warnings);
    case 'unavailable':
    case 'error':
      return guidance('Payment projection unavailable', 'Payment projection is unavailable. The browser does not create payment or order truth.', 'warning', warnings);
    case 'no_context':
      return guidance('No payment context', 'No checkout or payment reference is available for this payment surface.', 'info', warnings);
    case 'initiation_ready':
    default:
      return guidance('Payment initiation placeholder', 'Payment initiation can be prepared here, but real provider handoff is outside this browser surface.', 'info', warnings);
  }
}

function guidance(
  title: string,
  message: string,
  severity: PaymentSurfaceProjection['stateGuidance']['severity'],
  warnings?: string[],
): PaymentSurfaceProjection['stateGuidance'] {
  return {
    title,
    message,
    severity,
    retryText: 'Before retrying, refresh or return to checkout for owner projection review.',
    supportText: 'Support can use the checkout and payment references shown on this page.',
    duplicateSubmitWarning: 'Do not start another payment while this result is pending or unknown.',
    paymentSuccessTruth: false,
    paymentFailureTruth: false,
    orderCreatedTruth: false,
    providerFinalityTruth: false,
    settlementTruth: false,
    warnings,
  };
}

function statusText(status: PaymentSurfaceStatus): string {
  return `Payment owner projection state: ${status}`;
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
