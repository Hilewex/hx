import { IShipmentRepository } from './interface';
import { ShipmentResponse, ShipmentPackage, ShipmentLine } from '@hx/contracts';
import { query } from '@hx/persistence';

export class PostgresShipmentRepository implements IShipmentRepository {
  async save(shipment: ShipmentResponse, idempotencyKey?: string): Promise<void> {
    await query('BEGIN');

    try {
      // 1. Check if shipment exists
      const existingRes = await query('SELECT shipment_id FROM shipments WHERE shipment_id = $1', [shipment.shipmentId]);
      
      if (existingRes.rowCount && existingRes.rowCount > 0) {
        // Update shipment
        await query(
          `UPDATE shipments 
           SET state = $1, updated_at = NOW() 
           WHERE shipment_id = $2`,
          [shipment.state, shipment.shipmentId]
        );
      } else {
        // Insert shipment
        await query(
          `INSERT INTO shipments (shipment_id, order_id, state) 
           VALUES ($1, $2, $3)`,
          [shipment.shipmentId, shipment.orderId, shipment.state]
        );
      }

      // Upsert packages
      for (const pkg of shipment.packages) {
        const pkgRes = await query('SELECT package_id FROM shipment_packages WHERE package_id = $1', [pkg.packageId]);
        if (pkgRes.rowCount && pkgRes.rowCount > 0) {
          await query(
            `UPDATE shipment_packages 
             SET state = $1, carrier_name = $2, tracking_number = $3, delivered_at = $4, updated_at = NOW()
             WHERE package_id = $5`,
            [pkg.state, pkg.carrierName || null, pkg.trackingNumber || null, pkg.deliveredAt || null, pkg.packageId]
          );
        } else {
          await query(
            `INSERT INTO shipment_packages (package_id, shipment_id, order_id, carrier_name, tracking_number, delivered_at, state)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [pkg.packageId, shipment.shipmentId, shipment.orderId, pkg.carrierName || null, pkg.trackingNumber || null, pkg.deliveredAt || null, pkg.state]
          );
        }
      }

      // Upsert lines
      for (const line of shipment.lines) {
        const lineRes = await query('SELECT shipment_line_id FROM shipment_lines WHERE shipment_line_id = $1', [line.shipmentLineId]);
        if (lineRes.rowCount && lineRes.rowCount > 0) {
          await query(
            `UPDATE shipment_lines
             SET state = $1, updated_at = NOW()
             WHERE shipment_line_id = $2`,
            [line.state, line.shipmentLineId]
          );
        } else {
          await query(
            `INSERT INTO shipment_lines (shipment_line_id, shipment_id, order_line_id, product_id, variant_id, storefront_id, quantity, state)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [line.shipmentLineId, shipment.shipmentId, line.orderLineId, line.productId, line.variantId, line.storefrontId, line.quantity, line.state]
          );
        }
      }

      // Save to idempotency if key provided
      if (idempotencyKey) {
        await query(
          `INSERT INTO idempotency (idempotency_key, response) 
           VALUES ($1, $2)
           ON CONFLICT (idempotency_key) DO UPDATE SET response = EXCLUDED.response`,
          [idempotencyKey, JSON.stringify(shipment)]
        );
      }

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  async getById(shipmentId: string): Promise<ShipmentResponse | undefined> {
    const sRes = await query('SELECT * FROM shipments WHERE shipment_id = $1', [shipmentId]);
    if (!sRes.rowCount || sRes.rowCount === 0) return undefined;
    
    return this.mapToShipmentResponse(sRes.rows[0], shipmentId);
  }

  async getByOrderId(orderId: string): Promise<ShipmentResponse[]> {
    const sRes = await query('SELECT shipment_id FROM shipments WHERE order_id = $1', [orderId]);
    const results: ShipmentResponse[] = [];
    for (const row of sRes.rows) {
      const s = await this.getById(row.shipment_id);
      if (s) results.push(s);
    }
    return results;
  }

  async getByIdempotencyKey(key: string): Promise<ShipmentResponse | undefined> {
    const res = await query('SELECT response FROM idempotency WHERE idempotency_key = $1', [key]);
    if (res.rowCount && res.rowCount > 0) {
      return res.rows[0].response as ShipmentResponse;
    }
    return undefined;
  }

  private async mapToShipmentResponse(shipmentRow: any, shipmentId: string): Promise<ShipmentResponse> {
    const pRes = await query('SELECT * FROM shipment_packages WHERE shipment_id = $1', [shipmentId]);
    const lRes = await query('SELECT * FROM shipment_lines WHERE shipment_id = $1', [shipmentId]);

    const lines: ShipmentLine[] = lRes.rows.map((r: any) => ({
      shipmentLineId: r.shipment_line_id,
      orderLineId: r.order_line_id,
      productId: r.product_id,
      variantId: r.variant_id,
      storefrontId: r.storefront_id,
      quantity: r.quantity,
      state: r.state as any
    }));

    const packages: ShipmentPackage[] = pRes.rows.map((r: any) => {
      // Find lines for this package
      // The current DB schema doesn't explicitly link package to line, so we assume all lines in shipment for simplicity or no link at all.
      // Wait, in `shipmentStore.set` in memory we map `lineIds: lines.map(l => l.shipmentLineId)`. 
      // Since it's a simplification in schema, let's just put all lines into the package if there's 1 package.
      return {
        packageId: r.package_id,
        shipmentId: r.shipment_id,
        orderId: r.order_id,
        lineIds: lines.map(l => l.shipmentLineId),
        carrierName: r.carrier_name,
        trackingNumber: r.tracking_number,
        deliveredAt: r.delivered_at ? r.delivered_at.toISOString() : undefined,
        state: r.state as any
      };
    });

    return {
      shipmentId,
      orderId: shipmentRow.order_id,
      state: shipmentRow.state as any,
      packages,
      lines,
      timeline: shipmentRow.timeline || [], // timeline wasn't added to DB schema
      entitlementTriggerSummary: {
        deliveredOpensReviewEligibility: shipmentRow.state === 'DELIVERED',
        deliveredOpensStoryEligibility: shipmentRow.state === 'DELIVERED',
        actualEligibilityMutationPerformed: false
      },
      errors: [],
      warnings: []
    };
  }
}
