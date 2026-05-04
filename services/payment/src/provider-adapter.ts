
import {
  createProviderResultEnvelope,
  ProviderResultEnvelope,
  ProviderOperationStatus,
} from '@hx/contracts';
import { randomUUID } from 'node:crypto';

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
  const providerMode = process.env.PAYMENT_PROVIDER_MODE || 'simulation';

  switch (providerMode) {
    case 'simulation':
    default:
      return new InternalSimulationPaymentProviderAdapter();
  }
}

