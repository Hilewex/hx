
/**
 * @fileoverview
 * This file defines the foundation for shipment carrier provider adapters. It
 * establishes the interface for interacting with various shipment carriers and
 * provides a default simulation adapter that adheres to the provider boundary
 * contract.
 */

import {
  createProviderResultEnvelope,
  ProviderResultEnvelope,
} from '@hx/contracts';
import { ShipmentPackage } from '@hx/contracts';

/**
 * Represents the normalized response from a carrier for a tracking operation.
 */
export interface NormalizedTrackingResponse {
  status: string;
  estimatedDelivery?: Date;
}

/**
 * Interface for a Shipment Carrier Provider Adapter.
 * All carrier-specific logic should be encapsulated within a class that
 * implements this interface.
 */
export interface ShipmentCarrierProviderAdapter {
  /**
   * Creates a shipment or tracking record with the carrier.
   *
   * @param shipmentPackage - The shipment package details.
   * @param idempotencyKey - An optional idempotency key.
   * @returns A promise that resolves to a ProviderResultEnvelope.
   */
  createTracking(
    shipmentPackage: ShipmentPackage,
    idempotencyKey?: string
  ): Promise<ProviderResultEnvelope<NormalizedTrackingResponse>>;
}

/**
 * A simulation adapter that provides a foundation for shipment carrier
 * integration without making any real network calls. It returns predictable
 * results based on the provider boundary contract.
 *
 * This adapter is used when the `SHIPMENT_PROVIDER_MODE` is set to `simulation`
 * or `not_configured`.
 */
class FoundationShipmentCarrierAdapter
  implements ShipmentCarrierProviderAdapter
{
  private readonly providerName = 'foundation-shipment-simulation';
  private readonly providerMode =
    process.env.SHIPMENT_PROVIDER_MODE === 'simulation'
      ? 'simulation'
      : 'not_configured';

  /**
   * Simulates the creation of a tracking record.
   *
   * It does not perform any network calls. Instead, it returns a standardized
   * `ProviderResultEnvelope` with a `succeeded` status and mock data,
   * strictly adhering to the boundary rules (e.g., `businessTruthMutated: false`).
   *
   * @param shipmentPackage - The shipment package to simulate tracking for.
   * @param idempotencyKey - An idempotency key for the operation.
   * @returns A promise resolving to a success envelope.
   */
  public async createTracking(
    shipmentPackage: ShipmentPackage,
    idempotencyKey?: string
  ): Promise<ProviderResultEnvelope<NormalizedTrackingResponse>> {
    const operation = 'createTracking';
    const mockRawResponse = {
      carrierId: `sim-${Date.now()}`,
      status: 'ACCEPTED_BY_CARRIER',
      trackingUrl: `https://simulation.carrier/track/${shipmentPackage.trackingNumber}`,
    };

    const normalized: NormalizedTrackingResponse = {
      status: 'pending',
    };

    const result = createProviderResultEnvelope<
      NormalizedTrackingResponse,
      typeof mockRawResponse
    >({
      providerDomain: 'shipment',
      providerName: this.providerName,
      providerMode: this.providerMode,
      operation,
      operationStatus: 'succeeded',
      idempotencyKey,
      correlationId: shipmentPackage.shipmentId,
      providerReference: `sim-ref-${shipmentPackage.packageId}`,
      normalized,
      raw: mockRawResponse,
    });

    return Promise.resolve(result);
  }
}

/**
 * Factory function to get the configured shipment carrier provider adapter.
 *
 * It reads the `SHIPMENT_PROVIDER_MODE` environment variable to decide which
 * adapter to return. Currently, it defaults to the foundation simulation adapter.
 *
 * @returns An instance of a `ShipmentCarrierProviderAdapter`.
 */
export function getShipmentCarrierProviderAdapter(): ShipmentCarrierProviderAdapter {
  // In the future, this could route to different adapters (Aras, Yurtiçi, etc.)
  // based on environment configuration. For now, it always returns the
  // foundation simulation.
  return new FoundationShipmentCarrierAdapter();
}

