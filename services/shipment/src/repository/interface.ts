import { ShipmentResponse } from '@hx/contracts';

export interface IShipmentRepository {
  save(shipment: ShipmentResponse, idempotencyKey?: string): Promise<void>;
  getById(shipmentId: string): Promise<ShipmentResponse | undefined>;
  getByOrderId(orderId: string): Promise<ShipmentResponse[]>;
  getByIdempotencyKey(key: string): Promise<ShipmentResponse | undefined>;
}
