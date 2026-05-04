/**
 * @fileoverview
 *
 * This file defines the common provider boundary contract, a standardized
 * foundation for integrating with external service providers (e.g., payment,
 * shipment, notification, payout). It establishes a clear separation between
 * the core business logic and provider-specific implementations.
 *
 * The core principles are:
 * - **Provider Truth vs. Business Truth:** A provider's response is not the
 *   ultimate source of truth. The core system retains ownership of its state.
 *   For example, a "succeeded" response from a payment provider does not
 *   directly mutate an order's financial status to "paid."
 * - **Boundary Flags:** Every interaction across the boundary includes a
 *   `ProviderBoundaryFlags` object. These flags enforce rules, ensuring that
 *   provider-side effects do not unintentionally alter the core business state.
 * - **Standardized Envelopes:** All data crossing the boundary, whether it's a
 *   result from an operation or an incoming callback, is wrapped in a
- *   standardized envelope (`ProviderResultEnvelope`, `ProviderCallbackEnvelope`).
 *   This provides consistency and traceability.
 * - **Configurable Modes:** Providers can operate in different modes
 *   (`simulation`, `sandbox`, `production`, etc.), allowing for safe testing and
 *   development without affecting live systems.
 */

/**
 * Defines the domain of the provider, categorizing its function.
 */
export type ProviderDomain =
  | 'payment'
  | 'shipment'
  | 'notification'
  | 'payout';

/**
 * Represents the operational mode of a provider.
 * - `simulation`: Internal, in-memory simulation. No external calls.
 * - `sandbox`: Connects to a provider's test environment.
 * - `parked`: The provider integration is temporarily disabled. Returns a standard "parked" response.
 * - `not_configured`: The provider is not set up.
 * - `production`: Connects to a provider's live environment.
 */
export type ProviderMode =
  | 'simulation'
  | 'sandbox'
  | 'parked'
  | 'not_configured'
  | 'production';

/**
 * Standardized status for an operation performed by a provider.
 */
export type ProviderOperationStatus =
  | 'accepted' // Request was accepted for asynchronous processing
  | 'succeeded' // Operation completed successfully
  | 'failed' // Operation failed definitively
  | 'pending' // The outcome is still pending
  | 'unknown_result' // The outcome could not be determined (e.g., due to a network timeout)
  | 'rejected'; // Request was rejected by the provider

/**
 * A set of flags that enforce the boundary between the core system and the provider.
 * These flags MUST default to `false` and are used by guards and interceptors to prevent
 * unintended side effects.
 *
 * @property {boolean} providerTruth - Acknowledges that the data is from the provider, not the system's source of truth.
 * @property {boolean} businessTruthMutated - Confirms that a core business entity (e.g., Order, Shipment) was intentionally mutated.
 * @property {boolean} ownerStateMutated - Confirms that the primary state of the business owner was changed (e.g., Order status).
 * @property {boolean} eventTruthMutated - Confirms that a business event was intentionally recorded as a source of truth.
 * @property {boolean} outboxDeliveryGuaranteed - Confirms that an outbox/event-sourcing record has a strong delivery guarantee (should almost always be false).
 */
export interface ProviderBoundaryFlags {
  readonly providerTruth: false;
  readonly businessTruthMutated: false;
  readonly ownerStateMutated: false;
  readonly eventTruthMutated: false;
  readonly outboxDeliveryGuaranteed: false;
}

/**
 * A standard, immutable set of boundary flags.
 */
const DEFAULT_BOUNDARY_FLAGS: ProviderBoundaryFlags = {
  providerTruth: false,
  businessTruthMutated: false,
  ownerStateMutated: false,
  eventTruthMutated: false,
  outboxDeliveryGuaranteed: false,
};

/**
 * Helper function to create a `ProviderBoundaryFlags` object.
 * Ensures all flags are explicitly set to `false`, reinforcing the boundary principle.
 */
export function createProviderBoundaryFlags(): ProviderBoundaryFlags {
  return DEFAULT_BOUNDARY_FLAGS;
}

