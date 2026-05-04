
import {
  ProviderResultEnvelope,
  createProviderResultEnvelope,
  ProviderMode,
} from '@hx/contracts';

/**
 * Defines the contract for a payout provider adapter.
 */
export interface PayoutProviderAdapter {
  /**
   * Submits a payout instruction to the provider.
   * This is a foundational method that simulates the interaction.
   *
   * @param instruction - The payout instruction details.
   * @returns A promise that resolves to a standard provider result envelope.
   */
  submitPayout(instruction: {
    payoutId: string;
    amount: number;
    currency: string;
    beneficiary: any;
    idempotencyKey?: string;
  }): Promise<ProviderResultEnvelope<any, any>>;
}

/**
 * A foundation/simulation implementation of the PayoutProviderAdapter.
 * It does not perform any real network calls or financial transactions.
 * Its purpose is to establish the boundary and return a predictable result.
 */
export class FoundationPayoutProviderAdapter implements PayoutProviderAdapter {
  private mode: ProviderMode;
  private providerName: string;

  constructor(mode: ProviderMode = 'parked', providerName = 'foundation_park') {
    this.mode = mode;
    this.providerName = providerName;
  }

  async submitPayout(instruction: {
    payoutId: string;
    amount: number;
    currency: string;
    beneficiary: any;
    idempotencyKey?: string;
  }): Promise<ProviderResultEnvelope> {
    
    // actualProviderPayoutPerformed:false - No real payout is performed.
    const actualProviderPayoutPerformed = false;

    const rawResponse = {
      simulation: true,
      payoutId: instruction.payoutId,
      status: 'simulated_acceptance',
      actualProviderPayoutPerformed,
    };

    const normalizedResponse = {
      payoutId: instruction.payoutId,
      status: 'accepted',
      actualProviderPayoutPerformed,
    };

    return createProviderResultEnvelope({
      providerDomain: 'payout',
      providerName: this.providerName,
      providerMode: this.mode,
      operation: 'submitPayout',
      operationStatus: 'accepted',
      idempotencyKey: instruction.idempotencyKey,
      providerReference: `sim-${Date.now()}`,
      normalized: normalizedResponse,
      raw: rawResponse,
    });
  }
}

/**
 * Factory to create a payout provider adapter based on environment configuration.
 */
export function createPayoutProviderAdapter(): PayoutProviderAdapter {
    const mode = (process.env.PAYOUT_PROVIDER_MODE as ProviderMode) || 'parked';
    const providerName = process.env.PAYOUT_PROVIDER_NAME || 'foundation_park';

    // In a real scenario, we might have a switch here to instantiate different
    // provider adapters (e.g., Wise, Payoneer).
    // For this foundation, we only return the simulation adapter.
    return new FoundationPayoutProviderAdapter(mode, providerName);
}
