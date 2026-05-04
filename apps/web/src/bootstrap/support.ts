import { config } from '../config';

export async function simulateSupportFlow() {
  console.log('\n--- P20 Support Simulation Start ---');

  const actor = { actorType: 'CUSTOMER', actorId: 'c_123' };
  const bffUrl = config.NEXT_PUBLIC_BFF_URL || 'http://localhost:3000';

  // SCENARIO-1: Payment critical ticket
  console.log('\n[SCENARIO-1] Creating Payment Critical Ticket...');
  const res1 = await fetch(`${bffUrl}/support/ticket/create`, {
    method: 'POST',
    body: JSON.stringify({
      ...actor,
      category: 'PAYMENT',
      subtopic: 'PAYMENT_SUCCESS_ORDER_MISSING',
      title: 'Ödeme Alındı Ama Sipariş Oluşmadı',
      description: 'Kartımdan 1500 TL çekildi ama siparişlerim sayfasında görünmüyor.',
      channel: 'PAYMENT_SCREEN',
      idempotencyKey: 'idem_p20_1'
    })
  }).then(r => r.json());

  if (res1.success) {
    console.log('✅ Ticket Created:', res1.ticket.ticketId);
    console.log('   Priority:', res1.ticket.priority, '(Expected: URGENT)');
    console.log('   Escalation:', res1.ticket.escalationTarget, '(Expected: FINANCE)');
    console.log('   Official Process:', res1.ticket.officialSupportProcess);
  }

  // SCENARIO-2: Shipment delayed ticket
  console.log('\n[SCENARIO-2] Creating Shipment Delayed Ticket...');
  const res2 = await fetch(`${bffUrl}/support/ticket/create`, {
    method: 'POST',
    body: JSON.stringify({
      ...actor,
      category: 'SHIPMENT',
      subtopic: 'SHIPMENT_DELAYED',
      title: 'Kargom Gecikti',
      description: '3 gün önce teslim edilmesi gerekiyordu hala gelmedi.',
      channel: 'ORDER_DETAIL',
      idempotencyKey: 'idem_p20_2'
    })
  }).then(r => r.json());

  if (res2.success) {
    console.log('✅ Ticket Created:', res2.ticket.ticketId);
    console.log('   Priority:', res2.ticket.priority, '(Expected: HIGH)');
    console.log('   Escalation:', res2.ticket.escalationTarget, '(Expected: OPERATIONS)');
    console.log('   Suggestions:', res2.ticket.selfServiceSuggestions.map((s: any) => s.title).join(', '));
  }

  // SCENARIO-3: Store/safety complaint
  console.log('\n[SCENARIO-3] Creating Safety Complaint Ticket...');
  const res3 = await fetch(`${bffUrl}/support/ticket/create`, {
    method: 'POST',
    body: JSON.stringify({
      ...actor,
      category: 'SAFETY_COMPLAINT',
      subtopic: 'INAPPROPRIATE_CONTENT',
      title: 'Uygunsuz İçerik Bildirimi',
      description: 'Bu mağazanın görselleri topluluk kurallarına aykırı.',
      channel: 'PDP',
      idempotencyKey: 'idem_p20_3'
    })
  }).then(r => r.json());

  if (res3.success) {
    console.log('✅ Ticket Created:', res3.ticket.ticketId);
    console.log('   Escalation:', res3.ticket.escalationTarget, '(Expected: MODERATION)');
  }

  // SCENARIO-4: Duplicate idempotency
  console.log('\n[SCENARIO-4] Testing Duplicate Idempotency (idem_p20_1)...');
  const res4 = await fetch(`${bffUrl}/support/ticket/create`, {
    method: 'POST',
    body: JSON.stringify({
      ...actor,
      category: 'PAYMENT',
      subtopic: 'PAYMENT_SUCCESS_ORDER_MISSING',
      title: 'Ödeme Alındı Ama Sipariş Oluşmadı (Tekrar)',
      description: 'Duplicate request',
      channel: 'PAYMENT_SCREEN',
      idempotencyKey: 'idem_p20_1'
    })
  }).then(r => r.json());

  if (res4.success && res4.ticket.ticketId === res1.ticket.ticketId) {
    console.log('✅ Idempotency working, returned same ticketId:', res4.ticket.ticketId);
  }

  // SCENARIO-5: Actor list / open count
  console.log('\n[SCENARIO-5] Listing Tickets for Actor...');
  const res5 = await fetch(`${bffUrl}/support/ticket/list?actorType=CUSTOMER&actorId=c_123`).then(r => r.json());
  console.log('✅ Tickets Found:', res5.items.length);
  console.log('   Open Count:', res5.openCount);

  // SCENARIO-6: Add customer message
  if (res1.success) {
    console.log('\n[SCENARIO-6] Adding Message to Ticket...');
    const res6 = await fetch(`${bffUrl}/support/ticket/message`, {
      method: 'POST',
      body: JSON.stringify({
        ticketId: res1.ticket.ticketId,
        authorType: 'CUSTOMER',
        authorId: 'c_123',
        body: 'Hala bir gelişme yok, lütfen kontrol edin.'
      })
    }).then(r => r.json());
    if (res6.success) {
      console.log('✅ Message Added. Thread Length:', res6.ticket.messages.length);
    }
  }

  // SCENARIO-7: Internal note denied for customer
  if (res1.success) {
    console.log('\n[SCENARIO-7] Testing Internal Note Restriction for Customer...');
    const res7 = await fetch(`${bffUrl}/support/ticket/message`, {
      method: 'POST',
      body: JSON.stringify({
        ticketId: res1.ticket.ticketId,
        authorType: 'CUSTOMER',
        authorId: 'c_123',
        body: 'Bu bir gizli not olmalı (ama değil)',
        isInternalNote: true
      })
    }).then(r => r.json());
    if (!res7.success && res7.errors.includes('INTERNAL_NOTE_NOT_ALLOWED')) {
      console.log('✅ Denied correctly: INTERNAL_NOTE_NOT_ALLOWED');
    }
  }

  // SCENARIO-8: Transition happy path
  if (res1.success) {
    console.log('\n[SCENARIO-8] Testing Transition Happy Path (OPEN -> TRIAGED -> WAITING_FOR_CUSTOMER -> RESOLVED -> CLOSED)...');
    const t1 = await fetch(`${bffUrl}/support/ticket/transition`, {
      method: 'POST',
      body: JSON.stringify({ ticketId: res1.ticket.ticketId, targetStatus: 'TRIAGED', actorType: 'ADMIN', note: 'İnceleniyor' })
    }).then(r => r.json());
    console.log('   Status:', t1.ticket.status);

    const t2 = await fetch(`${bffUrl}/support/ticket/transition`, {
      method: 'POST',
      body: JSON.stringify({ ticketId: res1.ticket.ticketId, targetStatus: 'WAITING_FOR_CUSTOMER', actorType: 'ADMIN', note: 'Dekont rica ederiz' })
    }).then(r => r.json());
    console.log('   Status:', t2.ticket.status);

    const t3 = await fetch(`${bffUrl}/support/ticket/transition`, {
      method: 'POST',
      body: JSON.stringify({ ticketId: res1.ticket.ticketId, targetStatus: 'RESOLVED', actorType: 'ADMIN', note: 'Siparişiniz tanımlandı' })
    }).then(r => r.json());
    console.log('   Status:', t3.ticket.status);

    const t4 = await fetch(`${bffUrl}/support/ticket/transition`, {
      method: 'POST',
      body: JSON.stringify({ ticketId: res1.ticket.ticketId, targetStatus: 'CLOSED', actorType: 'SYSTEM' })
    }).then(r => r.json());
    console.log('   Status:', t4.ticket.status, 'ClosedAt:', t4.ticket.closedAt);
  }

  // SCENARIO-9: Invalid transition
  if (res2.success) {
    console.log('\n[SCENARIO-9] Testing Invalid Transition (OPEN -> CLOSED)...');
    const res9 = await fetch(`${bffUrl}/support/ticket/transition`, {
      method: 'POST',
      body: JSON.stringify({ ticketId: res2.ticket.ticketId, targetStatus: 'CLOSED' })
    }).then(r => r.json());
    if (!res9.success && res9.errors.includes('INVALID_TRANSITION')) {
      console.log('✅ Transition Denied: INVALID_TRANSITION');
    }
  }

  // SCENARIO-10: Unknown ticket
  console.log('\n[SCENARIO-10] Requesting Unknown Ticket...');
  const res10 = await fetch(`${bffUrl}/support/ticket/unknown_id`).then(r => r.json());
  if (res10.errors?.includes('SUPPORT_TICKET_NOT_FOUND')) {
    console.log('✅ Returned 404 / SUPPORT_TICKET_NOT_FOUND');
  }

  console.log('\n--- P20 Support Simulation End ---');
}
