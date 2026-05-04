export type ShipmentState = 'CREATED' | 'PREPARING' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURNED_TO_SENDER';
export interface CreateShipmentFromOrderCommand {
    orderId: string;
    idempotencyKey?: string;
}
export interface ShipmentLine {
    shipmentLineId: string;
    orderLineId: string;
    productId: string;
    variantId?: string;
    storefrontId: string;
    quantity: number;
    state: ShipmentState;
}
export interface ShipmentPackage {
    packageId: string;
    shipmentId: string;
    orderId: string;
    lineIds: string[];
    state: ShipmentState;
    carrierName?: string;
    trackingNumber?: string;
    estimatedDeliveryAt?: string;
    deliveredAt?: string;
}
export interface ShipmentTimelineEvent {
    timestamp: string;
    state: ShipmentState;
    note?: string;
}
export interface ShipmentResponse {
    shipmentId: string;
    orderId: string;
    state: ShipmentState;
    packages: ShipmentPackage[];
    lines: ShipmentLine[];
    timeline: ShipmentTimelineEvent[];
    entitlementTriggerSummary: {
        deliveredOpensReviewEligibility: boolean;
        deliveredOpensStoryEligibility: boolean;
        actualEligibilityMutationPerformed: boolean;
    };
    errors: string[];
    warnings: string[];
}
export interface ShipmentDetailResponse extends ShipmentResponse {
}
export interface ShipmentStateTransitionCommand {
    shipmentId: string;
    targetState: ShipmentState;
    note?: string;
    carrierData?: {
        carrierName?: string;
        trackingNumber?: string;
    };
}
export interface ShipmentTransitionResult {
    success: boolean;
    shipment?: ShipmentResponse;
    error?: string;
}
//# sourceMappingURL=shipment.d.ts.map