/**
 * Represents a standard error structure for provider-related failures.
 */
export interface ProviderError {
  /** A standardized error code from the core system. */
  code: string;
  /** A user-friendly error message. */
  message: string;
  /** Whether the operation can be safely retried. */
  retryable: boolean;
  /** The original error code from the provider, if available. */
  rawCode?: string;
  /** The original error message from the provider, if available. */
  rawMessage?: string;
}

/**
 * A standardized envelope for the result of any provider operation.
 *
 * @template TNormalized - The shape of the normalized data, understood by the core system.
 * @template TRaw - The shape of the raw data returned by the provider.
 */
export interface ProviderResultEnvelope<TNormalized = unknown, TRaw = unknown> {
  readonly providerDomain: ProviderDomain;
  readonly providerName: string;
  readonly providerMode: ProviderMode;
  readonly operation: string;
  readonly operationStatus: ProviderOperationStatus;
  readonly providerReference?: string;
  readonly idempotencyKey?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly requestId?: string;
  readonly occurredAt: Date;
  readonly normalized?: TNormalized;
  readonly raw?: TRaw;
  readonly error?: ProviderError;
  readonly boundary: ProviderBoundaryFlags;
}

/**
 * A standardized envelope for incoming callbacks or webhooks from a provider.
 *
 * @template TRaw - The shape of the raw data received in the callback.
 */
/**
 * The verification status of a provider callback's signature.
 */
export type ProviderCallbackVerificationStatus =
  | 'not_required'
  | 'verified'
  | 'failed'
  | 'unsupported';

/**
 * The processing status of a received provider callback.
 */
export type ProviderCallbackProcessingStatus =
  | 'received' // Initial state upon successful ingestion
  | 'accepted' // Acknowledged and queued for processing
  | 'duplicate' // Detected as a duplicate, processing skipped
  | 'rejected' // Invalid payload or failed validation, not processed
  | 'ignored' // Valid but irrelevant to the system, intentionally not processed
  | 'failed'; // An unexpected error occurred during processing

/**
 * The replay status of a provider callback, used for idempotency checks.
 */
export type ProviderCallbackReplayStatus =
  | 'first_seen' // The first time this event has been observed
  | 'replay_detected' // A potential replay based on provider-sent timestamps or IDs
  | 'duplicate_event' // A confirmed duplicate based on idempotency keys or event IDs
  | 'unknown'; // The replay status could not be determined

export interface ProviderCallbackEnvelope<TRaw = unknown> {
  readonly providerDomain: ProviderDomain;
  readonly providerName: string;
  readonly providerMode: ProviderMode;
  readonly callbackType: string;
  readonly providerEventId?: string;
  readonly signatureVerified: boolean;
  readonly replayDetected: boolean;
  readonly idempotencyKey?: string;
  readonly correlationId?: string;
  readonly receivedAt: Date;
  readonly raw: TRaw;
  readonly boundary: ProviderBoundaryFlags;
}

/**
 * Helper function to create a `ProviderResultEnvelope`.
 * It ensures the `boundary` flags are correctly initialized.
 *
 * @param init - The initial data for the envelope.
 */
export function createProviderResultEnvelope<TNormalized = unknown, TRaw = unknown>(
  init: Omit<ProviderResultEnvelope<TNormalized, TRaw>, 'boundary' | 'occurredAt'>
): ProviderResultEnvelope<TNormalized, TRaw> {
  return {
    ...init,
    occurredAt: new Date(),
    boundary: createProviderBoundaryFlags(),
  };
}

/**
 * Helper function to create a `ProviderCallbackEnvelope`.
 * It ensures the `boundary` flags are correctly initialized.
 *
 * @param init - The initial data for the callback envelope.
 */
export function createProviderCallbackEnvelope<TRaw = unknown>(
  init: Omit<ProviderCallbackEnvelope<TRaw>, 'boundary' | 'receivedAt'>
): ProviderCallbackEnvelope<TRaw> {
  return {
    ...init,
    receivedAt: new Date(),
    boundary: createProviderBoundaryFlags(),
  };
}
