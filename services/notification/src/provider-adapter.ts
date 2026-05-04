
import {
  createProviderResultEnvelope,
  ProviderResultEnvelope,
  ProviderMode,
  ProviderOperationStatus,
  NotificationChannel,
} from '@hx/contracts';

/**
 * Interface for a notification provider adapter.
 * Defines the contract for sending a notification through a specific provider.
 */
export interface NotificationProviderAdapter {
  send(params: {
    channel: NotificationChannel;
    correlationId?: string;
    causationId?: string;
  }): Promise<ProviderResultEnvelope>;
}

/**
 * A foundational notification provider adapter that simulates provider interactions
 * based on the configured mode, without making any real network calls.
 *
 * This serves as the basis for the HARDENING-09E boundary, ensuring that
 * notification delivery attempts adhere to the provider contract standard.
 */
export class FoundationNotificationProviderAdapter implements NotificationProviderAdapter {
  constructor(
    private readonly providerName: string,
    private readonly mode: ProviderMode
  ) {}

  async send(params: {
    channel: NotificationChannel;
    correlationId?: string;
    causationId?: string;
  }): Promise<ProviderResultEnvelope> {
    let operationStatus: ProviderOperationStatus = 'succeeded';
    let normalized: any = {};

    switch (this.mode) {
      case 'sandbox':
        operationStatus = 'succeeded';
        normalized = { message: 'Delivered to sandbox' };
        break;
      case 'parked':
        operationStatus = 'succeeded'; // Parked is a 'successful' operation from the adapter's perspective.
        normalized = { message: 'Provider is parked, delivery skipped' };
        break;
      case 'not_configured':
        operationStatus = 'failed';
        normalized = { message: 'Provider is not configured' };
        break;
      default:
        operationStatus = 'unknown_result';
        normalized = { message: `Unknown provider mode: ${this.mode}` };
        break;
    }

    return createProviderResultEnvelope({
      providerDomain: 'notification',
      providerName: this.providerName,
      providerMode: this.mode,
      operation: `send-${params.channel.toLowerCase()}`,
      operationStatus,
      correlationId: params.correlationId,
      causationId: params.causationId,
      normalized,
      // In a real scenario, this would be the raw response from the provider.
      // For this foundation, we keep it aligned with the normalized output.
      raw: normalized, 
    });
  }
}
