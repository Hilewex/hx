import { IShipmentRepository } from './interface';
import { ShipmentResponse } from '@hx/contracts';

export class InMemoryShipmentRepository implements IShipmentRepository {
  private shipments = new Map<string, ShipmentResponse>();
  private idempotencyMap = new Map<string, ShipmentResponse>();

  async save(shipment: ShipmentResponse, idempotencyKey?: string): Promise<void> {
    this.shipments.set(shipment.shipmentId, { ...shipment });
    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, { ...shipment });
    }
  }

  async getById(shipmentId: string): Promise<ShipmentResponse | undefined> {
    const s = this.shipments.get(shipmentId);
    return s ? { ...s } : undefined;
  }

  async getByOrderId(orderId: string): Promise<ShipmentResponse[]> {
    const result: ShipmentResponse[] = [];
    for (const s of this.shipments.values()) {
      if (s.orderId === orderId) {
        result.push({ ...s });
      }
    }
    return result;
  }

  async getByIdempotencyKey(key: string): Promise<ShipmentResponse | undefined> {
    const s = this.idempotencyMap.get(key);
    return s ? { ...s } : undefined;
  }
}
