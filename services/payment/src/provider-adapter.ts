
import {
  createProviderResultEnvelope,
  ProviderResultEnvelope,
  ProviderOperationStatus,
  PaytrStatusInquiryResponse,
  NormalizedPaytrStatusInquiryCandidate,
  mapPaytrStatusInquiryToReconciliationCandidate,
} from '@hx/contracts';
import { randomUUID } from 'node:crypto';
import {
  PaymentProviderConfigResolution,
  resolvePaymentProviderConfig,
} from './provider-config';

/**
 * Normalized response for a payment initiation operation from any provider.
 */
export interface NormalizedPaymentInitiation {
  paymentAttemptId: string;
  providerReference?: string;
  redirectUrl?: string;
  raw?: unknown;
}

/**
 * Interface for a payment provider adapter, standardizing interactions with
 * various payment gateways.
 */
export interface PaymentProviderAdapter {
  /**
   * Initiates a payment flow with the provider.
   * @param command - The details for the payment initiation.
   * @returns A ProviderResultEnvelope containing the standardized result.
   */
  initiatePayment(command: {
    amount: number;
    currency: string;
    checkoutId: string;
    idempotencyKey: string;
    correlationId: string;
    simulationScenario?: 'succeeded' | 'pending' | 'unknown_result'; // HARDENING-09C
  }): Promise<ProviderResultEnvelope<NormalizedPaymentInitiation>>;

  statusInquiry(command: {
    merchantOid: string;
    expectedAmountMinor: number;
    expectedCurrency: string;
    idempotencyKey: string;
    correlationId: string;
    simulationResponse?: PaytrStatusInquiryResponse;
  }): Promise<ProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>>;
}

/**
 * An internal simulation adapter that mimics the behavior of a payment provider
 * without making any real network calls. It's used for testing and foundation
 * development.
 */
class InternalSimulationPaymentProviderAdapter
  implements PaymentProviderAdapter
{
  private readonly providerName = 'internal_simulation';
  private readonly providerMode = 'simulation';

  async initiatePayment(command: {
    amount: number;
    currency: string;
    checkoutId: string;
    idempotencyKey: string;
    correlationId: string;
    simulationScenario?: 'succeeded' | 'pending' | 'unknown_result';
  }): Promise<ProviderResultEnvelope<NormalizedPaymentInitiation>> {
    // HARDENING-09C: Add simulationScenario to control payment result
    const { simulationScenario = 'succeeded' } = command;
    let operationStatus: ProviderOperationStatus = 'succeeded';

    switch (simulationScenario) {
      case 'pending':
        operationStatus = 'pending';
        break;
      case 'unknown_result':
        operationStatus = 'unknown_result';
        break;
    }

    const paymentAttemptId = randomUUID();
    const providerSimulationRef = `sim_${paymentAttemptId}`;

    const normalized: NormalizedPaymentInitiation = {
      paymentAttemptId,
      providerReference: providerSimulationRef,
      redirectUrl: `https://sim.provider.com/pay?ref=${providerSimulationRef}`,
      raw: { simulation: true, timestamp: new Date().toISOString(), scenario: simulationScenario },
    };

    return createProviderResultEnvelope<NormalizedPaymentInitiation>({
      providerDomain: 'payment',
      providerName: this.providerName,
      providerMode: this.providerMode,
      operation: 'initiatePayment',
      operationStatus, // Use the determined status
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      providerReference: providerSimulationRef,
      normalized,
    });
  }

  async statusInquiry(command: {
    merchantOid: string;
    expectedAmountMinor: number;
    expectedCurrency: string;
    idempotencyKey: string;
    correlationId: string;
    simulationResponse?: PaytrStatusInquiryResponse;
  }): Promise<ProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>> {
    if (!command.simulationResponse) {
      return createProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>({
        providerDomain: 'payment',
        providerName: this.providerName,
        providerMode: this.providerMode,
        operation: 'statusInquiry',
        operationStatus: 'unknown_result',
        idempotencyKey: command.idempotencyKey,
        correlationId: command.correlationId,
        error: {
          code: 'PAYTR_STATUS_INQUIRY_SIMULATION_RESPONSE_REQUIRED',
          message: 'Status inquiry simulation requires an explicit simulationResponse. No live provider request was attempted.',
          retryable: false,
        },
      });
    }

    const candidate = mapPaytrStatusInquiryToReconciliationCandidate({
      merchantOid: command.merchantOid,
      expectedAmountMinor: command.expectedAmountMinor,
      expectedCurrency: command.expectedCurrency,
      response: command.simulationResponse,
      occurredAt: new Date(),
      inquiryRef: command.idempotencyKey,
    });

    let operationStatus: ProviderOperationStatus;
    switch (candidate.normalizedStatus) {
      case 'succeeded_candidate':
        operationStatus = 'succeeded';
        break;
      case 'status_query_inconclusive':
        operationStatus = 'unknown_result';
        break;
      case 'status_query_failed':
        operationStatus = 'failed';
        break;
      case 'rejected_amount_mismatch':
      case 'rejected_currency_mismatch':
      case 'rejected_unexpected_format':
        operationStatus = 'rejected';
        break;
    }

    return createProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>({
      providerDomain: 'payment',
      providerName: this.providerName,
      providerMode: this.providerMode,
      operation: 'statusInquiry',
      operationStatus,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      normalized: candidate,
      raw: command.simulationResponse,
      ...(operationStatus === 'failed'
        ? {
            error: {
              code: 'PAYTR_STATUS_INQUIRY_FAILED',
              message: candidate.rejectionReason ?? 'PayTR status inquiry simulation failed.',
              retryable: false,
            },
          }
        : {}),
    });
  }
}

class NotConfiguredPaymentProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly config: PaymentProviderConfigResolution) {}

  async initiatePayment(command: {
    amount: number;
    currency: string;
    checkoutId: string;
    idempotencyKey: string;
    correlationId: string;
    simulationScenario?: 'succeeded' | 'pending' | 'unknown_result';
  }): Promise<ProviderResultEnvelope<NormalizedPaymentInitiation>> {
    const errorCode = this.config.isUsableForInitiation || this.config.errors.length === 0
      ? 'PAYMENT_PROVIDER_NOT_IMPLEMENTED'
      : 'PAYMENT_PROVIDER_NOT_CONFIGURED';

    return createProviderResultEnvelope<NormalizedPaymentInitiation>({
      providerDomain: 'payment',
      providerName: this.config.requestedProviderName ?? this.config.activeProviderName,
      providerMode: this.config.providerMode,
      operation: 'initiatePayment',
      operationStatus: 'rejected',
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      error: {
        code: errorCode,
        message: 'Payment provider is not available for live initiation in this package.',
        retryable: false,
      },
    });
  }

  async statusInquiry(command: {
    merchantOid: string;
    expectedAmountMinor: number;
    expectedCurrency: string;
    idempotencyKey: string;
    correlationId: string;
    simulationResponse?: PaytrStatusInquiryResponse;
  }): Promise<ProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>> {
    const errorCode = this.config.isUsableForInitiation || this.config.errors.length === 0
      ? 'PAYMENT_PROVIDER_NOT_IMPLEMENTED'
      : 'PAYMENT_PROVIDER_NOT_CONFIGURED';

    return createProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>({
      providerDomain: 'payment',
      providerName: this.config.requestedProviderName ?? this.config.activeProviderName,
      providerMode: this.config.providerMode,
      operation: 'statusInquiry',
      operationStatus: 'rejected',
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      error: {
        code: errorCode,
        message: 'Payment provider is not available for status inquiry in this package.',
        retryable: false,
      },
    });
  }
}

/**
 * Factory function to get the configured payment provider adapter.
 *
 * It reads the environment configuration to decide which adapter to instantiate.
 * This allows for switching between simulation, sandbox, and production providers
 * without changing the core service logic.
 *
 * @returns The appropriate payment provider adapter instance.
 */
export function getPaymentProviderAdapter(): PaymentProviderAdapter {
  const config = resolvePaymentProviderConfig();

  if (config.activeProviderName === 'internal_simulation' && config.errors.length === 0) {
    return new InternalSimulationPaymentProviderAdapter();
  }

  return new NotConfiguredPaymentProviderAdapter(config);
}

