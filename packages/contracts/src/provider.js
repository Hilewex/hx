"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProviderBoundaryFlags = createProviderBoundaryFlags;
exports.createProviderResultEnvelope = createProviderResultEnvelope;
exports.createProviderCallbackEnvelope = createProviderCallbackEnvelope;
exports.createProviderCallbackSignatureVerificationResult = createProviderCallbackSignatureVerificationResult;
/**
 * A standard, immutable set of boundary flags.
 */
const DEFAULT_BOUNDARY_FLAGS = {
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
function createProviderBoundaryFlags() {
    return DEFAULT_BOUNDARY_FLAGS;
}
/**
 * Helper function to create a `ProviderResultEnvelope`.
 * It ensures the `boundary` flags are correctly initialized.
 *
 * @param init - The initial data for the envelope.
 */
function createProviderResultEnvelope(init) {
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
function createProviderCallbackEnvelope(init) {
    return {
        ...init,
        receivedAt: new Date(),
        boundary: createProviderBoundaryFlags(),
    };
}
/**
 * Helper function to create a standardized `ProviderCallbackSignatureVerificationResult`.
 *
 * This function ensures that the result object is created consistently and
 * adheres to the boundary principles. It centralizes the logic for determining
 * `signatureVerified` based on `verificationStatus`.
 *
 * @param init - The initial properties for the verification result.
 * @returns A complete and standardized signature verification result object.
 */
function createProviderCallbackSignatureVerificationResult(init) {
    const signatureVerified = init.verificationStatus === 'verified';
    const replayDetected = init.replayDetected ?? (init.replayStatus === 'replay_detected' || init.replayStatus === 'duplicate_event');
    return {
        ...init,
        signatureVerified,
        replayDetected,
        checkedAt: new Date(),
        boundary: createProviderBoundaryFlags(),
    };
}
