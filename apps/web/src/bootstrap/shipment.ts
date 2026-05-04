import { ShipmentResponse } from '@hx/contracts';

export type ShipmentViewState =
  | 'IDLE'
  | 'CREATING'
  | 'CREATED'
  | 'DETAIL_LOADING'
  | 'DETAIL_READY'
  | 'TRANSITIONING'
  | 'DELIVERED'
  | 'NOT_FOUND'
  | 'ERROR';

export async function simulateShipmentFlow(orderId: string): Promise<ShipmentResponse | undefined> {
  console.log('\n--- SIMULATING SHIPMENT FLOW ---');
  let finalShipment: ShipmentResponse | undefined;

  async function request(path: string, method: string, body?: any) {
    try {
      const res = await fetch(`http://localhost:3000${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer guest-token',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      return { status: res.status, data };
    } catch (err) {
      console.error(`[SHIPMENT ${method} ${path}] Failed`, err);
      return { status: 500, data: null };
    }
  }

  console.log(`1. Call POST /shipment/create-from-order for orderId: ${orderId}`);
  renderShipmentShell('CREATING');
  const createRes = await request('/shipment/create-from-order', 'POST', { orderId });
  console.log('Status:', createRes.status);
  console.log('Data:', JSON.stringify(createRes.data, null, 2));

  if (createRes.status === 201 && createRes.data?.shipmentId) {
    const shipmentId = createRes.data.shipmentId;
    renderShipmentShell('CREATED');

    console.log('2. Duplicate create check for same orderId');
    const dupRes = await request('/shipment/create-from-order', 'POST', { orderId });
    console.log('Status:', dupRes.status);
    console.log('Shipment ID Match:', dupRes.data?.shipmentId === shipmentId ? 'MATCH (OK)' : 'MISMATCH (FAIL)');

    console.log(`3. Call GET /shipment/${shipmentId} (Detail Read)`);
    renderShipmentShell('DETAIL_LOADING');
    const detailRes = await request(`/shipment/${shipmentId}`, 'GET');
    console.log('Status:', detailRes.status);
    renderShipmentShell(detailRes.status === 200 ? 'DETAIL_READY' : 'ERROR');

    console.log('4. Transition Flow: CREATED -> PREPARING -> SHIPPED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED');
    const states: any[] = [
      { target: 'PREPARING', note: 'Packing items' },
      { target: 'SHIPPED', note: 'Handed over to carrier', carrier: { carrierName: 'SpeedyEx', trackingNumber: 'TRK123' } },
      { target: 'IN_TRANSIT', note: 'On the way' },
      { target: 'OUT_FOR_DELIVERY', note: 'Courier is arriving' },
      { target: 'DELIVERED', note: 'Package received by customer' }
    ];

    for (const step of states) {
      console.log(`Transitioning to: ${step.target}`);
      renderShipmentShell('TRANSITIONING');
      const trRes = await request('/shipment/transition', 'POST', {
        shipmentId,
        targetState: step.target,
        note: step.note,
        carrierData: step.carrier
      });
      console.log('Status:', trRes.status, 'New State:', trRes.data?.state);
      if (trRes.status !== 200) {
        console.error('Transition failed!');
        break;
      }
      finalShipment = trRes.data;
    }
    renderShipmentShell('DELIVERED');

    console.log('5. Invalid Transition Check: DELIVERED -> IN_TRANSIT');
    const invRes = await request('/shipment/transition', 'POST', {
      shipmentId,
      targetState: 'IN_TRANSIT'
    });
    console.log('Status:', invRes.status, 'Data:', JSON.stringify(invRes.data));
    if (invRes.status === 400) {
      console.log('Expected: 400 INVALID_TRANSITION (OK)');
    }
  }

  console.log('6. Unknown Shipment Scenario');
  const unknownRes = await request('/shipment/unknown-id', 'GET');
  console.log('Status:', unknownRes.status, 'Data:', JSON.stringify(unknownRes.data));
  if (unknownRes.status === 404) {
    console.log('Expected: 404 SHIPMENT_NOT_FOUND (OK)');
  }

  console.log('7. Unknown Order Scenario');
  const unknownOrderRes = await request('/shipment/create-from-order', 'POST', { orderId: 'unknown-order' });
  console.log('Status:', unknownOrderRes.status, 'Data:', JSON.stringify(unknownOrderRes.data));
  if (unknownOrderRes.status === 404) {
    console.log('Expected: 404 ORDER_NOT_FOUND (OK)');
  }

  console.log('--- END SHIPMENT FLOW ---\n');
  return finalShipment;
}

export function renderShipmentShell(state: ShipmentViewState) {
  console.log(`[UI] Rendering Shipment Shell in state: ${state}`);
}
